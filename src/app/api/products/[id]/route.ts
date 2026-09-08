import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await prisma.product.findFirst({
      where: { OR: [{ id: params.id }, { slug: params.id }], active: true },
      include: { category: true },
    })
    if (!product) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

    const session = await getSession()

    return NextResponse.json({
      ...product,
      price: Number(product.price),
      comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
    })
  } catch (err) {
    console.error('[product]', err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
