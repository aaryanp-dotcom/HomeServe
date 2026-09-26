// Next.js shows this automatically while the dashboard's server component fetches its data
// (bookings, quotations, maintenance, reviews, subscription — several parallel queries) —
// shape roughly mirrors the real layout so nothing jumps into place once it resolves.
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 p-5 sm:p-8 animate-pulse">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-stone-100" />
          <div className="h-9 w-56 bg-stone-150" />
        </div>
        <div className="h-11 w-40 bg-stone-150" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-20 border border-ink-900/10 bg-white" />)}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="h-48 bg-stone-150" />
          <div className="space-y-2">
            <div className="h-5 w-32 bg-stone-150" />
            {[0, 1, 2].map((i) => <div key={i} className="h-16 border border-ink-900/10 bg-white" />)}
          </div>
        </div>
        <div className="space-y-6">
          <div className="h-40 bg-stone-150" />
          <div className="h-24 border border-ink-900/10 bg-white" />
        </div>
      </div>
    </div>
  )
}
