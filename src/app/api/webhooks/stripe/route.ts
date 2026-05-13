import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { sendOrderConfirmationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature') ?? ''

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const pi = event.data.object as any

  // ── Payment succeeded ─────────────────────────────────────────
  if (event.type === 'payment_intent.succeeded') {
    const order = await prisma.order.findFirst({
      where: { stripePaymentId: pi.id },
      include: { user: true, items: { include: { product: true } } },
    })

    if (order) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status:        'CONFIRMED',
          paymentStatus: 'PAID',
          paidAt:        new Date(),
        },
      })

      sendOrderConfirmationEmail(order.user.email, order.user.name, {
        orderNumber:   order.orderNumber,
        total:         Number(order.total),
        paymentMethod: order.paymentMethod,
        items: order.items.map(i => ({
          name:      i.product.name,
          quantity:  i.quantity,
          unitPrice: Number(i.unitPrice),
        })),
      }).catch(console.error)
    }
  }

  // ── Payment failed ────────────────────────────────────────────
  if (event.type === 'payment_intent.payment_failed') {
    const order = await prisma.order.findFirst({
      where: { stripePaymentId: pi.id },
    })
    if (order) {
      await prisma.order.update({
        where: { id: order.id },
        data:  { status: 'CANCELLED', paymentStatus: 'UNPAID' },
      })
    }
  }

  return NextResponse.json({ received: true })
}
