import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminSupabase = createAdminClient()

  // Verify profile
  const { data: profile } = await adminSupabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 403 })

  let query = adminSupabase
    .from('bookings')
    .select(`
      *,
      service:services(*),
      homeowner:user_profiles!bookings_homeowner_profile_fkey(full_name, phone, email),
      contractor:user_profiles!bookings_contractor_profile_fkey(full_name, phone),
      milestones(*),
      payments(*)
    `)
    .eq('id', id)

  // Scope by role — must reassign; query builder is immutable
  if (profile.role === 'homeowner') {
    query = query.eq('homeowner_id', user.id)
  } else if (profile.role === 'contractor') {
    query = query.eq('contractor_id', user.id)
  }
  // admin sees all

  const { data: booking, error } = await query.single()

  if (error || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  return NextResponse.json({ booking })
}
