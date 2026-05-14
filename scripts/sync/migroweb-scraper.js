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
  imageBase:    'https://www.wmphoto.it/products/',
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
  // "11 x 36 Pz" → first number = number of cartons
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

// ─── Scraping helpers (run inside page.evaluate) ─────────────────────────
/**
 * Extract all products from the current catalog page DOM.
 * Called via page.evaluate() — must be self-contained (no closures over Node vars).
 */
function extractPageProducts() {
  const cards = document.querySelectorAll('div.div_totcella')
  const results = []

  cards.forEach(card => {
    try {
      // ── Image ──────────────────────────────────────────────────────────
      const imgEl = card.querySelector('img.foto_catalog')
      const imgSrc = imgEl ? imgEl.src : ''

      // ── Description block ──────────────────────────────────────────────
      const descrBlock = card.querySelector('div.div_descr')
      if (!descrBlock) return

      const strongs = descrBlock.querySelectorAll('strong')
      // strong[0] = product name, strong[2] = "Articolo XXXXXX Fornitore YYYYYY Iva ZZ%"
      const name    = strongs[0] ? strongs[0].innerText.trim() : ''
      const artLine = strongs[2] ? strongs[2].innerText.trim() : ''

      if (!name) return

      // Parse Articolo (supplier SKU)
      const artMatch = artLine.match(/Articolo\s+(\S+)/)
      const sku = artMatch ? artMatch[1] : ''

      // Parse IVA
      const ivaMatch = artLine.match(/Iva\s+(\d+)%/)
      const iva = ivaMatch ? parseInt(ivaMatch[1], 10) : 22

      // ── b tags: [0]=DISPONIBILITA', [1]=STRATO, [2]=CODICE EAN ─────────
      const bTags = descrBlock.querySelectorAll('b')
      const stockText = bTags[0] ? bTags[0].innerText.trim() : ''
      const ean       = bTags[2] ? bTags[2].innerText.trim() : ''

      // ── Price block ────────────────────────────────────────────────────
      const codiceBlock = card.querySelector('div.div_codice')
      let priceText = ''
      let qtyText   = ''

      if (codiceBlock) {
        // Data TDs = those without strong or input children
        const tds = Array.from(codiceBlock.querySelectorAll('td'))
        const dataTds = tds.filter(td =>
          !td.querySelector('strong') && !td.querySelector('input')
        )
        // [0]=unit price "1,496", [1]=carton qty "X 36 Pz"
        priceText = dataTds[0] ? dataTds[0].innerText.trim() : ''
        qtyText   = dataTds[1] ? dataTds[1].innerText.trim() : ''
      }

      results.push({ name, sku, ean, iva, imgSrc, stockText, priceText, qtyText, artLine })
    } catch (e) {
      // skip malformed card
    }
  })

  return results
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  const startedAt = Date.now()
  const prisma = new PrismaClient()

  // Create SyncLog entry
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
        '--ignore-certificate-errors',   // migroweb.it uses self-signed cert
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    })
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    await page.setViewport({ width: 1280, height: 900 })

    // ── 1. LOGIN ─────────────────────────────────────────────────────────
    const loginUrl = `${CONFIG.baseUrl}/MigroWeb/`
    log('Navigating to login page:', loginUrl)
    await page.goto(loginUrl, { waitUntil: 'networkidle2', timeout: 30000 })

    // Find and fill login form (JSP form — typically name/password text inputs)
    await page.waitForSelector('input[type="text"], input[name*="user"], input[name*="code"]', { timeout: 10000 })

    // Fill username field (first text input)
    const userField = await page.$('input[type="text"]') ||
                      await page.$('input[name*="user"]') ||
                      await page.$('input[name*="cod"]')
    if (!userField) throw new Error('Login: username field not found')
    await userField.click({ clickCount: 3 })
    await userField.type(CONFIG.user, { delay: 40 })

    // Fill password field
    const passField = await page.$('input[type="password"]')
    if (!passField) throw new Error('Login: password field not found')
    await passField.click({ clickCount: 3 })
    await passField.type(CONFIG.pass, { delay: 40 })

    // Submit
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      passField.press('Enter'),
    ])

    const afterLoginUrl = page.url()
    log('After login URL:', afterLoginUrl)
    if (afterLoginUrl.toLowerCase().includes('login') ||
        afterLoginUrl.toLowerCase().includes('error') ||
        afterLoginUrl === loginUrl) {
      throw new Error(`Login failed — still at: ${afterLoginUrl}`)
    }
    log('✅ Login successful')

    // ── 2. NAVIGATE TO PRODUCT CATALOG ───────────────────────────────────
    const catalogUrl = `${CONFIG.baseUrl}/MigroWeb/insordiniCat.jsp`
    log('Loading product catalog:', catalogUrl)
    await page.goto(catalogUrl, { waitUntil: 'networkidle2', timeout: 30000 })

    // Wait for first product card
    await page.waitForSelector('div.div_totcella', { timeout: 20000 })

    // ── 3. DETERMINE TOTAL PAGES ─────────────────────────────────────────
    const totalPages = await page.evaluate(() => {
      const el = document.querySelector('input#PAGTOT')
      return el ? parseInt(el.value, 10) : 1
    })
    log(`Total pages: ${totalPages}`)

    // ── 4. SCRAPE ALL PAGES ───────────────────────────────────────────────
    const allProducts = []
    let pageNum = 1

    while (pageNum <= totalPages) {
      log(`Scraping page ${pageNum} / ${totalPages}...`)

      // Wait for products to be visible
      await page.waitForSelector('div.div_totcella', { timeout: 15000 })

      // Extract current page products
      const pageProducts = await page.evaluate(extractPageProducts)

      const valid = pageProducts.filter(p => p.name && p.name.length > 1 && p.priceText)
      log(`  → ${valid.length} products found (${pageProducts.length} total cards)`)
      allProducts.push(...valid)

      if (pageNum >= totalPages) break

      // Navigate to next page by evaluating contapiu() JS function
      // This increments vedipag1 and submits the form
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
        page.evaluate(() => {
          // Try standard pagination function first
          if (typeof contapiu === 'function') {
            contapiu()
          } else {
            // Fallback: click next image button
            const nextBtn = document.querySelector('img.next, img[onclick*="contapiu"]')
            if (nextBtn) nextBtn.click()
          }
        }),
      ])

      pageNum++

      // Small delay to be respectful to the server
      await new Promise(r => setTimeout(r, 800))
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
      // Close browser before DB ops to free memory
      await browser.close()
      browser = null

      // Get default category (fallback for new products)
      const defaultCategory =
        await prisma.category.findFirst({ where: { slug: 'getranke' } }) ||
        await prisma.category.findFirst({ where: { slug: 'all' } }) ||
        await prisma.category.findFirst()

      if (!defaultCategory) throw new Error('No category found in DB — run seed first')

      // Track all supplier SKUs seen in this sync
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

        // Build unit label: "X 36 Pz" → "36 Stk/Karton"
        const unitLabel = unitQty > 1 ? `${unitQty} Stk/Karton` : '1 Stk'

        if (sku) seenSkus.add(sku)

        // Build image URL from articolo number
        const imgUrl = sku
          ? `https://www.wmphoto.it/products/${sku}.jpg`
          : (item.imgSrc || '')

        const existing = sku
          ? await prisma.product.findFirst({ where: { supplierSku: sku, supplierSource: CONFIG.source } })
          : await prisma.product.findFirst({ where: { name: item.name, supplierSource: CONFIG.source } })

        if (existing) {
          // UPDATE price + stock
          const updates = {
            stock:        stockCount,
            costPrice:    costPrice,
            active:       existing.active, // keep current active state
            lastSyncedAt: new Date(),
          }
          // Update sell price only if it changed by more than 2%
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
          // NEW product — create inactive for admin review
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
              active:         false,  // admin must review + activate
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

    // ── 7. FINALIZE SYNC LOG ─────────────────────────────────────────────
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status:              CONFIG.dryRun ? 'success' : 'success',
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
