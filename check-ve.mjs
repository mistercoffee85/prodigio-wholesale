import { PrismaClient } from './node_modules/@prisma/client/default.js'
const prisma = new PrismaClient()

// Check VE format variety in DB
const byUnit = await prisma.$queryRaw`
  SELECT unit, COUNT(*)::int as cnt
  FROM "Product"
  WHERE "supplierSource" = 'migroweb'
  GROUP BY unit
  ORDER BY cnt DESC
  LIMIT 30
`
console.log('=== VE Verteilung ===')
byUnit.forEach(r => console.log(r.unit + ': ' + r.cnt))

// Check how VE is shown in details vs unit field for recent products
const newProds = await prisma.product.findMany({
  where: { supplierSource: 'migroweb' },
  select: { name: true, unit: true, details: true, moq: true },
  take: 5,
  orderBy: { lastSyncedAt: 'desc' }
})
console.log('\n=== Letzte sync Produkte ===')
newProds.forEach(p => {
  console.log(p.unit + ' | ' + JSON.stringify(p.details) + ' | ' + p.name.slice(0,40))
})

await prisma.$disconnect()
