import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/api-auth'
import { logAdmin } from '@/lib/maintenance/audit'
import { reviewApplicationSchema } from '@/lib/contractor-applications/schemas'
import { notifyApplicantRejected } from '@/lib/contractor-applications/notify'

/**
 * POST /api/admin/contractor-applications/:id — the only place a contractor application can turn
 * into an actual account. Applying never assigns anything by itself (see the public route and
 * 030_contractor_applications.sql) — this is the manual admin step.
 *
 * action=approve:
 *   1. Looks for an existing account by email (user_profiles.email) — someone may have applied
 *      after already registering as a homeowner.
 *   2. If none exists, creates one with the admin-supplied temporary password (email_confirm: true,
 *      so there's no dependency on outbound confirmation mail actually arriving — deliberately
 *      independent of Supabase's email pipeline, which this app has had trouble with). If an
 *      account already exists, its password is left untouched; only the role changes.
 *   3. Sets user_profiles.role = 'contractor' via the service-role client — the only context the
 *      guard trigger (migration 018) allows a role to actually change in.
 *   4. Upserts contractor_profiles from what the applicant gave us (specializations, experience,
 *      city, their message as an initial bio), is_verified: true, contractor_type: 'employed'.
 *   5. Marks the application approved and logs the action to admin_audit_log.
 *
 * action=reject: marks the application rejected with a reason, notifies the applicant, touches
 * no account.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response
  const { userId: adminId, admin } = auth

  const parsed = reviewApplicationSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 })
  const act = parsed.data

  const { data: application } = await admin.from('contractor_applications').select('*').eq('id', params.id).maybeSingle()
  if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  if (application.status !== 'pending') {
    return NextResponse.json({ error: `This application is already ${application.status}.` }, { status: 409 })
  }

  if (act.action === 'reject') {
    await admin.from('contractor_applications').update({
      status: 'rejected', rejection_reason: act.rejectionReason,
      reviewed_by: adminId, reviewed_at: new Date().toISOString(),
    }).eq('id', application.id)

    await logAdmin(admin, adminId, {
      action: 'contractor_application.reject', entity_type: 'contractor_application', entity_id: application.id,
      summary: `Rejected application from ${application.full_name}`, details: { reason: act.rejectionReason },
    })

    if (application.email) void notifyApplicantRejected({ ...application, email: application.email }, act.rejectionReason)
    return NextResponse.json({ ok: true, status: 'rejected' })
  }

  // ── Approve ──────────────────────────────────────────────────────────────────
  // The application's own email is optional (phone is the primary contact — see the
  // migration), but a login account needs one either way. Fall back to whatever the admin
  // supplied in the approval form; if there's genuinely neither, this can't proceed.
  const accountEmail = application.email ?? act.email
  if (!accountEmail) {
    return NextResponse.json({ error: 'This application has no email on file — enter one to create the account.' }, { status: 400 })
  }

  const { data: existingProfile } = application.email
    ? await admin.from('user_profiles').select('user_id').ilike('email', application.email).maybeSingle()
    : { data: null }

  let userId: string
  let createdNewAccount = false

  if (existingProfile) {
    userId = existingProfile.user_id
  } else {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: accountEmail,
      password: act.temporaryPassword,
      email_confirm: true,
      user_metadata: { full_name: application.full_name },
    })
    if (createErr || !created.user) {
      console.error('[admin/contractor-applications] createUser', createErr?.message)
      return NextResponse.json({ error: createErr?.message ?? 'Could not create the account' }, { status: 500 })
    }
    userId = created.user.id
    createdNewAccount = true
  }

  const { error: roleErr } = await admin.from('user_profiles').update({ role: 'contractor' }).eq('user_id', userId)
  if (roleErr) {
    console.error('[admin/contractor-applications] role update', roleErr.code, roleErr.hint)
    return NextResponse.json({ error: 'Account exists but the role could not be set. Try again.' }, { status: 500 })
  }

  const { error: profileErr } = await admin.from('contractor_profiles').upsert({
    user_id: userId,
    specializations: application.specializations,
    experience_years: application.experience_years,
    bio: application.message,
    city: application.city,
    is_verified: true,
    contractor_type: 'employed',
  }, { onConflict: 'user_id' })
  if (profileErr) {
    console.error('[admin/contractor-applications] contractor_profiles upsert', profileErr.code, profileErr.hint)
    return NextResponse.json({ error: 'Role was set, but the contractor profile could not be saved.' }, { status: 500 })
  }

  await admin.from('contractor_applications').update({
    status: 'approved', admin_notes: act.adminNotes ?? null,
    reviewed_by: adminId, reviewed_at: new Date().toISOString(), approved_user_id: userId,
  }).eq('id', application.id)

  await logAdmin(admin, adminId, {
    action: 'contractor_application.approve', entity_type: 'contractor_application', entity_id: application.id,
    summary: `Approved ${application.full_name} as a contractor${createdNewAccount ? ' (new account)' : ' (existing account promoted)'}`,
    details: { user_id: userId, created_new_account: createdNewAccount },
  })

  return NextResponse.json({
    ok: true, status: 'approved', userId, createdNewAccount,
    // accountEmail may differ from the application's own email field — it's whatever the
    // account was actually created with, including an admin-supplied override.
    accountEmail,
    // Only meaningful when createdNewAccount is true — the admin UI shows this exactly once so
    // it can be relayed to the contractor directly; it is never stored anywhere and this response
    // is the only place it appears.
    temporaryPassword: createdNewAccount ? act.temporaryPassword : null,
  })
}
