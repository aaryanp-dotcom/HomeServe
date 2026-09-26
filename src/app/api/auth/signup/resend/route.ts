import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendRawEmail } from '@/lib/notifications'
import { baseEmailLayout } from '@/lib/notifications/email-layout'

// POST /api/auth/signup/resend — re-sends a fresh 6-digit confirmation code via Resend, for
// the "Resend the code" button on the signup page and the "Resend the code" link the login
// page shows after a sign-in fails because the account isn't confirmed yet.
//
// Deliberately password-free: it uses a magiclink grant rather than /api/auth/signup's
// signup-type one, so it never touches the account's stored password (see that route's
// comment for why that matters). The magiclink grant's email_otp is verified the same way
// as the signup one — supabase.auth.verifyOtp({ type: 'email' }) — since Supabase treats
// both as plain email OTPs once generated (verifying with 'signup' one only accepted for a
// still-pending signup; 'email' covers both cases uniformly, so the client doesn't need to
// track which flow produced the currently-displayed code).
//
// It's public and unauthenticated by design, same as "forgot password" elsewhere in the
// app — the code is only ever usable by whoever controls that inbox, regardless of who
// triggered the request — and always answers success either way so the response shape
// can't be used to enumerate which emails have an account.
const bodySchema = z.object({ email: z.string().trim().email().max(200) })

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
  const { email } = parsed.data

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${req.nextUrl.origin}/auth/callback` },
  })

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
