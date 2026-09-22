import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getThemeBySlug } from '@/lib/themes/data'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function parseDeviceId(req: Request): Promise<string | null> {
  const body = await req.json().catch(() => null)
  const id = body && typeof body === 'object' && 'deviceId' in body ? (body as { deviceId?: unknown }).deviceId : null
  return typeof id === 'string' && UUID_RE.test(id) ? id : null
}

/** POST saves a theme, DELETE unsaves it — both for the browser's own device id (see lib/themes/device.ts).
 *  No login: this is the public design-inspiration gallery, so a "save" is anonymous and per-browser. */
export async function POST(req: Request, { params }: { params: { slug: string } }) {
  if (!getThemeBySlug(params.slug)) return NextResponse.json({ error: 'Unknown theme' }, { status: 404 })
  const deviceId = await parseDeviceId(req)
  if (!deviceId) return NextResponse.json({ error: 'Invalid device id' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('theme_saves').upsert(
    { theme_slug: params.slug, device_id: deviceId },
    { onConflict: 'theme_slug,device_id', ignoreDuplicates: true },
  )
  if (error) return NextResponse.json({ error: 'Could not save' }, { status: 500 })

  const { data: count } = await admin.rpc('theme_save_count', { p_slug: params.slug })
  return NextResponse.json({ saved: true, count: Number(count ?? 0) })
}

export async function DELETE(req: Request, { params }: { params: { slug: string } }) {
  if (!getThemeBySlug(params.slug)) return NextResponse.json({ error: 'Unknown theme' }, { status: 404 })
  const deviceId = await parseDeviceId(req)
  if (!deviceId) return NextResponse.json({ error: 'Invalid device id' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('theme_saves').delete().eq('theme_slug', params.slug).eq('device_id', deviceId)
  if (error) return NextResponse.json({ error: 'Could not unsave' }, { status: 500 })

  const { data: count } = await admin.rpc('theme_save_count', { p_slug: params.slug })
  return NextResponse.json({ saved: false, count: Number(count ?? 0) })
}
