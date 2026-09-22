/**
 * notification_logs holds one row per channel and per delivery attempt. The customer-facing
 * feed and unread badge treat those as one item per event on a subject.
 */
export interface FeedRow {
  id: string; event: string; created_at: string; read_at: string | null
  booking_id: string | null; reference_id?: string | null
}

export function dedupeFeed<T extends FeedRow>(rows: T[], limit = 50): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const n of rows) {
    const key = `${n.event}|${n.reference_id ?? n.booking_id ?? ''}|${n.created_at.slice(0, 16)}`
    if (seen.has(key)) continue
    seen.add(key); out.push(n)
    if (out.length >= limit) break
  }
  return out
}
