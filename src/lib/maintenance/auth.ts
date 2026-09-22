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

/** Server-side admin gate. Never rely on the route being hidden in the UI. */
export async function requireAdmin(): Promise<Auth> {
  const a = await requireUser()
  if (!a.ok) return a
  if (a.role !== 'admin') return deny(403, 'Forbidden')
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
