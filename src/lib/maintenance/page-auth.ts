import { redirect } from 'next/navigation'
import { createClient, getAuthUser, getAuthProfile } from '@/lib/supabase/server'

/** Page-level admin gate (defence in depth; the API routes and RLS enforce it independently). */
export async function adminPage(path: string) {
  const supabase = await createClient()
  const user = await getAuthUser()
  if (!user) redirect(`/login?redirect=${path}`)
  // Same cached profile the admin layout already fetched for this request.
  const profile = await getAuthProfile(user.id)
  if (profile?.role !== 'admin') redirect('/homeowner/dashboard')
  return { supabase, user }
}
