import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { rateLimit, clientIp } from '@/lib/rate-limit'

// Route → required role mapping
const ROLE_ROUTES: Record<string, string[]> = {
  '/homeowner': ['homeowner', 'admin'],
  '/admin': ['admin'],
  '/contractor': ['contractor', 'admin'],
}

// POST endpoints that create records and are worth throttling per IP — public lead/contact
// forms get the tightest limits since they need no auth at all; authenticated creation
// endpoints (bookings, payments, service requests) get more room since a real user may
// legitimately retry a few times. See lib/rate-limit.ts for what this can and can't protect.
const RATE_LIMITED_ROUTES: { prefix: string; exact?: boolean; limit: number; windowMs: number }[] = [
  // Creates an account and sends an email per request — same tight limit as the other
  // unauthenticated lead/contact forms.
  { prefix: '/api/auth/signup',         limit: 5,  windowMs: 10 * 60_000 },
  { prefix: '/api/renovation-requests', limit: 5,  windowMs: 10 * 60_000 },
  { prefix: '/api/support/tickets',     limit: 8,  windowMs: 10 * 60_000 },
  { prefix: '/api/site-visits',         limit: 10, windowMs: 10 * 60_000 },
  { prefix: '/api/bookings',            limit: 15, windowMs: 10 * 60_000 },
  // Deliberately NOT '/api/payments' as a prefix — that would also throttle
  // /api/payments/razorpay/webhook, which Razorpay's own servers call (not a human abuser).
  // Dropping legitimate webhook deliveries under load would leave payments unsettled.
  { prefix: '/api/payments', exact: true, limit: 15, windowMs: 10 * 60_000 },
  { prefix: '/api/payments/milestone',  limit: 15, windowMs: 10 * 60_000 },
  { prefix: '/api/maintenance/requests', limit: 10, windowMs: 10 * 60_000 },
  { prefix: '/api/maintenance/memberships', limit: 10, windowMs: 10 * 60_000 },
  { prefix: '/api/warranty-requests',   limit: 10, windowMs: 10 * 60_000 },
  { prefix: '/api/reviews',             limit: 10, windowMs: 10 * 60_000 },
  // Anonymous by design (no login — see the route's own comment), so nothing here stops a
  // script from spamming fresh device ids to inflate a theme's save count. Low stakes (a
  // vanity counter, not real data), but cheap to throttle while we're here.
  { prefix: '/api/themes',              limit: 20, windowMs: 10 * 60_000 },
]

export async function middleware(request: NextRequest) {
  if (request.method === 'POST') {
    const pathname = request.nextUrl.pathname
    const route = RATE_LIMITED_ROUTES.find((r) =>
      r.exact ? pathname === r.prefix : pathname === r.prefix || pathname.startsWith(r.prefix + '/'),
    )
    if (route) {
      const result = rateLimit(`${route.prefix}:${clientIp(request)}`, route.limit, route.windowMs)
      if (!result.ok) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a moment and try again.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
              'X-RateLimit-Limit': String(result.limit),
              'X-RateLimit-Remaining': '0',
            },
          },
        )
      }
    }
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2]),
          )
        },
      },
    },
  )

  // Refresh session — do not remove this
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Only the role portals are gated here. Everything else (marketing pages, auth
  // pages, public APIs) passes through; API routes authenticate themselves and
  // return 401/403 JSON. NOTE: an allow-list containing '/' with startsWith()
  // matches every path, which previously made the whole gate a no-op.
  const matchedPrefix = Object.keys(ROLE_ROUTES).find(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/'),
  )

  if (!matchedPrefix) return supabaseResponse

  // Not logged in → redirect to login
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check the user's role against the portal they are entering
  const requiredRoles = ROLE_ROUTES[matchedPrefix]

  // Fetch role from user_profiles
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!profile || !requiredRoles.includes(profile.role)) {
    // Redirect to their correct portal
    const roleRedirects: Record<string, string> = {
      homeowner: '/homeowner/dashboard',
      admin: '/admin/dashboard',
      contractor: '/contractor/dashboard',
    }
    const correctPath = profile ? roleRedirects[profile.role] ?? '/login' : '/login'
    return NextResponse.redirect(new URL(correctPath, request.url))
  }

  // Admin MFA enforcement. This has to live here rather than in admin/layout.tsx —
  // that layout wraps /admin/mfa/setup and /admin/mfa/verify too (they're nested
  // under /admin/*, and a layout can't exclude its own child routes), so a redirect
  // there would send the setup page back to itself in an infinite loop. Middleware
  // has the real pathname, so it can exclude the MFA pages from the check while
  // still gating every other /admin/* route.
  if (profile.role === 'admin' && !pathname.startsWith('/admin/mfa')) {
    const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    const { data: factors } = await supabase.auth.mfa.listFactors()
    const hasVerifiedFactor = (factors?.totp ?? []).length > 0
    if (!hasVerifiedFactor) {
      return NextResponse.redirect(new URL('/admin/mfa/setup', request.url))
    }
    if (mfaData?.currentLevel !== 'aal2') {
      return NextResponse.redirect(new URL('/admin/mfa/verify', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
