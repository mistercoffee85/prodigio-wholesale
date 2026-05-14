import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

const SETTING_KEY = 'markup_factors'

const CATEGORIES = [
  { slug: 'grosshandel-getraenke',    label: 'Getränke' },
  { slug: 'grosshandel-bier-wein',    label: 'Bier & Wein' },
  { slug: 'grosshandel-kaffee-tee',   label: 'Kaffee & Tee' },
  { slug: 'grosshandel-lebensmittel', label: 'Lebensmittel' },
  { slug: 'grosshandel-suesswaren',   label: 'Süsswaren & Snacks' },
  { slug: 'grosshandel-hygiene',      label: 'Hygiene & Reinigung' },
  { slug: 'grosshandel-sonstiges',    label: 'Haushalt & Sonstiges' },
]

function roundUp5(n: number) { return Math.ceil(n * 20) / 20 }

export async function GET() {
  try {
    await requireAdmin()
    const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } })
    const factors: Record<string, number> = setting ? JSON.parse(setting.value) : {}

    const counts = await prisma.$queryRaw<{ categorySlug: string; cnt: number }[]>`
      SELECT c.slug AS "categorySlug", COUNT(p.id)::int AS cnt
      FROM categories c
      LEFT JOIN products p ON p."categoryId" = c.id AND p."supplierSource" = 'migroweb'
      WHERE c.slug LIKE 'grosshandel-%'
      GROUP BY c.slug
    `
    const countMap = Object.fromEntries(counts.map(r => [r.categorySlug, Number(r.cnt)]))

    const categories = CATEGORIES.map(c => ({
      slug:   c.slug,
      label:  c.label,
      factor: factors[c.slug] ?? 1.35,
      count:  countMap[c.slug] ?? 0,
    }))

    return NextResponse.json({ categories })
  } catch {
    return NextResponse.json({ error: 'Fehler' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { factors, recalculate } = await req.json() as {
      factors: Record<string, number>
      recalculate?: boolean
    }

    // Persist markup factors
    await prisma.setting.upsert({
      where:  { key: SETTING_KEY },
      update: { value: JSON.stringify(factors) },
      create: { key: SETTING_KEY, value: JSON.stringify(factors) },
    })

    let updated = 0

    if (recalculate) {
      const cats = await prisma.category.findMany({
        where:  { slug: { in: Object.keys(factors) } },
        select: { id: true, slug: true },
      })
      const catIdMap = Object.fromEntries(cats.map(c => [c.slug, c.id]))

      for (const [slug, factor] of Object.entries(factors)) {
        const catId = catIdMap[slug]
        if (!catId || factor <= 0) continue

        const products = await prisma.product.findMany({
          where:  { categoryId: catId, supplierSource: 'migroweb', costPrice: { gt: 0 } },
          select: { id: true, costPrice: true },
        })

        const BATCH = 100
        for (let i = 0; i < products.length; i += BATCH) {
          const batch = products.slice(i, i + BATCH)
          await Promise.all(batch.map(p =>
            prisma.product.update({
              where: { id: p.id },
              data:  { price: roundUp5(Number(p.costPrice) * factor) },
            })
          ))
          updated += batch.length
        }
      }
    }

    return NextResponse.json({ saved: true, updated })
  } catch (err) {
    console.error('[markup POST]', err)
    return NextResponse.json({ error: 'Fehler' }, { status: 500 })
  }
}
