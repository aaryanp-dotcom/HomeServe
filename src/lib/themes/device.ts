'use client'

// A per-browser id for the theme gallery's save feature, which has no login. Not a fingerprint — just a
// random value the browser keeps so "did I save this" and the real save count survive a refresh.
const DEVICE_KEY = 'hs_device_id'
const SAVED_KEY = 'hs_saved_themes'

export function getDeviceId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(DEVICE_KEY, id) }
    return id
  } catch {
    return ''
  }
}

function readSavedSlugs(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function isThemeSavedLocally(slug: string): boolean {
  if (typeof window === 'undefined') return false
  return readSavedSlugs().includes(slug)
}

function writeSavedSlugs(slugs: string[]) {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(slugs)) } catch { /* private mode / quota — ignore */ }
}

/** Saves or unsaves a theme against the server, then mirrors the result into localStorage so the
 *  card/button remembers it across visits without needing an account. Returns the new save count. */
export async function toggleThemeSave(slug: string, save: boolean): Promise<number | null> {
  const deviceId = getDeviceId()
  if (!deviceId) return null
  try {
    const res = await fetch(`/api/themes/${slug}/save`, {
      method: save ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId }),
    })
    if (!res.ok) return null
    const data: { count: number } = await res.json()
    const current = readSavedSlugs()
    writeSavedSlugs(save ? Array.from(new Set([...current, slug])) : current.filter((s) => s !== slug))
    return data.count
  } catch {
    return null
  }
}
