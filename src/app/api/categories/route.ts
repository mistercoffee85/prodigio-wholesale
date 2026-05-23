import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { products: { where: { active: true } } } } },
  })
  return NextResponse.json(categories)
}
