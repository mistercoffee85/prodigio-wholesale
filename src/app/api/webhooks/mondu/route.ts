import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMonduWebhook } from '@/lib/mondu'
import { sendOrderConfirmationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const rawBody  = await req.text()
  const signature = req.headers.get('x-mondu-signature') ?? ''

  if (!verifyMonduWebhook(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(rawBody)
  const { topic, order } = event

  console.log('[mondu webhook]', topic, order?.external_reference_id)

  if (!order?.external_reference_id) {
    return NextResponse.json({ received: true })
  }

  const dbOrder = await prisma.order.findFirst({
    where: { orderNumber: order.external_reference_id },
    include: {
      user:  { include: { company: true } },
      items: { include: { product: true } },
    },
  })

  if (!dbOrder) {
    return NextResponse.json({ received: true })
  }

  // ── Mondu order confirmed (buyer approved) ────────────────────
  if (topic === 'order/confirmed' || topic === 'order/authorized') {
    await prisma.order.update({
      where: { id: dbOrder.id },
      data:  { status: 'CONFIRMED', paymentStatus: 'UNPAID' },
    })

    // Decrement stock
    await Promise.all(
      dbOrder.items.map(i =>
        prisma.product.update({
          where: { id: i.productId },
          data:  { stock: { decrement: i.quantity } },
        })
      )
    )

    // Send confirmation email
    sendOrderConfirmationEmail(dbOrder.user.email, dbOrder.user.name, {
      orderNumber:   dbOrder.orderNumber,
      total:         Number(dbOrder.total),
      paymentMethod: 'MONDU',
      items: dbOrder.items.map(i => ({
        name:      i.productName,
        quantity:  i.quantity,
        unitPrice: Number(i.unitPrice),
        sku:       i.productSku,
        unit:      i.unit,
      })),
    }).catch(console.error)
  }

  // ── Mondu payment received (buyer paid Mondu) ─────────────────
  if (topic === 'order/payment_received') {
    await prisma.order.update({
      where: { id: dbOrder.id },
      data:  { paymentStatus: 'PAID', paidAt: new Date() },
    })
  }

  // ── Mondu declined creditworthiness check ─────────────────────
  if (topic === 'order/declined') {
    await prisma.order.update({
      where: { id: dbOrder.id },
      data:  { status: 'CANCELLED' },
    })
  }

  return NextResponse.json({ received: true })
}
