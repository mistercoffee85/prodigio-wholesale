import { PrismaClient, Role, UserStatus, PriceGroup } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── Admin User ──────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin123!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'gionatan.devita@gmail.com' },
    update: {},
    create: {
      email: 'gionatan.devita@gmail.com',
      password: adminPassword,
      name: 'Gionatan De Vita',
      role: Role.ADMIN,
      status: UserStatus.APPROVED,
    },
  })
  console.log('✅ Admin created:', admin.email)

  // ── Demo Customer ───────────────────────────────────────────────
  const customerPassword = await bcrypt.hash('Demo123!', 12)
  const customer = await prisma.user.upsert({
    where: { email: 'demo@kunde.ch' },
    update: {},
    create: {
      email: 'demo@kunde.ch',
      password: customerPassword,
      name: 'Max Mustermann',
      role: Role.CUSTOMER,
      status: UserStatus.APPROVED,
      company: {
        create: {
          name: 'Demo GmbH',
          industry: 'Einzelhandel',
          address: 'Musterstrasse 1',
          city: 'Zürich',
          zip: '8001',
          country: 'CH',
          uid: 'CHE-123.456.789',
          priceGroup: PriceGroup.STANDARD,
        },
      },
    },
  })
  console.log('✅ Demo customer created:', customer.email)

  // ── Categories ──────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'bubble-tea' },
      update: {},
      create: { name: 'Bubble Tea', slug: 'bubble-tea', emoji: '🧋', description: 'BOBAJOY RTD, DIY Sets, Fruchtperlen, Zubehör', sortOrder: 1 },
    }),
    prisma.category.upsert({
      where: { slug: 'tea-balls' },
      update: {},
      create: { name: 'Tea Balls', slug: 'tea-balls', emoji: '🍵', description: 'Tee ohne Beutel — einfach, nachhaltig, aromatisch', sortOrder: 2 },
    }),
    prisma.category.upsert({
      where: { slug: 'sweets' },
      update: {},
      create: { name: 'Sweets & Schokolade', slug: 'sweets', emoji: '🍫', description: 'PatisLove, The Mallows, XocoSweet', sortOrder: 3 },
    }),
  ])
  console.log('✅ Categories created:', categories.map(c => c.name).join(', '))

  const [bubbleTea, teaBalls, sweets] = categories

  // ── Products ────────────────────────────────────────────────────
  const products = [
    // Bubble Tea
    {
      name: 'BOBAJOY Ready-to-Drink Mango',
      slug: 'bobajoy-rtd-mango',
      brand: 'BOBAJOY',
      emoji: '🧋',
      bgGradient: 'linear-gradient(135deg, #fff3cd, #fde68a)',
      price: 38.40,
      unit: '12er Tray (250ml)',
      moq: 6,
      badge: 'hot',
      categoryId: bubbleTea.id,
      stock: 500,
      sku: 'BJ-RTD-MNG-12',
      description: 'Das meistverkaufte Bubble Tea der Schweiz. Echter Mango-Geschmack mit Kokosmilch, fertig zum Trinken. Ideal für Cafés, Kioske und Einzelhandel.',
      details: { 'Inhalt': '250ml pro Dose', 'VE Inhalt': '12 Dosen', 'MHD': '12 Monate', 'Lagerung': 'Kühlschrank 0–8°C', 'EAN': '7612345678901' },
    },
    {
      name: 'BOBAJOY Ready-to-Drink Strawberry',
      slug: 'bobajoy-rtd-strawberry',
      brand: 'BOBAJOY',
      emoji: '🍓',
      bgGradient: 'linear-gradient(135deg, #ffe4e6, #fda4af)',
      price: 38.40,
      unit: '12er Tray (250ml)',
      moq: 6,
      badge: 'new',
      categoryId: bubbleTea.id,
      stock: 350,
      sku: 'BJ-RTD-STR-12',
      description: 'Frischer Erdbeer-Geschmack mit echten Fruchtperlen. Ohne künstliche Farben oder Aromen.',
      details: { 'Inhalt': '250ml pro Dose', 'VE Inhalt': '12 Dosen', 'MHD': '12 Monate', 'Lagerung': 'Kühlschrank 0–8°C' },
    },
    {
      name: 'BOBAJOY Ready-to-Drink Taro Purple',
      slug: 'bobajoy-rtd-taro',
      brand: 'BOBAJOY',
      emoji: '🫐',
      bgGradient: 'linear-gradient(135deg, #ede9fe, #c4b5fd)',
      price: 38.40,
      unit: '12er Tray (250ml)',
      moq: 6,
      badge: null,
      categoryId: bubbleTea.id,
      stock: 280,
      sku: 'BJ-RTD-TAR-12',
      description: 'Cremiger Taro-Geschmack mit Kokosmilch und Tapioka-Perlen. Der Instagram-Hit unter den Bubble Teas.',
      details: { 'Inhalt': '250ml pro Dose', 'VE Inhalt': '12 Dosen', 'MHD': '12 Monate' },
    },
    {
      name: 'DIY Bubble Tea Starter Set',
      slug: 'diy-bubble-tea-starter-set',
      brand: 'meinBubbleTea',
      emoji: '🫧',
      bgGradient: 'linear-gradient(135deg, #ecfdf5, #a7f3d0)',
      price: 64.80,
      comparePrice: 72.00,
      unit: 'Set (6x DIY-Kit)',
      moq: 6,
      badge: 'sale',
      categoryId: bubbleTea.id,
      stock: 150,
      sku: 'MBT-DIY-STR-6',
      description: 'Komplettes DIY-Set für den Heimgebrauch. Mit Boba-Perlen, Milchtee, Cups und Straws. Ideal für Wiederverkäufer.',
      details: { 'Inhalt': 'Vollständiges Kit', 'VE Inhalt': '6 Sets', 'Portionen': '2 pro Kit', 'Format': 'Geschenkkarton' },
    },
    {
      name: 'Fruchtperlen Mango 1kg',
      slug: 'fruchtperlen-mango-1kg',
      brand: 'meinBubbleTea',
      emoji: '🟡',
      bgGradient: 'linear-gradient(135deg, #fef9c3, #fde047)',
      price: 18.50,
      unit: 'Beutel 1kg',
      moq: 12,
      badge: null,
      categoryId: bubbleTea.id,
      stock: 800,
      sku: 'MBT-FRP-MNG-1K',
      description: 'Premium Mango-Fruchtperlen (Popping Boba) für Bubble Tea, Yoghurt und Desserts. Frisch und saftig.',
      details: { 'Gewicht': '1kg', 'Perlen': '~1000 Stück', 'MHD': '18 Monate', 'Lagerung': 'Kühl & trocken' },
    },
    {
      name: 'Fruchtperlen Strawberry 1kg',
      slug: 'fruchtperlen-strawberry-1kg',
      brand: 'meinBubbleTea',
      emoji: '🔴',
      bgGradient: 'linear-gradient(135deg, #ffe4e6, #fca5a5)',
      price: 18.50,
      unit: 'Beutel 1kg',
      moq: 12,
      badge: null,
      categoryId: bubbleTea.id,
      stock: 650,
      sku: 'MBT-FRP-STR-1K',
      description: 'Erdbeere Popping Boba — knallt im Mund auf! Ideal für Bubble Tea, Softeis und Desserts.',
      details: { 'Gewicht': '1kg', 'MHD': '18 Monate', 'Lagerung': 'Kühl & trocken' },
    },
    {
      name: 'Bubble Tea Cups 700ml (50er)',
      slug: 'bubble-tea-cups-700ml-50er',
      brand: 'meinBubbleTea',
      emoji: '🥤',
      bgGradient: 'linear-gradient(135deg, #f0f9ff, #bae6fd)',
      price: 16.90,
      unit: '50er Pack',
      moq: 6,
      badge: null,
      categoryId: bubbleTea.id,
      stock: 1200,
      sku: 'MBT-CUP-700-50',
      description: 'Professionelle transparente Kunststoff-Cups mit Deckel für Bubble Tea. Kompatibel mit Siegelfolien-Maschinen.',
      details: { 'Volumen': '700ml', 'Material': 'PET', 'Pack': '50 Stück + Deckel', 'Durchmesser': '90mm' },
    },
    {
      name: 'Boba Straws XL Papier (100er)',
      slug: 'boba-straws-xl-100er',
      brand: 'meinBubbleTea',
      emoji: '🥢',
      bgGradient: 'linear-gradient(135deg, #f5f3ff, #ddd6fe)',
      price: 8.90,
      unit: '100er Pack',
      moq: 12,
      badge: null,
      categoryId: bubbleTea.id,
      stock: 2000,
      sku: 'MBT-STR-XL-100',
      description: 'Extra breite Straws (12mm) für Tapioka-Perlen. Aus Papier, kompostierbar. Verschiedene Farben verfügbar.',
      details: { 'Durchmesser': '12mm', 'Material': 'Papier (kompostierbar)', 'Pack': '100 Stück', 'Länge': '21cm' },
    },
    // Tea Balls
    {
      name: 'Tea Balls Classic Black Tea (100er)',
      slug: 'tea-balls-classic-black-100er',
      brand: 'Tea Balls',
      emoji: '🫖',
      bgGradient: 'linear-gradient(135deg, #fef3c7, #fcd34d)',
      price: 24.00,
      unit: 'Dose 100 Balls',
      moq: 6,
      badge: null,
      categoryId: teaBalls.id,
      stock: 400,
      sku: 'TB-BLK-100',
      description: 'Tee komprimiert in kleinen Kugeln — kein Beutel, kein Sieb. Einfach in die Tasse, mit heissem Wasser aufgiessen.',
      details: { 'Sorte': 'Schwarztee', 'Pack': '100 Kugeln', 'Portionen': '100 Tassen', 'Koffein': 'Ja' },
    },
    {
      name: 'Tea Balls Green Tea Sencha (100er)',
      slug: 'tea-balls-green-sencha-100er',
      brand: 'Tea Balls',
      emoji: '🍃',
      bgGradient: 'linear-gradient(135deg, #ecfdf5, #6ee7b7)',
      price: 24.00,
      unit: 'Dose 100 Balls',
      moq: 6,
      badge: 'new',
      categoryId: teaBalls.id,
      stock: 320,
      sku: 'TB-GRN-100',
      description: 'Premium Sencha Grüntee in Ball-Form. Aromatisch, frisch und kompostierbar.',
      details: { 'Sorte': 'Grüntee Sencha', 'Pack': '100 Kugeln', 'Herkunft': 'Japan/China' },
    },
    {
      name: 'Tea Balls Earl Grey (100er)',
      slug: 'tea-balls-earl-grey-100er',
      brand: 'Tea Balls',
      emoji: '🌸',
      bgGradient: 'linear-gradient(135deg, #ede9fe, #a78bfa)',
      price: 24.00,
      unit: 'Dose 100 Balls',
      moq: 6,
      badge: null,
      categoryId: teaBalls.id,
      stock: 290,
      sku: 'TB-EAR-100',
      description: 'Klassischer Earl Grey mit echtem Bergamotte-Öl. Die beliebteste Sorte aus dem Tea-Balls-Sortiment.',
      details: { 'Sorte': 'Earl Grey', 'Aroma': 'Bergamotte', 'Pack': '100 Kugeln' },
    },
    {
      name: 'Tea Balls Peach Ice Tea (100er)',
      slug: 'tea-balls-peach-ice-tea-100er',
      brand: 'Tea Balls',
      emoji: '🍑',
      bgGradient: 'linear-gradient(135deg, #fff7ed, #fed7aa)',
      price: 26.00,
      unit: 'Dose 100 Balls',
      moq: 6,
      badge: 'hot',
      categoryId: teaBalls.id,
      stock: 380,
      sku: 'TB-PCH-ICE-100',
      description: 'Speziell für kaltes Wasser entwickelt! Pfirsich-Geschmack, einfach in Eiswasser auflösen. Perfekt für den Sommer.',
      details: { 'Typ': 'Cold Brew / Ice Tea', 'Temperatur': 'Kalt & Heiss', 'Pack': '100 Kugeln', 'Zucker': 'Leicht gesüsst' },
    },
    // Sweets
    {
      name: 'PatisLove Pistaziencreme 200g',
      slug: 'patislove-pistaziencreme-200g',
      brand: 'PatisLove',
      emoji: '🟢',
      bgGradient: 'linear-gradient(135deg, #ecfdf5, #86efac)',
      price: 9.80,
      comparePrice: 11.50,
      unit: 'Glas 200g',
      moq: 12,
      badge: 'hot',
      categoryId: sweets.id,
      stock: 600,
      sku: 'PL-PST-200G',
      description: 'Die luxuriöse Alternative zu Nusscreme. 40% echte Pistazien, cremig und intensiv. Für Bäckereien und Feinkost-Läden.',
      details: { 'Gewicht': '200g', 'Pistazien': '40%', 'MHD': '12 Monate', 'Glutenfrei': 'Ja', 'Vegan': 'Ja' },
    },
    {
      name: 'PatisLove Freeze Dried Dragées 80g',
      slug: 'patislove-freeze-dried-dragees-80g',
      brand: 'PatisLove',
      emoji: '✨',
      bgGradient: 'linear-gradient(135deg, #fef3c7, #fbbf24)',
      price: 7.20,
      unit: 'Beutel 80g',
      moq: 12,
      badge: 'new',
      categoryId: sweets.id,
      stock: 450,
      sku: 'PL-FRZ-DRG-80G',
      description: 'Lyophilisierte Schokoladendrops für Dekoration und Snacking. Einzigartiges Knuspern — der Trend auf Social Media.',
      details: { 'Gewicht': '80g', 'Sorten': 'Mix / Schokolade', 'MHD': '18 Monate' },
    },
    {
      name: 'The Mallows Marshmallows Vanilla 150g',
      slug: 'the-mallows-marshmallows-vanilla-150g',
      brand: 'The Mallows',
      emoji: '🤍',
      bgGradient: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
      price: 6.40,
      unit: 'Box 150g',
      moq: 12,
      badge: null,
      categoryId: sweets.id,
      stock: 520,
      sku: 'TM-MSH-VAN-150G',
      description: 'Premium Gourmet-Marshmallows aus Dänemark. Echte Vanille, handgemacht. Für Cafés, Geschenkshops und Feinkostabteilungen.',
      details: { 'Gewicht': '150g', 'Herkunft': 'Dänemark', 'Geschmack': 'Vanille', 'MHD': '9 Monate' },
    },
    {
      name: 'The Mallows Marshmallows Strawberry 150g',
      slug: 'the-mallows-marshmallows-strawberry-150g',
      brand: 'The Mallows',
      emoji: '🍓',
      bgGradient: 'linear-gradient(135deg, #fff1f2, #fecdd3)',
      price: 6.40,
      unit: 'Box 150g',
      moq: 12,
      badge: 'new',
      categoryId: sweets.id,
      stock: 480,
      sku: 'TM-MSH-STR-150G',
      description: 'Erdbeere-Marshmallows mit echter Frucht. Wunderbar als Geschenk oder Café-Beilage für Kakao.',
      details: { 'Gewicht': '150g', 'Herkunft': 'Dänemark', 'Geschmack': 'Erdbeere', 'MHD': '9 Monate' },
    },
    {
      name: 'XocoSweet Dubai Pistachio Chocolate Bar',
      slug: 'xocosweet-dubai-pistachio-bar',
      brand: 'XocoSweet',
      emoji: '🍫',
      bgGradient: 'linear-gradient(135deg, #ecfdf5, #34d399)',
      price: 8.50,
      unit: 'Riegel 90g',
      moq: 12,
      badge: 'hot',
      categoryId: sweets.id,
      stock: 350,
      sku: 'XS-DXB-PST-90G',
      description: 'Der Dubai-Style Schokoladen-Riegel mit Pistaziencreme und knuspriger Kadaïf-Füllung. Viraler TikTok-Hit.',
      details: { 'Gewicht': '90g', 'Schokolade': 'Milch 38%', 'Füllung': 'Pistazien + Kadaïf', 'Vegan': 'Nein' },
    },
  ]

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...p,
        details: p.details as any,
        price: p.price,
        comparePrice: p.comparePrice ?? null,
      },
    })
  }
  console.log(`✅ ${products.length} products created`)

  // ── Settings ────────────────────────────────────────────────────
  const settings = [
    { key: 'free_shipping_threshold', value: '300' },
    { key: 'shipping_cost', value: '12.90' },
    { key: 'vat_rate', value: '0.081' },
    { key: 'company_name', value: 'PRO.DI.GIO GmbH' },
    { key: 'company_address', value: 'Dreispitz, 4142 Basel, Schweiz' },
    { key: 'company_email', value: 'wholesale@prodigio.ch' },
    { key: 'company_phone', value: '+41 61 212 34 56' },
    { key: 'min_order_value', value: '100' },
  ]

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    })
  }
  console.log('✅ Settings created')

  console.log('\n🎉 Seed complete!')
  console.log('   Admin login: gionatan.devita@gmail.com / Admin123!')
  console.log('   Demo login:  demo@kunde.ch / Demo123!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
