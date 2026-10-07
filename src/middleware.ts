import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── Rate Limiter (per edge instance) ─────────────────────────────────────────
const rl = new Map<string, { n: number; reset: number }>()

function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const e = rl.get(key)
  if (!e || now > e.reset) { rl.set(key, { n: 1, reset: now + windowMs }); return true }
  if (e.n >= limit) return false
  e.n++
  return true
}

// Periodic cleanup
if (Math.random() < 0.005) {
  const now = Date.now()
  rl.forEach((e, k) => { if (now > e.reset) rl.delete(k) })
}

// ── Blocked path patterns (scanner/bot probes) ────────────────────────────────
const BLOCKED = [
  /\.(php|asp|aspx|jsp|cgi|env|git|svn|htaccess|htpasswd|bak|sql|conf|cfg|ini|log|sh|bash)$/i,
  /\/(wp-admin|wp-login|xmlrpc|phpmyadmin|\.git|\.env|\.svn|setup\.php|install\.php)/i,
  /(%2e%2e|\.\.\/|%00)/i,  // path traversal / null byte
]

// ── CSP ──────────────────────────────────────────────────────────────────────
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com https://maps.googleapis.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.supabase.co https://cdn.shopify.com https://images.unsplash.com https://www.meinbubbletea.ch https://www.msy.be https://www.wmphoto.it https://www.migroweb.it",
  "connect-src 'self' https://*.supabase.co https://api.stripe.com https://checkout.stripe.com",
  "frame-src https://js.stripe.com https://checkout.stripe.com https://hooks.stripe.com",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ')

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const ip = (req.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim()

  // 1. Block scanner/bot probes
  if (BLOCKED.some(p => p.test(pathname))) {
    return new NextResponse(null, { status: 404 })
  }

  // 2. Rate limiting
  // Auth endpoints — brute force protection (15 req/min)
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password')) {
    if (!allow(`auth:${ip}`, 15, 60_000)) {
      return new NextResponse('Too Many Requests', { status: 429, headers: { 'Retry-After': '60' } })
    }
  }
  // API endpoints (60 req/min)
  else if (pathname.startsWith('/api/')) {
    if (!allow(`api:${ip}`, 60, 60_000)) {
      return new NextResponse('Too Many Requests', { status: 429, headers: { 'Retry-After': '60' } })
    }
  }
  // General pages (200 req/min — DDoS baseline)
  else {
    if (!allow(`page:${ip}`, 200, 60_000)) {
      return new NextResponse('Too Many Requests', { status: 429, headers: { 'Retry-After': '60' } })
    }
  }

  // 3. Auth checks
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/products') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/products') ||
    pathname.startsWith('/api/categories') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/agb') ||
    pathname.startsWith('/datenschutz') ||
    pathname.startsWith('/impressum') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public')

  if (!isPublic && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (pathname.startsWith('/admin') && token?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login?error=forbidden', req.url))
  }

  if (pathname.startsWith('/dashboard') && token?.status !== 'APPROVED') {
    return NextResponse.redirect(new URL('/login?error=pending', req.url))
  }

  if (pathname.startsWith('/checkout') && (!token || token.status !== 'APPROVED')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 4. Security headers
  const res = NextResponse.next()
  res.headers.set('Content-Security-Policy', CSP)
  res.headers.set('X-Frame-Options', 'SAMEORIGIN')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|eot|mp4|webm|pdf|txt|xml|json|csv)$).*)',
  ],
}
