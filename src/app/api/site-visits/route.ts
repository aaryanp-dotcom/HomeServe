import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getSupabase() {
  const cookieStore = cookies()
  return createServerClient(
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
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { request_id, scheduled_date, scheduled_time, address, status, site_notes } = body

  if (!request_id) return NextResponse.json({ error: 'request_id is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('site_visits')
    .insert({
      request_id,
      scheduled_date: scheduled_date || null,
      scheduled_time: scheduled_time || null,
      address: address || null,
      status: status ?? 'scheduled',
      site_notes: site_notes || null,
      assigned_to: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('[site-visits/create]', error.code, error.hint)
    return NextResponse.json({ error: 'Could not schedule the visit' }, { status: 500 })
  }

  // Also update the renovation_request status to site_visit_scheduled
  await supabase
    .from('renovation_requests')
    .update({ status: 'site_visit_scheduled' })
    .eq('id', request_id)
    .eq('status', 'qualified') // only if currently qualified

  return NextResponse.json({ siteVisit: data })
}
