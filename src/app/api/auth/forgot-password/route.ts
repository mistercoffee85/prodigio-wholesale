import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import { rateLimit, getClientIp } from '@/lib/rateLimit'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const { allowed } = rateLimit(ip, 'forgot-password', { limit: 5, windowSec: 3600 })
  if (!allowed) {
    return NextResponse.json({ error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' }, { status: 429 })
  }

  const { email } = await req.json()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Ungültige E-Mail-Adresse' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })

  // Always return success to prevent email enumeration
  if (!user) {
    return NextResponse.json({ success: true })
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: token, passwordResetExpiry: expiry },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://b2b.prodigio.ch'
  const resetUrl = `${appUrl}/reset-password?token=${token}`

  try {
    await sendPasswordResetEmail(user.email, resetUrl)
  } catch (err) {
    console.error('Failed to send password reset email:', err)
    return NextResponse.json({ error: 'E-Mail konnte nicht gesendet werden.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
