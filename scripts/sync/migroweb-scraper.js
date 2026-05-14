/**
 * migroweb-scraper.js
 * Nightly supplier sync: logs in to migroweb.it, scrapes all products,
 * updates prices + stock in the Prodigio B2B database.
 *
 * Run:  node scripts/sync/migroweb-scraper.js
 * Env:  MIGROWEB_URL, MIGROWEB_USER, MIGROWEB_PASS
 *       DATABASE_URL, DIRECT_URL
 *       MARKUP_FACTOR (default 1.35 = 35% Marge)
 *       SYNC_DRY_RUN=true  → only logs, no DB writes
 *
 * Login: uses "Codice CediCash" + "Codice Spedizione" + "Genera Password" button
 * Catalog: insordiniCat.jsp → click "Vai" → scrape div.div_totcella cards
 * Pagination: GOPAG input + vaiapagina() JS function (69 pages confirmed)
 */

'use strict'

const puppeteer = require('puppeteer')
const { PrismaClient } = require('@prisma/client')
const slugify = require('./slugify')

// ─── Config ────────────────────────────────────────────────────────────────
const CONFIG = {
  baseUrl:      (process.env.MIGROWEB_URL || 'https://www.migroweb.it').replace(/\/$/, ''),
  user:         process.env.MIGROWEB_USER || '',
  pass:         process.env.MIGROWEB_PASS || '',
  markupFactor: parseFloat(process.env.MARKUP_FACTOR || '1.35'),
  dryRun:       process.env.SYNC_DRY_RUN === 'true',
  source:       'migroweb',
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function log(msg, data = '') {
  const ts = new Date().toISOString()
  if (data) console.log(`[${ts}] ${msg}`, data)
  else console.log(`[${ts}] ${msg}`)
}

/**
 * Parse Italian price format: "1,496" → 1.496  /  "12,50" → 12.50
 */
function parsePrice(str) {
  if (!str) return null
  const cleaned = str.replace(/[^0-9,]/g, '').replace(',', '.')
  const val = parseFloat(cleaned)
  return isNaN(val) || val <= 0 ? null : val
}

/**
 * Parse stock from DISPONIBILITA string: "11 x 36" → 11 imballi (cartons)
 * or plain integer "25" → 25
 */
function parseStock(str) {
  if (!str) return 0
  const m = str.match(/(\d+)\s*[xX×]/)
  if (m) return parseInt(m[1], 10)
  const n = parseInt(str.replace(/[^0-9]/g, ''), 10)
  return isNaN(n) ? 0 : n
}

/**
 * Parse per-carton quantity: "X 36 Pz" → 36
 */
function parseUnitQty(str) {
  if (!str) return 1
  const m = str.match(/(\d+)/)
  return m ? parseInt(m[1], 10) : 1
}

/**
 * Round sell price up to nearest CHF 0.05
 */
function calcSellPrice(costPrice, factor) {
  return Math.ceil(costPrice * factor * 20) / 20
}

function buildSlug(name, sku) {
  const base = slugify(name)
  return sku ? `${base}-${sku.toLowerCase().replace(/[^a-z0-9]/g, '')}` : base
}

// ─── Scraping helper (runs inside page.evaluate — must be self-contained) ──
/**
 * Extract all products from the current catalog page DOM.
 * Confirmed selectors from live page inspection (May 2026):
 *   - Cards:   div.div_totcella
 *   - Image:   img.foto_catalog  → src = https://www.wmphoto.it/products/{articolo}.jpg
 *   - Name:    strong[3].innerText
 *   - Price:   first "n,nnn" match in card.innerText
 *   - SKU:     "Articolo XXXXXX" in card.innerText
 *   - Stock:   "DISPONIBILITA' : XX x YY" in card.innerText
 *   - EAN:     "CODICE EAN : XXXXXXXXXX" in card.innerText
 *   - IVA:     "Iva XX%" in card.innerText
 *   - Qty:     "X NN Pz" in card.innerText
 */
function extractPageProducts() {
  const cards = document.querySelectorAll('div.div_totcella')
  const results = []

  cards.forEach(card => {
    try {
      // ── Image ──────────────────────────────────────────────────────────
      const imgEl = card.querySelector('img.foto_catalog')
      const imgSrc = imgEl ? imgEl.src : ''

      // ── Full text for regex extraction ─────────────────────────────────
      const text = card.innerText || ''

      // ── Name: strong[3] is the product name ────────────────────────────
      const strongs = card.querySelectorAll('strong')
      const name = strongs[3] ? strongs[3].innerText.trim() : ''
      if (!name || name.length < 2) return

      // ── SKU: "Articolo 212022" ──────────────────────────────────────────
      const artMatch = text.match(/Articolo\s+(\d+)/)
      const sku = artMatch ? artMatch[1] : ''

      // ── IVA: "Iva 22%" ─────────────────────────────────────────────────
      const ivaMatch = text.match(/Iva\s+(\d+)%/)
      const iva = ivaMatch ? parseInt(ivaMatch[1], 10) : 22

      // ── Stock: "DISPONIBILITA' : 11 x 36" ──────────────────────────────
      const dispMatch = text.match(/DISPONIBILITA'?\s*:\s*([\d\s xX×]+)/)
      const stockText = dispMatch ? dispMatch[1].trim() : ''

      // ── EAN: "CODICE EAN : 8021684153808" ──────────────────────────────
      const eanMatch = text.match(/CODICE EAN\s*:\s*(\d+)/)
      const ean = eanMatch ? eanMatch[1] : ''

      // ── Price: first decimal number e.g. "1,496" (Imballi price) ───────
      const prices = text.match(/\d+,\d+/g)
      const priceText = prices ? prices[0] : ''
      if (!priceText) return

      // ── Qty per carton: "X 36 Pz" ──────────────────────────────────────
      const qtyMatch = text.match(/X\s*(\d+)\s*Pz/i)
      const qtyText = qtyMatch ? qtyMatch[0] : ''

      results.push({ name, sku, ean, iva, imgSrc, stockText, priceText, qtyText })
    } catch (_) {
      // skip malformed card
    }
  })

  return results
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  const startedAt = Date.now()
  const prisma = new PrismaClient()

  const syncLog = await prisma.syncLog.create({
    data: { source: CONFIG.source, status: 'running' },
  })
  log(`Sync started (id: ${syncLog.id}, dry-run: ${CONFIG.dryRun})`)

  const stats = { found: 0, new: 0, updated: 0, deactivated: 0 }

  let browser
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--ignore-certificate-errors',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    })
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    await page.setViewport({ width: 1280, height: 900 })

    // ── 1. LOGIN ─────────────────────────────────────────────────────────
    // Form: Codice CediCash + Codice Spedizione → click "Genera Password"
    const loginUrl = `${CONFIG.baseUrl}/MigroWeb/`
    log('Navigating to login page:', loginUrl)
    await page.goto(loginUrl, { waitUntil: 'networkidle2', timeout: 30000 })

    // Step 1: Fill Codice CediCash + Codice Spedizione, click "Genera Password"
    await page.waitForSelector('input[placeholder="Codice CediCash"]', { timeout: 10000 })

    // Use evaluate to set values directly (more reliable in headless mode)
    await page.evaluate((user) => {
      const f1 = document.querySelector('input[placeholder="Codice CediCash"]')
      const f2 = document.querySelector('input[placeholder="Codice Spedizione"]')
      if (f1) f1.value = user
      if (f2) f2.value = user
    }, CONFIG.user)

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.evaluate(() => {
        const btn = [...document.querySelectorAll('input[type=button], button')]
          .find(el => (el.value || el.innerText || '').toLowerCase().includes('genera'))
        if (btn) btn.click()
      }),
    ])

    // Step 2: Enter password in the field that appears after "Genera Password"
    await page.waitForSelector('input#password', { timeout: 10000 })
    await page.evaluate((pass) => {
      const f = document.getElementById('password')
      if (f) f.value = pass
    }, CONFIG.pass)

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.evaluate(() => {
        // Click the "L o g i n" button (value has spaces between letters)
        const btn = [...document.querySelectorAll('input[type=button], input[type=submit], button')]
          .find(el => (el.value || el.innerText || '').replace(/\s/g, '').toLowerCase() === 'login')
        if (btn) btn.click()
        else document.querySelector('form')?.submit()
      }),
    ])

    const afterLoginUrl = page.url()
    log('After login URL:', afterLoginUrl)
    if (!afterLoginUrl.includes('homepage.jsp')) {
      throw new Error(`Login failed — unexpected URL: ${afterLoginUrl}`)
    }
    log('✅ Login successful')

    // ── 2. NAVIGATE TO PRODUCT CATALOG ───────────────────────────────────
    // Go through gestione_ordini.jsp first (required for catalog session context)
    const ordiniUrl = `${CONFIG.baseUrl}/MigroWeb/gestione_ordini.jsp`
    log('Loading order page:', ordiniUrl)
    await page.goto(ordiniUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForSelector('input[value="Nuovo Ordine Catalogo"]', { timeout: 30000 })
    log('✅ Order page ready')

    // Session is now established — navigate directly to catalog
    const catalogUrl = `${CONFIG.baseUrl}/MigroWeb/insordiniCat.jsp`
    log('Loading catalog:', catalogUrl)
    await page.goto(catalogUrl, { waitUntil: 'networkidle2', timeout: 90000 })

    // Find the frame that contains the catalog form (may be in a child frame)
    const allFrames = page.frames()
    log(`Page frames: ${allFrames.length}`)
    allFrames.forEach((f, i) => log(`  Frame ${i}: ${f.url()}`))

    // Find the frame that has input[name="Vai"]
    let catalogFrame = page.mainFrame()
    for (const frame of allFrames) {
      try {
        const hasVai = await frame.evaluate(() => !!document.querySelector('input[name="Vai"]'))
        if (hasVai) {
          catalogFrame = frame
          log('Found Vai button in frame:', frame.url())
          break
        }
      } catch (_) {}
    }

    // Click "Vai" to load all products
    await catalogFrame.evaluate(() => {
      document.querySelector('input[name="Vai"]')?.click()
    })
    await catalogFrame.waitForSelector('div.div_totcella', { timeout: 30000 })
    log('✅ Products loaded')

    // ── 3. DETERMINE TOTAL PAGES ─────────────────────────────────────────
    const totalPages = await catalogFrame.evaluate(() => {
      const el = document.querySelector('input#PAGTOT')
      return el ? parseInt(el.value, 10) : 1
    })
    log(`Total pages: ${totalPages}`)

    // ── 4. SCRAPE ALL PAGES ───────────────────────────────────────────────
    const allProducts = []
    let pageNum = 1

    while (pageNum <= totalPages) {
      log(`Scraping page ${pageNum} / ${totalPages}...`)

      await catalogFrame.waitForSelector('div.div_totcella', { timeout: 15000 })
      const pageProducts = await catalogFrame.evaluate(extractPageProducts)

      log(`  → ${pageProducts.length} products found`)
      allProducts.push(...pageProducts)

      if (pageNum >= totalPages) break

      // Navigate to next page via vaiapagina() JS function
      const nextPage = pageNum + 1
      await Promise.all([
        catalogFrame.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
        catalogFrame.evaluate((n) => {
          const gopag = document.getElementById('GOPAG')
          if (gopag) gopag.value = String(n)
          if (typeof vaiapagina === 'function') vaiapagina()
        }, nextPage),
      ])

      pageNum++
      await new Promise(r => setTimeout(r, 500))
    }

    log(`Total scraped: ${allProducts.length} products across ${pageNum} pages`)
    stats.found = allProducts.length

    if (allProducts.length === 0) {
      throw new Error('No products found — check login or selectors')
    }

    // ── 5. DRY RUN or DB SYNC ────────────────────────────────────────────
    if (CONFIG.dryRun) {
      log('DRY RUN — sample of first 10 products:')
      allProducts.slice(0, 10).forEach((p, i) => {
        const cost = parsePrice(p.priceText)
        const sell = cost ? calcSellPrice(cost, CONFIG.markupFactor) : null
        log(`  [${i + 1}] ${p.name}`)
        log(`       SKU=${p.sku}  EAN=${p.ean}  cost=${p.priceText}(${cost})  sell=${sell}  stock="${p.stockText}"  qty="${p.qtyText}"`)
      })
      log('DRY RUN complete — no DB changes made')
    } else {
      await browser.close()
      browser = null

      const defaultCategory =
        await prisma.category.findFirst({ where: { slug: 'getranke' } }) ||
        await prisma.category.findFirst({ where: { slug: 'all' } }) ||
        await prisma.category.findFirst()

      if (!defaultCategory) throw new Error('No category found in DB — run seed first')

      const seenSkus = new Set()

      for (const item of allProducts) {
        const costPrice = parsePrice(item.priceText)
        if (!costPrice || costPrice <= 0) {
          log(`  Skipping "${item.name}" — invalid price: "${item.priceText}"`)
          continue
        }

        const sellPrice  = calcSellPrice(costPrice, CONFIG.markupFactor)
        const stockCount = parseStock(item.stockText)
        const unitQty    = parseUnitQty(item.qtyText)
        const sku        = item.sku || null
        const unitLabel  = unitQty > 1 ? `${unitQty} Stk/Karton` : '1 Stk'

        if (sku) seenSkus.add(sku)

        const imgUrl = sku
          ? `https://www.wmphoto.it/products/${sku}.jpg`
          : (item.imgSrc || '')

        const existing = sku
          ? await prisma.product.findFirst({ where: { supplierSku: sku, supplierSource: CONFIG.source } })
          : await prisma.product.findFirst({ where: { name: item.name, supplierSource: CONFIG.source } })

        if (existing) {
          const updates = {
            stock:        stockCount,
            costPrice:    costPrice,
            active:       existing.active,
            lastSyncedAt: new Date(),
          }
          const currentPrice = Number(existing.price)
          if (currentPrice > 0) {
            const priceDiff = Math.abs(currentPrice - sellPrice) / currentPrice
            if (priceDiff > 0.02) {
              updates.price = sellPrice
              log(`  💰 Price update: "${existing.name}" ${currentPrice.toFixed(2)} → ${sellPrice.toFixed(2)} CHF`)
            }
          }
          await prisma.product.update({ where: { id: existing.id }, data: updates })
          stats.updated++
        } else {
          const slug = buildSlug(item.name, sku)
          await prisma.product.create({
            data: {
              name:           item.name,
              slug:           slug,
              description:    item.name,
              brand:          'Migroweb',
              emoji:          '📦',
              price:          sellPrice,
              unit:           unitLabel,
              moq:            1,
              stock:          stockCount,
              active:         false,
              categoryId:     defaultCategory.id,
              supplierSku:    sku,
              supplierSource: CONFIG.source,
              costPrice:      costPrice,
              lastSyncedAt:   new Date(),
              syncManaged:    true,
              images:         imgUrl ? [imgUrl] : [],
            },
          })
          log(`  ✨ NEW: "${item.name}" → CHF ${sellPrice.toFixed(2)} (cost: ${costPrice.toFixed(3)}, stock: ${stockCount})`)
          stats.new++
        }
      }

      // ── 6. DEACTIVATE MISSING PRODUCTS ────────────────────────────────
      if (seenSkus.size > 0) {
        const missing = await prisma.product.findMany({
          where: {
            supplierSource: CONFIG.source,
            syncManaged:    true,
            active:         true,
            supplierSku:    { notIn: Array.from(seenSkus) },
          },
        })
        for (const p of missing) {
          await prisma.product.update({
            where: { id: p.id },
            data: { active: false, stock: 0 },
          })
          log(`  ⛔ Deactivated: "${p.name}" (not in supplier catalog)`)
          stats.deactivated++
        }
      }
    }

    // ── 7. FINALIZE ──────────────────────────────────────────────────────
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status:              'success',
        productsFound:       stats.found,
        productsNew:         stats.new,
        productsUpdated:     stats.updated,
        productsDeactivated: stats.deactivated,
        durationMs:          Date.now() - startedAt,
        finishedAt:          new Date(),
      },
    })

    const dur = ((Date.now() - startedAt) / 1000).toFixed(1)
    log(`✅ Sync complete in ${dur}s — found: ${stats.found} | new: ${stats.new} | updated: ${stats.updated} | deactivated: ${stats.deactivated}`)

  } catch (err) {
    log('❌ Sync failed:', err.message)
    console.error(err)
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status:       'error',
        errorMessage: err.message.slice(0, 500),
        durationMs:   Date.now() - startedAt,
        finishedAt:   new Date(),
      },
    }).catch(() => {})
    process.exit(1)
  } finally {
    if (browser) await browser.close().catch(() => {})
    await prisma.$disconnect()
  }
}

main()
