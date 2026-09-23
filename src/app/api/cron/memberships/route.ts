import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyCustomer } from '@/lib/maintenance/notify'
import { MEMBERSHIP_BILLING } from '@/lib/maintenance/config'
import { fmtDate } from '@/lib/maintenance/format'

/**
 * GET /api/cron/memberships — daily job (see vercel.json).
 *   1. rolls terms: active → expired when the end date passes; a paid renewal becomes active
 *   2. sends the renewal reminder and the final expiry notice, once each
 * Protected by CRON_SECRET (Vercel sends it as a Bearer token). Idempotent: reminder rows are
 * stamped, so a re-run or a retry sends nothing twice.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const admin = createAdminClient()

  const { data: rolled, error: rollErr } = await admin.rpc('roll_memberships')
  if (rollErr) {
    console.error('[cron/memberships] roll', rollErr.code, rollErr.hint)
    return NextResponse.json({ error: 'Rollover failed' }, { status: 500 })
  }

  const addDays = (n: number) => {
    const d = new Date(); d.setDate(d.getDate() + n)
    return d.toISOString().slice(0, 10)
  }
  const today = new Date().toISOString().slice(0, 10)

  let reminders = 0
  let notices = 0

  const send = async (kind: 'renewal' | 'expiry') => {
    const horizon = addDays(kind === 'renewal' ? MEMBERSHIP_BILLING.reminderDaysBefore : MEMBERSHIP_BILLING.expiryNoticeDaysBefore)
    const col = kind === 'renewal' ? 'renewal_reminder_sent_at' : 'expiry_notice_sent_at'
    const { data: subs } = await admin
      .from('maintenance_subscriptions')
      .select('id, user_id, property_id, end_date, plan_snapshot')
      .eq('status', 'active').eq('cancel_at_period_end', false)
      .gt('end_date', today).lte('end_date', horizon)
      .is(col, null)
    for (const s of subs ?? []) {
      // Already renewed (a paid, upcoming term exists): nothing to remind about; just mark it handled.
      const { data: renewed } = await admin.from('maintenance_subscriptions').select('id')
        .eq('property_id', s.property_id).eq('status', 'upcoming').maybeSingle()
      if (renewed) {
        await admin.from('maintenance_subscriptions').update({ [col]: new Date().toISOString() }).eq('id', s.id)
        continue
      }
      // Stamp first: a crash after sending must not cause a duplicate on the next run.
      const { data: claimed } = await admin.from('maintenance_subscriptions').update({ [col]: new Date().toISOString() })
        .eq('id', s.id).is(col, null).select('id').maybeSingle()
      if (!claimed) continue
      await notifyCustomer(admin, s.user_id, kind === 'renewal' ? 'membership_renewal_reminder' : 'membership_expiry_notice', {
        plan_name: (s.plan_snapshot as { name?: string })?.name ?? 'Membership',
        end_date: fmtDate(s.end_date),
      }, { reference: { type: 'membership', id: s.id } })
      if (kind === 'renewal') reminders++; else notices++
    }
  }
  await send('renewal')
  await send('expiry')

  return NextResponse.json({ ok: true, ...(rolled as object), reminders, notices })
}
