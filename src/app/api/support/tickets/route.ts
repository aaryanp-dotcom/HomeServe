import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createTicketSchema } from '@/lib/support/schemas'
import { hasServiceHistory } from '@/lib/support/eligibility'
import { notifyAdminsOfNewTicket, notifyCustomerTicketReceived } from '@/lib/support/notify'
import type { SupportTicket } from '@/lib/support/types'

/**
 * POST /api/support/tickets — the one entry point behind both the public /contact form and a signed-in
 * homeowner's "raise a ticket". Works with or without a session: logged in, the ticket is linked to the
 * account; logged out, name/email/phone come from the form as given. The dashboard flow additionally
 * requires an active or past service — see hasServiceHistory — the contact form never does.
 */
export async function POST(request: NextRequest) {
  const parsed = createTicketSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
  if (parsed.data.honeypot) return NextResponse.json({ ok: true, ticket_number: 'TCK-00000000-0000' }) // silently pretend to succeed

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()

  const { name, email, phone, subject, category, message, source } = parsed.data

  if (source === 'dashboard') {
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!(await hasServiceHistory(user.id))) {
      return NextResponse.json(
        { error: 'Support tickets are for customers with an active or past service. For a general question, use the contact form instead.' },
        { status: 403 },
      )
    }
  }

  const { data: ticket, error } = await admin.from('support_tickets').insert({
    user_id: user?.id ?? null,
    name, email, phone: phone ?? null, subject, category, source,
  }).select('*').single()
  if (error || !ticket) return NextResponse.json({ error: 'Could not submit your message. Please try again.' }, { status: 500 })

  await admin.from('support_ticket_messages').insert({ ticket_id: ticket.id, sender_role: 'customer', body: message })

  const row = ticket as SupportTicket
  void notifyAdminsOfNewTicket(row, message)
  void notifyCustomerTicketReceived(row)

  return NextResponse.json({ ok: true, id: ticket.id, ticket_number: ticket.ticket_number })
}
