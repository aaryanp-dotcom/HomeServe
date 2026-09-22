import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteContext { params: Promise<{ id: string }> }

// GET /api/services/[id]
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const adminSupabase = createAdminClient()
  const { data: service, error } = await adminSupabase.from('services').select('*').eq('id', id).single()
  if (error || !service) return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  return NextResponse.json({ service })
}

// PATCH /api/services/[id] — admin updates a service
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase.from('user_profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const allowed = ['name', 'category', 'description', 'base_price', 'price_unit', 'min_duration_hours', 'max_duration_hours', 'is_active']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const { data, error } = await adminSupabase.from('services').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ service: data })
}

// DELETE /api/services/[id] — admin soft-deletes (marks inactive)
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase.from('user_profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await adminSupabase.from('services').update({ is_active: false }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
