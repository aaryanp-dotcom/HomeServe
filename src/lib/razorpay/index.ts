import Razorpay from 'razorpay'
import crypto from 'crypto'

// Lazy-initialized to avoid module-load crash when env vars are absent (e.g. build time)
function getRazorpayClient() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })
}

export interface CreateOrderParams {
  amount: number            // in INR (we convert to paise)
  currency?: string
  receipt: string           // booking_id or "booking_id:milestone_number"
  notes?: Record<string, string>
}

export async function createRazorpayOrder(params: CreateOrderParams) {
  const order = await getRazorpayClient().orders.create({
    amount: Math.round(params.amount * 100), // convert to paise
    currency: params.currency ?? 'INR',
    receipt: params.receipt,
    notes: params.notes ?? {},
  })
  return order
}

/**
 * Verify Razorpay payment signature
 * Must be called on payment.success before marking payment as captured
 */
export function verifyRazorpaySignature(params: {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}): boolean {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = params

  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')

  return generatedSignature === razorpay_signature
}

/**
 * Verify Razorpay webhook signature
 */
export function verifyWebhookSignature(body: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')

  return expectedSignature === signature
}

/**
 * Calculate milestone amounts for a project booking
 * Returns: { milestone1: number, milestone2: number, milestone3: number }
 */
export function calculateMilestoneAmounts(totalAmount: number) {
  const m1 = Math.round(totalAmount * 0.20 * 100) / 100
  const m2 = Math.round(totalAmount * 0.40 * 100) / 100
  const m3 = Math.round((totalAmount - m1 - m2) * 100) / 100 // remainder to avoid rounding issues
  return { milestone1: m1, milestone2: m2, milestone3: m3 }
}

/**
 * Refund a captured payment (full by default). The refund.processed webhook and the
 * caller's own settlement RPC are both idempotent, so either may run first.
 */
export async function refundRazorpayPayment(paymentId: string, amountInr?: number) {
  const args: { amount?: number } = {}
  if (amountInr != null) args.amount = Math.round(amountInr * 100)
  return getRazorpayClient().payments.refund(paymentId, args)
}
