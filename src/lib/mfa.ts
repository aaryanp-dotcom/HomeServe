/**
 * MFA helpers for the admin portal.
 *
 * HomeServe uses Supabase Auth TOTP (Time-based One-Time Password) as the MFA
 * factor for administrative accounts.
 *
 * The enforcement model:
 *   1. The admin layout checks the session's Authenticator Assurance Level (AAL).
 *      If it is not 'aal2' (MFA verified), the admin is redirected to:
 *        • /admin/mfa/setup  — if no TOTP factor is enrolled yet
 *        • /admin/mfa/verify — if a factor is enrolled but not verified this session
 *
 *   2. Server-side API helpers (requireAdmin) perform the same check independently,
 *      so bypassing the UI redirect does not grant access to admin API routes.
 *
 *   3. The MFA verification is session-scoped: after verifying, the session token
 *      carries aal2 and the admin proceeds normally. On logout + re-login the
 *      challenge is repeated.
 *
 * Dashboard configuration required (see migration 026):
 *   • Authentication → Multi-Factor Authentication → enable TOTP
 *   • For each admin user: Authentication → Users → Require MFA
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

/** Check MFA status server-side. Returns the AAL ('aal1' | 'aal2' | null). */
export async function getAdminAal(): Promise<{
  aal: string | null
  hasEnrolledFactor: boolean
  factorId: string | null
}> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cs: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    },
  )

  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error || !data) return { aal: null, hasEnrolledFactor: false, factorId: null }

  const { currentLevel } = data

  // listFactors().totp returns only *verified* factors.
  // For unverified (freshly enrolled) factors, check the .all array.
  const { data: factors } = await supabase.auth.mfa.listFactors()
  const verifiedTotp = factors?.totp ?? []     // only verified TOTP factors
  const allFactors   = factors?.all ?? []
  const unverifiedTotp = allFactors.filter(
    (f) => f.factor_type === 'totp' && !verifiedTotp.some((v) => v.id === f.id),
  )

  return {
    aal: currentLevel,
    hasEnrolledFactor: verifiedTotp.length > 0,
    factorId: verifiedTotp[0]?.id ?? unverifiedTotp[0]?.id ?? null,
  }
}

/**
 * Enforce MFA on admin pages.
 * Call this from the admin layout's getUser() function.
 * Redirects to setup or verify as needed.
 */
export async function enforceAdminMfa() {
  const { aal, hasEnrolledFactor } = await getAdminAal()

  if (!hasEnrolledFactor) {
    // Admin has no TOTP factor at all — must set one up
    redirect('/admin/mfa/setup')
  }

  if (aal !== 'aal2') {
    // Factor enrolled but this session hasn't passed the challenge
    redirect('/admin/mfa/verify')
  }
}
