import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/api-auth'
import { z } from 'zod'

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve'), admin_notes: z.string().trim().max(1000).optional() }),
  z.object({ action: z.literal('reject'), rejection_reason: z.string().trim().min(1).max(500) }),
  z.object({ action: z.literal('execute') }),
])

/**
 * POST /api/admin/erasure?id=xxx
 *
 * Admin controls the erasure workflow:
 *   action=approve → moves request to 'approved' status
 *   action=reject  → rejects the request
 *   action=execute → runs the actual data erasure (requires 'approved' status)
 *
 * The execute action:
 *   1. Calls the execute_erasure() SQL function (anonymises/deletes personal data)
 *   2. Removes storage objects (avatars, project photos, maintenance media)
 *   3. Deletes the auth.users record last (cascades profile deletion)
 *   4. Records everything in erasure_audit_log
 *
 * Authorization: Admin + MFA required.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response
  const { userId: adminId, admin } = auth

  const { searchParams } = new URL(req.url)
  const requestId = searchParams.get('id')
  if (!requestId) return NextResponse.json({ error: 'id query parameter required' }, { status: 400 })

  const body = await req.json().catch(() => null)
  const parsed = actionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid action' }, { status: 400 })
  }
  const act = parsed.data

  // Load the request
  const { data: erasureReq } = await admin
    .from('erasure_requests')
    .select('id, user_id, status, email_at_request, name_at_request')
    .eq('id', requestId)
    .maybeSingle()

  if (!erasureReq) return NextResponse.json({ error: 'Erasure request not found' }, { status: 404 })

  // ── Approve ─────────────────────────────────────────────────────────────────
  if (act.action === 'approve') {
    if (!['pending', 'in_review'].includes(erasureReq.status)) {
      return NextResponse.json({ error: `Cannot approve a request with status '${erasureReq.status}'` }, { status: 409 })
    }
    await admin.from('erasure_requests').update({
      status:       'approved',
      admin_notes:  act.admin_notes ?? null,
      reviewed_at:  new Date().toISOString(),
      reviewed_by:  adminId,
      approved_at:  new Date().toISOString(),
      approved_by:  adminId,
    }).eq('id', requestId)

    await admin.from('erasure_audit_log').insert({
      request_id: requestId,
      actor_id:   adminId,
      action:     'approved',
      details:    { admin_notes: act.admin_notes ?? null },
    })

    return NextResponse.json({ ok: true, status: 'approved' })
  }

  // ── Reject ──────────────────────────────────────────────────────────────────
  if (act.action === 'reject') {
    if (!['pending', 'in_review'].includes(erasureReq.status)) {
      return NextResponse.json({ error: `Cannot reject a request with status '${erasureReq.status}'` }, { status: 409 })
    }
    await admin.from('erasure_requests').update({
      status:           'rejected',
      rejection_reason: act.rejection_reason,
      reviewed_at:      new Date().toISOString(),
      reviewed_by:      adminId,
    }).eq('id', requestId)

    await admin.from('erasure_audit_log').insert({
      request_id: requestId,
      actor_id:   adminId,
      action:     'rejected',
      details:    { reason: act.rejection_reason },
    })

    return NextResponse.json({ ok: true, status: 'rejected' })
  }

  // ── Execute ──────────────────────────────────────────────────────────────────
  if (act.action === 'execute') {
    if (erasureReq.status !== 'approved') {
      return NextResponse.json({ error: `Cannot execute a request with status '${erasureReq.status}'. Approve it first.` }, { status: 409 })
    }

    const userId = erasureReq.user_id

    try {
      // 1. Run the SQL erasure function (anonymise/delete personal data in DB)
      const { data: summary, error: fnErr } = await admin.rpc('execute_erasure', {
        p_request_id: requestId,
        p_actor:      adminId,
      })

      if (fnErr) {
        console.error('[admin/erasure] execute_erasure RPC', fnErr.message)
        return NextResponse.json({ error: `Erasure failed: ${fnErr.message}` }, { status: 500 })
      }

      // 2. Delete storage objects: avatars/{userId}/…
      const { data: avatarObjects } = await admin.storage
        .from('avatars')
        .list(userId)
      if (avatarObjects?.length) {
        const paths = avatarObjects.map((o) => `${userId}/${o.name}`)
        await admin.storage.from('avatars').remove(paths)
      }

      // 3. Delete project-media objects for all bookings of this user
      //    (maintenance-media is deleted via CASCADE on maintenance_request_media)
      const { data: bookings } = await admin
        .from('bookings')
        .select('id')
        .eq('homeowner_id', userId)
      if (bookings?.length) {
        for (const booking of bookings) {
          const { data: mediaObjects } = await admin.storage
            .from('project-media')
            .list(booking.id)
          if (mediaObjects?.length) {
            const paths = mediaObjects.map((o) => `${booking.id}/${o.name}`)
            await admin.storage.from('project-media').remove(paths)
          }
        }
      }

      // 4. Delete maintenance-media for this user's requests
      const { data: mReqs } = await admin
        .from('maintenance_requests')
        .select('id')
        .eq('user_id', userId)
      if (mReqs?.length) {
        for (const r of mReqs) {
          const { data: mediaObjects } = await admin.storage
            .from('maintenance-media')
            .list(r.id)
          if (mediaObjects?.length) {
            const paths = mediaObjects.map((o) => `${r.id}/${o.name}`)
            await admin.storage.from('maintenance-media').remove(paths)
          }
        }
      }

      // 5. Delete auth.users record LAST (cascades to any remaining FK rows)
      await admin.auth.admin.deleteUser(userId)

      await admin.from('erasure_audit_log').insert({
        request_id: requestId,
        actor_id:   adminId,
        action:     'auth_user_deleted',
        details:    { user_id: userId },
      })

      return NextResponse.json({ ok: true, status: 'completed', summary })

    } catch (err) {
      console.error('[admin/erasure] execute', err instanceof Error ? err.message : 'unknown')
      return NextResponse.json({ error: 'Erasure execution failed. Check server logs.' }, { status: 500 })
    }
  }
}

/**
 * GET /api/admin/erasure
 * List all erasure requests with their status.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response
  const { admin } = auth

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let query = admin
    .from('erasure_requests')
    .select('id, request_number, user_id, email_at_request, name_at_request, status, created_at, completed_at, customer_notes, admin_notes')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Could not load requests' }, { status: 500 })
  return NextResponse.json({ requests: data ?? [] })
}
