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
  baseUrl:      process.env.MIGROWEB_URL  || 'https://www.migroweb.it',
  loginUrl:     process.env.MIGROWEB_URL  || 'https://www.migroweb.it',
  user:         process.env.MIGROWEB_USER || '',
  pass:         process.env.MIGROWEB_PASS || '',
  markupFactor: parseFloat(process.env.MARKUP_FACTOR || '1.35'),
  dryRun:       process.env.SYNC_DRY_RUN === 'true',
  source:       'migroweb',
  // ── Page Selectors (update after seeing actual page) ──────────────────
  // These will be filled in once we see the page structure via screenshot
  selectors: {
    // Login form
    loginUsernameField: 'input[name="username"], input[name="user"], input[type="text"]',
    loginPasswordField: 'input[name="password"], input[name="pass"], input[type="password"]',
    loginSubmitButton:  'button[type="submit"], input[type="submit"]',
    loginSuccessCheck:  '', // CSS selector that only exists when logged in

    // Product table / list
    productTable:       'table.products, table#products, .product-list table',
    productRow:         'tr[data-sku], tbody tr',  // each row = one product
    // Within each row, these are column indices or CSS selectors:
    colSku:             0,   // column index or selector
    colName:            1,
    colPrice:           2,
    colStock:           3,
    colUnit:            4,

    // Pagination
    nextPageLink:       'a.next, a[rel="next"], .pagination .next',
  },
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function log(msg, data = '') {
  const ts = new Date().toISOString()
  if (data) console.log(`[${ts}] ${msg}`, data)
  else console.log(`[${ts}] ${msg}`)
}

function parsePrice(str) {
  if (!str) return null
  // Handle formats: "12,50", "12.50", "CHF 12.50", "€12,50"
  const cleaned = str.replace(/[^0-9.,]/g, '').replace(',', '.')
  const val = parseFloat(cleaned)
  return isNaN(val) ? null : Math.round(val * 100) / 100
}

function parseStock(str) {
  if (!str) return 999
  const num = parseInt(str.replace(/[^0-9]/g, ''), 10)
  return isNaN(num) ? 999 : num
}

function buildSlug(name, sku) {
  const base = slugify(name)
  return sku ? `${base}-${sku.toLowerCase().replace(/[^a-z0-9]/g, '')}` : base
}

