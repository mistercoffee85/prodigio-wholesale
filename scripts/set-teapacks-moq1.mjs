import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

// Tea-Packs: Kunde wählt die Menge frei ab 1 Stück. Beide Staffeln beginnen
// ohnehin bei 1 (12er: 1-215 CHF 3.07, 100er: 1-10 CHF 25.00), die bisherige
// MOQ 6 machte deren unteren Bereich unerreichbar.
const r = await p.product.updateMany({
  where: { category: { slug: { in: ['teaballs-heiss-kalt-12er', 'teaballs-heiss-kalt-100er'] } } },
  data:  { moq: 1 },
})
console.log(`${r.count} Produkte auf MOQ 1 gesetzt\n`)

const check = await p.product.findMany({
  where: { category: { slug: { in: ['teaballs-heiss-kalt-12er','teaballs-heiss-kalt-100er'] } } },
  select: { sku:true, price:true, moq:true, priceTiers:true },
  orderBy: { sku:'asc' },
})
for (const c of check) {
  const t = [...c.priceTiers].sort((a,b)=>a.minQty-b.minQty)
  console.log(`${c.sku.padEnd(11)} MOQ ${c.moq}  ab 1 Stk CHF ${(+c.price).toFixed(2)}  dann ${t.map(x=>`${x.minQty}+ ${x.price}`).join(' / ')}`)
}
await p.$disconnect()
