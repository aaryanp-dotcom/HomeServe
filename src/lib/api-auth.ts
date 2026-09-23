/**
 * Shared authentication helpers for API routes.
 *
 * All helpers verify the user server-side via supabase.auth.getUser() — never
 * trust client-supplied user info. The service-role client is used only for
 * writes that the API has already authorized.
 *
 * MFA enforcement:
 *   requireAdminApi() checks that the session is at aal2 (TOTP verified) in
 *   addition to the role check. This is the same check that requireAdmin() in
 *   lib/maintenance/auth.ts performs. It is duplicated here so that API routes
 *   that import from this file rather than from lib/maintenance/auth.ts also
 *   get MFA enforcement without code changes to every individual route.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type ApiAuthResult =
  | { ok: true; userId: string; role: string; admin: ReturnType<typeof createAdminClient> }
  | { ok: false; response: NextResponse }

const fail = (status: number, error: string): ApiAuthResult => ({
  ok: false,
  response: NextResponse.json({ error }, { status }),
})

/** Authenticated user (any role). */
export async function requireAuthApi(): Promise<ApiAuthResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail(401, 'Unauthorized')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('user_profiles').select('role').eq('user_id', user.id).single()
  return { ok: true, userId: user.id, role: profile?.role ?? 'homeowner', admin }
}

/**
 * Admin-only API gate with MFA enforcement.
 *
 * Requires:
 *   1. Authenticated session (verified server-side)
 *   2. role = 'admin' (verified against DB, not client state)
 *   3. Session at aal2 (TOTP verified this session)
 */
export async function requireAdminApi(): Promise<ApiAuthResult> {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth
  if (auth.role !== 'admin') return fail(403, 'Forbidden')

  const supabase = await createClient()
  const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (mfaData?.currentLevel !== 'aal2') {
    return fail(403, 'MFA verification required. Please complete two-factor authentication.')
  }

  return auth
}
