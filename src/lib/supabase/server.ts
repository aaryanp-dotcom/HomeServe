import { cache } from 'react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]),
            )
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    },
  )
}

export type AuthUser = { id: string; email?: string }

/**
 * The signed-in user, resolved once per request.
 *
 * A portal navigation renders the layout and the page in the same request, and both used to
 * call auth.getUser() — each a separate round trip to Supabase Auth. React's cache() makes the
 * second caller reuse the first result. Server Components only: in route handlers and server
 * actions cache() doesn't dedupe, so those keep calling getUser() directly (which is what you
 * want after a mutation anyway).
 *
 * Uses getClaims() rather than getUser(): when the project signs JWTs with an asymmetric key it
 * verifies the signature locally against the cached JWKS (no network call); with a legacy
 * symmetric secret it falls back to a getUser() round trip, so it is never weaker than before
 * for the token's validity. What it does not do is notice a session revoked server-side before
 * the access token expires (max 1h) — the DB queries are still authorised by RLS on the same
 * token, and middleware / API routes / server actions continue to use getUser() where it matters.
 */
export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims?.sub) return null
  return { id: claims.sub, email: typeof claims.email === 'string' ? claims.email : undefined }
})

/** Profile fields the portal layouts and page gates need, fetched once per request. */
export const getAuthProfile = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_profiles')
    .select('full_name, email, role, avatar_url')
    .eq('user_id', userId)
    .single()
  return data
})
