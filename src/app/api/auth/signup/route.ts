import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendRawEmail } from '@/lib/notifications'
import { baseEmailLayout } from '@/lib/notifications/email-layout'

// POST /api/auth/signup — creates the homeowner account and emails the confirmation link
// ourselves via Resend, instead of Supabase's own (rate-limited, unbranded) mailer.
//
// Uses the admin API's generateLink(type: 'signup'), which creates the user exactly like
// supabase.auth.signUp() but — unlike signUp() — does not send an email itself; it just
// returns the confirmation link for us to deliver.
//
// This route is ONLY for the initial account-creation submit, never for "resend" (see
// api/auth/signup/resend): generateLink(type:'signup') against an email that already has
// an unconfirmed account silently applies whatever password is passed here as that
// account's password. That's fine for this route, since the caller is the person actively
// filling in the signup form with both fields at once — but it would let anyone who merely
// knows a pending account's email address overwrite its password if this endpoint also
// answered "resend" requests, which carry no proof the caller knows the current one.
const bodySchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), z.string().regex(/^[6-9]\d{9}$/).optional()),
  password: z.string().min(8).max(200),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 })
  }
  const { fullName, email, phone, password } = parsed.data

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'signup',
    email,
    password,
    options: {
      data: { full_name: fullName, phone: phone ?? undefined },
      redirectTo: `${req.nextUrl.origin}/auth/callback`,
    },
  })

  if (error) {
    // Only a genuinely already-confirmed account reaches here as an error — generateLink
    // regenerates the link (instead of erroring) for an existing-but-unconfirmed one, which
    // is fine: this route only ever runs for a fresh form submit, so re-applying the same
    // password the visitor just typed is a no-op, not a mutation of someone else's account.
    const isExisting = /already|registered|exists/i.test(error.message)
    return NextResponse.json(
      { error: isExisting ? 'An account with this email already exists. Try signing in.' : 'Sign up failed. Please try again.' },
      { status: isExisting ? 409 : 400 },
    )
  }

  const link = data.properties?.action_link
  if (!link) {
    console.error('[auth/signup] generateLink returned no action_link')
    return NextResponse.json({ error: 'Sign up failed. Please try again.' }, { status: 500 })
  }

  await sendRawEmail(email, 'Confirm your HomeServe account', baseEmailLayout(`
    <h2 style="color:#111827;margin:0 0 16px;">Confirm your email to get started 👋</h2>
    <p style="color:#374151;margin:0 0 8px;">Hi <strong>${fullName}</strong>,</p>
    <p style="color:#374151;margin:0 0 20px;">Click below to confirm your email and activate your HomeServe account.</p>
    <a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Confirm my email</a>
    <p style="color:#9ca3af;font-size:12px;margin:20px 0 0;">If you didn't create a HomeServe account, you can safely ignore this email.</p>
  `, 'Confirm your account'))

  return NextResponse.json({ success: true })
}
