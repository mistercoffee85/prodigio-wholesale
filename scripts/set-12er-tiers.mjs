import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

// Staffelpreise 12er Box (Listenpreise, netto exkl. MwSt).
// Basis 2.99 = Masterkarton-Preis. Er gilt damit auch unterhalb eines
// Masterkartons, weil die Tabelle dort nichts definiert und ein tieferer
// Basispreis die Staffel invertieren würde (215 Boxen billiger als 216).
const TIERS = [
  { minQty:  216, price: 2.99 },  // ab 1 Masterkarton
  { minQty: 1080, price: 2.87 },  // ¼ Palette
  { minQty: 2160, price: 2.74 },  // ½ Palette
  { minQty: 4320, price: 2.54 },  // ab 1 Palette
]

const r = await p.product.updateMany({
  where: { category: { slug: 'teaballs-heiss-kalt-12er' } },
  data:  { price: 2.99, priceTiers: TIERS },
})
console.log(`${r.count} Produkte aktualisiert\n`)

const COST = 1.19  // aus deiner Marge-Spalte: EK − "Deine Marge" ist überall 1.19
console.log('Menge          Preis/Box   Total        Marge/Box   Marge %')
for (const q of [6, 215, 216, 1079, 1080, 2160, 4320]) {
  let price = 2.99
  for (const t of TIERS) if (q >= t.minQty) price = t.price
  const m = price - COST
  console.log(
    `${String(q).padStart(6)} Boxen  CHF ${price.toFixed(2)}   ` +
    `${(price*q).toFixed(2).padStart(9)}    ${m.toFixed(2)}        ${Math.round(m/price*100)}%`
  )
}
await p.$disconnect()
