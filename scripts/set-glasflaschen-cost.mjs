import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

// Einstand frei Lager (landed), bestätigt für normale UND Bio-Flaschen.
//   Ware        EUR 2.95 ex works
// + Transport   EUR 0.139  (Rechnung EUR 5814.25 inkl. EUR 260 Transport,
//                           verteilt auf 1820 Flaschen + 2x25 Holzaufsteller)
// = EUR 3.089, bewusst zu 1:1 gerechnet (konservative Hauskalkulation,
//   puffert Kursschwankungen; EZB-Kurs lag am 15.09.2026 bei 0.9441) = CHF 3.09
// Zoll/Einfuhrabgaben sind hier NICHT enthalten — auf der Rechnung stand nur Transport.
const EUR = 2.95, TRANSPORT_EUR = 260 / 1870, RATE = 1.00
const cost = Math.round((EUR + TRANSPORT_EUR) * RATE * 100) / 100

// Nur echte Flaschen. Die "Probier-Teebox | 20 Sorten" ist ein anderer Artikel.
const r = await p.product.updateMany({
  where: { active: true, unit: { in: ['Glasflasche', 'Glasflasche / Stück'] } },
  data:  { costPrice: cost },
})
console.log(`EUR ${(EUR + TRANSPORT_EUR).toFixed(4)} landed x ${RATE} = CHF ${cost.toFixed(2)} auf ${r.count} Flaschen gesetzt\n`)

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
