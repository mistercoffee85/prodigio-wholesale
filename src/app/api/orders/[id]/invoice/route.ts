import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { InvoicePDF, type InvoiceData } from '@/lib/invoice'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import QRCode from 'qrcode'

function buildSwissQrData(orderNumber: string, amount: number): string {
  const iban = 'CH4000233233228707010'
  const lines = [
    'SPC',          // header
    '0200',         // version
    '1',            // coding
    iban,           // IBAN
    'S',            // creditor address type (structured)
    'Pro.Di.Gio GmbH', // creditor name
    'Mailand-Strasse 31', // street
    '',             // building number (combined in street above)
    '4053',         // postal code
    'Basel',        // city
    'CH',           // country
    '', '', '', '', '', '', // ultimate creditor (empty)
    amount.toFixed(2), // amount
    'CHF',          // currency
    '', '', '', '', '', '', // debtor (empty = open)
    'NON',          // reference type
    '',             // reference
    `Bestellung #${orderNumber}`, // additional info
    'EPD',          // end
  ]
  return lines.join('\n')
}

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: { include: { company: true } },
        items: { include: { product: { select: { name: true, supplierSku: true, unit: true } } } },
      },
    })

    if (!order) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

    // Only the order owner or an admin can download
    if (session.user.role !== 'ADMIN' && order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
    }

    const fmt = (d: Date) => format(d, 'dd. MMMM yyyy', { locale: de })

    // QR code for bank transfer (Swiss QR-bill)
    let qrCodeDataUrl: string | undefined
    if (order.paymentMethod === 'BANK_TRANSFER') {
      qrCodeDataUrl = await QRCode.toDataURL(
        buildSwissQrData(order.orderNumber, Number(order.total)),
        { errorCorrectionLevel: 'M', margin: 1, width: 160 }
      )
    }

    const data: InvoiceData = {
      orderNumber:   order.orderNumber,
      createdAt:     fmt(order.createdAt),
      paidAt:        order.paidAt ? fmt(order.paidAt) : undefined,
      isPaid:        order.paymentStatus === 'PAID',

      customer: {
        name:     order.user.name,
        email:    order.user.email,
        company:  order.user.company?.name,
        uid:      order.user.company?.uid ?? undefined,
        address:  order.user.company?.address ?? undefined,
        industry: order.user.company?.industry ?? undefined,
      },

      items: order.items.map(item => ({
        name:      (item as any).productName ?? item.product.name,
        sku:       (item as any).productSku  ?? item.product.supplierSku ?? '',
        quantity:  item.quantity,
        unitPrice: Number(item.unitPrice),
        total:     Number(item.total),
        unit:      (item as any).unit ?? item.product.unit ?? '',
      })),

      subtotal:      Number(order.subtotal),
      tax:           Number(order.tax),
      shippingCost:  Number(order.shippingCost),
      total:         Number(order.total),
      paymentMethod: order.paymentMethod,
      shippingOption: order.shippingOption ?? undefined,
      qrCodeDataUrl,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer: Buffer = await (renderToBuffer as any)(createElement(InvoicePDF, { d: data }))
    const uint8 = new Uint8Array(buffer)

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="Rechnung-${order.orderNumber}.pdf"`,
        'Content-Length':      uint8.byteLength.toString(),
        'Cache-Control':       'no-store',
      },
    })
  } catch (err) {
    console.error('Invoice error:', err)
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }
    return NextResponse.json({ error: 'PDF konnte nicht erstellt werden' }, { status: 500 })
  }
}
