import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { renovationRequestSchema } from '@/lib/validations'

// POST /api/renovation-requests — public lead form.
// Anonymous visitors have no RLS access to this table, so the row is written with
// the service-role client after server-side validation. The optional logged-in
// user is looked up from the session cookie so the lead can be linked to them.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = renovationRequestSchema.safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return NextResponse.json(
        { error: first?.message ?? 'Invalid request', issues: parsed.error.issues },
        { status: 400 },
      )
    }
    const d = parsed.data

    // Room-wise sizes: the server owns the arithmetic, never the client.
    const rooms = d.rooms.map((r) => ({
      name: r.name,
      length_ft: r.length_ft,
      width_ft: r.width_ft,
      area_sqft: Math.round(r.length_ft * r.width_ft * 10) / 10,
    }))
    const areaSqft = d.sizeMode === 'room_wise' && rooms.length
      ? Math.round(rooms.reduce((sum, r) => sum + r.area_sqft, 0) * 10) / 10
      : d.areaSqft ?? null
    if (areaSqft !== null && (areaSqft < 50 || areaSqft > 100000)) {
      return NextResponse.json({ error: 'Total area should be between 50 and 1,00,000 sq ft' }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createServerClient(
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
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await createAdminClient()
      .from('renovation_requests')
      .insert({
        city: d.city,
        locality: d.locality,
        property_type: d.propertyType,
        bhk: d.bhk ?? null,
        approximate_area: d.approximateArea ?? null,
        carpet_area_sqft: areaSqft,
        size_input_mode: areaSqft === null ? null : d.sizeMode ?? 'total_area',
        rooms_detail: d.sizeMode === 'room_wise' ? rooms : [],
        estimate_low: d.estimateLow ?? null,
        estimate_high: d.estimateHigh ?? null,
        is_new_property: d.isNewProperty,
        scope: d.scope,
        scope_other: d.scopeOther ?? null,
        budget_range: d.budget ?? null,
        timeline_preference: d.timeline ?? null,
        inspiration_theme: d.inspirationTheme ?? null,
        notes: d.notes ?? null,
        full_name: d.fullName,
        mobile: d.mobile,
        email: d.email ?? null,
        preferred_contact_time: d.preferredContactTime ?? null,
        user_id: user?.id ?? null,
        status: 'new',
      })
      .select('id, request_number')
      .single()

    if (error) {
      // Log only the error code/hint — not the full row which may echo back PII fields.
      console.error('Supabase error creating renovation request:', error.code, error.hint)
      return NextResponse.json({ error: 'Failed to save request. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      requestId: data.id,
      requestNumber: data.request_number,
    })
  } catch (err) {
    console.error('Error creating renovation request:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  // Admin: list all requests
  const cookieStore = cookies()
  const supabase = createServerClient(
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  let limit = parseInt(url.searchParams.get('limit') ?? '50')
  if (isNaN(limit) || limit <= 0) {
    limit = 50
  } else if (limit > 100) {
    limit = 100 // Defensive cap to prevent resource exhaustion
  }

  let query = supabase
    .from('renovation_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('[renovation-requests/list]', error.code, error.hint)
    return NextResponse.json({ error: 'Failed to load requests' }, { status: 500 })
  }

  return NextResponse.json({ requests: data })
}
