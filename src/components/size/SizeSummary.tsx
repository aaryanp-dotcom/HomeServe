import { formatBoth, type RoomDetail } from '@/lib/size'
import { cn } from '@/lib/utils'

const MODE_LABEL: Record<string, string> = { bhk_preset: 'Flat type', total_area: 'Total area', room_wise: 'Room by room' }

/** Read-only view of a saved size: total in sq ft / sq m, entry mode and the room table. */
export function SizeSummary({
  title, areaSqft, mode, rooms, compareTo, className,
}: {
  title: string
  areaSqft: number | null
  mode?: string | null
  rooms?: RoomDetail[]
  /** Another area (e.g. the customer's stated size) to show the variance against. */
  compareTo?: number | null
  className?: string
}) {
  if (!areaSqft) return null
  const variance = compareTo && compareTo > 0 ? ((areaSqft - compareTo) / compareTo) * 100 : null
  const list = rooms ?? []
  return (
    <div className={cn('border border-ink-900/15 bg-white p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="panel-title">{title}</h2>
          {mode && <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-stone-400">{MODE_LABEL[mode] ?? mode}</p>}
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-bold leading-none tracking-[-0.02em] text-ink-900">{Math.round(areaSqft).toLocaleString('en-IN')} <span className="text-sm font-medium text-stone-500">sq ft</span></p>
          <p className="mt-1 text-xs text-stone-400">{formatBoth(areaSqft).split('(')[1]?.replace(')', '')}</p>
        </div>
      </div>
      {variance !== null && Math.abs(variance) >= 1 && (
        <p className={cn('mt-3 inline-block px-2 py-1 font-mono text-[0.6875rem] font-semibold uppercase tracking-wider', Math.abs(variance) > 10 ? 'bg-cobalt-100 text-cobalt-700' : 'bg-ink-900/[0.07] text-ink-700')}>
          {variance > 0 ? '+' : ''}{variance.toFixed(0)}% vs customer&apos;s figure
        </p>
      )}
      {list.length > 0 && (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-ink-900/20 text-left font-mono text-[0.6875rem] uppercase tracking-wider text-stone-400">
              <th className="pb-1.5 font-medium">Room</th><th className="pb-1.5 font-medium">L × W (ft)</th><th className="pb-1.5 text-right font-medium">Area</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r, i) => (
              <tr key={`${r.name}-${i}`} className="border-b border-ink-900/10 last:border-0">
                <td className="py-1.5 text-stone-700">{r.name}</td>
                <td className="py-1.5 font-mono text-xs text-stone-500">{r.length_ft} × {r.width_ft}</td>
                <td className="py-1.5 text-right font-medium text-stone-800">{Math.round(r.area_sqft)} sq ft</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
