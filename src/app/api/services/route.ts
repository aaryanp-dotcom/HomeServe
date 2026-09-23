import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { SERVICE_CATEGORIES } from '@/types'

// FIND-10: Explicit Zod schema — validates all fields before touching the DB.
// Uses the canonical SERVICE_CATEGORIES enum from @/types to stay in sync with
// the rest of the codebase and the database constraint.
const createServiceSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.enum(SERVICE_CATEGORIES),
  description: z.string().max(2000).optional().default(''),
  base_price: z.number().positive(),
  price_unit: z.enum(['fixed', 'per_sqft', 'per_hour']).optional().default('fixed'),
  min_duration_hours: z.number().int().positive().optional().default(1),
  max_duration_hours: z.number().int().positive().optional().default(4),
})

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

  const bodyRaw = await request.json().catch(() => null)
  const parsed = createServiceSchema.safeParse(bodyRaw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
  }

  const { name, category, description, base_price, price_unit, min_duration_hours, max_duration_hours } = parsed.data

  const { data, error } = await adminSupabase
    .from('services')
    .insert({ name, category, description, base_price, price_unit, min_duration_hours, max_duration_hours, is_active: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ service: data }, { status: 201 })
}
