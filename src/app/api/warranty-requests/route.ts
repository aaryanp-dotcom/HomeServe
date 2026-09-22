import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body = await req.json()
    const { issue_category, description, preferred_visit_time } = body

    if (!issue_category || !description) {
      return NextResponse.json({ error: 'issue_category and description are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('warranty_requests')
      .insert({
        user_id: user.id,
        issue_category,
        description,
        preferred_visit_time: preferred_visit_time || null,
        status: 'new',
      })
      .select('id, issue_category, status, created_at')
      .single()

    if (error) {
      console.error('warranty_requests insert error', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('warranty-requests POST error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    let query = supabase
      .from('warranty_requests')
      .select('*')
      .order('created_at', { ascending: false })

    // Non-admin users only see their own requests
    if (profile?.role !== 'admin') {
      query = query.eq('user_id', user.id)
    }

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('warranty-requests GET error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
