import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/maintenance/auth'
import { warrantyFactsSchema } from '@/lib/maintenance/schemas'
import { notifyCustomer } from '@/lib/maintenance/notify'
import { logAdmin } from '@/lib/maintenance/audit'
import { fmtDate, warrantyStatus } from '@/lib/maintenance/format'

/**
 * PUT /api/admin/projects/:id/warranty — record handover and the warranty facts of a
 * renovation project. Nothing is defaulted: until admin enters a period, customers are told
 * the warranty terms are in their project agreement.
 */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const a = await requireAdmin()
  if (!a.ok) return a.res
  const { admin } = a

  const parsed = warrantyFactsSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid warranty details' }, { status: 400 })
  const v = parsed.data
  if (v.warranty_months && !v.handover_date) {
    return NextResponse.json({ error: 'Enter the handover date to set a warranty period.' }, { status: 400 })
  }

  const { data: before } = await admin.from('bookings').select('id, homeowner_id, project_title, booking_number, booking_type, handover_date, warranty_months').eq('id', params.id).maybeSingle()
  if (!before || before.booking_type !== 'project') return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const facts = { handover_date: v.handover_date ?? null, warranty_months: v.warranty_months ?? null, warranty_terms: v.warranty_terms ?? null }
  const { error } = await admin.from('bookings').update(facts).eq('id', params.id)
  if (error) {
    console.error('[admin/warranty]', error.code, error.hint)
    return NextResponse.json({ error: 'Could not save the warranty details' }, { status: 500 })
  }

  await logAdmin(admin, a.user.id, { action: 'warranty.update', entity_type: 'project', entity_id: params.id, summary: `Set handover ${facts.handover_date ?? 'none'}, warranty ${facts.warranty_months ?? 'terms in agreement'}`, details: { before: { handover_date: before.handover_date, warranty_months: before.warranty_months }, after: facts } })

  const changed = before.handover_date !== facts.handover_date || before.warranty_months !== facts.warranty_months
  if (changed && facts.handover_date) {
    const st = warrantyStatus(facts)
    const summary = st.state === 'active' || st.state === 'ended'
      ? `Handover: ${fmtDate(facts.handover_date)}. Warranty period: ${facts.warranty_months} months, to ${fmtDate(st.ends)}.`
      : `Handover: ${fmtDate(facts.handover_date)}. Warranty terms are set out in your project agreement.`
    void notifyCustomer(admin, before.homeowner_id, 'warranty_update', {
      project: before.project_title ?? before.booking_number, summary,
    }, { reference: { type: 'project', id: before.id } })
  }
  return NextResponse.json({ ok: true })
}
