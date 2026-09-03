import { PrismaClient } from '@prisma/client'

const p = new PrismaClient()

const TEABALLS_PARENT = 'cmozp7s1q000b3v8si6dq05k2'

async function main() {
  // ── 1. Kategorien anlegen ────────────────────────────────────────────────
  const cat12 = await p.category.upsert({
    where: { slug: 'teaballs-heiss-kalt-12er' },
    update: {},
    create: {
      name:      'TEABALLS heiß & kalt – 12er Box',
      slug:      'teaballs-heiss-kalt-12er',
      emoji:     '📦',
      sortOrder: 24,
      parentId:  TEABALLS_PARENT,
    },
  })

  const cat100 = await p.category.upsert({
    where: { slug: 'teaballs-heiss-kalt-100er' },
    update: {},
    create: {
      name:      'TEABALLS heiß & kalt – 100er Box',
      slug:      'teaballs-heiss-kalt-100er',
      emoji:     '🏭',
      sortOrder: 25,
      parentId:  TEABALLS_PARENT,
    },
  })

  console.log('Kategorien:', cat12.name, '|', cat100.name)

  // ── 2. Produkte: 12er Boxen ──────────────────────────────────────────────
  const products12 = [
    {
      name:        'TEABALLS heiß & kalt – Earl Grey 12er Box',
      slug:        'teaballs-earl-grey-12er',
      description: 'TEABALLS Earl Grey in der praktischen 12er-Box. Heiß oder kalt geniessen – schnell fertig, ohne Beutel. Glutenfrei, laktosefrei, vegan.',
      emoji:       '🍵',
      bgGradient:  'linear-gradient(135deg, #9ca3af, #6b7280)',
      sku:         'TB-EG-12',
      badge:       'NEU',
      unit:        '12er Box',
      moq:         6,
      price:       15.00,
      details:     { Geschmack: 'Earl Grey', Inhalt: '12 Packs', Zubereitung: 'Heiß & Kalt', Glutenfrei: 'Ja', Laktosefrei: 'Ja', Vegan: 'Ja' },
    },
    {
      name:        'TEABALLS heiß & kalt – Grüner Tee 12er Box',
      slug:        'teaballs-gruener-tee-12er',
      description: 'TEABALLS Grüner Tee in der 12er-Box. Frisch und leicht – ideal heiß und kalt. Glutenfrei, laktosefrei, vegan.',
      emoji:       '🍃',
      bgGradient:  'linear-gradient(135deg, #84cc16, #65a30d)',
      sku:         'TB-GT-12',
      badge:       'NEU',
      unit:        '12er Box',
      moq:         6,
      price:       15.00,
      details:     { Geschmack: 'Grüner Tee', Inhalt: '12 Packs', Zubereitung: 'Heiß & Kalt', Glutenfrei: 'Ja', Laktosefrei: 'Ja', Vegan: 'Ja' },
    },
    {
      name:        'TEABALLS heiß & kalt – Pfefferminze 12er Box',
      slug:        'teaballs-pfefferminze-12er',
      description: 'TEABALLS Pfefferminze in der 12er-Box. Erfrischend minzig – heiß als Wohlfühltee, kalt als erfrischendes Getränk. Glutenfrei, laktosefrei, vegan.',
      emoji:       '🌿',
      bgGradient:  'linear-gradient(135deg, #22c55e, #16a34a)',
      sku:         'TB-PM-12',
      badge:       'NEU',
      unit:        '12er Box',
      moq:         6,
      price:       15.00,
      details:     { Geschmack: 'Pfefferminze', Inhalt: '12 Packs', Zubereitung: 'Heiß & Kalt', Glutenfrei: 'Ja', Laktosefrei: 'Ja', Vegan: 'Ja' },
    },
    {
      name:        'TEABALLS heiß & kalt – Wildberry 12er Box',
      slug:        'teaballs-wildberry-12er',
      description: 'TEABALLS Wildberry in der 12er-Box. Fruchtig-beerig – heiß oder als erfrischender Eistee. Glutenfrei, laktosefrei, vegan.',
      emoji:       '🫐',
      bgGradient:  'linear-gradient(135deg, #c026d3, #9333ea)',
      sku:         'TB-WB-12',
      badge:       'NEU',
      unit:        '12er Box',
      moq:         6,
      price:       15.00,
      details:     { Geschmack: 'Wildberry', Inhalt: '12 Packs', Zubereitung: 'Heiß & Kalt', Glutenfrei: 'Ja', Laktosefrei: 'Ja', Vegan: 'Ja' },
    },
    {
      name:        'TEABALLS heiß & kalt – Zitrone 12er Box',
      slug:        'teaballs-zitrone-12er',
      description: 'TEABALLS Zitrone in der 12er-Box. Frisch-zitronig mit Vitamin C – heiß oder als erfrischender Cold Brew. Glutenfrei, laktosefrei, vegan.',
      emoji:       '🍋',
      bgGradient:  'linear-gradient(135deg, #eab308, #ca8a04)',
      sku:         'TB-ZI-12',
      badge:       'NEU · Vitamine +',
      unit:        '12er Box',
      moq:         6,
      price:       15.00,
      details:     { Geschmack: 'Zitrone', Inhalt: '12 Packs', Zubereitung: 'Heiß & Kalt', Vitamine: 'Vitamin C', Glutenfrei: 'Ja', Laktosefrei: 'Ja', Vegan: 'Ja' },
    },
  ]

  // ── 3. Produkte: 100er Boxen (Gastro/Grosshandel) ───────────────────────
  const products100 = [
    {
      name:        'TEABALLS heiß & kalt – Earl Grey 100er Gastrobox',
      slug:        'teaballs-earl-grey-100er',
      description: 'TEABALLS Earl Grey in der 100er Gastrobox für Gastronomie und Grossverbraucher. Heiß oder kalt – schnell fertig, ohne Beutel.',
      emoji:       '🍵',
      bgGradient:  'linear-gradient(135deg, #9ca3af, #6b7280)',
      sku:         'TB-EG-100',
      badge:       'GASTRO',
      unit:        '100er Gastrobox',
      moq:         2,
      price:       85.00,
      details:     { Geschmack: 'Earl Grey', Inhalt: '100 Packs', Zubereitung: 'Heiß & Kalt', Ideal_für: 'Gastronomie', Glutenfrei: 'Ja', Laktosefrei: 'Ja', Vegan: 'Ja' },
    },
    {
      name:        'TEABALLS heiß & kalt – Minze 100er Gastrobox',
      slug:        'teaballs-minze-100er',
      description: 'TEABALLS Minze in der 100er Gastrobox. Erfrischend minzig – ideal für Restaurants, Hotels und Kantinen.',
      emoji:       '🌿',
      bgGradient:  'linear-gradient(135deg, #22c55e, #16a34a)',
      sku:         'TB-MI-100',
      badge:       'GASTRO',
      unit:        '100er Gastrobox',
      moq:         2,
      price:       85.00,
      details:     { Geschmack: 'Minze', Inhalt: '100 Packs', Zubereitung: 'Heiß & Kalt', Ideal_für: 'Gastronomie', Glutenfrei: 'Ja', Laktosefrei: 'Ja', Vegan: 'Ja' },
    },
    {
      name:        'TEABALLS heiß & kalt – Wildberry 100er Gastrobox',
      slug:        'teaballs-wildberry-100er',
      description: 'TEABALLS Wildberry in der 100er Gastrobox. Fruchtiger Beerengenuss heiß und kalt – ideal für die Gastronomie.',
      emoji:       '🫐',
      bgGradient:  'linear-gradient(135deg, #c026d3, #9333ea)',
      sku:         'TB-WB-100',
      badge:       'GASTRO',
      unit:        '100er Gastrobox',
      moq:         2,
      price:       85.00,
      details:     { Geschmack: 'Wildberry', Inhalt: '100 Packs', Zubereitung: 'Heiß & Kalt', Ideal_für: 'Gastronomie', Glutenfrei: 'Ja', Laktosefrei: 'Ja', Vegan: 'Ja' },
    },
    {
      name:        'TEABALLS heiß & kalt – Zitrone 100er Gastrobox',
      slug:        'teaballs-zitrone-100er',
      description: 'TEABALLS Zitrone + Vitamin C in der 100er Gastrobox. Ideal für Hotels, Restaurants und Büros – schnell fertig, ohne Beutel.',
      emoji:       '🍋',
      bgGradient:  'linear-gradient(135deg, #eab308, #ca8a04)',
      sku:         'TB-ZI-100',
      badge:       'GASTRO · Vitamine +',
      unit:        '100er Gastrobox',
      moq:         2,
      price:       85.00,
      details:     { Geschmack: 'Zitrone', Inhalt: '100 Packs', Zubereitung: 'Heiß & Kalt', Vitamine: 'Vitamin C', Ideal_für: 'Gastronomie', Glutenfrei: 'Ja', Laktosefrei: 'Ja', Vegan: 'Ja' },
    },
  ]

  // ── 4. Produkte in DB schreiben ──────────────────────────────────────────
  let created = 0
  for (const prod of products12) {
    await p.product.upsert({
      where: { slug: prod.slug },
      update: {},
      create: { ...prod, categoryId: cat12.id, brand: 'TEABALLS', stock: 200, taxRate: 0.025, active: true, details: prod.details },
    })
    created++
    console.log('✓', prod.name)
  }

  for (const prod of products100) {
    await p.product.upsert({
      where: { slug: prod.slug },
      update: {},
      create: { ...prod, categoryId: cat100.id, brand: 'TEABALLS', stock: 50, taxRate: 0.025, active: true, details: prod.details },
    })
    created++
    console.log('✓', prod.name)
  }

  console.log(`\n✅ ${created} Produkte angelegt.`)
  console.log('⚠️  Preise bitte im Admin-Panel anpassen: /admin/products')
}

main().catch(console.error).finally(() => p.$disconnect())
