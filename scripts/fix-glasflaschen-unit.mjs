import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

// CHF 5.20 ist der Preis pro Flasche (bestätigt: Einstand EUR 2.95 ex works —
// bei 5.20 je 6er-Pack wäre jede Flasche ein Verlustgeschäft). Die Einheit
// "6er Pack · Glasflaschen" liess "6× 6er Pack" im Warenkorb erscheinen und
// suggerierte 36 statt 6 Flaschen.
const r = await p.product.updateMany({
  where: { unit: '6er Pack · Glasflaschen', active: true },
  data:  { unit: 'Glasflasche' },
})
console.log(`${r.count} Produkte auf "Glasflasche" umgestellt\n`)

const check = await p.product.findMany({
  where: { category: { slug: { in: ['teaballs-glasflaschen','teaballs-glasflaschen-bio'] } }, active: true },
  select: { name: true, unit: true, price: true, moq: true },
  orderBy: { name: 'asc' },
})
console.log('Anzeige im Warenkorb bei Mindestbestellung:')
for (const c of check) {
  console.log(`  ${c.moq}× ${c.unit.padEnd(20)} = CHF ${(Number(c.price)*c.moq).toFixed(2).padStart(7)}   ${c.name.slice(0,42)}`)
}
await p.$disconnect()
