import type { SupabaseClient } from '@supabase/supabase-js'
import { createRazorpayOrder } from '@/lib/razorpay'
import { rupees, fmtDate } from './format'
import { notifyCustomer } from './notify'

/**
 * Maintenance payments reuse the SAME Razorpay client, signature verification and
 * webhook endpoint as renovation payments. Only the ledger differs
 * (maintenance_payments + the *_maintenance_payment SQL functions), so the milestone
 * flow is untouched. Recurring auto-debit is not used: memberships are one-time orders.
 */

export interface MaintenanceSettleResult {
  ok: boolean
  error?: string
  already_settled?: boolean
  already_refunded?: boolean
  ignored?: boolean
  kind?: 'membership' | 'request_charge'
  user_id?: string
  subscription_id?: string
  request_id?: string
  amount?: number
  plan_name?: string
  start_date?: string
  end_date?: string
  status?: string
}

async function rpc(admin: SupabaseClient, fn: string, args: Record<string, unknown>): Promise<MaintenanceSettleResult> {
  const { data, error } = await admin.rpc(fn, args)
  if (error) throw new Error(`${fn}: ${error.message}`)
  return data as MaintenanceSettleResult
}

export const settleMaintenancePayment = (admin: SupabaseClient, orderId: string, paymentId: string | null, signature?: string, payload?: unknown) =>
  rpc(admin, 'settle_maintenance_payment', { p_order_id: orderId, p_payment_id: paymentId, p_signature: signature ?? null, p_payload: payload ?? null })

export const failMaintenancePayment = (admin: SupabaseClient, orderId: string, payload?: unknown) =>
  rpc(admin, 'fail_maintenance_payment', { p_order_id: orderId, p_payload: payload ?? null })

/** Webhook path: matches Razorpay payments by their Razorpay payment id. */
export const refundMaintenancePayment = (admin: SupabaseClient, paymentId: string, payload?: unknown) =>
  rpc(admin, 'refund_maintenance_payment', { p_payment_id: paymentId, p_payload: payload ?? null })

/** Admin path: the order id is unique on every ledger row (online and offline), so it is never ambiguous. */
export const refundMaintenancePaymentByOrder = (admin: SupabaseClient, orderId: string, payload?: unknown) =>
  rpc(admin, 'refund_maintenance_payment_by_order', { p_order_id: orderId, p_payload: payload ?? null })

/** True when this order id belongs to the maintenance ledger. */
export async function isMaintenanceOrder(admin: SupabaseClient, orderId: string) {
  const { data } = await admin.from('maintenance_payments').select('id').eq('razorpay_order_id', orderId).maybeSingle()
  return !!data
}

/**
 * Create the Razorpay order and its ledger row.
 * Throws a friendly error when Razorpay is not configured.
 */
export async function createMaintenanceOrder(
  admin: SupabaseClient,
  p: {
    userId: string
    kind: 'membership' | 'request_charge'
    subscriptionId?: string
    requestId?: string
    amount: number
    description: string
    receipt: string
  },
) {
  const keyId = process.env.RAZORPAY_KEY_ID ?? ''
  if (!/^rzp_(test|live)_[A-Za-z0-9]{8,}$/.test(keyId) || /placeholder/i.test(keyId)) {
    throw new PaymentsNotConfigured()
  }
  const order = await createRazorpayOrder({
    amount: p.amount,
    currency: 'INR',
    receipt: p.receipt.slice(0, 40),
    notes: { kind: p.kind, ref: p.subscriptionId ?? p.requestId ?? '' },
  })
  const { error } = await admin.from('maintenance_payments').insert({
    user_id: p.userId,
    kind: p.kind,
    subscription_id: p.subscriptionId ?? null,
    request_id: p.requestId ?? null,
    razorpay_order_id: order.id,
    amount: p.amount,
    currency: 'INR',
    status: 'created',
    description: p.description,
  })
  if (error) throw new Error(`maintenance_payments insert: ${error.message}`)
  return { order_id: order.id, amount: Math.round(p.amount * 100), currency: 'INR' }
}

export class PaymentsNotConfigured extends Error {
  constructor() { super('Online payments are not configured yet.') }
}

/** Email the customer about a settled / failed maintenance payment. Never throws. */
export async function notifyMaintenancePayment(admin: SupabaseClient, r: MaintenanceSettleResult, outcome: 'received' | 'failed') {
  try {
    if (!r.user_id) return
    if (outcome === 'failed') return // failed payments are shown in-app; no email template for maintenance
    if (r.kind === 'membership' && r.subscription_id) {
      const { data: sub } = await admin
        .from('maintenance_subscriptions')
        .select('id, start_date, end_date, plan_snapshot, property:customer_properties(label, address_line)')
        .eq('id', r.subscription_id)
        .single()
      if (!sub) return
      const prop = (Array.isArray(sub.property) ? sub.property[0] : sub.property) as { label?: string; address_line?: string } | null
      await notifyCustomer(admin, r.user_id, 'membership_purchased', {
        plan_name: (sub.plan_snapshot as { name?: string })?.name ?? 'Membership',
        property: prop ? `${prop.label ?? 'your home'} (${prop.address_line ?? ''})` : 'your home',
        start_date: fmtDate(sub.start_date),
        end_date: fmtDate(sub.end_date),
      }, { reference: { type: 'membership', id: sub.id } })
    } else if (r.request_id) {
      const { data: req } = await admin.from('maintenance_requests').select('id, request_number').eq('id', r.request_id).single()
      await notifyCustomer(admin, r.user_id, 'maintenance_payment_received', {
        amount: rupees(r.amount ?? 0),
        request_number: req?.request_number ?? '',
        request_id: r.request_id,
      }, { reference: { type: 'maintenance_request', id: r.request_id } })
    }
  } catch (err) {
    console.error('[maintenance] payment notification failed', err instanceof Error ? err.message : 'unknown')
  }
}
