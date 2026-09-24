/**
 * In-memory, per-instance rate limiter for Next.js Edge Middleware.
 *
 * This is a pragmatic first line of defence against scripted abuse — spam bookings, flooded
 * lead forms, hammering a payment-order endpoint — with zero new infrastructure. It is
 * deliberately NOT a distributed limiter: each warm Vercel Edge instance keeps its own
 * counters in memory, so the effective limit under real, spread-out attack traffic (many
 * regions / cold starts) is softer than the numbers below suggest. It stops casual/scripted
 * abuse from a single source; it does not stand in for a proper distributed limiter.
 *
 * If this ever needs to hold under deliberate, distributed attack rather than casual abuse,
 * the correct upgrade is a shared store — Upstash Redis via `@upstash/ratelimit` is the
 * standard choice on Vercel — swapped in behind this same `rateLimit()` signature.
 *
 * Separately: this can only limit requests that reach OUR Next.js server. Sign-in and
 * password-reset call Supabase Auth directly from the browser (see app/login,
 * app/forgot-password) and never pass through this middleware — that traffic can only be
 * throttled in the Supabase dashboard (Authentication → Rate Limits). Signup is the
 * exception: it posts to /api/auth/signup so the confirmation email can go out via Resend
 * ourselves, which puts it through this same limiter — see RATE_LIMITED_ROUTES in middleware.ts.
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

// Cheap, approximate cap so a long-lived instance under sustained traffic doesn't grow the
// Map unbounded. Not an LRU — just periodically sweeps anything already expired.
const MAX_ENTRIES = 5000

function sweep(now: number) {
  if (buckets.size <= MAX_ENTRIES) return
  Array.from(buckets.entries()).some(([key, bucket]) => {
    if (bucket.resetAt <= now) buckets.delete(key)
    return buckets.size <= MAX_ENTRIES
  })
}

export interface RateLimitResult {
  ok: boolean
  limit: number
  remaining: number
  /** Epoch ms when the window resets. */
  resetAt: number
}

/** Fixed-window counter. `key` should already include the route (and IP) it applies to. */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  sweep(now)

  const existing = buckets.get(key)
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return { ok: true, limit, remaining: limit - 1, resetAt }
  }

  if (existing.count >= limit) {
    return { ok: false, limit, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count += 1
  return { ok: true, limit, remaining: limit - existing.count, resetAt: existing.resetAt }
}

/** Best-effort client IP from the headers Vercel's edge network sets. */
export function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}
