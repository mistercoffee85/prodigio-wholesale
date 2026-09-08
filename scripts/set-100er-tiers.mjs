import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

// Staffelpreise 100er Gastrobox (Listenpreise, ohne Kundenrabatt)
const TIERS = [
  { minQty: 1,   price: 25.00 },  // 1–10 Boxen
  { minQty: 11,  price: 23.00 },  // 11–50
  { minQty: 51,  price: 21.00 },  // 51–100
  { minQty: 101, price: 19.00 },  // ab 101
]

const r = await p.product.updateMany({
  where: { category: { slug: 'teaballs-heiss-kalt-100er' } },
  data:  { price: 25.00, priceTiers: TIERS },
})
console.log(`${r.count} Produkte aktualisiert`)

const check = await p.product.findMany({
  where: { category: { slug: 'teaballs-heiss-kalt-100er' } },
  select: { sku: true, price: true, priceTiers: true, moq: true },
  orderBy: { sku: 'asc' },
})
for (const c of check) {
  console.log(`${c.sku}  Basis CHF ${Number(c.price).toFixed(2)}  MOQ ${c.moq}  Staffel: ${c.priceTiers.map(t => `${t.minQty}+→${t.price}`).join('  ')}`)
}
await p.$disconnect()
