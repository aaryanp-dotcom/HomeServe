import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminTicketActionSchema } from '@/lib/support/schemas'
import { notifyCustomerOfReply } from '@/lib/support/notify'
import type { SupportTicket } from '@/lib/support/types'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('user_profiles').select('role').eq('user_id', user.id).single()
  return profile?.role === 'admin' ? { user, admin } : null
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireAdmin()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { admin } = ctx

  const parsed = adminTicketActionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })

  const { data: ticket } = await admin.from('support_tickets').select('*').eq('id', params.id).maybeSingle()
  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  const act = parsed.data

  if (act.action === 'reply') {
    const { error } = await admin.from('support_ticket_messages').insert({ ticket_id: ticket.id, sender_role: 'homeserve', body: act.body })
    if (error) return NextResponse.json({ error: 'Could not send the reply' }, { status: 500 })
    if (ticket.status === 'open') await admin.from('support_tickets').update({ status: 'in_progress' }).eq('id', ticket.id)
    void notifyCustomerOfReply(ticket as SupportTicket, act.body)
    return NextResponse.json({ ok: true })
  }

  // action === 'status'
  const { error } = await admin.from('support_tickets').update({
    status: act.status, resolved_at: act.status === 'resolved' ? new Date().toISOString() : ticket.resolved_at,
  }).eq('id', ticket.id)
  if (error) return NextResponse.json({ error: 'Could not update the ticket' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
