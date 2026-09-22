import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cs: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    },
  )
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('quotations')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Mark as viewed if customer is viewing
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin' && data.status === 'sent') {
    await supabase.from('quotations').update({ status: 'viewed', viewed_at: new Date().toISOString() }).eq('id', id)
  }

  return NextResponse.json({ quotation: data })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Customers can only accept or reject
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') {
    const allowed = ['accepted', 'rejected', 'revision_requested']
    if (!allowed.includes(body.status)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const updateData: Record<string, unknown> = { status: body.status }
  if (body.status === 'accepted') updateData.accepted_at = new Date().toISOString()
  if (body.status === 'rejected') {
    updateData.rejected_at = new Date().toISOString()
    updateData.rejection_reason = body.rejection_reason ?? null
  }
  if (body.status === 'sent') updateData.sent_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('quotations')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If accepted — update lead status to won
  if (body.status === 'accepted' && data.request_id) {
    await supabase.from('renovation_requests').update({ status: 'won', won_at: new Date().toISOString() }).eq('id', data.request_id)
  }

  return NextResponse.json({ quotation: data })
}
