import { Skeleton } from '@/components/ui/shared'

/**
 * Instant placeholder shown inside a portal's layout while the next page's server data loads.
 *
 * Portal pages are dynamic (they read the session), so without a loading boundary the browser
 * has nothing to prefetch and a click does nothing until the whole page has rendered on the
 * server. With this in place the URL and chrome change immediately and the page streams in.
 * The shape (header, stat row, two content cards) approximates most portal pages so the swap
 * doesn't jump.
 */
export function PortalLoading() {
  return (
    <div role="status" aria-busy="true" className="mx-auto max-w-6xl space-y-8 p-5 sm:p-8">
      <span className="sr-only">Loading…</span>

      <div className="space-y-3">
        <Skeleton className="h-3 w-24 rounded-soft-sm" />
        <Skeleton className="h-8 w-64 max-w-full rounded-soft-sm" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-soft-sm" />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-soft-sm lg:col-span-2" />
        <Skeleton className="h-64 rounded-soft-sm" />
      </div>
    </div>
  )
}
