import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { propertySchema } from '@/lib/maintenance/schemas'

/**
 * POST /api/properties — add a home to the signed-in customer's account.
 * Uses the user's own session, so RLS (user_id = auth.uid()) is what enforces ownership.
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = propertySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid property', issues: parsed.error.issues }, { status: 400 })
  }

  const { count } = await supabase.from('customer_properties').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
  if ((count ?? 0) >= 10) return NextResponse.json({ error: 'You can save up to 10 properties.' }, { status: 400 })

  const v = parsed.data
  const { data, error } = await supabase
    .from('customer_properties')
    .insert({ ...v, user_id: user.id, is_default: (count ?? 0) === 0 })
    .select('*')
    .single()
  if (error) {
    console.error('[properties] insert', error.code, error.hint)
    return NextResponse.json({ error: 'Could not save the property' }, { status: 500 })
  }
  return NextResponse.json({ property: data }, { status: 201 })
}
