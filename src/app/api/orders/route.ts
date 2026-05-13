import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(req.url)
    const page  = Number(searchParams.get('page') ?? 1)
    const limit = Number(searchParams.get('limit') ?? 20)

    // Admins see all orders
    const where = session.user.role === 'ADMIN' ? {} : { userId: session.user.id }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, company: { select: { name: true } } } },
          items: { include: { product: { select: { name: true, emoji: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({ orders, total, page, limit })
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
