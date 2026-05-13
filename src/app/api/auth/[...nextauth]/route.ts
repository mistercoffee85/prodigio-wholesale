import { NextRequest, NextResponse } from 'next/server'
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

const handler = NextAuth(authOptions)

export { handler as GET }

// Wrap POST to add rate limiting on sign-in attempts
export async function POST(req: NextRequest, ctx: { params: { nextauth: string[] } }) {
  const action = ctx.params.nextauth?.[0]

  // Apply rate limit only on credentials sign-in
  if (action === 'signin') {
    const ip = getClientIp(req)
    const rl = rateLimit(ip, 'login', { limit: 10, windowSec: 900 }) // 10 attempts per 15 min
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Zu viele Anmeldeversuche. Bitte warten Sie 15 Minuten.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          },
        }
      )
    }
  }

  return handler(req, ctx)
}
