/**
 * Simple in-memory rate limiter for Next.js API routes.
 * Works per serverless instance — good enough to stop brute-force bots.
 * For multi-region / high-traffic production, swap to Upstash Redis.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes to avoid memory leaks
setInterval(() => {
  const now = Date.now()
  store.forEach((entry, key) => {
    if (entry.resetAt < now) store.delete(key)
  })
}, 5 * 60 * 1000)

interface RateLimitOptions {
  /** Max requests allowed within the window */
  limit: number
  /** Window duration in seconds */
  windowSec: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function rateLimit(
  ip: string,
  namespace: string,
  { limit, windowSec }: RateLimitOptions
): RateLimitResult {
  const key = `${namespace}:${ip}`
  const now = Date.now()

  let entry = store.get(key)

  // Create or reset expired window
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + windowSec * 1000 }
    store.set(key, entry)
  }

  entry.count++

  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  }
}

/**
 * Extract real IP from Next.js request, respecting Vercel/proxy headers.
 */
export function getClientIp(req: Request): string {
  const headers = req instanceof Request ? req.headers : (req as any).headers
  return (
    (headers.get?.('x-real-ip') as string) ??
    (headers.get?.('x-forwarded-for') as string)?.split(',')[0]?.trim() ??
    '0.0.0.0'
  )
}
