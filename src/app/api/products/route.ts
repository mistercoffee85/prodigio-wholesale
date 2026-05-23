import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { applyDiscount } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const search   = searchParams.get('search')
    const badge    = searchParams.get('badge')
    const supplier        = searchParams.get('supplier')         // exact supplierSource match
    const excludeSupplier = searchParams.get('excludeSupplier') // exclude this supplier
    const page     = Number(searchParams.get('page') ?? 1)
    const limit    = Number(searchParams.get('limit') ?? 100)

    const session = await getSession()
    const approved   = session?.user?.status === 'APPROVED'
    const priceGroup = session?.user?.priceGroup ?? 'STANDARD'

    // Special virtual category: cash-carry → filter by supplierSource=migroweb
    const isCashCarry = category === 'cash-carry'

    // If a parent category is requested, also include products from all child categories
    let categoryFilter: object | undefined
    if (category && !isCashCarry) {
      const cat = await prisma.category.findUnique({
        where: { slug: category },
        include: { children: { select: { slug: true } } },
      })
      if (cat) {
        const slugs = [cat.slug, ...cat.children.map(c => c.slug)]
        categoryFilter = { category: { slug: { in: slugs } } }
      } else {
        categoryFilter = { category: { slug: category } }
      }
    }

    const where: Record<string, unknown> = {
      ...categoryFilter,
    }
    if (isCashCarry)     where.supplierSource = 'migroweb'
    else if (supplier)   where.supplierSource = supplier
    if (excludeSupplier && !isCashCarry) where.supplierSource = { not: excludeSupplier }
    if (badge)           where.badge = badge
    if (search)          where.OR = [
      { name:        { contains: search, mode: 'insensitive' } },
      { brand:       { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { name: true, slug: true, parentId: true } } },
        orderBy: [{ badge: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    const priced = products.map(p => ({
      ...p,
      // Hide prices for non-approved users — show 0 so UI knows to display lock
      price:         approved ? applyDiscount(Number(p.price), priceGroup) : 0,
      comparePrice:  approved && p.comparePrice ? Number(p.comparePrice) : null,
      originalPrice: approved ? Number(p.price) : 0,
      taxRate:       Number(p.taxRate),
    }))

    return NextResponse.json({ products: priced, total, page, limit })
  } catch (err) {
    console.error('[products]', err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
