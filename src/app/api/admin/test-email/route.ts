import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const apiKey  = process.env.RESEND_API_KEY
  const from    = process.env.EMAIL_FROM ?? 'PRO.DI.GIO Grosshandel <onboarding@resend.dev>'
  const adminTo = process.env.ADMIN_EMAIL ?? 'contact@prodigio.ch'

  if (!apiKey) {
    return NextResponse.json({
      error: 'RESEND_API_KEY ist nicht gesetzt in Vercel Environment Variables.',
    }, { status: 500 })
  }

  const resend = new Resend(apiKey)

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: adminTo,
      subject: '✅ Resend Test-E-Mail von PRO.DI.GIO B2B',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:32px auto;padding:32px;background:#f8f8f8;border-radius:12px;">
          <h2 style="color:#0d0d0d;">✅ Resend funktioniert!</h2>
          <p>Diese Test-E-Mail wurde erfolgreich über <strong>Resend</strong> verschickt.</p>
          <p><strong>FROM:</strong> ${from}</p>
          <p><strong>TO:</strong> ${adminTo}</p>
          <p style="color:#9e9e9e;font-size:12px;">PRO.DI.GIO GmbH · B2B Grosshandel · Basel</p>
        </div>
      `,
    })

    if (error) {
      return NextResponse.json({
        error: `Resend Fehler: ${error.message}`,
        hint: 'Domain nicht verifiziert in Resend, falsche API-Key, oder FROM-Adresse nicht erlaubt.',
        from,
        to: adminTo,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Test-E-Mail erfolgreich an ${adminTo}`,
      emailId: data?.id,
      from,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message, from, to: adminTo }, { status: 500 })
  }
}
