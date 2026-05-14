'use strict'
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

// ── Keyword rules (order matters — first match wins) ──────────────────────
const RULES = [
  {
    slug: 'grosshandel-getraenke',
    keywords: [
      'acqua','water','wasser','succo','juice','saft','cola','fanta','sprite','pepsi',
      'aranciata','limonata','cedrata','gassosa','bibita','bevanda','drink','soft',
      'energy','monster','redbull','gatorade','powerade','lucozade','tonic',
      'limon','arancia','chinotto','san pellegrino','ferrarelle','fiuggi','levissima',
      'nepi','uliveto','vera','fonte','frizzante','naturale','minerale',
      'succo di','nettare','smoothie','ice tea','iced tea','the freddo','frutta',
    ],
  },
  {
    slug: 'grosshandel-bier-wein',
    keywords: [
      'birra','beer','bier','vino','wine','wein','prosecco','spumante','frizzante',
      'champagne','grappa','amaro','whisky','whiskey','vodka','gin ','rum ',
      'liquore','aperitivo','aperol','campari','martini','vermut','sambuca',
      'limoncello','nocino','mirto','spritz','sangria','cava','asti',
      'peroni','moretti','heineken','corona','budweiser','carlsberg',
      'bottiglia','cl ','75cl','33cl','66cl',
    ],
  },
  {
    slug: 'grosshandel-kaffee-tee',
    keywords: [
      'caffè','caffe','kaffee','coffee','espresso','capsule','capsula','nespresso',
      'lavazza','illy','kimbo','borbone','bialetti','moka','macinato','arabica',
      'tè ','tea ','tee ','tisana','camomilla','infuso','infusion','orzo',
      'cicoria','matcha','chai','oolong','verde ','verde,','nero ',
    ],
  },
  {
    slug: 'grosshandel-suesswaren',
    keywords: [
      'caramell','candy','bonbon','cioccolat','chocolat','schokolad','nutella',
      'kinder','ferrero','lindt','toblerone','kitkat','bounty','snickers','twix',
      'biscotti','kekse','cookie','wafer','cracker','grissini','cereali',
      'patatine','chips ','snack','popcorn','nachos','tortilla','pretzel',
      'torrone','confetti','gomm','jelly','gummy','marshmallow','lecca',
      'menta','mentine','pastiglie','caramelle','dropsè','drops ',
      'gelato','ghiacciolo','ice cream','eis ',
    ],
  },
  {
    slug: 'grosshandel-lebensmittel',
    keywords: [
      'pasta','spaghetti','rigatoni','penne','fusilli','farfalle','tagliatelle',
      'lasagna','lasagne','gnocchi','ravioli','tortellini',
      'riso','rice','reis','basmati','arborio','parboiled',
      'farina','mehl','flour','semola','amido','maizena',
      'olio','oil','öl','oliva','girasole','mais ','mais,',
      'sale ','sale,','salz','zucchero','zucker','sugar','miele','honey',
      'aceto','vinegar','essig','balsamico',
      'conserva','pelati','passata','pomodoro','tomaten','tomato','sugo','ragù',
      'tonno','tuna','sardine','sgombro','acciughe','pesce ',
      'legumi','fagioli','ceci','lenticchie','piselli',
      'brodo','bouillon','dado','würze','maggi',
      'pesto','aioli','maionese','mayonnaise','senape','mostarda','ketchup',
      'sale fino','sale grosso','spezie','gewürz','pepe ','paprika ',
      'latte ','latte,','milch','milk','panna','crema','burro','butter',
      'formaggio','käse','cheese','parmigia','grana','pecorino','mozzarella',
      'prosciutto','salame','salami','bresaola','mortadella','würstchen',
      'brot','pane ','pane,','grissini','fette biscottate','toast',
      'marmellata','konfitüre','jam','confettura','marmelad',
    ],
  },
  {
    slug: 'grosshandel-hygiene',
    keywords: [
      'detersivo','detergent','reinigung','pulizia','pulitore','sgrassator',
      'sapone','soap','seife','shampoo','balsamo','bagnoschiuma','docciaschiuma',
      'dentifricio','zahnpasta','collutorio','deodorant','profum',
      'carta igienica','fazzoletti','scottex','kleenex','salviette','tovaglioli',
      'candeggina','amuchina','lysol','domestos','ajax','mr.muscle','smac',
      'anticalcare','wc gel','sciacquone',
      'spugna','panno','straccio','mocio','scopa','aspirapolvere',
      'sacchetti','buste','imballagg','pellicola','alluminio','stagnola',
      'piatti','bicchieri','posate','bicchiere','piatto',
      'assorbente','pannolino','baby','pampers','huggies',
    ],
  },
]

