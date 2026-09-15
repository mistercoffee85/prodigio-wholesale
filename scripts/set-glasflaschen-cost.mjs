import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

// Einstand EUR 2.95 ex works, bestätigt für normale UND Bio-Flaschen.
// EZB-Referenzkurs 15.09.2026: 1 EUR = 0.9441 CHF.
// Achtung: ex works — Fracht und Verzollung sind hier NICHT enthalten.
const EUR = 2.95, RATE = 0.9441
const cost = Math.round(EUR * RATE * 100) / 100

// Nur echte Flaschen. Die "Probier-Teebox | 20 Sorten" ist ein anderer Artikel.
const r = await p.product.updateMany({
  where: { active: true, unit: { in: ['Glasflasche', 'Glasflasche / Stück'] } },
  data:  { costPrice: cost },
})
console.log(`EUR ${EUR} x ${RATE} = CHF ${cost.toFixed(2)} auf ${r.count} Flaschen gesetzt\n`)

const rows = await p.product.findMany({
  where: { active: true, costPrice: { not: null } },
  select: { name: true, price: true, costPrice: true, comparePrice: true, category: { select: { name: true } } },
  orderBy: { name: 'asc' },
})
console.log('Marge beim heutigen Verkaufspreis:')
for (const x of rows) {
  const vk = Number(x.price), c = Number(x.costPrice)
  console.log(`  CHF ${vk.toFixed(2)} − ${c.toFixed(2)} = ${(vk-c).toFixed(2)}  (${String(Math.round((vk-c)/vk*100)).padStart(2)}%)  ${x.name.slice(0,40)}`)
}
const ohne = await p.product.count({ where: { active: true, costPrice: null } })
console.log(`\nNoch ohne Einstandspreis: ${ohne} aktive Produkte`)
await p.$disconnect()