function calcSellPrice(costPrice, factor) {
  return Math.ceil(costPrice * factor * 20) / 20 // round up to nearest 0.05
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
        '--ignore-certificate-errors',   // migroweb.it has self-signed cert
        '--disable-dev-shm-usage',
      ],
    })
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (compatible; ProdigioSync/1.0)')

    // ── 1. LOGIN ─────────────────────────────────────────────────────────
    log('Navigating to login page...')
    await page.goto(CONFIG.loginUrl, { waitUntil: 'networkidle2', timeout: 30000 })

    // Wait for login form
    await page.waitForSelector(CONFIG.selectors.loginUsernameField, { timeout: 10000 })

    await page.type(CONFIG.selectors.loginUsernameField, CONFIG.user, { delay: 50 })
    await page.type(CONFIG.selectors.loginPasswordField, CONFIG.pass, { delay: 50 })

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click(CONFIG.selectors.loginSubmitButton),
    ])

    // Verify login success
    const currentUrl = page.url()
    if (currentUrl.includes('login') || currentUrl.includes('error')) {
      throw new Error(`Login failed — redirected to: ${currentUrl}`)
    }
    log('Login successful:', currentUrl)

    // ── 2. NAVIGATE TO PRODUCT CATALOG ───────────────────────────────────
    const catalogUrl = `${CONFIG.baseUrl}/MigroWeb/insordiniCat.jsp`
    log('Loading product catalog:', catalogUrl)
    await page.goto(catalogUrl, { waitUntil: 'networkidle2', timeout: 30000 })

    // ── 3. SCRAPE ALL PAGES ───────────────────────────────────────────────
    const allProducts = []
    let pageNum = 1

    while (true) {
      log(`Scraping page ${pageNum}...`)

      // Wait for product table
      await page.waitForSelector(CONFIG.selectors.productTable, { timeout: 15000 })
        .catch(() => log('Warning: product table selector not found, trying anyway'))

      // Extract products from current page
      const pageProducts = await page.evaluate((sel) => {
        const rows = document.querySelectorAll(sel.productRow)
        const results = []

        rows.forEach(row => {
          const cells = row.querySelectorAll('td')
          if (cells.length < 3) return // skip header/empty rows

          const getText = (idx) => cells[idx]?.innerText?.trim() || ''
          const getImg  = () => row.querySelector('img')?.src || ''

          results.push({
            sku:    getText(sel.colSku),
            name:   getText(sel.colName),
            price:  getText(sel.colPrice),
            stock:  getText(sel.colStock),
            unit:   getText(sel.colUnit) || '1 Stk',
            image:  getImg(),
            raw:    Array.from(cells).map(c => c.innerText.trim()),
          })
        })

        return results
      }, CONFIG.selectors)

      const valid = pageProducts.filter(p => p.name && p.name.length > 1)
      log(`  Found ${valid.length} products on page ${pageNum}`)
      allProducts.push(...valid)

      // Check for next page
      const hasNext = await page.$(CONFIG.selectors.nextPageLink)
      if (!hasNext) break

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
        page.click(CONFIG.selectors.nextPageLink),
      ])
      pageNum++
    }

    log(`Total scraped: ${allProducts.length} products`)
    stats.found = allProducts.length

    if (allProducts.length === 0) {
      throw new Error('No products found — selectors may need updating. Check screenshot.')
    }

    if (CONFIG.dryRun) {
      log('DRY RUN — first 5 products:')
      allProducts.slice(0, 5).forEach(p => log('  ', p))
    } else {
      // ── 4. SYNC TO DATABASE ────────────────────────────────────────────
      await browser.close()
      browser = null

      // Get default category (fallback)
      let defaultCategory = await prisma.category.findFirst({ where: { slug: 'all' } })
      if (!defaultCategory) {
        defaultCategory = await prisma.category.findFirst()
      }

      // Track all supplier SKUs seen in this sync
      const seenSkus = new Set()

      for (const item of allProducts) {
        const costPrice = parsePrice(item.price)
        if (!costPrice || costPrice <= 0) {
          log(`  Skipping "${item.name}" — no valid price`)
          continue
        }

        const sellPrice = calcSellPrice(costPrice, CONFIG.markupFactor)
        const stock     = parseStock(item.stock)
        const sku       = item.sku || null

        if (sku) seenSkus.add(sku)

        const existing = sku
          ? await prisma.product.findFirst({ where: { supplierSku: sku, supplierSource: CONFIG.source } })
          : await prisma.product.findFirst({ where: { name: item.name, supplierSource: CONFIG.source } })

        if (existing) {
          // UPDATE price + stock
          const updates = {
            costPrice:    costPrice,
            stock:        stock,
            active:       true,
            lastSyncedAt: new Date(),
          }
          // Only update sell price if it changed by more than 2%
          const priceDiff = Math.abs(Number(existing.price) - sellPrice) / Number(existing.price)
          if (priceDiff > 0.02) {
            updates.price = sellPrice
            log(`  Price change: "${existing.name}" ${existing.price} → ${sellPrice} CHF`)
          }

          await prisma.product.update({ where: { id: existing.id }, data: updates })
          stats.updated++
        } else {
          // NEW product — create with placeholder category
          const slug = buildSlug(item.name, sku)
          await prisma.product.create({
            data: {
              name:          item.name,
              slug:          slug,
              description:   item.name,
              brand:         'Migroweb',
              emoji:         '📦',
              price:         sellPrice,
              unit:          item.unit,
              moq:           1,
              stock:         stock,
              active:        false, // NEW products start INACTIVE — admin must review
              categoryId:    defaultCategory.id,
              supplierSku:   sku,
              supplierSource: CONFIG.source,
              costPrice:     costPrice,
              lastSyncedAt:  new Date(),
              syncManaged:   true,
              images:        item.image ? [item.image] : [],
            },
          })
          log(`  NEW product: "${item.name}" at CHF ${sellPrice} (cost: ${costPrice})`)
          stats.new++
        }
      }

      // ── 5. DEACTIVATE MISSING PRODUCTS ────────────────────────────────
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
          log(`  DEACTIVATED: "${p.name}" (no longer in supplier catalog)`)
          stats.deactivated++
        }
      }
    }

    // ── 6. UPDATE SYNC LOG ───────────────────────────────────────────────
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

    log(`✅ Sync complete — found: ${stats.found}, new: ${stats.new}, updated: ${stats.updated}, deactivated: ${stats.deactivated}`)

  } catch (err) {
    log('❌ Sync failed:', err.message)

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status:       'error',
        errorMessage: err.message,
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
