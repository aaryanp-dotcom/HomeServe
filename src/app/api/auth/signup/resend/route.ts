import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendRawEmail } from '@/lib/notifications'
import { baseEmailLayout } from '@/lib/notifications/email-layout'

// POST /api/auth/signup/resend — re-sends the confirmation link via Resend, for the "Resend
// the email" button on the signup page and the "Resend the email" link the login page shows
// after a sign-in fails because the account isn't confirmed yet.
//
// Deliberately password-free: it uses a magiclink grant rather than /api/auth/signup's
// signup-type one, so it never touches the account's stored password (see that route's
// comment for why that matters). Clicking a magic link both confirms the email and signs
// the owner in. It's public and unauthenticated by design, same as "forgot password"
// elsewhere in the app — the link is only ever usable by whoever controls that inbox,
// regardless of who triggered the request — and always answers success either way so the
// response shape can't be used to enumerate which emails have an account.
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

  if (!error && data.properties?.action_link) {
    await sendRawEmail(email, 'Confirm your HomeServe account', baseEmailLayout(`
      <h2 style="color:#111827;margin:0 0 16px;">Confirm your email to get started 👋</h2>
      <p style="color:#374151;margin:0 0 20px;">Click below to confirm your email and activate your HomeServe account.</p>
      <a href="${data.properties.action_link}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Confirm my email</a>
      <p style="color:#9ca3af;font-size:12px;margin:20px 0 0;">If you didn't request this, you can safely ignore this email.</p>
    `, 'Confirm your account'))
  }

  return NextResponse.json({ success: true })
}
