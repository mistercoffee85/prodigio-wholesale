import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth
    const { pathname } = req.nextUrl

    // Admin routes — only ADMIN role
    if (pathname.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login?error=forbidden', req.url))
    }

    // Dashboard routes — only APPROVED customers + admins
    if (pathname.startsWith('/dashboard') && token?.status !== 'APPROVED') {
      return NextResponse.redirect(new URL('/login?error=pending', req.url))
    }

    // Checkout — must be logged in & approved
    if (pathname.startsWith('/checkout') && (!token || token.status !== 'APPROVED')) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        // Public routes
        if (
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
        ) return true
        return !!token
      },
    },
  }
)

// Static files live in /public but are served from the root path, so they must be
// excluded by extension — a "public/" prefix never appears in the request URL.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|eot|mp4|webm|pdf|txt|xml|json|csv)$).*)',
  ],
}
