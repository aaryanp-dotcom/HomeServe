import { Resend } from 'resend'
import twilio from 'twilio'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NotificationEvent } from '@/types'
import { baseEmailLayout } from './email-layout'
import { MAINTENANCE_EMAIL, MAINTENANCE_SMS } from './maintenance-templates'

// Lazy clients — prevent module-load crash when env vars are absent at build time
function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
}

function getTwilioClient() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return null
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
}

/**
 * A channel is "configured" only with real credentials. Placeholder values in a fresh
 * .env are treated as not configured, so we skip the channel instead of logging a
 * "failed" notification that would show up in the customer's in-app list.
 */
function channelConfigured(channel: 'email' | 'sms' | 'whatsapp'): boolean {
  if (channel === 'email') return /^re_[A-Za-z0-9_]{16,}$/.test(process.env.RESEND_API_KEY ?? '')
  return /^AC[0-9a-f]{32}$/i.test(process.env.TWILIO_ACCOUNT_SID ?? '') && !!process.env.TWILIO_AUTH_TOKEN
}

// ============================================================
// EMAIL TEMPLATES
// ============================================================

type EmailPayload = {
  to: string
  subject: string
  html: string
}

const EMAIL_TEMPLATES: Record<string, (data: Record<string, string>) => EmailPayload> = {
  ...MAINTENANCE_EMAIL,
  booking_created: (data) => ({
    to: data.email,
    subject: `Booking Confirmed – ${data.booking_number} | HomeServe`,
    html: baseEmailLayout(`
      <h2 style="color:#111827;margin:0 0 16px;">Booking Received! 🎉</h2>
      <p style="color:#374151;margin:0 0 8px;">Hi <strong>${data.name}</strong>,</p>
      <p style="color:#374151;margin:0 0 20px;">Your booking has been created successfully. Our team will review it and assign a team member shortly.</p>
      <table style="width:100%;border:1px solid #e5e7eb;border-radius:8px;border-collapse:collapse;margin:0 0 20px;">
        <tr style="background:#f9fafb;"><td style="padding:12px 16px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;width:40%;">Booking Number</td><td style="padding:12px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${data.booking_number}</td></tr>
        <tr><td style="padding:12px 16px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Service</td><td style="padding:12px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${data.service_name}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:12px 16px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Scheduled Date</td><td style="padding:12px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${data.scheduled_date}</td></tr>
        <tr><td style="padding:12px 16px;font-weight:600;color:#374151;">Total Amount</td><td style="padding:12px 16px;color:#2563eb;font-weight:700;">${data.total_amount}</td></tr>
      </table>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/homeowner/bookings/${data.booking_id}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Track Your Booking</a>
    `, 'Booking Confirmed'),
  }),

  booking_assigned: (data) => ({
    to: data.email,
    subject: `Team member assigned – ${data.booking_number} | HomeServe`,
    html: baseEmailLayout(`
      <h2 style="color:#111827;margin:0 0 16px;">Great news! A HomeServe team member has been assigned 👷</h2>
      <p style="color:#374151;margin:0 0 20px;">Hi <strong>${data.name}</strong>, <strong>${data.contractor_name}</strong> has been assigned to your booking <strong>${data.booking_number}</strong> and will arrive on <strong>${data.scheduled_date} at ${data.scheduled_time}</strong>.</p>
      <p style="color:#374151;margin:0 0 20px;">You can follow progress from your booking dashboard.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/homeowner/bookings/${data.booking_id}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">View Booking Details</a>
    `, 'Team member assigned'),
  }),

  milestone_payment_due: (data) => ({
    to: data.email,
    subject: `Payment Due – Milestone ${data.milestone_number} | ${data.booking_number}`,
    html: baseEmailLayout(`
      <h2 style="color:#111827;margin:0 0 16px;">Milestone ${data.milestone_number} Payment Required 💳</h2>
      <p style="color:#374151;margin:0 0 20px;">Hi <strong>${data.name}</strong>, the work on <strong>${data.milestone_title}</strong> is complete. Please review and release the payment of <strong style="color:#2563eb;">${data.amount}</strong>.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/homeowner/bookings/${data.booking_id}#milestones" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Approve & Pay Now</a>
    `, 'Milestone Payment Due'),
  }),

  booking_completed: (data) => ({
    to: data.email,
    subject: `Job Complete – ${data.booking_number} | HomeServe`,
    html: baseEmailLayout(`
      <h2 style="color:#111827;margin:0 0 16px;">Your service is complete! ✅</h2>
      <p style="color:#374151;margin:0 0 20px;">Hi <strong>${data.name}</strong>, booking <strong>${data.booking_number}</strong> has been marked as complete. We hope you're happy with the work!</p>
      <p style="color:#374151;margin:0 0 20px;">Please take a moment to rate your experience — it helps us keep improving.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/homeowner/bookings/${data.booking_id}#review" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Leave a Review</a>
    `, 'Booking Complete'),
  }),

  payment_received: (data) => ({
    to: data.email,
    subject: `Payment Confirmed – ₹${data.amount} | HomeServe`,
    html: baseEmailLayout(`
      <h2 style="color:#111827;margin:0 0 16px;">Payment Received ✅</h2>
      <p style="color:#374151;margin:0 0 20px;">Hi <strong>${data.name}</strong>, we've received your payment of <strong style="color:#16a34a;">₹${data.amount}</strong> for booking <strong>${data.booking_number}</strong>.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/homeowner/bookings/${data.booking_id}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">View Booking</a>
    `, 'Payment Confirmed'),
  }),

  payment_failed: (data) => ({
    to: data.email,
    subject: `Payment Unsuccessful – ₹${data.amount} | HomeServe`,
    html: baseEmailLayout(`
      <h2 style="color:#111827;margin:0 0 16px;">Payment unsuccessful</h2>
      <p style="color:#374151;margin:0 0 20px;">Hi <strong>${data.name}</strong>, your payment of <strong>₹${data.amount}</strong> for booking <strong>${data.booking_number}</strong> did not go through. No amount has been kept — you can safely try again.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/homeowner/payments" style="display:inline-block;background:#111111;color:#fff;padding:12px 24px;text-decoration:none;font-weight:600;">Retry payment</a>
    `, 'Payment Unsuccessful'),
  }),

  // Contractor notifications
  booking_assigned_contractor: (data) => ({
    to: data.email,
    subject: `New Job Assigned – ${data.booking_number} | HomeServe`,
    html: baseEmailLayout(`
      <h2 style="color:#111827;margin:0 0 16px;">You have a new job! 🔧</h2>
      <p style="color:#374151;margin:0 0 20px;">Hi <strong>${data.name}</strong>, you've been assigned to a new booking.</p>
      <table style="width:100%;border:1px solid #e5e7eb;border-radius:8px;border-collapse:collapse;margin:0 0 20px;">
        <tr style="background:#f9fafb;"><td style="padding:12px 16px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;width:40%;">Booking</td><td style="padding:12px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${data.booking_number}</td></tr>
        <tr><td style="padding:12px 16px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Service</td><td style="padding:12px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${data.service_name}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:12px 16px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Date & Time</td><td style="padding:12px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${data.scheduled_date} at ${data.scheduled_time}</td></tr>
        <tr><td style="padding:12px 16px;font-weight:600;color:#374151;">Address</td><td style="padding:12px 16px;color:#111827;">${data.address}</td></tr>
      </table>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/contractor/jobs/${data.booking_id}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">View Job Details</a>
    `, 'New Job Assigned'),
  }),
}

