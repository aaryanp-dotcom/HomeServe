import { createAdminClient } from '@/lib/supabase/admin'

/** Real save counts per theme slug, for the gallery grid. Missing/zero-save themes just aren't in the map. */
export async function getThemeSaveCounts(): Promise<Record<string, number>> {
  const { data, error } = await createAdminClient().rpc('theme_save_counts')
  if (error || !data) return {}
  const counts: Record<string, number> = {}
  for (const row of data as { theme_slug: string; saves: number }[]) counts[row.theme_slug] = Number(row.saves)
  return counts
}

export async function getThemeSaveCount(slug: string): Promise<number> {
  const { data, error } = await createAdminClient().rpc('theme_save_count', { p_slug: slug })
  return error || data == null ? 0 : Number(data)
}
