import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOrderCancelledEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

/**
 * Täglicher Vercel-Cron (06:00 UTC): storniert unbezahlte
 * Vorauskasse-Bestellungen, deren Zahlungsfrist (dueDate) abgelaufen ist.
 * Reservierter Lagerbestand wird wieder freigegeben.
 *
 * Vercel sendet automatisch `Authorization: Bearer ${CRON_SECRET}`,
 * wenn die Env-Variable CRON_SECRET gesetzt ist.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const overdue = await prisma.order.findMany({
    where: {
      paymentMethod: 'BANK_TRANSFER',
      paymentStatus: 'UNPAID',
      status:        { in: ['PENDING', 'CONFIRMED'] },
      dueDate:       { lt: new Date() },
    },
    include: {
      user:  true,
      items: true,
    },
  })

  const cancelled: string[] = []

  for (const order of overdue) {
    // Bestand zurückbuchen — wurde bei Vorauskasse-Bestellung sofort reserviert
    await prisma.$transaction([
      ...order.items.map(i =>
        prisma.product.update({
          where: { id: i.productId },
          data:  { stock: { increment: i.quantity } },
        })
      ),
      prisma.order.update({
        where: { id: order.id },
        data:  { status: 'CANCELLED' },
      }),
    ])

    cancelled.push(order.orderNumber)

    sendOrderCancelledEmail(order.user.email, order.user.name, order.orderNumber)
      .catch(err => console.error('[cron] Storno-Email fehlgeschlagen:', order.orderNumber, err))
  }

  console.log(`[cron] cancel-overdue-orders: ${cancelled.length} storniert`, cancelled)
  return NextResponse.json({ cancelled: cancelled.length, orderNumbers: cancelled })
}
