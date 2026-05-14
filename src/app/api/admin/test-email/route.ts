import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  try {
    await transporter.verify()
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.SMTP_USER,
      subject: '✅ Test-E-Mail von PRO.DI.GIO B2B',
      html: `
        <div style="font-family:Arial,sans-serif; max-width:500px; margin:32px auto; padding:32px; background:#f8f8f8; border-radius:12px;">
          <h2 style="color:#0d0d0d;">✅ E-Mail funktioniert!</h2>
          <p>Diese Test-E-Mail wurde erfolgreich von <strong>${process.env.SMTP_USER}</strong> verschickt.</p>
          <p style="color:#9e9e9e; font-size:12px;">PRO.DI.GIO GmbH · B2B Grosshandel · Basel</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, message: `Test-E-Mail verschickt an ${process.env.SMTP_USER}` })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
