import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createApplicationSchema } from '@/lib/contractor-applications/schemas'
import { notifyAdminsOfNewApplication, notifyApplicantReceived } from '@/lib/contractor-applications/notify'
import type { ContractorApplication } from '@/lib/contractor-applications/types'

/**
 * POST /api/contractor-applications — public "join our team" form. Anonymous visitors have no
 * RLS access to this table (see 030_contractor_applications.sql), so the row is written with the
 * service-role client after validation. This only ever creates a pending application row — never
 * an auth account, never a role. Only an admin approving it (see
 * /api/admin/contractor-applications/[id]) can do that.
 */
export async function POST(req: NextRequest) {
  const parsed = createApplicationSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request', issues: parsed.error.issues }, { status: 400 })
  }
  if (parsed.data.honeypot) return NextResponse.json({ ok: true }) // silently pretend to succeed

  const { fullName, email, phone, city, experienceYears, specializations, message } = parsed.data
  const admin = createAdminClient()

  const { data: app, error } = await admin.from('contractor_applications').insert({
    full_name: fullName, email: email ?? null, phone, city: city ?? null,
    experience_years: experienceYears, specializations, message: message ?? null,
  }).select('*').single()

  if (error || !app) {
    console.error('[contractor-applications] insert', error?.code, error?.hint)
    return NextResponse.json({ error: 'Could not submit your application. Please try again.' }, { status: 500 })
  }

  const row = app as ContractorApplication
  void notifyAdminsOfNewApplication(row)
  if (row.email) void notifyApplicantReceived({ ...row, email: row.email })

  return NextResponse.json({ ok: true, id: app.id })
}
