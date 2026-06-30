import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { stripe, toStripeAmount } from '@/lib/stripe'
import { sendTransportCostEmail } from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://b2b.prodigio.ch'

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
  shippingCost:  z.number().min(0).optional(), // Admin sets transport cost manually
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
    }

    const body = await req.json()
    const data = updateSchema.parse(body)

    // If shippingCost is being set, recalculate total, create Stripe payment link, send email
    let extraData: Record<string, unknown> = {}
    let transportPaymentLinkUrl: string | null = null
    let orderForEmail: { orderNumber: string; shippingCost: number; subtotal: number; tax: number; total: number; user: { email: string; name: string } } | null = null

    if (data.shippingCost !== undefined) {
      const current = await prisma.order.findUnique({
        where: { id: params.id },
        select: { subtotal: true, tax: true, orderNumber: true, paymentMethod: true, user: { select: { email: true, name: true } } },
      })
      if (current) {
        const newTotal = Math.round((Number(current.subtotal) + Number(current.tax) + data.shippingCost) * 100) / 100
        extraData = { shippingCost: data.shippingCost, total: newTotal, shippingPending: false }

        // Create Stripe payment link for full amount using customer's chosen payment method
        if (data.shippingCost > 0) {
          const pmMap: Record<string, string[]> = {
            STRIPE_CARD:   ['card'],
            STRIPE_TWINT:  ['twint'],
            STRIPE_PAYPAL: ['paypal'],
            STRIPE_KLARNA: ['klarna'],
          }
          const paymentMethodTypes = pmMap[current.paymentMethod] ?? ['card', 'twint', 'klarna', 'paypal']
          const price = await stripe.prices.create({
            currency: 'chf',
            unit_amount: toStripeAmount(newTotal),
            product_data: { name: `Bestellung #${current.orderNumber}` },
          })
          const link = await stripe.paymentLinks.create({
            line_items: [{ price: price.id, quantity: 1 }],
            payment_method_types: paymentMethodTypes as any,
            metadata: { orderId: params.id, type: 'transport_cost' },
            after_completion: { type: 'redirect', redirect: { url: `${APP_URL}/dashboard/orders` } },
          })
          transportPaymentLinkUrl = link.url
          orderForEmail = {
            orderNumber: current.orderNumber,
            shippingCost: data.shippingCost,
            subtotal: Number(current.subtotal),
            tax: Number(current.tax),
            total: newTotal,
            user: current.user,
          }
        }
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

    // Send transport cost email after DB update
    if (orderForEmail && transportPaymentLinkUrl) {
      await sendTransportCostEmail(
        orderForEmail.user.email,
        orderForEmail.user.name,
        orderForEmail,
        transportPaymentLinkUrl
      ).catch(console.error)
    }

    return NextResponse.json(order)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