// ============================================================
// SMS TEMPLATES
// ============================================================

const SMS_TEMPLATES: Record<string, (data: Record<string, string>) => string> = {
  ...MAINTENANCE_SMS,
  booking_created: (d) => `HomeServe: Booking ${d.booking_number} confirmed for ${d.service_name} on ${d.scheduled_date}. Track: ${process.env.NEXT_PUBLIC_APP_URL}/homeowner/bookings/${d.booking_id}`,
  booking_assigned: (d) => `HomeServe: ${d.contractor_name} assigned to booking ${d.booking_number}. Arriving ${d.scheduled_date} at ${d.scheduled_time}. Track: ${process.env.NEXT_PUBLIC_APP_URL}/homeowner/bookings/${d.booking_id}`,
  milestone_payment_due: (d) => `HomeServe: Milestone ${d.milestone_number} complete. Payment of ${d.amount} due for booking ${d.booking_number}. Approve: ${process.env.NEXT_PUBLIC_APP_URL}/homeowner/bookings/${d.booking_id}`,
  booking_completed: (d) => `HomeServe: Booking ${d.booking_number} complete! Please rate your experience: ${process.env.NEXT_PUBLIC_APP_URL}/homeowner/bookings/${d.booking_id}`,
  payment_received: (d) => `HomeServe: Payment of Rs.${d.amount} received for booking ${d.booking_number}. Thank you!`,
  payment_failed: (d) => `HomeServe: Your payment of Rs.${d.amount} for booking ${d.booking_number} was unsuccessful. Please retry: ${process.env.NEXT_PUBLIC_APP_URL}/homeowner/payments`,
  booking_assigned_contractor: (d) => `HomeServe: New job ${d.booking_number} assigned to you. ${d.service_name} on ${d.scheduled_date}. View: ${process.env.NEXT_PUBLIC_APP_URL}/contractor/jobs/${d.booking_id}`,
}

