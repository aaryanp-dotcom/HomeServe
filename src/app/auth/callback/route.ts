import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { safeNext } from '@/lib/auth/redirect'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]),
            )
          },
        },
      },
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Safety net: make sure a homeowner profile row exists (the sign-up trigger normally creates it)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', data.user.id)
        .single()

      if (!profile) {
        // Public sign-up (including Google) only ever creates homeowners
        await supabase.from('user_profiles').insert({
          user_id: data.user.id,
          full_name: data.user.user_metadata?.full_name ?? data.user.email?.split('@')[0] ?? 'User',
          email: data.user.email,
          role: 'homeowner',
        })
        return NextResponse.redirect(`${origin}${safeNext(next, 'homeowner')}`)
      }

      return NextResponse.redirect(`${origin}${safeNext(next, profile.role)}`)
    }
  }

  // Auth error — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
