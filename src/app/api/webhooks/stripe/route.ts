import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
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

      // Decrement stock for each item (Stripe orders skip this in checkout route)
      await Promise.all(
        order.items.map(i =>
          prisma.product.update({
            where: { id: i.productId },
            data:  { stock: { decrement: i.quantity } },
          })
        )
      )

      // await: Vercel friert die Funktion nach der Response ein
      await sendOrderConfirmationEmail(order.user.email, order.user.name, {
        orderNumber:      order.orderNumber,
        total:            Number(order.total),
        paymentMethod:    order.paymentMethod,
        shippingOption:   order.shippingOption ?? undefined,
        shippingOptionLocal: order.shippingOptionLocal ?? undefined,
        items: order.items.map(i => ({
          name:      (i as any).productName || i.product.name,
          quantity:  i.quantity,
          unitPrice: Number(i.unitPrice),
          unit:      (i as any).unit      || i.product.unit || '',
          sku:       (i as any).productSku || i.product.supplierSku || '',
        })),
      }).catch(console.error)
    }
  }

  // ── Transport cost paid via Payment Link ──────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    if (session.metadata?.type === 'transport_cost' && session.metadata?.orderId) {
      await prisma.order.update({
        where: { id: session.metadata.orderId },
        data: { status: 'CONFIRMED', paymentStatus: 'PAID', paidAt: new Date() },
      })
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
