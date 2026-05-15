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

/**
 * Map product name to a Grosshandel subcategory slug via keyword matching.
 * Same logic as scripts/setup-categories.js — must stay in sync.
 */
const CATEGORY_RULES = [
  { slug: 'grosshandel-getraenke', kw: ['acqua','water','wasser','succo','juice','saft','cola','fanta','sprite','pepsi','aranciata','limonata','cedrata','gassosa','bibita','bevanda','drink','soft','energy','monster','redbull','gatorade','powerade','lucozade','tonic','limon','arancia','chinotto','san pellegrino','ferrarelle','fiuggi','levissima','uliveto','vera','fonte','frizzante','naturale','minerale','succo di','nettare','smoothie','ice tea','iced tea','the freddo','frutta'] },
  { slug: 'grosshandel-bier-wein', kw: ['birra','beer','bier','vino','wine','wein','prosecco','spumante','champagne','grappa','amaro','whisky','whiskey','vodka','gin ','rum ','liquore','aperitivo','aperol','campari','martini','vermut','sambuca','limoncello','nocino','mirto','spritz','sangria','cava','asti','peroni','moretti','heineken','corona','budweiser','carlsberg','bottiglia','75cl','33cl','66cl'] },
  { slug: 'grosshandel-kaffee-tee', kw: ['caffè','caffe','kaffee','coffee','espresso','capsule','capsula','nespresso','lavazza','illy','kimbo','borbone','bialetti','moka','macinato','arabica','tè ','tea ','tee ','tisana','camomilla','infuso','infusion','orzo','cicoria','matcha','chai','oolong','verde ','verde,','nero '] },
  { slug: 'grosshandel-suesswaren', kw: ['caramell','candy','bonbon','cioccolat','chocolat','schokolad','nutella','kinder','ferrero','lindt','toblerone','kitkat','bounty','snickers','twix','biscotti','kekse','cookie','wafer','cracker','grissini','cereali','patatine','chips ','snack','popcorn','nachos','tortilla','pretzel','torrone','confetti','gomm','jelly','gummy','marshmallow','lecca','menta','mentine','pastiglie','caramelle','drops ','gelato','ghiacciolo','ice cream','eis '] },
  { slug: 'grosshandel-lebensmittel', kw: ['pasta','spaghetti','rigatoni','penne','fusilli','farfalle','tagliatelle','lasagna','lasagne','gnocchi','ravioli','tortellini','riso','rice','reis','basmati','arborio','parboiled','farina','mehl','flour','semola','amido','maizena','olio','oil','öl','oliva','girasole','sale ','sale,','salz','zucchero','zucker','sugar','miele','honey','aceto','vinegar','essig','balsamico','conserva','pelati','passata','pomodoro','tomaten','tomato','sugo','ragù','tonno','tuna','sardine','sgombro','acciughe','pesce ','legumi','fagioli','ceci','lenticchie','piselli','brodo','bouillon','dado','maggi','pesto','aioli','maionese','mayonnaise','senape','mostarda','ketchup','spezie','pepe ','paprika ','latte ','latte,','milch','milk','panna','crema','burro','butter','formaggio','käse','cheese','parmigia','grana','pecorino','mozzarella','prosciutto','salame','salami','bresaola','mortadella','pane ','pane,','marmellata','konfitüre','jam','confettura','marmelad'] },
  { slug: 'grosshandel-hygiene', kw: ['detersivo','detergent','reinigung','pulizia','pulitore','sgrassator','sapone','soap','seife','shampoo','balsamo','bagnoschiuma','docciaschiuma','dentifricio','zahnpasta','collutorio','deodorant','profum','carta igienica','fazzoletti','scottex','kleenex','salviette','tovaglioli','candeggina','amuchina','lysol','domestos','ajax','wc gel','anticalcare','spugna','panno','straccio','mocio','scopa','sacchetti','buste','imballagg','pellicola','alluminio','stagnola','piatti','bicchieri','posate','assorbente','pannolino','baby','pampers','huggies'] },
]
const CATEGORY_FALLBACK = 'grosshandel-sonstiges'

function categorizeName(name) {
  const lower = name.toLowerCase()
  for (const rule of CATEGORY_RULES) {
    if (rule.kw.some(kw => lower.includes(kw))) return rule.slug
  }
  return CATEGORY_FALLBACK
}

