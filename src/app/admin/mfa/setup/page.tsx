import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { noIndex } from '@/lib/seo'
import MfaSetupClient from './MfaSetupClient'

export const metadata: Metadata = { ...noIndex, title: 'Set up MFA — Admin' }

/**
 * Admin MFA setup page.
 * Only accessible when logged in as an admin without MFA enrolled.
 * If MFA is already verified, send them to the dashboard.
 */
export default async function AdminMfaSetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/admin/dashboard')

  // Server-side role check
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  if (profile?.role !== 'admin') redirect('/homeowner/dashboard')

  // If already at aal2, no need to setup/verify again
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aal?.currentLevel === 'aal2') redirect('/admin/dashboard')

  return <MfaSetupClient />
}
