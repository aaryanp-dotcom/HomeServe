import type { SupabaseClient } from '@supabase/supabase-js'
import { sendNotification } from '@/lib/notifications'
import { formatCurrency } from '@/lib/utils'

/** Shape returned by the settle_payment / fail_payment / refund_payment SQL functions. */
export interface SettleResult {
  ok: boolean
  error?: string
  already_settled?: boolean
  already_refunded?: boolean
  ignored?: boolean
  booking_id?: string
  homeowner_id?: string
  booking_number?: string
  amount?: number
  booking_status?: string
  paid_amount?: number
}

async function rpc(admin: SupabaseClient, fn: string, args: Record<string, unknown>): Promise<SettleResult> {
  const { data, error } = await admin.rpc(fn, args)
  if (error) throw new Error(`${fn}: ${error.message}`)
  return data as SettleResult
}

export const settlePayment = (admin: SupabaseClient, orderId: string, paymentId: string, signature?: string, payload?: unknown) =>
  rpc(admin, 'settle_payment', { p_order_id: orderId, p_payment_id: paymentId, p_signature: signature ?? null, p_payload: payload ?? null })

export const failPayment = (admin: SupabaseClient, orderId: string, payload?: unknown) =>
  rpc(admin, 'fail_payment', { p_order_id: orderId, p_payload: payload ?? null })

export const refundPayment = (admin: SupabaseClient, paymentId: string, payload?: unknown) =>
  rpc(admin, 'refund_payment', { p_payment_id: paymentId, p_payload: payload ?? null })

/** Look up the homeowner's contact details and send the matching notification. Never throws. */
export async function notifyHomeowner(
  admin: SupabaseClient,
  r: SettleResult,
  event: 'payment_received' | 'payment_failed',
) {
  try {
    if (!r.homeowner_id) return
    const [{ data: profile }, { data: authUser }] = await Promise.all([
      admin.from('user_profiles').select('full_name, phone').eq('user_id', r.homeowner_id).single(),
      admin.auth.admin.getUserById(r.homeowner_id),
    ])
    const email = authUser?.user?.email ?? ''
    await sendNotification({
      event,
      userId: r.homeowner_id,
      bookingId: r.booking_id,
      data: {
        name: profile?.full_name ?? 'Customer',
        email,
        booking_number: r.booking_number ?? '',
        booking_id: r.booking_id ?? '',
        amount: formatCurrency(r.amount ?? 0),
      },
      channels: ['email', 'sms'],
      email,
      phone: profile?.phone ?? '',
    })
  } catch (err) {
    console.error('[payments] notification failed', err instanceof Error ? err.message : 'unknown')
  }
}
