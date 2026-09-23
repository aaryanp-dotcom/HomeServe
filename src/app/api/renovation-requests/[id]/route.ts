import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi, requireAuthApi } from '@/lib/api-auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response
  const { admin: supabase } = auth

  const body = await req.json()
  const allowedFields = ['status', 'admin_notes', 'assigned_to', 'contacted_at', 'won_at', 'lost_at', 'lost_reason']
  const updateData: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (key in body) updateData[key] = body[key]
  }

  const { error } = await supabase
    .from('renovation_requests')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('[renovation-requests/update]', error.code, error.hint)
    return NextResponse.json({ error: 'Could not update the request' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const { userId, role, admin: supabase } = auth

  const isAdmin = role === 'admin'

  let query = supabase
    .from('renovation_requests')
    .select('*')
    .eq('id', id)

  if (!isAdmin) {
    // Scope to the authenticated user's own submissions only.
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query.single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ request: data })
}
