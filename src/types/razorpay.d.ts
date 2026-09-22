// Global Razorpay types — shared across all files that use the Razorpay checkout modal

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: {
    razorpay_payment_id: string
    razorpay_order_id: string
    razorpay_signature: string
  }) => void
  prefill?: { name?: string; email?: string; contact?: string }
  theme?: { color: string }
  modal?: { ondismiss?: () => void }
  [key: string]: unknown
}

interface RazorpayInstance {
  open(): void
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

export {}
