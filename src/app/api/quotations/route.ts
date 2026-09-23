import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response
  const { userId, admin: supabase } = auth

  const body = await req.json()

  const { data, error } = await supabase
    .from('quotations')
    .insert({
      request_id:           body.request_id,
      customer_name:        body.customer_name,
      customer_mobile:      body.customer_mobile,
      customer_email:       body.customer_email,
      project_address:      body.project_address,
      project_title:        body.project_title,
      project_scope:        body.project_scope,
      project_area_sqft:    body.project_area_sqft ?? null,
      line_items:           body.line_items,
      subtotal:             body.subtotal,
      gst_rate:             body.gst_rate,
      gst_amount:           body.gst_amount,
      discount_amount:      body.discount_amount,
      total_amount:         body.total_amount,
      payment_schedule:     body.payment_schedule,
      validity_days:        body.validity_days,
      terms_and_conditions: body.terms_and_conditions,
      notes:                body.notes,
      status:               body.status ?? 'draft',
      created_by:           userId,
      sent_at:              body.status === 'sent' ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (error) {
    console.error('[quotations/create]', error.code, error.hint)
    return NextResponse.json({ error: 'Could not create the quotation' }, { status: 500 })
  }

  // Update the renovation_request status if linked
  if (body.request_id && body.status === 'sent') {
    await supabase
      .from('renovation_requests')
      .update({ status: 'quote_sent' })
      .eq('id', body.request_id)
  }

  return NextResponse.json({ quotation: data })
}
