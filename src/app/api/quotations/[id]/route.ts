import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'

const patchSchema = z.object({
  status: z.enum(['accepted', 'rejected', 'revision_requested', 'sent']),
  rejection_reason: z.string().max(1000).nullish(),
})

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

  // Defence-in-depth alongside RLS: a non-admin may only read a quotation tied to their own
  // lead. RLS already enforces this at the DB layer, but the route shouldn't rely on that alone.
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('user_id', user.id).single()
  const isAdmin = profile?.role === 'admin'
  if (!isAdmin) {
    const { data: lead } = await supabase.from('renovation_requests').select('user_id').eq('id', data.request_id).maybeSingle()
    if (lead?.user_id !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Mark as viewed if customer is viewing
  if (!isAdmin && data.status === 'sent') {
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

  const parsed = patchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 })
  const body = parsed.data

  // Customers can only reject or request a revision here — and only their own quotation.
  // Deliberately NOT 'accepted': accepting has to also create the booking + milestones, which
  // only POST /api/quotations/[id]/accept does. Letting this route set status:'accepted' would
  // leave the quotation (and the lead) marked won with no project ever created behind it.
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('user_id', user.id).single()
  const isAdmin = profile?.role === 'admin'
  if (!isAdmin) {
    const allowed = ['rejected', 'revision_requested']
    if (!allowed.includes(body.status)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { data: quote } = await supabase.from('quotations').select('request_id').eq('id', id).maybeSingle()
    const { data: lead } = quote
      ? await supabase.from('renovation_requests').select('user_id').eq('id', quote.request_id).maybeSingle()
      : { data: null }
    if (!quote || lead?.user_id !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 })
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

  if (error) {
    console.error('[quotations/update]', error.code, error.hint)
    return NextResponse.json({ error: 'Could not update the quotation' }, { status: 500 })
  }

  // If accepted — update lead status to won
  if (body.status === 'accepted' && data.request_id) {
    await supabase.from('renovation_requests').update({ status: 'won', won_at: new Date().toISOString() }).eq('id', data.request_id)
  }

  return NextResponse.json({ quotation: data })
}
