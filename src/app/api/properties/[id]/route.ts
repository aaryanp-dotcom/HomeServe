import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { propertySchema } from '@/lib/maintenance/schemas'

/** PATCH /api/properties/:id — edit one of your homes. RLS limits this to the owner. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = propertySchema.partial().safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid property' }, { status: 400 })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { booking_id, ...v } = parsed.data
  const makeDefault = (body as { is_default?: boolean } | null)?.is_default === true

  if (makeDefault) await supabase.from('customer_properties').update({ is_default: false }).eq('user_id', user.id)
  const { data, error } = await supabase
    .from('customer_properties').update({ ...v, ...(makeDefault ? { is_default: true } : {}) })
    .eq('id', params.id).eq('user_id', user.id).select('*').maybeSingle()
  if (error) return NextResponse.json({ error: 'Could not update the property' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  return NextResponse.json({ property: data })
}

/**
 * DELETE /api/properties/:id — remove a home. Homes that have service requests or a
 * membership are kept (the history depends on them) and the customer is told why.
 */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: own } = await supabase.from('customer_properties').select('id, is_default').eq('id', params.id).eq('user_id', user.id).maybeSingle()
  if (!own) return NextResponse.json({ error: 'Property not found' }, { status: 404 })

  const [{ count: reqs }, { count: subs }] = await Promise.all([
    supabase.from('maintenance_requests').select('id', { count: 'exact', head: true }).eq('property_id', params.id),
    supabase.from('maintenance_subscriptions').select('id', { count: 'exact', head: true }).eq('property_id', params.id),
  ])
  if ((reqs ?? 0) > 0 || (subs ?? 0) > 0) {
    return NextResponse.json({ error: 'This home has service requests or a membership, so it is kept for your history. You can rename it instead.' }, { status: 409 })
  }
  const { error } = await supabase.from('customer_properties').delete().eq('id', params.id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: 'Could not delete the property' }, { status: 500 })

  if (own.is_default) {
    const { data: next } = await supabase.from('customer_properties').select('id').eq('user_id', user.id).order('created_at').limit(1).maybeSingle()
    if (next) await supabase.from('customer_properties').update({ is_default: true }).eq('id', next.id)
  }
  return NextResponse.json({ ok: true })
}
