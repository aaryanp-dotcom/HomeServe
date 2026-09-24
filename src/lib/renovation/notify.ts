import { sendRawEmail } from '@/lib/notifications'
import { baseEmailLayout } from '@/lib/notifications/email-layout'

/**
 * Confirms receipt of a public renovation-request lead. Best-effort and silent on failure
 * (sendRawEmail already swallows send errors) — a mail hiccup must never fail the lead
 * submission itself. Only fires when the visitor gave an email; it's optional on this form.
 */
export async function notifyLeadReceived(lead: {
  fullName: string
  email: string
  requestNumber: string
  city: string
  locality: string
}) {
  await sendRawEmail(lead.email, `We've got your renovation request — ${lead.requestNumber}`, baseEmailLayout(`
    <h2 style="color:#111827;margin:0 0 16px;">Thanks, we've got your request! 🏠</h2>
    <p style="color:#374151;margin:0 0 8px;">Hi <strong>${lead.fullName}</strong>,</p>
    <p style="color:#374151;margin:0 0 20px;">We've received your renovation request for <strong>${lead.locality}, ${lead.city}</strong>. Your reference number is <strong>${lead.requestNumber}</strong>.</p>
    <p style="color:#374151;margin:0 0 4px;">Here's what happens next:</p>
    <ol style="color:#374151;margin:0 0 20px;padding-left:20px;">
      <li style="margin-bottom:6px;">Our team reviews your requirement (within 24 hours)</li>
      <li style="margin-bottom:6px;">We call you to understand your project in detail</li>
      <li style="margin-bottom:6px;">We schedule a site visit at your convenience</li>
      <li>Post site visit, we prepare a detailed quotation</li>
    </ol>
    <p style="color:#6b7280;font-size:13px;margin:0;">Reference: ${lead.requestNumber}</p>
  `, 'Request received'))
}
