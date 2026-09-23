import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { requireUser } from '@/lib/maintenance/auth'
import { addRequestEvent } from '@/lib/maintenance/notify'

const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
const MAX_BYTES = 5 * 1024 * 1024
const MAX_CUSTOMER_PHOTOS = 6

/** Cheap magic-byte check so a renamed file cannot pass as an image. */
function looksLikeImage(buf: Buffer, type: string) {
  if (type === 'image/jpeg') return buf[0] === 0xff && buf[1] === 0xd8
  if (type === 'image/png') return buf.subarray(0, 8).toString('hex') === '89504e470d0a1a0a'
  if (type === 'image/webp') return buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP'
  return false
}

/**
 * POST /api/maintenance/requests/:id/media  (multipart: files[], kind?, caption?)
 * Customers attach photos of the problem to their own request. Admin may add
 * before / after / completion photos to any request.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const a = await requireUser()
  if (!a.ok) return a.res
  const { admin, user, role } = a
  const isAdmin = role === 'admin'

  const { data: r } = await admin.from('maintenance_requests').select('id, user_id, status').eq('id', params.id).maybeSingle()
  if (!r || (!isAdmin && r.user_id !== user.id)) return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  if (!isAdmin && ['closed', 'cancelled'].includes(r.status)) {
    return NextResponse.json({ error: 'This request is closed' }, { status: 409 })
  }

  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: 'Expected a multipart form' }, { status: 400 })
  const files = form.getAll('files').filter((f): f is File => f instanceof File)
  if (files.length === 0) return NextResponse.json({ error: 'No files' }, { status: 400 })
  if (files.length > 6) return NextResponse.json({ error: 'Up to 6 photos at a time' }, { status: 400 })

  const kindRaw = String(form.get('kind') ?? 'customer_photo')
  const kind = isAdmin && ['before', 'after', 'completion', 'customer_photo'].includes(kindRaw) ? kindRaw : 'customer_photo'
  const caption = String(form.get('caption') ?? '').slice(0, 200) || null
  const visible = isAdmin ? String(form.get('visible') ?? 'true') !== 'false' : true

  if (!isAdmin) {
    const { count } = await admin.from('maintenance_request_media').select('id', { count: 'exact', head: true })
      .eq('request_id', r.id).eq('kind', 'customer_photo')
    if ((count ?? 0) + files.length > MAX_CUSTOMER_PHOTOS) {
      return NextResponse.json({ error: `You can attach up to ${MAX_CUSTOMER_PHOTOS} photos per request` }, { status: 400 })
    }
  }

  const saved: string[] = []
  for (const f of files) {
    const ext = TYPES[f.type]
    if (!ext) return NextResponse.json({ error: 'Only JPG, PNG or WebP images are allowed' }, { status: 400 })
    if (f.size > MAX_BYTES) return NextResponse.json({ error: 'Each photo must be under 5 MB' }, { status: 400 })
    const buf = Buffer.from(await f.arrayBuffer())
    if (!looksLikeImage(buf, f.type)) return NextResponse.json({ error: 'That file is not a valid image' }, { status: 400 })

    const path = `${r.id}/${randomUUID()}.${ext}`
    const { error: upErr } = await admin.storage.from('maintenance-media').upload(path, buf, { contentType: f.type, upsert: false })
    if (upErr) {
      console.error('[maintenance/media] upload', upErr.message)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
    const { error: rowErr } = await admin.from('maintenance_request_media').insert({
      request_id: r.id, storage_path: path, kind, caption, visible_to_customer: visible, uploaded_by: user.id,
    })
    if (rowErr) {
      await admin.storage.from('maintenance-media').remove([path])
      console.error('[maintenance/media] row', rowErr.code, rowErr.hint)
      return NextResponse.json({ error: 'Could not save the photo' }, { status: 500 })
    }
    saved.push(path)
  }

  await addRequestEvent(admin, {
    request_id: r.id, actor_id: user.id, actor_role: isAdmin ? 'homeserve' : 'customer', event_type: 'media',
    body: `${files.length} photo${files.length > 1 ? 's' : ''} added`, visible_to_customer: visible, metadata: { kind },
  })
  return NextResponse.json({ ok: true, count: saved.length }, { status: 201 })
}
