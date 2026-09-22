import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Route → required role mapping
const ROLE_ROUTES: Record<string, string[]> = {
  '/homeowner': ['homeowner', 'admin'],
  '/admin': ['admin'],
  '/contractor': ['contractor', 'admin'],
}

export async function middleware(request: NextRequest) {
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

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
