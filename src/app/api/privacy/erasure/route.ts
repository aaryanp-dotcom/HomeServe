import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const requestSchema = z.object({
  reason: z.string().trim().max(1000).optional(),
})

/**
 * POST /api/privacy/erasure
 *
 * Authenticated customer requests deletion of their account and personal data.
 *
 * Requirements:
 *   • User must be authenticated (session verified server-side)
 *   • One active erasure request per user at a time
 *   • Request is recorded; actual deletion happens only after admin review and approval
 *
 * The workflow is intentionally admin-controlled (not fully automated) because:
 *   1. Some records must be retained for legal/accounting reasons
 *   2. Active projects/open disputes must be resolved before erasure
 *   3. Identity must be verified (prevents account enumeration attacks)
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Get the user's profile for their name
  const { data: profile } = await admin
    .from('user_profiles')
    .select('full_name')
    .eq('user_id', user.id)
    .single()

  // Check for an existing active request
  const { data: existing } = await admin
    .from('erasure_requests')
    .select('id, request_number, status, created_at')
    .eq('user_id', user.id)
    .in('status', ['pending', 'in_review', 'approved', 'executing'])
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      {
        error: 'You already have an active erasure request.',
        existing: { request_number: existing.request_number, status: existing.status },
      },
      { status: 409 },
    )
  }

  const { data, error } = await admin
    .from('erasure_requests')
    .insert({
      user_id:          user.id,
      email_at_request: user.email ?? 'unknown',
      name_at_request:  profile?.full_name ?? 'Unknown',
      customer_notes:   parsed.data.reason ?? null,
      status:           'pending',
    })
    .select('id, request_number, status, created_at')
    .single()

  if (error || !data) {
    console.error('[privacy/erasure] insert', error?.code, error?.hint)
    return NextResponse.json({ error: 'Could not record your request. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: 'Your erasure request has been received. We will review it within 30 days.',
    request_number: data.request_number,
    status: data.status,
  }, { status: 201 })
}

/**
 * GET /api/privacy/erasure
 *
 * Returns the authenticated user's erasure requests.
 */
export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('erasure_requests')
    .select('id, request_number, status, created_at, completed_at, rejection_reason')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Could not load requests' }, { status: 500 })
  return NextResponse.json({ requests: data ?? [] })
}