// ─── Scraping helper (runs inside page.evaluate — must be self-contained) ──
/**
 * Extract all products from the current catalog page DOM.
 * Confirmed selectors from live page inspection (May 2026):
 *   - Cards:      div.div_totcella
 *   - Image:      img.foto_catalog  (real URL from Migroweb CDN)
 *   - Name:       strong[3].innerText
 *   - Brand:      strong[0] or strong[1] (producer/brand label)
 *   - Price:      first "n,nnn" match in card.innerText (cost price per carton)
 *   - SKU:        "Articolo XXXXXX" in card.innerText
 *   - Stock:      "DISPONIBILITA' : XX x YY" in card.innerText
 *   - EAN:        "CODICE EAN : XXXXXXXXXX" in card.innerText
 *   - IVA:        "Iva XX%" in card.innerText
 *   - VE:         "X NN Pz" in card.innerText  (Verkaufseinheit / sales unit)
 *   - Description: all td/span text blocks for additional product info
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

      // ── Brand: try strong[0], strong[1], strong[2] for producer name ───
      let brand = ''
      for (let i = 0; i <= 2; i++) {
        const t = strongs[i] ? strongs[i].innerText.trim() : ''
        if (t && t.length > 1 && !/^\d+$/.test(t) && !t.toLowerCase().includes('articolo')) {
          brand = t
          break
        }
      }

      // ── SKU: "Articolo 212022" ──────────────────────────────────────────
      const artMatch = text.match(/Articolo\s+(\d+)/i)
      const sku = artMatch ? artMatch[1] : ''

      // ── IVA: "Iva 22%" ─────────────────────────────────────────────────
      const ivaMatch = text.match(/Iva\s+(\d+)%/i)
      const iva = ivaMatch ? parseInt(ivaMatch[1], 10) : 22

      // ── Stock: "DISPONIBILITA' : 11 x 36" ──────────────────────────────
      const dispMatch = text.match(/DISPONIBILITA'?\s*:\s*([\d\s xX×]+)/i)
      const stockText = dispMatch ? dispMatch[1].trim() : ''

      // ── EAN: "CODICE EAN : 8021684153808" ──────────────────────────────
      const eanMatch = text.match(/CODICE EAN\s*:\s*(\d+)/i)
      const ean = eanMatch ? eanMatch[1] : ''

      // ── Price: first decimal number e.g. "1,496" (Imballi/carton price) ─
      const prices = text.match(/\d+,\d+/g)
      const priceText = prices ? prices[0] : ''
      if (!priceText) return

      // ── VE: "X 36 Pz" → store as "36 Pz" (1:1 from Migroweb) ──────────
      const veMatch = text.match(/X\s*(\d+)\s*Pz/i)
      const veText = veMatch ? veMatch[0].replace(/^X\s*/i, '').trim().replace('Pz', 'Stk') : ''  // "36 Stk"
      const qtyText = veMatch ? veMatch[0] : ''  // kept for parseUnitQty compat

      // ── Extra description lines (td content beyond the name) ──────────
      // Grab all visible text cells that look like product attributes
      const descParts = []
      if (ean)       descParts.push(`EAN: ${ean}`)
      if (veText)    descParts.push(`VE: ${veText}`)
      if (brand)     descParts.push(`Marke: ${brand}`)

      results.push({ name, brand, sku, ean, iva, imgSrc, stockText, priceText, qtyText, veText, descParts })
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
    // How it works:
    //   - After login, navigate to gestione_ordini.jsp (the order management page)
    //   - Click "Nuovo Ordine Catalogo" which calls nuovo_ordine_car() via onclick
    //   - That function shows an alert("Inserire la piattaforma") — accept it
    //   - Accepting the alert triggers a navigation to insordiniCat.jsp
    //   - insordiniCat.jsp already has 200 product cards loaded (no Vai needed)
    //   - Pagination: GOPAG input + vaiapagina() JS function (69 pages total)
    //
    // CDP notes:
    //   - page.click() and await evaluate() both hang 3min (protocolTimeout) on this page
    //   - Use fire-and-forget evaluate().catch(() => {}) for all button clicks
    //   - Auto-accept dialogs to prevent headless confirm() returning false

    // Helper: search frames for a selector (3s timeout per frame to avoid CDP freeze)
    async function findFrameWithSelector(frames, selector) {
      for (const frame of frames) {
        try {
          const el = await Promise.race([
            frame.$(selector),
            new Promise((_, r) => setTimeout(() => r(null), 3000)),
          ])
          if (el) return { frame, el }
        } catch (_) {}
      }
      return null
    }

    // Load the order management page
    const ordiniUrl = `${CONFIG.baseUrl}/MigroWeb/gestione_ordini.jsp`
    log('Loading:', ordiniUrl)
    await page.goto(ordiniUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await new Promise(r => setTimeout(r, 2000))

    let allFrames = page.frames()
    const ordiniFound = await findFrameWithSelector(allFrames, 'input[value="Nuovo Ordine Catalogo"]')
    if (!ordiniFound) throw new Error('Nuovo Ordine Catalogo button not found')
    log('✅ Order page ready')

    // Auto-accept alerts from nuovo_ordine_car() — headless dismisses them by default
    // which blocks navigation. Accepting the alert is what triggers the nav to insordiniCat.jsp.
    page.on('dialog', async dialog => { await dialog.accept() })

    // Fire-and-forget click (awaiting evaluate causes 3min CDP protocolTimeout)
    ordiniFound.frame.evaluate(() => {
      const btn = document.querySelector('input[value="Nuovo Ordine Catalogo"]')
      if (btn) btn.click()
    }).catch(() => {})

    log('Clicked Nuovo Ordine Catalogo — waiting 20s for catalog...')
    await new Promise(r => setTimeout(r, 20000))
    page.removeAllListeners('dialog')
    log('Catalog URL:', page.url())

    // Find the frame containing product cards (div.div_totcella)
    allFrames = page.frames()
    let productFrame = null
    for (const f of allFrames) {
      try {
        const count = await Promise.race([
          f.evaluate(() => document.querySelectorAll('div.div_totcella').length),
          new Promise((_, r) => setTimeout(() => r(0), 3000)),
        ])
        if (count > 0) { productFrame = f; break }
      } catch (_) {}
    }

    if (!productFrame) {
      log('No products yet — waiting 15 more seconds...')
      await new Promise(r => setTimeout(r, 15000))
      allFrames = page.frames()
      for (const f of allFrames) {
        try {
          const count = await Promise.race([
            f.evaluate(() => document.querySelectorAll('div.div_totcella').length),
            new Promise((_, r) => setTimeout(() => r(0), 3000)),
          ])
          if (count > 0) { productFrame = f; break }
        } catch (_) {}
      }
    }

    if (!productFrame) throw new Error('No div.div_totcella found after navigation to catalog')

    let catalogFrame = productFrame
    log('✅ Catalog frame:', catalogFrame.url())

    // Click Vai to initialize the full catalog search (sets PAGTOT + pagination).
    // Products are pre-loaded but PAGTOT is only set after clicking Vai.
    catalogFrame.evaluate(() => {
      const btn = document.querySelector('input[name="Vai"]')
      if (btn) btn.click()
    }).catch(() => {})

    log('Clicked Vai — waiting for catalog to fully initialize (PAGTOT + products)...')

    // IMPORTANT: After Vai click the frame reloads, making the old catalogFrame stale.
    // Wait for PAGTOT to appear (this confirms the catalog is fully loaded with pagination).
    // Re-search frames to get a fresh reference.
    await new Promise(r => setTimeout(r, 3000)) // brief pause for reload to start
    let pagtotFound = false
    for (let attempt = 0; attempt < 6; attempt++) { // max 6 × 5s = 30s
      await new Promise(r => setTimeout(r, 5000))
      const frames = page.frames()
      for (const f of frames) {
        try {
          const pagtot = await Promise.race([
            f.evaluate(() => {
              const el = document.querySelector('input#PAGTOT')
              return el ? parseInt(el.value, 10) : 0
            }),
            new Promise((_, r) => setTimeout(() => r(0), 3000)),
          ])
          if (pagtot > 0) {
            catalogFrame = f
            pagtotFound = true
            log(`Catalog initialized: PAGTOT=${pagtot} in frame ${f.url()}`)
            break
          }
        } catch (_) {}
      }
      if (pagtotFound) break
      log(`Waiting for PAGTOT (attempt ${attempt + 1}/6)...`)
    }

    if (!pagtotFound) throw new Error('PAGTOT not found after Vai click — catalog did not initialize')
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

      await catalogFrame.waitForSelector('div.div_totcella', { timeout: 30000 })
      const pageProducts = await catalogFrame.evaluate(extractPageProducts)

      log(`  → ${pageProducts.length} products found`)
      allProducts.push(...pageProducts)

      if (pageNum >= totalPages) break

      // Navigate to next page via vaiapagina() JS function
      // vaiapagina() may be AJAX or frame reload — don't use waitForNavigation
      const nextPage = pageNum + 1

      // Read first product name on current page for change-detection below
      const prevFirstName = await catalogFrame.evaluate(() => {
        const first = document.querySelector('div.div_totcella')
        return first ? (first.innerText || '').slice(0, 60) : ''
      }).catch(() => '')

      await catalogFrame.evaluate((n) => {
        const gopag = document.getElementById('GOPAG')
        if (gopag) gopag.value = String(n)
        if (typeof vaiapagina === 'function') vaiapagina()
      }, nextPage)

      // Wait for page to reload: poll until first product changes OR 8s max
      let waited = 0
      while (waited < 8000) {
        await new Promise(r => setTimeout(r, 600))
        waited += 600
        const curFirstName = await catalogFrame.evaluate(() => {
          const first = document.querySelector('div.div_totcella')
          return first ? (first.innerText || '').slice(0, 60) : ''
        }).catch(() => '')
        if (curFirstName && curFirstName !== prevFirstName) break
      }
      // Extra safety buffer
      await new Promise(r => setTimeout(r, 500))
      await catalogFrame.waitForSelector('div.div_totcella', { timeout: 30000 })

      pageNum++
    }

    // ── Deduplicate by SKU (same product may appear on multiple pages) ────
    const seenRaw = new Set()
    const uniqueProducts = allProducts.filter(p => {
      const key = p.sku || p.name
      if (seenRaw.has(key)) return false
      seenRaw.add(key)
      return true
    })
    const dupes = allProducts.length - uniqueProducts.length
    log(`Total scraped: ${allProducts.length} entries across ${pageNum} pages (${dupes} duplicates removed → ${uniqueProducts.length} unique)`)
    stats.found = uniqueProducts.length
    const allProductsDeduped = uniqueProducts

    if (allProductsDeduped.length === 0) {
      throw new Error('No products found — check login or selectors')
    }

    // ── 5. DRY RUN or DB SYNC ────────────────────────────────────────────
    if (CONFIG.dryRun) {
      log('DRY RUN — sample of first 10 products:')
      allProductsDeduped.slice(0, 10).forEach((p, i) => {
        const cost = parsePrice(p.priceText)
        const sell = cost ? calcSellPrice(cost, CONFIG.markupFactor) : null
        log(`  [${i + 1}] ${p.name}`)
        log(`       SKU=${p.sku}  EAN=${p.ean}  brand="${p.brand}"  VE="${p.veText}"  img="${p.imgSrc}"`)
        log(`       cost=${p.priceText}(${cost})  sell=${sell}  stock="${p.stockText}"`)
      })
      log('DRY RUN complete — no DB changes made')
    } else {
      await browser.close()
      browser = null

      // Load Grosshandel subcategory slugs → ids for keyword-based assignment
      const ghCats = await prisma.category.findMany({
        where: { slug: { startsWith: 'grosshandel-' } },
        select: { id: true, slug: true },
      })
      const catIdBySlug = Object.fromEntries(ghCats.map(c => [c.slug, c.id]))
      const fallbackCatId = catIdBySlug[CATEGORY_FALLBACK]
      if (!fallbackCatId) throw new Error('Grosshandel categories not found — run scripts/setup-categories.js first')

      // Load per-category markup factors from DB settings (fallback: CONFIG.markupFactor)
      const markupSetting = await prisma.setting.findUnique({ where: { key: 'markup_factors' } })
      const markupFactors = markupSetting ? JSON.parse(markupSetting.value) : {}
      log(`Loaded markup factors: ${JSON.stringify(markupFactors)}`)

      // ── BULK DB SYNC (fast: 1 findMany + 1 createMany + batched updates) ──
      // Load all existing migroweb products in one query (avoid N+1 queries)
      log('Loading existing products from DB...')
      const existingRows = await prisma.product.findMany({
        where: { supplierSource: CONFIG.source },
        select: { id: true, supplierSku: true, name: true, price: true, images: true },
      })
      const bySkuMap  = new Map(existingRows.filter(p => p.supplierSku).map(p => [p.supplierSku, p]))
      const byNameMap = new Map(existingRows.filter(p => !p.supplierSku).map(p => [p.name, p]))
      log(`Loaded ${existingRows.length} existing products from DB`)

      const now = new Date()
      const seenSkus  = new Set()
      const toCreate  = []
      const toUpdate  = [] // { id, data }

      for (const item of allProductsDeduped) {
        const costPricePerPz = parsePrice(item.priceText)   // Migroweb price = per single piece (Pz)
        if (!costPricePerPz || costPricePerPz <= 0) continue

        const unitQty    = parseUnitQty(item.qtyText)        // pieces per VE (e.g. 24)
        // Multiply by unitQty to get the cost per VE (carton)
        const costPrice  = Math.round(costPricePerPz * Math.max(unitQty, 1) * 100) / 100

        const catSlugForMarkup = categorizeName(item.name)
        const factor = markupFactors[catSlugForMarkup] ?? CONFIG.markupFactor
        const sellPrice  = calcSellPrice(costPrice, factor)
        const stockCount = parseStock(item.stockText)
        const sku        = item.sku || null

        // ── VE: use Migroweb text 1:1 (e.g. "36 Pz"), fallback computed ──
        const unitLabel = item.veText || (unitQty > 1 ? `${unitQty} Stk` : '1 Stk')

        // ── Brand: from card, fallback to 'Migroweb' ─────────────────────
        const brand = item.brand || 'Migroweb'

        // ── Image: direct src from img.foto_catalog ───────────────────────
        const imgUrl = item.imgSrc || (sku ? `https://www.wmphoto.it/products/${sku}.jpg` : '')

        // ── Details: structured info from Migroweb card ───────────────────
        const details = {}
        if (item.ean)      details['EAN']            = item.ean
        if (item.iva)      details['MwSt']           = `${item.iva}%`
        if (unitLabel)     details['VE']             = unitLabel
        if (item.stockText) details['Verfügbarkeit'] = item.stockText
        if (sku)           details['Artikelnr.']     = sku

        // ── Description: name + key details (min 10 chars) ───────────────
        const descParts = [item.name]
        if (item.veText) descParts.push(`VE: ${item.veText}`)
        if (item.ean)    descParts.push(`EAN: ${item.ean}`)
        const description = descParts.join(' | ').padEnd(10, '.')

        if (sku) seenSkus.add(sku)

        const existing = sku ? bySkuMap.get(sku) : byNameMap.get(item.name)

        if (existing) {
          const data = {
            stock:        stockCount,
            costPrice,
            lastSyncedAt: now,
            unit:         unitLabel,   // always keep VE in sync with supplier
            details,                   // refresh details each sync
          }
          // Always update sell price (recalculated from per-VE cost price)
          data.price = sellPrice
          // Update image if currently empty
          if (imgUrl && (!existing.images || existing.images.length === 0)) {
            data.images = [imgUrl]
          }
          toUpdate.push({ id: existing.id, data })
          stats.updated++
        } else {
          const catSlug = categorizeName(item.name)
          const categoryId = catIdBySlug[catSlug] || fallbackCatId
          // Use per-category markup if configured, else global MARKUP_FACTOR
          const effectiveFactor = markupFactors[catSlug] ?? CONFIG.markupFactor

          toCreate.push({
            name:           item.name,
            slug:           buildSlug(item.name, sku),
            description,
            brand,
            emoji:          '📦',
            price:          sellPrice,
            unit:           unitLabel,
            moq:            1,
            stock:          stockCount,
            active:         true,      // visible immediately
            categoryId,
            supplierSku:    sku,
            supplierSource: CONFIG.source,
            costPrice,
            lastSyncedAt:   now,
            syncManaged:    true,
            images:         imgUrl ? [imgUrl] : [],
            details,
          })
          stats.new++
        }
      }

      // Bulk create (one query)
      if (toCreate.length > 0) {
        log(`Creating ${toCreate.length} new products (bulk)...`)
        await prisma.product.createMany({ data: toCreate, skipDuplicates: true })
        log(`✅ Created ${toCreate.length} products`)
      }

      // Batched updates: 50 in parallel per batch (~200ms per batch vs 50s sequential)
      if (toUpdate.length > 0) {
        log(`Updating ${toUpdate.length} existing products (batched)...`)
        const BATCH = 50
        for (let i = 0; i < toUpdate.length; i += BATCH) {
          const batch = toUpdate.slice(i, i + BATCH)
          await Promise.all(batch.map(({ id, data }) =>
            prisma.product.update({ where: { id }, data })
          ))
          if ((i + BATCH) % 2000 === 0 || i + BATCH >= toUpdate.length) {
            log(`  Updated ${Math.min(i + BATCH, toUpdate.length)} / ${toUpdate.length}`)
          }
        }
        log(`✅ Updated ${toUpdate.length} products`)
      }

      // ── 6. DEACTIVATE MISSING PRODUCTS ────────────────────────────────
      if (seenSkus.size > 0) {
        const result = await prisma.product.updateMany({
          where: {
            supplierSource: CONFIG.source,
            syncManaged:    true,
            active:         true,
            supplierSku:    { notIn: Array.from(seenSkus) },
          },
          data: { active: false, stock: 0 },
        })
        stats.deactivated = result.count
        if (result.count > 0) log(`⛔ Deactivated ${result.count} products not in supplier catalog`)
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
