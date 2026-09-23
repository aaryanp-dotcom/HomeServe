import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/project-photos?booking_id=xxx
 *
 * Returns signed URLs (1 hour) for project photos the authenticated customer
 * is allowed to see. Only returns photos where visible_to_customer = true
 * and the booking belongs to the authenticated user.
 *
 * Admins may pass any booking_id; customers are restricted to their own bookings.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const bookingId = searchParams.get('booking_id')
  if (!bookingId) return NextResponse.json({ error: 'booking_id is required' }, { status: 400 })

  const admin = createAdminClient()

  // Role check
  const { data: profile } = await admin
    .from('user_profiles').select('role').eq('user_id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  // For non-admin users, verify they own the booking
  if (!isAdmin) {
    const { data: booking } = await admin
      .from('bookings').select('id').eq('id', bookingId).eq('homeowner_id', user.id).maybeSingle()
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  const { data: photos, error } = await admin
    .from('project_photos')
    .select('id, storage_path, kind, caption, created_at')
    .eq('booking_id', bookingId)
    .eq('visible_to_customer', true)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: 'Could not load photos' }, { status: 500 })
  if (!photos?.length) return NextResponse.json({ photos: [] })

  const paths = photos.map((p) => p.storage_path)
  const { data: signed } = await admin.storage
    .from('project-media')
    .createSignedUrls(paths, 3600)

  const signedMap = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]))

  return NextResponse.json({
    photos: photos.map((p) => ({
      ...p,
      signed_url: signedMap.get(p.storage_path) ?? null,
    })),
  })
}
