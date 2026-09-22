import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Real save counts per theme slug, for the gallery grid. Missing/zero-save themes just aren't in the
 * map. The /themes page prerenders this with `revalidate`, which Next.js also runs once at build time —
 * a missing env var or a momentarily-unreachable Supabase must never fail the whole production build
 * over a save count, so every failure here (including createAdminClient() itself throwing) degrades to
 * "no counts yet" instead of throwing.
 */
export async function getThemeSaveCounts(): Promise<Record<string, number>> {
  try {
    const { data, error } = await createAdminClient().rpc('theme_save_counts')
    if (error || !data) return {}
    const counts: Record<string, number> = {}
    for (const row of data as { theme_slug: string; saves: number }[]) counts[row.theme_slug] = Number(row.saves)
    return counts
  } catch (err) {
    console.error('[themes] getThemeSaveCounts failed', err)
    return {}
  }
}

export async function getThemeSaveCount(slug: string): Promise<number> {
  try {
    const { data, error } = await createAdminClient().rpc('theme_save_count', { p_slug: slug })
    return error || data == null ? 0 : Number(data)
  } catch (err) {
    console.error('[themes] getThemeSaveCount failed', err)
    return 0
  }
}
