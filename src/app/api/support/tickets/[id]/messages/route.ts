import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { replyMessageSchema } from '@/lib/support/schemas'

/** POST — a signed-in homeowner adding a follow-up message to their own ticket. Reopens it if it had
 *  been marked resolved/closed, since a new message means it isn't actually done. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = replyMessageSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })

  const admin = createAdminClient()
  const { data: ticket } = await admin.from('support_tickets').select('id, status').eq('id', id).eq('user_id', user.id).maybeSingle()
  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  const { error } = await admin.from('support_ticket_messages').insert({ ticket_id: ticket.id, sender_role: 'customer', body: parsed.data.body })
  if (error) return NextResponse.json({ error: 'Could not send your message' }, { status: 500 })

  if (['resolved', 'closed'].includes(ticket.status)) {
    await admin.from('support_tickets').update({ status: 'open' }).eq('id', ticket.id)
  }
  return NextResponse.json({ ok: true })
}
