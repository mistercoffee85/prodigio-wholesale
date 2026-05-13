import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { applyDiscount } from '@/lib/utils'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await prisma.product.findFirst({
      where: { OR: [{ id: params.id }, { slug: params.id }], active: true },
      include: { category: true },
    })
    if (!product) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

    const session = await getSession()
    const priceGroup = session?.user?.priceGroup ?? 'STANDARD'

    return NextResponse.json({
      ...product,
      price: applyDiscount(Number(product.price), priceGroup),
      comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
    })
  } catch (err) {
    console.error('[product]', err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