// ============================================================
// CORE SEND FUNCTIONS
// ============================================================

async function sendEmail(payload: EmailPayload) {
  const { data, error } = await getResend().emails.send({
    from: `${process.env.RESEND_FROM_NAME ?? 'HomeServe'} <${process.env.RESEND_FROM_EMAIL ?? 'noreply@homeserve.ai'}>`,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  })
  if (error) throw new Error(`Resend error: ${error.message}`)
  return data?.id
}

/**
 * A plain, un-logged send for mail that doesn't fit the per-user `notification_logs` model — support
 * tickets can be anonymous (no user_id) or go to more than one admin recipient. Callers are expected to
 * catch/ignore failures themselves (best-effort, same spirit as every other notification here): a slow
 * or misconfigured mail provider must never fail the request that triggered it.
 */
export async function sendRawEmail(to: string | string[], subject: string, html: string): Promise<void> {
  if (!channelConfigured('email')) { console.info('[notifications] email skipped (not configured):', subject); return }
  const { error } = await getResend().emails.send({
    from: `${process.env.RESEND_FROM_NAME ?? 'HomeServe'} <${process.env.RESEND_FROM_EMAIL ?? 'noreply@homeserve.ai'}>`,
    to, subject, html,
  })
  if (error) console.error('[notifications] sendRawEmail failed:', error.message)
}

async function sendSMS(to: string, message: string) {
  const client = getTwilioClient()
  if (!client) throw new Error('Twilio not configured')
  const msg = await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: `+91${to.replace(/^\+91/, '')}`, // normalise Indian number
  })
  return msg.sid
}

async function sendWhatsApp(to: string, message: string) {
  const client = getTwilioClient()
  if (!client) throw new Error('Twilio not configured')
  const msg = await client.messages.create({
    body: message,
    from: process.env.TWILIO_WHATSAPP_NUMBER,
    to: `whatsapp:+91${to.replace(/^\+91/, '')}`,
  })
  return msg.sid
}

// ============================================================
// PUBLIC API
// ============================================================

interface SendNotificationParams {
  event: NotificationEvent
  userId: string
  bookingId?: string
  /** Non-booking subject (maintenance request, membership …) recorded on the log row. */
  reference?: { type: 'maintenance_request' | 'membership' | 'project'; id: string }
  data: Record<string, string>
  channels: Array<'email' | 'sms' | 'whatsapp'>
  email?: string
  phone?: string
}

export async function sendNotification(params: SendNotificationParams) {
  const supabase = createAdminClient()
  const results: Array<{ channel: string; status: 'sent' | 'failed'; error?: string; providerId?: string }> = []

  for (const channel of params.channels) {
    if (!channelConfigured(channel)) {
      console.info(`[notifications] ${channel} skipped for ${params.event}: provider not configured`)
      continue
    }
    let status: 'sent' | 'failed' = 'failed'
    let providerId: string | undefined
    let error: string | undefined

    try {
      if (channel === 'email' && params.email) {
        const templateKey = params.event === 'booking_assigned' && params.data.role === 'contractor'
          ? 'booking_assigned_contractor'
          : params.event

        const template = EMAIL_TEMPLATES[templateKey]
        if (template) {
          providerId = await sendEmail(template({ ...params.data, email: params.email })) ?? undefined
          status = 'sent'
        }
      }

      if (channel === 'sms' && params.phone) {
        const templateFn = SMS_TEMPLATES[params.event]
        if (templateFn) {
          providerId = await sendSMS(params.phone, templateFn(params.data))
          status = 'sent'
        }
      }

      if (channel === 'whatsapp' && params.phone) {
        const templateFn = SMS_TEMPLATES[params.event]
        if (templateFn) {
          providerId = await sendWhatsApp(params.phone, templateFn(params.data))
          status = 'sent'
        }
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[notifications] ${channel} failed for ${params.event}:`, error)
    }

    // Log to database
    await supabase.from('notification_logs').insert({
      user_id: params.userId,
      booking_id: params.bookingId ?? null,
      reference_type: params.reference?.type ?? null,
      reference_id: params.reference?.id ?? null,
      event: params.event,
      channel,
      recipient: channel === 'email' ? (params.email ?? '') : (params.phone ?? ''),
      status,
      provider_id: providerId ?? null,
      error: error ?? null,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
    })

    results.push({ channel, status, error, providerId })
  }

  return results
}
