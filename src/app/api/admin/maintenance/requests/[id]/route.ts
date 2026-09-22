import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/maintenance/auth'
import { adminActionSchema } from '@/lib/maintenance/schemas'
import { addRequestEvent, notifyCustomer } from '@/lib/maintenance/notify'
import { ADMIN_TRANSITIONS, REQUEST_STATUS, slotLabel, type RequestStatus } from '@/lib/maintenance/config'
import { rupees, fmtDate } from '@/lib/maintenance/format'

/**
 * POST /api/admin/maintenance/requests/:id
 * Every admin action on a maintenance request: status, internal assignment, visits,
 * charges (with the membership benefit engine), notes and customer messages.
 * The admin check is server-side; this route is safe even if the UI is bypassed.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const a = await requireAdmin()
  if (!a.ok) return a.res
  const { admin, user } = a

  const parsed = adminActionSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid action', issues: parsed.error.issues }, { status: 400 })
  }
  const act = parsed.data

  const { data: r } = await admin
    .from('maintenance_requests')
    .select('*, service:maintenance_services(name)')
    .eq('id', params.id).maybeSingle()
  if (!r) return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  const serviceName = (Array.isArray(r.service) ? r.service[0] : r.service)?.name ?? 'your service'
  const cur = r.status as RequestStatus
  const ref = { type: 'maintenance_request' as const, id: r.id }
  const base = { request_number: r.request_number, request_id: r.id, service_name: serviceName }

  switch (act.action) {
    // ── status ────────────────────────────────────────────────────────────
    case 'status': {
      const to = act.status as RequestStatus
      if (!ADMIN_TRANSITIONS[cur].includes(to)) {
        return NextResponse.json({ error: `A ${REQUEST_STATUS[cur].label.toLowerCase()} request cannot move to ${REQUEST_STATUS[to].label.toLowerCase()}.` }, { status: 409 })
      }
      const now = new Date().toISOString()
      const patch: Record<string, unknown> = { status: to }

      if (to === 'scheduled') {
        const { count } = await admin.from('maintenance_visits').select('id', { count: 'exact', head: true }).eq('request_id', r.id).eq('status', 'scheduled')
        if (!count) return NextResponse.json({ error: 'Schedule a visit first.' }, { status: 400 })
      }
      if (to === 'confirmed') patch.confirmed_at = now
      if (to === 'completed') {
        patch.completed_at = now
        if (act.completion_summary) patch.completion_summary = act.completion_summary
      }
      if (to === 'closed') {
        if (r.payment_status === 'pending') {
          return NextResponse.json({ error: `${rupees(Number(r.amount_due))} is still unpaid. Wait for payment or mark the charges as waived before closing.` }, { status: 409 })
        }
        patch.closed_at = now
      }
      if (to === 'cancelled') { patch.cancelled_at = now; patch.cancellation_reason = act.note ?? null }
      if (to === 'in_progress' && cur === 'completed') patch.completed_at = null

      const { data: upd } = await admin.from('maintenance_requests').update(patch).eq('id', r.id).eq('status', cur).select('id').maybeSingle()
      if (!upd) return NextResponse.json({ error: 'The request changed just now. Please refresh.' }, { status: 409 })

      if (to === 'completed') {
        await admin.from('maintenance_visits').update({ status: 'completed', completed_at: now }).eq('request_id', r.id).eq('status', 'scheduled')
      }
      await addRequestEvent(admin, {
        request_id: r.id, actor_id: user.id, actor_role: 'homeserve', event_type: 'status_change',
        from_status: cur, to_status: to, body: act.note ?? undefined,
      })

      if (to === 'confirmed') void notifyCustomer(admin, r.user_id, 'maintenance_request_confirmed', base, { reference: ref })
      if (to === 'completed') {
        void notifyCustomer(admin, r.user_id, 'maintenance_completed', { ...base, amount_due: r.payment_status === 'pending' ? rupees(Number(r.amount_due)) : '0' }, { reference: ref })
      }
      return NextResponse.json({ ok: true, status: to })
    }

    // ── internal responsibility ───────────────────────────────────────────
    case 'assign': {
      if (act.assigned_to) {
        const { data: p } = await admin.from('user_profiles').select('role').eq('user_id', act.assigned_to).maybeSingle()
        if (p?.role !== 'admin') return NextResponse.json({ error: 'Only HomeServe staff accounts can be assigned.' }, { status: 400 })
      }
      await admin.from('maintenance_requests').update({ assigned_to: act.assigned_to, team_label: act.team_label ?? null }).eq('id', r.id)
      await addRequestEvent(admin, {
        request_id: r.id, actor_id: user.id, actor_role: 'homeserve', event_type: 'assignment', visible_to_customer: false,
        body: act.assigned_to ? `Assigned${act.team_label ? ` to ${act.team_label}` : ''}` : 'Unassigned',
        metadata: { assigned_to: act.assigned_to, team_label: act.team_label ?? null },
      })
      return NextResponse.json({ ok: true })
    }

    // ── visits ────────────────────────────────────────────────────────────
    case 'schedule': {
      if (['requested', 'completed', 'customer_confirmed', 'closed', 'cancelled'].includes(cur)) {
        return NextResponse.json({ error: cur === 'requested' ? 'Confirm the request before scheduling a visit.' : 'A visit cannot be scheduled at this stage.' }, { status: 409 })
      }
      if (act.scheduled_date < new Date().toISOString().slice(0, 10)) {
        return NextResponse.json({ error: 'Choose today or a future date.' }, { status: 400 })
      }
      await admin.from('maintenance_visits').update({ status: 'rescheduled' }).eq('request_id', r.id).eq('status', 'scheduled')
      const { data: visit, error } = await admin.from('maintenance_visits').insert({
        request_id: r.id, scheduled_date: act.scheduled_date, time_window: act.time_window, notes: act.notes ?? null, created_by: user.id,
        technician_id: act.technician_id ?? null,
      }).select('id').single()
      if (error || !visit) return NextResponse.json({ error: 'Could not schedule the visit' }, { status: 500 })

      if (cur === 'confirmed') {
        await admin.from('maintenance_requests').update({ status: 'scheduled' }).eq('id', r.id).eq('status', 'confirmed')
        await addRequestEvent(admin, { request_id: r.id, actor_id: user.id, actor_role: 'homeserve', event_type: 'status_change', from_status: 'confirmed', to_status: 'scheduled' })
      }
      await addRequestEvent(admin, {
        request_id: r.id, actor_id: user.id, actor_role: 'homeserve', event_type: 'visit',
        body: `Visit scheduled for ${fmtDate(act.scheduled_date)} (${slotLabel(act.time_window)})`,
        metadata: { visit_id: visit.id, date: act.scheduled_date, window: act.time_window },
      })
      void notifyCustomer(admin, r.user_id, 'maintenance_visit_scheduled', {
        ...base, scheduled_date: fmtDate(act.scheduled_date), time_window: slotLabel(act.time_window).toLowerCase(),
      }, { reference: ref, sms: true })
      return NextResponse.json({ ok: true, visit_id: visit.id })
    }

    case 'visit_status': {
      const { data: v } = await admin.from('maintenance_visits').select('id').eq('id', act.visit_id).eq('request_id', r.id).maybeSingle()
      if (!v) return NextResponse.json({ error: 'Visit not found' }, { status: 404 })
      await admin.from('maintenance_visits').update({
        status: act.status, completed_at: act.status === 'completed' ? new Date().toISOString() : null,
      }).eq('id', v.id)
      await addRequestEvent(admin, { request_id: r.id, actor_id: user.id, actor_role: 'homeserve', event_type: 'visit', body: `Visit marked ${act.status}`, metadata: { visit_id: v.id } })
      return NextResponse.json({ ok: true })
    }

    case 'technician': {
      const { data: v } = await admin.from('maintenance_visits').select('id').eq('id', act.visit_id).eq('request_id', r.id).maybeSingle()
      if (!v) return NextResponse.json({ error: 'Visit not found' }, { status: 404 })
      await admin.from('maintenance_visits').update({ technician_id: act.technician_id }).eq('id', v.id)
      await addRequestEvent(admin, { request_id: r.id, actor_id: user.id, actor_role: 'homeserve', event_type: 'visit', body: act.technician_id ? 'Visit assigned to a technician' : 'Visit unassigned', metadata: { visit_id: v.id, technician_id: act.technician_id } })
      return NextResponse.json({ ok: true })
    }

    // ── charges + membership benefits ─────────────────────────────────────
    case 'charges': {
      if (r.payment_status === 'paid') return NextResponse.json({ error: 'This request is already paid, so its charges are locked.' }, { status: 409 })
      if (['cancelled'].includes(cur)) return NextResponse.json({ error: 'A cancelled request has no charges.' }, { status: 409 })
      const materials = act.materials.map((m) => ({
        item: m.item, qty: m.qty, unit_price: m.unit_price, amount: Math.round(m.qty * m.unit_price * 100) / 100,
      }))
      const materials_cost = Math.round(materials.reduce((s, m) => s + m.amount, 0) * 100) / 100
      const { error: upErr } = await admin.from('maintenance_requests').update({
        visit_fee: act.visit_fee, labour_charge: act.labour_charge, materials, materials_cost,
        payment_status: r.payment_status === 'waived' ? 'pending' : r.payment_status,
      }).eq('id', r.id)
      if (upErr) return NextResponse.json({ error: 'Could not save charges' }, { status: 500 })

      const { data: calc, error: rpcErr } = await admin.rpc('recalculate_request_charges', { p_request_id: r.id, p_actor: user.id })
      if (rpcErr || !calc?.ok) {
        console.error('[admin/maintenance] recalc', rpcErr, calc)
        return NextResponse.json({ error: calc?.error ?? 'Could not calculate charges' }, { status: 500 })
      }
      if (act.waive && Number(calc.amount_due) > 0) {
        await admin.from('maintenance_requests').update({ payment_status: 'waived' }).eq('id', r.id)
        await addRequestEvent(admin, { request_id: r.id, actor_id: user.id, actor_role: 'homeserve', event_type: 'charges', body: 'Amount due waived', visible_to_customer: true })
      }
      // Any unpaid checkout for the old amount is no longer valid.
      await admin.from('maintenance_payments').update({ status: 'failed' }).eq('request_id', r.id).eq('status', 'created')
      return NextResponse.json({ ok: true, calc })
    }

    // ── notes and messages ────────────────────────────────────────────────
    case 'note':
      await addRequestEvent(admin, { request_id: r.id, actor_id: user.id, actor_role: 'homeserve', event_type: 'note', body: act.body, visible_to_customer: false })
      return NextResponse.json({ ok: true })

    case 'message':
      if (['closed', 'cancelled'].includes(cur)) return NextResponse.json({ error: 'This request is closed.' }, { status: 409 })
      await addRequestEvent(admin, { request_id: r.id, actor_id: user.id, actor_role: 'homeserve', event_type: 'message', body: act.body })
      return NextResponse.json({ ok: true })
  }
}
