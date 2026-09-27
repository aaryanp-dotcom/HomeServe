import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendRawEmail } from '@/lib/notifications'
import { baseEmailLayout } from '@/lib/notifications/email-layout'

// POST /api/auth/signup/resend — re-sends a fresh 6-digit confirmation code via Resend, for
// the "Resend the code" button on the signup page and the "Resend the code" link the login
// page shows after a sign-in fails because the account isn't confirmed yet.
//
// Uses the SAME generateLink(type: 'signup') as the initial signup route — deliberately not
// 'magiclink', so an existing pending signup keeps behaving as a signup, not a separate
// magic-link grant. This does NOT need to match the type passed to verifyOtp() on the client:
// per Supabase's current docs, a 6-digit email OTP is always verified with type:'email',
// whichever generateLink type produced it — 'signup'/'magiclink' are deprecated verifyOtp
// types kept only for the old link-based flow.
//
// Deliberately omits `password`: the installed @supabase/auth-js types mark it required for
// type:'signup', but generateLink() only forwards whatever fields it's given to Supabase's
// API (no client-side check) — leaving it out sends no password field at all, rather than a
// fabricated one that would silently overwrite the account's real password. Resend must
// never be able to change the password of an account it doesn't prove ownership of; only
// the initial /api/auth/signup submit (which collects the real password from the form) may
// do that.
//
// It's public and unauthenticated by design, same as "forgot password" elsewhere in the
// app — the code is only ever usable by whoever controls that inbox, regardless of who
// triggered the request — and always answers success either way (except a rate limit, which
// applies uniformly and reveals nothing about whether the account exists) so the response
// shape can't be used to enumerate which emails have an account.
const bodySchema = z.object({ email: z.string().trim().email().max(200) })

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
  const { email } = parsed.data

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'signup',
    email,
    // See the file comment: intentionally no `password` field, hence the cast.
  } as unknown as Parameters<typeof admin.auth.admin.generateLink>[0])

  if (error && /security purposes|rate limit|too many requests/i.test(error.message)) {
    return NextResponse.json({ error: 'Please wait a moment before requesting another code.' }, { status: 429 })
  }

  const code = data?.properties?.email_otp
  if (!error && code) {
    await sendRawEmail(email, `${code} is your HomeServe confirmation code`, baseEmailLayout(`
      <h2 style="color:#111827;margin:0 0 16px;">Confirm your email to get started 👋</h2>
      <p style="color:#374151;margin:0 0 20px;">Enter this code to confirm your email and activate your HomeServe account:</p>
      <p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#111827;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 0;text-align:center;margin:0 0 20px;">${code}</p>
      <p style="color:#6b7280;font-size:13px;margin:0 0 20px;">This code expires shortly — if it's stopped working, request a new one.</p>
      <p style="color:#9ca3af;font-size:12px;margin:0;">If you didn't request this, you can safely ignore this email.</p>
    `, 'Confirm your account'))
  }

  return NextResponse.json({ success: true })
}
