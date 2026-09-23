import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/maintenance/auth'
import { createRequestSchema } from '@/lib/maintenance/schemas'
import { addRequestEvent, notifyCustomer } from '@/lib/maintenance/notify'
import { logAdmin } from '@/lib/maintenance/audit'

const schema = createRequestSchema.and(z.object({ user_id: z.string().uuid(), confirm: z.boolean().optional() }))

/**
 * POST /api/admin/maintenance/requests — HomeServe raises a request for a customer
 * (phone / WhatsApp bookings). Same validation and ownership rules as the customer route:
 * the property must belong to that customer.
 */
export async function POST(req: Request) {
  const a = await requireAdmin()
  if (!a.ok) return a.res
  const { admin, user } = a

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request', issues: parsed.error.issues }, { status: 400 })
  const v = parsed.data

  const [{ data: prop }, { data: svc }] = await Promise.all([
    admin.from('customer_properties').select('*').eq('id', v.property_id).eq('user_id', v.user_id).maybeSingle(),
    admin.from('maintenance_services').select('id, name, category, is_active').eq('id', v.service_id).maybeSingle(),
  ])
  if (!prop) return NextResponse.json({ error: "That home does not belong to this customer" }, { status: 404 })
  if (!svc || !svc.is_active) return NextResponse.json({ error: 'That service is not available' }, { status: 404 })

  const today = new Date().toISOString().slice(0, 10)
  const { data: sub } = await admin.from('maintenance_subscriptions').select('id')
    .eq('property_id', prop.id).eq('user_id', v.user_id).eq('status', 'active').lte('start_date', today).gt('end_date', today).maybeSingle()

  const address = [prop.address_line, prop.locality, prop.city].filter(Boolean).join(', ') + (prop.pincode ? ` – ${prop.pincode}` : '')
  const { data: created, error } = await admin.from('maintenance_requests').insert({
    request_number: '', user_id: v.user_id, service_id: svc.id, category: svc.category, property_id: prop.id,
    address_snapshot: address, city: prop.city, booking_id: v.booking_id ?? prop.booking_id ?? null,
    subscription_id: sub?.id ?? null, urgency: v.urgency, description: v.description,
    preferred_date: v.preferred_date ?? null, preferred_slot: v.preferred_slot ?? null,
    status: v.confirm ? 'confirmed' : 'requested', confirmed_at: v.confirm ? new Date().toISOString() : null,
  }).select('id, request_number').single()
  if (error || !created) {
    console.error('[admin/maintenance/requests] insert', error?.code, error?.hint)
    return NextResponse.json({ error: 'Could not create the request' }, { status: 500 })
  }

  await addRequestEvent(admin, {
    request_id: created.id, actor_id: user.id, actor_role: 'homeserve', event_type: 'created',
    to_status: v.confirm ? 'confirmed' : 'requested', body: 'Request created by HomeServe on your behalf', metadata: { by_admin: true },
  })
  await logAdmin(admin, user.id, { action: 'request.create', entity_type: 'maintenance_request', entity_id: created.id, summary: `Created ${created.request_number} for a customer` })
  void notifyCustomer(admin, v.user_id, v.confirm ? 'maintenance_request_confirmed' : 'maintenance_request_received', {
    service_name: svc.name, request_number: created.request_number, request_id: created.id,
  }, { reference: { type: 'maintenance_request', id: created.id } })

  return NextResponse.json({ id: created.id, request_number: created.request_number }, { status: 201 })
}
