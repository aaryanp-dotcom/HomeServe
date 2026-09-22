import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/** Page-level admin gate (defence in depth; the API routes and RLS enforce it independently). */
export async function adminPage(path: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=${path}`)
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') redirect('/homeowner/dashboard')
  return { supabase, user }
}
