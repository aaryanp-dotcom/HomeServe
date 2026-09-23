import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/notifications — in-app notification log for current user
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase
    .from('notification_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('sent_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('[notifications/list]', error.code, error.hint)
    return NextResponse.json({ error: 'Could not load notifications' }, { status: 500 })
  }
  return NextResponse.json({ notifications: data ?? [] })
}

// POST /api/notifications — mark all of the current user's notifications as read.
// notification_logs is admin-write only under RLS, so this uses the service role
// and is strictly scoped to the authenticated user's own rows.
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await createAdminClient()
    .from('notification_logs')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null)

  if (error) {
    console.error('[notifications/mark-read]', error.code, error.hint)
    return NextResponse.json({ error: 'Could not update notifications' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
