import { createAdminClient } from '@/lib/supabase/admin'
import { sendRawEmail } from '@/lib/notifications'
import { baseEmailLayout } from '@/lib/notifications/email-layout'
import type { ContractorApplication } from './types'

/** All best-effort — a mail failure here never fails the application/review action that triggered it. */

export async function notifyAdminsOfNewApplication(app: ContractorApplication) {
  const admin = createAdminClient()
  const { data: admins } = await admin.from('user_profiles').select('email').eq('role', 'admin')
  const to = (admins ?? []).map((a) => a.email).filter((e): e is string => !!e)
  if (to.length === 0) return
  await sendRawEmail(to, `New contractor application — ${app.full_name}`, baseEmailLayout(`
    <h2 style="color:#111827;margin:0 0 16px;">New technician application</h2>
    <table style="width:100%;border:1px solid #e5e7eb;border-radius:8px;border-collapse:collapse;margin:0 0 20px;">
      <tr style="background:#f9fafb;"><td style="padding:12px 16px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;width:35%;">Name</td><td style="padding:12px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${app.full_name}</td></tr>
      <tr><td style="padding:12px 16px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Contact</td><td style="padding:12px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${app.email ? `${app.email} · ` : ''}${app.phone}</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:12px 16px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;">Experience</td><td style="padding:12px 16px;color:#111827;border-bottom:1px solid #e5e7eb;">${app.experience_years} years${app.city ? ` · ${app.city}` : ''}</td></tr>
      <tr><td style="padding:12px 16px;font-weight:600;color:#374151;">Specialisations</td><td style="padding:12px 16px;color:#111827;">${app.specializations.join(', ')}</td></tr>
    </table>
    ${app.message ? `<p style="color:#374151;white-space:pre-line;margin:0 0 20px;">${app.message}</p>` : ''}
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/contractor-applications" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Review application</a>
  `, 'New technician application'))
}

export async function notifyApplicantReceived(app: ContractorApplication & { email: string }) {
  await sendRawEmail(app.email, `We received your application — HomeServe`, baseEmailLayout(`
    <h2 style="color:#111827;margin:0 0 16px;">Thanks for applying</h2>
    <p style="color:#374151;margin:0 0 8px;">Hi <strong>${app.full_name}</strong>,</p>
    <p style="color:#374151;margin:0 0 20px;">We've received your application to join the HomeServe site team. Our team will review it and get back to you.</p>
  `, 'Application received'))
}

export async function notifyApplicantRejected(app: ContractorApplication & { email: string }, reason: string) {
  await sendRawEmail(app.email, `Update on your HomeServe application`, baseEmailLayout(`
    <h2 style="color:#111827;margin:0 0 16px;">About your application</h2>
    <p style="color:#374151;margin:0 0 8px;">Hi <strong>${app.full_name}</strong>,</p>
    <p style="color:#374151;margin:0 0 16px;">Thanks for your interest in joining HomeServe. We're not able to move forward with your application right now.</p>
    <p style="color:#374151;margin:0;">${reason}</p>
  `, 'About your application'))
}
