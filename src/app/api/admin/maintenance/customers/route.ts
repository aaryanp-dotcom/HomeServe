import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/maintenance/auth'
import { propertySchema } from '@/lib/maintenance/schemas'
import { logAdmin } from '@/lib/maintenance/audit'

/** GET /api/admin/maintenance/customers?q= — find a customer (name, phone or email) and their homes. */
export async function GET(req: Request) {
  const a = await requireAdmin()
  if (!a.ok) return a.res
  const q = (new URL(req.url).searchParams.get('q') ?? '').trim().replace(/[%,()]/g, '')
  if (q.length < 2) return NextResponse.json({ customers: [] })

  const { data: profiles } = await a.admin.from('user_profiles')
    .select('user_id, full_name, phone, email')
    .eq('role', 'homeowner')
    .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
    .limit(8)
  const ids = (profiles ?? []).map((p) => p.user_id)
  const { data: props } = ids.length
    ? await a.admin.from('customer_properties').select('id, user_id, label, address_line, city').in('user_id', ids)
    : { data: [] }
  return NextResponse.json({
    customers: (profiles ?? []).map((p) => ({ ...p, properties: (props ?? []).filter((x) => x.user_id === p.user_id) })),
  })
}

/** POST /api/admin/maintenance/customers — add a home to a customer's account (for phone bookings). */
export async function POST(req: Request) {
  const a = await requireAdmin()
  if (!a.ok) return a.res
  const body = await req.json().catch(() => null)
  const uid = z.string().uuid().safeParse(body?.user_id)
  const parsed = propertySchema.safeParse(body)
  if (!uid.success || !parsed.success) return NextResponse.json({ error: parsed.success ? 'Choose a customer' : (parsed.error.issues[0]?.message ?? 'Invalid address') }, { status: 400 })
  const { data: owner } = await a.admin.from('user_profiles').select('user_id, role').eq('user_id', uid.data).maybeSingle()
  if (!owner || owner.role !== 'homeowner') return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  const { count } = await a.admin.from('customer_properties').select('id', { count: 'exact', head: true }).eq('user_id', uid.data)
  if ((count ?? 0) >= 10) return NextResponse.json({ error: 'This customer already has 10 saved homes.' }, { status: 400 })
  const { data, error } = await a.admin.from('customer_properties').insert({ ...parsed.data, user_id: uid.data, is_default: (count ?? 0) === 0 }).select('*').single()
  if (error) return NextResponse.json({ error: 'Could not save the home' }, { status: 500 })
  await logAdmin(a.admin, a.user.id, { action: 'property.create', entity_type: 'customer_property', entity_id: data.id, summary: 'Added a home to a customer account' })
  return NextResponse.json({ property: data }, { status: 201 })
}
