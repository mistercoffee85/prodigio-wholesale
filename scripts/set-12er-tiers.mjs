import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

// Staffelpreise 12er Box (Listenpreise, netto exkl. MwSt).
// Basis 3.07 = 1-215 Boxen bei 25% Handelsmarge. Hergeleitet aus der
// Retailer-Tabelle: EK = VK x (1 - Handelsmarge), und VK ist dort über alle
// vier Zeilen konsistent CHF 4.10  ->  4.10 x 0.75 = 3.07.
const TIERS = [
  { minQty:    1, price: 3.07 },  // 1-215, 25% Handelsmarge — als Stufe geführt,
                                  // damit die Staffeltabelle im Shop lückenlos ist
  { minQty:  216, price: 2.99 },  // ab 1 Masterkarton
  { minQty: 1080, price: 2.87 },  // ¼ Palette
  { minQty: 2160, price: 2.74 },  // ½ Palette
  { minQty: 4320, price: 2.54 },  // ab 1 Palette
]

const r = await p.product.updateMany({
  where: { category: { slug: 'teaballs-heiss-kalt-12er' } },
  data:  { price: 3.07, priceTiers: TIERS },
})
console.log(`${r.count} Produkte aktualisiert\n`)

const COST = 1.19  // aus deiner Marge-Spalte: EK − "Deine Marge" ist überall 1.19
console.log('Menge          Preis/Box   Total        Marge/Box   Marge %')
for (const q of [1, 6, 215, 216, 1080, 2160, 4320]) {
  let price = 3.07
  for (const t of TIERS) if (q >= t.minQty) price = t.price
  const m = price - COST
  console.log(
    `${String(q).padStart(6)} Boxen  CHF ${price.toFixed(2)}   ` +
    `${(price*q).toFixed(2).padStart(9)}    ${m.toFixed(2)}        ${Math.round(m/price*100)}%`
  )
}
await p.$disconnect()
