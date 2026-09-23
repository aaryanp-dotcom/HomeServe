import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/maintenance/auth'
import { serviceEditSchema } from '@/lib/maintenance/schemas'
import { logAdmin } from '@/lib/maintenance/audit'

/** PUT /api/admin/maintenance/services/:id — edit a catalogue entry (prices, copy, availability). */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const a = await requireAdmin()
  if (!a.ok) return a.res

  const parsed = serviceEditSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid service', issues: parsed.error.issues }, { status: 400 })
  const v = parsed.data

  const { data: before } = await a.admin.from('maintenance_services').select('indicative_price_from, indicative_price_to, is_active').eq('id', params.id).maybeSingle()
  const { data, error } = await a.admin.from('maintenance_services').update({
    ...v,
    indicative_price_from: v.indicative_price_from ?? null,
    indicative_price_to: v.indicative_price_to ?? null,
    price_note: v.price_note ?? null,
  }).eq('id', params.id).select('id').maybeSingle()
  if (error) {
    console.error('[admin/maintenance/services]', error.code, error.hint)
    return NextResponse.json({ error: 'Could not save the service' }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  await logAdmin(a.admin, a.user.id, {
    action: 'service.update', entity_type: 'maintenance_service', entity_id: params.id, summary: `Edited service ${v.name}`,
    details: { before, after: { indicative_price_from: v.indicative_price_from ?? null, indicative_price_to: v.indicative_price_to ?? null, is_active: v.is_active } },
  })
  return NextResponse.json({ ok: true })
}
