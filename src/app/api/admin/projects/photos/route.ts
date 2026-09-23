import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { requireAdminApi } from '@/lib/api-auth'

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
}
const MAX_BYTES = 15 * 1024 * 1024 // 15 MB (matches project-media bucket limit)
const MAX_FILES = 10

/** Cheap magic-byte check — prevents a renamed file from bypassing MIME validation. */
function looksLikeImage(buf: Buffer, type: string): boolean {
  if (type === 'image/jpeg') return buf[0] === 0xff && buf[1] === 0xd8
  if (type === 'image/png')  return buf.subarray(0, 8).toString('hex') === '89504e470d0a1a0a'
  if (type === 'image/webp') return buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP'
  return false
}

/**
 * POST /api/admin/projects/photos
 *
 * Multipart form fields:
 *   files[]        — image files (JPG / PNG / WebP, ≤ 15 MB each, ≤ 10 files)
 *   booking_id     — UUID of the booking these photos belong to (required)
 *   update_id      — UUID of the project_update row (optional)
 *   kind           — 'before' | 'progress' | 'milestone' | 'after' | 'completion' (default: 'progress')
 *   caption        — string (optional, max 200 chars)
 *   visible        — 'true' | 'false' (default: 'true')
 *
 * Returns: { ok: true, photos: [{ id, storage_path, signed_url }] }
 *
 * Authorization: admin + MFA (aal2) required.
 * Storage: project-media bucket (private), path: {booking_id}/{uuid}.{ext}
 */
export async function POST(req: Request) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response
  const { userId, admin } = auth

  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })

  const bookingId = String(form.get('booking_id') ?? '').trim()
  if (!bookingId) return NextResponse.json({ error: 'booking_id is required' }, { status: 400 })

  // Verify the booking exists
  const { data: booking } = await admin.from('bookings').select('id').eq('id', bookingId).maybeSingle()
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const updateId = String(form.get('update_id') ?? '').trim() || null
  const kindRaw = String(form.get('kind') ?? 'progress')
  const kind = ['before', 'progress', 'milestone', 'after', 'completion'].includes(kindRaw) ? kindRaw : 'progress'
  const caption = String(form.get('caption') ?? '').slice(0, 200) || null
  const visible = String(form.get('visible') ?? 'true') !== 'false'

  const files = form.getAll('files').filter((f): f is File => f instanceof File)
  if (files.length === 0) return NextResponse.json({ error: 'No files provided' }, { status: 400 })
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `Maximum ${MAX_FILES} files per upload` }, { status: 400 })
  }

  const saved: { id: string; storage_path: string; signed_url: string }[] = []

  for (const file of files) {
    const ext = ALLOWED_MIME[file.type]
    if (!ext) {
      return NextResponse.json({ error: 'Only JPG, PNG and WebP images are allowed' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `Each file must be under ${MAX_BYTES / 1024 / 1024} MB` }, { status: 400 })
    }
    const buf = Buffer.from(await file.arrayBuffer())
    if (!looksLikeImage(buf, file.type)) {
      return NextResponse.json({ error: 'File content does not match the declared type' }, { status: 400 })
    }

    // Safe storage path — no user-controlled segments
    const storagePath = `${bookingId}/${randomUUID()}.${ext}`

    const { error: upErr } = await admin.storage
      .from('project-media')
      .upload(storagePath, buf, { contentType: file.type, upsert: false })

    if (upErr) {
      console.error('[admin/projects/photos] upload', upErr.message)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // Insert row in project_photos
    const { data: photoRow, error: rowErr } = await admin
      .from('project_photos')
      .insert({
        booking_id:         bookingId,
        update_id:          updateId,
        storage_path:       storagePath,
        kind,
        caption,
        visible_to_customer: visible,
        uploaded_by:        userId,
      })
      .select('id')
      .single()

    if (rowErr || !photoRow) {
      // Roll back the storage upload
      await admin.storage.from('project-media').remove([storagePath])
      console.error('[admin/projects/photos] row', rowErr?.code, rowErr?.hint)
      return NextResponse.json({ error: 'Could not save photo metadata' }, { status: 500 })
    }

    // Generate a 1-hour signed URL for the response
    const { data: signedData } = await admin.storage
      .from('project-media')
      .createSignedUrl(storagePath, 3600)

    saved.push({
      id:           photoRow.id,
      storage_path: storagePath,
      signed_url:   signedData?.signedUrl ?? '',
    })
  }

  return NextResponse.json({ ok: true, count: saved.length, photos: saved }, { status: 201 })
}

/**
 * GET /api/admin/projects/photos?booking_id=xxx[&update_id=yyy]
 *
 * Returns project photos with fresh signed URLs (1 hour).
 * Admin only.
 */
export async function GET(req: Request) {
  const auth = await requireAdminApi()
  if (!auth.ok) return auth.response
  const { admin } = auth

  const { searchParams } = new URL(req.url)
  const bookingId = searchParams.get('booking_id')
  if (!bookingId) return NextResponse.json({ error: 'booking_id is required' }, { status: 400 })

  let query = admin
    .from('project_photos')
    .select('id, storage_path, kind, caption, visible_to_customer, uploaded_by, created_at, update_id')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true })

  const updateId = searchParams.get('update_id')
  if (updateId) query = query.eq('update_id', updateId)

  const { data: photos, error } = await query
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
