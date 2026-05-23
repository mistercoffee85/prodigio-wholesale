import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const [categories, cashCarryCount] = await Promise.all([
    prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: { where: { active: true } } } } },
    }),
    // Cash & Carry is a virtual category — products stay in their original categories
    // but are filtered by supplierSource=migroweb when browsed via cash-carry slug
    prisma.product.count({ where: { supplierSource: 'migroweb', active: true } }),
  ])

  // Override the count for the cash-carry virtual category
  const patched = categories.map(cat =>
    cat.slug === 'cash-carry'
      ? { ...cat, _count: { products: cashCarryCount } }
      : cat
  )

  return NextResponse.json(patched)
}
