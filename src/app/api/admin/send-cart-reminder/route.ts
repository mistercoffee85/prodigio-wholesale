import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const FROM    = process.env.EMAIL_FROM    ?? 'PRO.DI.GIO Grosshandel <onboarding@resend.dev>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://b2b.prodigio.ch'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId: cartId } = await req.json()
  if (!cartId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { user: { include: { company: true } } },
  })
  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0)
    return NextResponse.json({ error: 'No active cart' }, { status: 404 })

  const items = cart.items as Array<{ name: string; quantity: number; unitPrice: number; total: number }>
  const subtotal = Number(cart.subtotal)
  const firstName = cart.user.name.split(' ')[0]

  const itemRows = items.map(i =>
    `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333">${i.name}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#666;text-align:center">${i.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;text-align:right">CHF ${Number(i.total).toFixed(2)}</td>
    </tr>`
  ).join('')

  const html = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"/></head>
<body style="font-family:Arial,sans-serif;margin:0;background:#f8f8f8;color:#0d0d0d">
  <div style="max-width:600px;margin:32px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
    <div style="background:#1a0a2e;padding:28px 32px">
      <p style="margin:0;font-size:18px;font-weight:800;color:white;letter-spacing:1px">PRO.DI.GIO Grosshandel</p>
      <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,.5);letter-spacing:1px">B2B Wholesale</p>
    </div>
    <div style="padding:32px">
      <p style="font-size:16px;margin:0 0 16px">Hallo ${firstName},</p>
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 24px">
        Sie haben noch Artikel in Ihrem Warenkorb. Schliessen Sie Ihre Bestellung ab — wir liefern innerhalb von 2–4 Werktagen.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <thead>
          <tr>
            <th style="text-align:left;font-size:11px;text-transform:uppercase;color:#999;padding-bottom:8px;border-bottom:2px solid #eee">Produkt</th>
            <th style="text-align:center;font-size:11px;text-transform:uppercase;color:#999;padding-bottom:8px;border-bottom:2px solid #eee">Menge</th>
            <th style="text-align:right;font-size:11px;text-transform:uppercase;color:#999;padding-bottom:8px;border-bottom:2px solid #eee">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding-top:12px;font-size:14px;font-weight:700">Zwischensumme</td>
            <td style="padding-top:12px;font-size:16px;font-weight:800;text-align:right;color:#5E1EB8">CHF ${subtotal.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      <a href="${APP_URL}/checkout" style="display:inline-block;background:#5E1EB8;color:white;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:14px">
        Bestellung abschliessen →
      </a>
      <p style="margin-top:24px;font-size:12px;color:#999">
        Bei Fragen erreichen Sie uns unter <a href="mailto:contact@prodigio.ch" style="color:#5E1EB8">contact@prodigio.ch</a> oder +41 61 868 95 33.
      </p>
    </div>
  </div>
</body>
</html>`

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY!)
    await resend.emails.send({
      from: FROM,
      to: cart.user.email,
      subject: `${firstName}, Ihr Warenkorb wartet auf Sie — PRO.DI.GIO Grosshandel`,
      html,
    })

    await prisma.activityLog.create({
      data: {
        userId: cart.userId,
        type: 'reminder_sent',
        payload: { sentBy: session.user.email, itemCount: items.length, subtotal },
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Cart reminder error:', err)
    return NextResponse.json({ error: 'Mail failed' }, { status: 500 })
  }
}
