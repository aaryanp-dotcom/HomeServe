import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type Admin = ReturnType<typeof createAdminClient>

export type Auth =
  | { ok: true; user: User; admin: Admin; role: string }
  | { ok: false; res: NextResponse }

const deny = (status: number, error: string): Auth => ({ ok: false, res: NextResponse.json({ error }, { status }) })

/** Signed-in user (server-verified). `admin` is the service-role client for writes the API has authorised. */
export async function requireUser(): Promise<Auth> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return deny(401, 'Unauthorized')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('user_profiles').select('role').eq('user_id', user.id).single()
  return { ok: true, user, admin, role: profile?.role ?? 'homeowner' }
}

/**
 * Server-side admin gate with MFA enforcement.
 *
 * Requires:
 *   1. User is authenticated (aal1 or aal2)
 *   2. User has role = 'admin' in user_profiles (verified server-side, not from client state)
 *   3. Session has passed TOTP challenge (aal2) — prevents admin API access if
 *      the admin is logged in but has not completed MFA this session.
 *
 * Never rely on the route being hidden in the UI.
 */
export async function requireAdmin(): Promise<Auth> {
  const a = await requireUser()
  if (!a.ok) return a
  if (a.role !== 'admin') return deny(403, 'Forbidden')

  // MFA check: the session must be at Authenticator Assurance Level 2
  const supabase = await createClient()
  const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (mfaData?.currentLevel !== 'aal2') {
    return deny(403, 'MFA verification required. Please complete two-factor authentication.')
  }

  return a
}

/** Contact details used for notifications. */
export async function contactFor(admin: Admin, userId: string) {
  const [{ data: profile }, { data: authUser }] = await Promise.all([
    admin.from('user_profiles').select('full_name, phone').eq('user_id', userId).single(),
    admin.auth.admin.getUserById(userId),
  ])
  return {
    name: profile?.full_name ?? 'Customer',
    phone: profile?.phone ?? '',
    email: authUser?.user?.email ?? '',
  }
}
