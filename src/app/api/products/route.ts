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
    const page     = Number(searchParams.get('page') ?? 1)
    const limit    = Number(searchParams.get('limit') ?? 100)

    const session = await getSession()
    const priceGroup = session?.user?.priceGroup ?? 'STANDARD'

    // If a parent category is requested, also include products from all child categories
    let categoryFilter: object | undefined
    if (category) {
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

    const where = {
      active: true,
      ...categoryFilter,
      ...(badge && { badge }),
      ...(search && {
        OR: [
          { name:        { contains: search, mode: 'insensitive' as const } },
          { brand:       { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

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
      price: applyDiscount(Number(p.price), priceGroup),
      comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
      originalPrice: Number(p.price),
      taxRate: Number(p.taxRate),
    }))

    return NextResponse.json({ products: priced, total, page, limit })
  } catch (err) {
    console.error('[products]', err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
