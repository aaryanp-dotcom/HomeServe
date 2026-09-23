import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response
  const { userId: adminUserId, admin: supabase } = auth

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
      assigned_to: adminUserId,
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
