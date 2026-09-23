import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  sizeMode: z.enum(['total_area', 'room_wise']),
  areaSqft: z.number().positive().max(100000).nullish(),
  rooms: z
    .array(z.object({
      name: z.string().trim().min(1).max(60),
      length_ft: z.number().min(1).max(200),
      width_ft: z.number().min(1).max(200),
    }))
    .max(40)
    .default([]),
  site_notes: z.string().max(4000).nullish(),
  markCompleted: z.boolean().optional(),
})

/**
 * PATCH /api/site-visits/[id] — admin records what was measured on site.
 * Room-wise totals are recomputed here; the client never supplies the sum.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid measurements' }, { status: 400 })
  }
  const d = parsed.data

  const rooms = d.rooms.map((r) => ({ ...r, area_sqft: Math.round(r.length_ft * r.width_ft * 10) / 10 }))
  const area = d.sizeMode === 'room_wise'
    ? Math.round(rooms.reduce((s, r) => s + r.area_sqft, 0) * 10) / 10
    : d.areaSqft ?? 0
  if (!(area >= 50 && area <= 100000)) {
    return NextResponse.json({ error: 'Total area should be between 50 and 1,00,000 sq ft' }, { status: 400 })
  }

  const update: Record<string, unknown> = {
    measured_area_sqft: area,
    measured_rooms: d.sizeMode === 'room_wise' ? rooms : [],
  }
  if (d.site_notes !== undefined) update.site_notes = d.site_notes
  if (d.markCompleted) { update.status = 'completed'; update.completed_at = new Date().toISOString() }

  const { data, error } = await supabase.from('site_visits').update(update).eq('id', id).select().single()
  if (error) {
    console.error('[site-visits/update]', error.code, error.hint)
    return NextResponse.json({ error: error.code === 'PGRST116' ? 'Site visit not found' : 'Could not save the measurement' }, { status: error.code === 'PGRST116' ? 404 : 500 })
  }

  // A completed visit moves the lead forward (only from the earlier pipeline stages).
  if (d.markCompleted) {
    await supabase
      .from('renovation_requests')
      .update({ status: 'site_visit_completed' })
      .eq('id', data.request_id)
      .in('status', ['new', 'contacted', 'qualified', 'site_visit_scheduled'])
  }
  return NextResponse.json({ siteVisit: data })
}
