import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/maintenance/auth'
import { createMaintenanceOrder, PaymentsNotConfigured } from '@/lib/maintenance/payments'

/**
 * POST /api/maintenance/requests/:id/pay
 * Creates a Razorpay order for the request's outstanding amount. The amount is read from
 * the database (never from the client). Allowed once the work is marked complete.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const a = await requireUser()
  if (!a.ok) return a.res
  const { admin, user } = a

  const { data: r } = await admin
    .from('maintenance_requests')
    .select('id, request_number, status, amount_due, payment_status, user_id')
    .eq('id', params.id).eq('user_id', user.id).maybeSingle()
  if (!r) return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  if (!['completed', 'customer_confirmed', 'closed'].includes(r.status)) {
    return NextResponse.json({ error: 'Payment opens once the work is marked complete.' }, { status: 409 })
  }
  if (r.payment_status !== 'pending' || Number(r.amount_due) <= 0) {
    return NextResponse.json({ error: 'Nothing is due on this request.' }, { status: 409 })
  }

  try {
    const razorpay = await createMaintenanceOrder(admin, {
      userId: user.id,
      kind: 'request_charge',
      requestId: r.id,
      amount: Number(r.amount_due),
      description: `Service request ${r.request_number}`,
      receipt: `mnt_${r.id.replace(/-/g, '')}`,
    })
    return NextResponse.json({ success: true, razorpay })
  } catch (err) {
    if (err instanceof PaymentsNotConfigured) return NextResponse.json({ error: err.message }, { status: 503 })
    console.error('[maintenance/pay]', err)
    return NextResponse.json({ error: 'Could not start the payment' }, { status: 500 })
  }
}
