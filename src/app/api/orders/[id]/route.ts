import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { name: true, email: true, company: true } },
        items: { include: { product: true } },
      },
    })

    if (!order) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
    if (session.user.role !== 'ADMIN' && order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
    }

    return NextResponse.json(order)
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}

const updateSchema = z.object({
  status:        z.enum(['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED']).optional(),
  paymentStatus: z.enum(['UNPAID','PAID','PARTIALLY_PAID','REFUNDED']).optional(),
  notes:         z.string().optional(),
  shippingCost:  z.number().min(0).optional(), // Admin sets transport cost for PRODIGIO_DELIVERS orders
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
    }

    const body = await req.json()
    const data = updateSchema.parse(body)

    // If shippingCost is being set, recalculate total and mark shipping as no longer pending
    let extraData: Record<string, unknown> = {}
    if (data.shippingCost !== undefined) {
      const current = await prisma.order.findUnique({ where: { id: params.id }, select: { subtotal: true, tax: true } })
      if (current) {
        const newTotal = Math.round((Number(current.subtotal) + Number(current.tax) + data.shippingCost) * 100) / 100
        extraData = { shippingCost: data.shippingCost, total: newTotal, shippingPending: false }
      }
    }

    const { shippingCost, ...restData } = data
    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
        ...restData,
        ...extraData,
        ...(data.status === 'DELIVERED' && { deliveredAt: new Date() }),
        ...(data.status === 'SHIPPED'   && { shippedAt:   new Date() }),
        ...(data.paymentStatus === 'PAID' && { paidAt:    new Date() }),
      },
    })

    return NextResponse.json(order)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
