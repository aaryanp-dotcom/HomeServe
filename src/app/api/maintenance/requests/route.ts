import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/maintenance/auth'
import { createRequestSchema } from '@/lib/maintenance/schemas'
import { addRequestEvent, notifyCustomer } from '@/lib/maintenance/notify'
import { OPEN_STATUSES } from '@/lib/maintenance/config'

/**
 * POST /api/maintenance/requests
 * A customer asks HomeServe for a maintenance service. Ownership of the property (and
 * the optional related project) is verified server-side; writes use the service role.
 */
export async function POST(req: Request) {
  const a = await requireUser()
  if (!a.ok) return a.res

  const parsed = createRequestSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request', issues: parsed.error.issues }, { status: 400 })
  }
  const v = parsed.data
  const { admin, user } = a

  if (v.preferred_date && v.preferred_date < new Date().toISOString().slice(0, 10)) {
    return NextResponse.json({ error: 'Preferred date cannot be in the past' }, { status: 400 })
  }

  const [{ data: prop }, { data: svc }] = await Promise.all([
    admin.from('customer_properties').select('*').eq('id', v.property_id).eq('user_id', user.id).maybeSingle(),
    admin.from('maintenance_services').select('id, name, category, is_active').eq('id', v.service_id).maybeSingle(),
  ])
  if (!prop) return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  if (!svc || !svc.is_active) return NextResponse.json({ error: 'That service is not available' }, { status: 404 })

  if (v.booking_id) {
    const { data: b } = await admin.from('bookings').select('id').eq('id', v.booking_id).eq('homeowner_id', user.id).maybeSingle()
    if (!b) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Double-submit guard: the same request from the same customer in the last few minutes is returned, not duplicated.
  const since = new Date(Date.now() - 5 * 60_000).toISOString()
  const { data: dup } = await admin.from('maintenance_requests').select('id, request_number')
    .eq('user_id', user.id).eq('service_id', svc.id).eq('property_id', prop.id).eq('description', v.description)
    .in('status', ['requested', 'confirmed']).gte('created_at', since).limit(1).maybeSingle()
  if (dup) return NextResponse.json({ id: dup.id, request_number: dup.request_number, duplicate: true }, { status: 200 })

  const { count: open } = await admin
    .from('maintenance_requests').select('id', { count: 'exact', head: true })
    .eq('user_id', user.id).in('status', OPEN_STATUSES)
  if ((open ?? 0) >= 25) {
    return NextResponse.json({ error: 'You have many open requests. Please wait for some to be completed.' }, { status: 429 })
  }

  // Membership in force for this home today (informational; benefits are computed by admin at charge time).
  const today = new Date().toISOString().slice(0, 10)
  const { data: sub } = await admin
    .from('maintenance_subscriptions').select('id')
    .eq('property_id', prop.id).eq('user_id', user.id).eq('status', 'active')
    .lte('start_date', today).gt('end_date', today).maybeSingle()

  const address = [prop.address_line, prop.locality, prop.city].filter(Boolean).join(', ') + (prop.pincode ? ` – ${prop.pincode}` : '')

  const { data: created, error } = await admin
    .from('maintenance_requests')
    .insert({
      request_number: '',
      user_id: user.id,
      service_id: svc.id,
      category: svc.category,
      property_id: prop.id,
      address_snapshot: address,
      city: prop.city,
      booking_id: v.booking_id ?? prop.booking_id ?? null,
      subscription_id: sub?.id ?? null,
      urgency: v.urgency,
      description: v.description,
      preferred_date: v.preferred_date ?? null,
      preferred_slot: v.preferred_slot ?? null,
    })
    .select('id, request_number')
    .single()
  if (error || !created) {
    console.error('[maintenance/requests] insert', error?.code, error?.hint)
    return NextResponse.json({ error: 'Could not create the request' }, { status: 500 })
  }

  await addRequestEvent(admin, {
    request_id: created.id, actor_id: user.id, actor_role: 'customer', event_type: 'created',
    to_status: 'requested', body: 'Request submitted', metadata: { urgency: v.urgency, member: !!sub },
  })
  void notifyCustomer(admin, user.id, 'maintenance_request_received', {
    service_name: svc.name, request_number: created.request_number, request_id: created.id,
  }, { reference: { type: 'maintenance_request', id: created.id } })

  return NextResponse.json({ id: created.id, request_number: created.request_number }, { status: 201 })
}
