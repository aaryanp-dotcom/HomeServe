import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { noIndex } from '@/lib/seo'
import MfaVerifyClient from './MfaVerifyClient'

export const metadata: Metadata = { ...noIndex, title: 'Verify MFA — Admin' }

/**
 * Admin MFA verification page.
 * Shown when an admin has a TOTP factor enrolled but the current session is still aal1.
 */
export default async function AdminMfaVerifyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/admin/dashboard')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  if (profile?.role !== 'admin') redirect('/homeowner/dashboard')

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aal?.currentLevel === 'aal2') redirect('/admin/dashboard')

  // listFactors().totp returns only verified TOTP factors
  const { data: factors } = await supabase.auth.mfa.listFactors()
  const verifiedTotp = factors?.totp ?? []

  if (verifiedTotp.length === 0) {
    // No verified factor — redirect to setup
    redirect('/admin/mfa/setup')
  }

  return <MfaVerifyClient factorId={verifiedTotp[0]!.id} />
}
