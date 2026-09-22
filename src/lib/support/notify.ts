import { createAdminClient } from '@/lib/supabase/admin'
import { sendRawEmail } from '@/lib/notifications'
import { baseEmailLayout } from '@/lib/notifications/email-layout'
import { CATEGORY_LABEL, type SupportTicket } from './types'

/** All best-effort — a mail failure here never fails the ticket that triggered it. */

export async function notifyAdminsOfNewTicket(ticket: SupportTicket, message: string) {
  const admin = createAdminClient()
  const { data: admins } = await admin.from('user_profiles').select('email').eq('role', 'admin')
  const to = (admins ?? []).map((a) => a.email).filter((e): e is string => !!e)
  if (to.length === 0) return
  await sendRawEmail(to, `New ${ticket.source === 'contact_form' ? 'contact form' : 'support'} message — ${ticket.ticket_number}`, baseEmailLayout(`
    <h2 style="color:#111827;margin:0 0 16px;">New support ticket</h2>
    <table style="width:100%;border:1px solid #e5e7eb;border-radius:8px;border-collapse:collapse;margin:0 0 20px;">
      <tr style="background:#f9fafb;"><td style="padding:12px 16px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;width:35%;">Ticket</td><td style="padding:12px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${ticket.ticket_number}</td></tr>
      <tr><td style="padding:12px 16px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">From</td><td style="padding:12px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${ticket.name} · ${ticket.email}${ticket.phone ? ` · ${ticket.phone}` : ''}</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:12px 16px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Category</td><td style="padding:12px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${CATEGORY_LABEL[ticket.category]}</td></tr>
      <tr><td style="padding:12px 16px;font-weight:600;color:#374151;">Subject</td><td style="padding:12px 16px;color:#111827;">${ticket.subject}</td></tr>
    </table>
    <p style="color:#374151;white-space:pre-line;margin:0 0 20px;">${message}</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/tickets/${ticket.id}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Open ticket</a>
  `, 'New support ticket'))
}

export async function notifyCustomerTicketReceived(ticket: SupportTicket) {
  await sendRawEmail(ticket.email, `We received your message — ${ticket.ticket_number}`, baseEmailLayout(`
    <h2 style="color:#111827;margin:0 0 16px;">We've got your message</h2>
    <p style="color:#374151;margin:0 0 8px;">Hi <strong>${ticket.name}</strong>,</p>
    <p style="color:#374151;margin:0 0 20px;">Thanks for reaching out. Your reference is <strong>${ticket.ticket_number}</strong> — our team will get back to you shortly.</p>
    <p style="color:#374151;margin:0;"><strong>Subject:</strong> ${ticket.subject}</p>
  `, 'We received your message'))
}

export async function notifyCustomerOfReply(ticket: SupportTicket, reply: string) {
  await sendRawEmail(ticket.email, `HomeServe replied — ${ticket.ticket_number}`, baseEmailLayout(`
    <h2 style="color:#111827;margin:0 0 16px;">HomeServe replied to your ticket</h2>
    <p style="color:#374151;margin:0 0 8px;">Hi <strong>${ticket.name}</strong>,</p>
    <p style="color:#374151;white-space:pre-line;margin:0 0 20px;">${reply}</p>
    ${ticket.user_id ? `<a href="${process.env.NEXT_PUBLIC_APP_URL}/homeowner/support/${ticket.id}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">View ticket</a>` : `<p style="color:#6b7280;font-size:13px;">Reference: ${ticket.ticket_number}</p>`}
  `, 'HomeServe replied'))
}