const FALLBACK_SLUG = 'grosshandel-sonstiges'

async function main() {
  console.log('Creating Migroweb category structure...')

  // 1. Create "Grosshandel" parent
  const parent = await p.category.upsert({
    where: { slug: 'grosshandel' },
    update: { name: 'Cash & Carry', emoji: '🏪', sortOrder: 10 },
    create: { name: 'Cash & Carry', slug: 'grosshandel', emoji: '🏪', sortOrder: 10, active: true },
  })
  console.log('✅ Parent: Grosshandel', parent.id)

  // 2. Create subcategories
  const CATS = [
    { slug: 'grosshandel-getraenke',   name: 'Getränke',              emoji: '🥤', sortOrder: 1 },
    { slug: 'grosshandel-bier-wein',   name: 'Bier & Wein',           emoji: '🍺', sortOrder: 2 },
    { slug: 'grosshandel-kaffee-tee',  name: 'Kaffee & Tee',          emoji: '☕', sortOrder: 3 },
    { slug: 'grosshandel-lebensmittel',name: 'Lebensmittel',          emoji: '🍝', sortOrder: 4 },
    { slug: 'grosshandel-suesswaren',  name: 'Süsswaren & Snacks',    emoji: '🍫', sortOrder: 5 },
    { slug: 'grosshandel-hygiene',     name: 'Hygiene & Reinigung',   emoji: '🧴', sortOrder: 6 },
    { slug: 'grosshandel-sonstiges',   name: 'Haushalt & Sonstiges',  emoji: '🏠', sortOrder: 7 },
  ]

  const catMap = {}
  for (const c of CATS) {
    const cat = await p.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, emoji: c.emoji, sortOrder: c.sortOrder, parentId: parent.id },
      create: { ...c, parentId: parent.id, active: true },
    })
    catMap[c.slug] = cat.id
    console.log(`  ✅ ${c.name}: ${cat.id}`)
  }

  // 3. Load all Migroweb products
  console.log('\nLoading Migroweb products...')
  const products = await p.product.findMany({
    where: { supplierSource: 'migroweb' },
    select: { id: true, name: true },
  })
  console.log(`Found ${products.length} Migroweb products`)

  // 4. Categorize by keyword matching
  function categorize(name) {
    const lower = name.toLowerCase()
    for (const rule of RULES) {
      if (rule.keywords.some(kw => lower.includes(kw))) return rule.slug
    }
    return FALLBACK_SLUG
  }

  // Build update buckets
  const buckets = {}
  for (const slug of [...CATS.map(c => c.slug)]) buckets[slug] = []

  for (const prod of products) {
    const slug = categorize(prod.name)
    buckets[slug].push(prod.id)
  }

  // 5. Bulk-update each bucket
  console.log('\nAssigning categories:')
  let total = 0
  for (const [slug, ids] of Object.entries(buckets)) {
    if (ids.length === 0) continue
    const catId = catMap[slug]
    await p.product.updateMany({ where: { id: { in: ids } }, data: { categoryId: catId } })
    console.log(`  ${slug}: ${ids.length} products`)
    total += ids.length
  }
  console.log(`\n✅ Done — ${total} products re-categorized`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => p.$disconnect())
