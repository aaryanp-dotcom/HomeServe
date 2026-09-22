// Email + SMS copy for the home-maintenance and membership events.
// Kept apart from the renovation templates so that file stays focused. Uses HomeServe /
// "our team" language — no "contractor". Every interpolated value is HTML-escaped.

import { baseEmailLayout } from './email-layout'

type Data = Record<string, string>
type Email = { to: string; subject: string; html: string }

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))

const app = () => process.env.NEXT_PUBLIC_APP_URL ?? ''
const btn = (href: string, label: string) =>
  `<a href="${esc(href)}" style="display:inline-block;background:#111111;color:#fff;padding:12px 24px;text-decoration:none;font-weight:600;">${esc(label)}</a>`
const h = (t: string) => `<h2 style="color:#111827;margin:0 0 16px;">${esc(t)}</h2>`
const p = (html: string) => `<p style="color:#374151;margin:0 0 16px;">${html}</p>`
const requestLink = (d: Data) => `${app()}/homeowner/maintenance/${d.request_id}`
const membershipLink = () => `${app()}/homeowner/membership`

export const MAINTENANCE_EMAIL: Record<string, (d: Data) => Email> = {
  maintenance_request_received: (d) => ({
    to: d.email,
    subject: `We have your service request ${d.request_number} | HomeServe`,
    html: baseEmailLayout(
      h('We have your request') +
        p(`Hi <strong>${esc(d.name)}</strong>, we received your request for <strong>${esc(d.service_name)}</strong> (${esc(d.request_number)}). Our team will review it and confirm shortly.`) +
        btn(requestLink(d), 'Track your request'),
      'Service request received',
    ),
  }),

  maintenance_request_confirmed: (d) => ({
    to: d.email,
    subject: `Your service request is confirmed — ${d.request_number} | HomeServe`,
    html: baseEmailLayout(
      h('Your request is confirmed') +
        p(`Hi <strong>${esc(d.name)}</strong>, HomeServe has confirmed your request for <strong>${esc(d.service_name)}</strong>. We will schedule a visit and let you know the date.`) +
        btn(requestLink(d), 'View request'),
      'Service request confirmed',
    ),
  }),

  maintenance_visit_scheduled: (d) => ({
    to: d.email,
    subject: `Visit scheduled for ${d.scheduled_date} — ${d.request_number} | HomeServe`,
    html: baseEmailLayout(
      h('Your visit is scheduled') +
        p(`Hi <strong>${esc(d.name)}</strong>, our team will visit for <strong>${esc(d.service_name)}</strong> on <strong>${esc(d.scheduled_date)}</strong> (${esc(d.time_window)}).`) +
        p('If this does not suit you, reply to this email or message us from the request page and we will reschedule.') +
        btn(requestLink(d), 'View request'),
      'Visit scheduled',
    ),
  }),

  maintenance_completed: (d) => ({
    to: d.email,
    subject: `Work completed — please confirm ${d.request_number} | HomeServe`,
    html: baseEmailLayout(
      h('Your service is complete') +
        p(`Hi <strong>${esc(d.name)}</strong>, our team has marked <strong>${esc(d.service_name)}</strong> as complete. Please confirm that you are happy, or tell us what is not right.`) +
        (d.amount_due && d.amount_due !== '0' ? p(`Amount due: <strong>${esc(d.amount_due)}</strong>.`) : '') +
        btn(requestLink(d), 'Review and confirm'),
      'Service completed',
    ),
  }),

  maintenance_payment_received: (d) => ({
    to: d.email,
    subject: `Payment received — ${d.amount} | HomeServe`,
    html: baseEmailLayout(
      h('Payment received') +
        p(`Hi <strong>${esc(d.name)}</strong>, we have received your payment of <strong>${esc(d.amount)}</strong>${d.request_number ? ` for service request ${esc(d.request_number)}` : ''}. Thank you.`) +
        btn(d.request_id ? requestLink(d) : membershipLink(), d.request_id ? 'View request' : 'View membership'),
      'Payment received',
    ),
  }),

  membership_purchased: (d) => ({
    to: d.email,
    subject: `Welcome to HomeServe ${d.plan_name} | Membership confirmed`,
    html: baseEmailLayout(
      h('Your membership is confirmed') +
        p(`Hi <strong>${esc(d.name)}</strong>, your <strong>${esc(d.plan_name)}</strong> membership for ${esc(d.property)} is confirmed.`) +
        p(`Term: <strong>${esc(d.start_date)}</strong> to <strong>${esc(d.end_date)}</strong>. Your benefits, limits and usage are always visible in your membership area.`) +
        btn(membershipLink(), 'View your membership'),
      'Membership confirmed',
    ),
  }),

  membership_renewal_reminder: (d) => ({
    to: d.email,
    subject: `Your HomeServe ${d.plan_name} membership ends on ${d.end_date}`,
    html: baseEmailLayout(
      h('Your membership ends soon') +
        p(`Hi <strong>${esc(d.name)}</strong>, your <strong>${esc(d.plan_name)}</strong> membership ends on <strong>${esc(d.end_date)}</strong>. Memberships do not renew automatically; you can renew from your membership area whenever you wish.`) +
        btn(membershipLink(), 'View or renew'),
      'Membership renewal',
    ),
  }),

  membership_expiry_notice: (d) => ({
    to: d.email,
    subject: `Last reminder: your HomeServe membership ends ${d.end_date}`,
    html: baseEmailLayout(
      h('Your membership ends this week') +
        p(`Hi <strong>${esc(d.name)}</strong>, your <strong>${esc(d.plan_name)}</strong> membership ends on <strong>${esc(d.end_date)}</strong>. After that date member benefits will no longer apply to new requests.`) +
        btn(membershipLink(), 'Renew membership'),
      'Membership ending',
    ),
  }),

  warranty_update: (d) => ({
    to: d.email,
    subject: `Warranty details updated for ${d.project} | HomeServe`,
    html: baseEmailLayout(
      h('Your project warranty details') +
        p(`Hi <strong>${esc(d.name)}</strong>, the handover and warranty details for <strong>${esc(d.project)}</strong> have been recorded.`) +
        p(esc(d.summary)) +
        p('You can raise a warranty request any time from your account. Home maintenance services are separate and optional.') +
        btn(`${app()}/homeowner/warranty`, 'View warranty'),
      'Warranty update',
    ),
  }),
}

export const MAINTENANCE_SMS: Record<string, (d: Data) => string> = {
  maintenance_visit_scheduled: (d) =>
    `HomeServe: visit for ${d.service_name} scheduled ${d.scheduled_date} (${d.time_window}). Details: ${app()}/homeowner/maintenance/${d.request_id}`,
}
