import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/services — list all active services, optionally filtered by category
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const search = searchParams.get('q')

  const adminSupabase = createAdminClient()
  let query = adminSupabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('base_price', { ascending: true })

  if (category) query = query.eq('category', category)
  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ services: data ?? [] })
}

// POST /api/services — admin creates a new service
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase.from('user_profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { name, category, description, base_price, price_unit, min_duration_hours, max_duration_hours } = body

  if (!name || !category || !base_price) {
    return NextResponse.json({ error: 'name, category, and base_price are required' }, { status: 400 })
  }

  const { data, error } = await adminSupabase
    .from('services')
    .insert({ name, category, description: description ?? '', base_price, price_unit: price_unit ?? 'fixed', min_duration_hours: min_duration_hours ?? 1, max_duration_hours: max_duration_hours ?? 4, is_active: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ service: data }, { status: 201 })
}
