import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/maintenance/auth'
import { customerActionSchema } from '@/lib/maintenance/schemas'
import { addRequestEvent } from '@/lib/maintenance/notify'
import { CUSTOMER_CANCELLABLE } from '@/lib/maintenance/config'

/**
 * POST /api/maintenance/requests/:id — actions a customer may take on their own request:
 * confirm the work, reopen it with a note, cancel it early, or send HomeServe a message.
 * Status changes are conditional updates (…WHERE status = <current>) so two racing clicks
 * cannot both succeed.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const a = await requireUser()
  if (!a.ok) return a.res
  const { admin, user } = a

  const parsed = customerActionSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid action' }, { status: 400 })
  const act = parsed.data

  const { data: r } = await admin
    .from('maintenance_requests').select('id, status, user_id').eq('id', params.id).eq('user_id', user.id).maybeSingle()
  if (!r) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

  const now = new Date().toISOString()

  const move = async (to: string, patch: Record<string, unknown>, from: string[], body: string, note?: string) => {
    if (!from.includes(r.status)) {
      return NextResponse.json({ error: `This request is ${r.status.replace(/_/g, ' ')} and cannot be changed that way.` }, { status: 409 })
    }
    const { data: upd, error } = await admin
      .from('maintenance_requests').update({ status: to, ...patch }).eq('id', r.id).eq('status', r.status).select('id').maybeSingle()
    if (error || !upd) return NextResponse.json({ error: 'The request changed just now. Please refresh.' }, { status: 409 })
    await addRequestEvent(admin, {
      request_id: r.id, actor_id: user.id, actor_role: 'customer', event_type: 'status_change',
      from_status: r.status, to_status: to, body: note ? `${body}: ${note}` : body,
    })
    return NextResponse.json({ ok: true, status: to })
  }

  switch (act.action) {
    case 'confirm':
      return move('customer_confirmed', { customer_confirmed_at: now }, ['completed'], 'Customer confirmed the work')
    case 'reopen':
      return move('in_progress', { customer_confirmed_at: null }, ['completed', 'customer_confirmed'], 'Customer reported an issue', act.note)
    case 'cancel':
      return move('cancelled', { cancelled_at: now, cancellation_reason: act.reason ?? null }, CUSTOMER_CANCELLABLE, 'Customer cancelled the request', act.reason ?? undefined)
    case 'message': {
      if (['closed', 'cancelled'].includes(r.status)) {
        return NextResponse.json({ error: 'This request is closed. Please raise a new request.' }, { status: 409 })
      }
      const { count: recent } = await admin.from('maintenance_request_events').select('id', { count: 'exact', head: true })
        .eq('actor_id', user.id).eq('event_type', 'message').gte('created_at', new Date(Date.now() - 10 * 60_000).toISOString())
      if ((recent ?? 0) >= 15) return NextResponse.json({ error: 'You are sending messages very quickly. Please wait a few minutes.' }, { status: 429 })
      await addRequestEvent(admin, { request_id: r.id, actor_id: user.id, actor_role: 'customer', event_type: 'message', body: act.body })
      return NextResponse.json({ ok: true })
    }
  }
}
