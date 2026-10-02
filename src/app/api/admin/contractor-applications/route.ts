import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/api-auth'

/** GET /api/admin/contractor-applications?status=pending — admin review queue. */
export async function GET(req: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response
  const { admin } = auth

  const status = req.nextUrl.searchParams.get('status')
  let query = admin.from('contractor_applications').select('*').order('created_at', { ascending: false }).limit(200)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Could not load applications' }, { status: 500 })
  return NextResponse.json({ applications: data ?? [] })
}
