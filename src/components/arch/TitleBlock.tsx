import { cn } from '@/lib/utils'

/** Drawing-sheet title block. Used in the footer to sign off every page like a set of drawings. */
export function TitleBlock({ className }: { className?: string }) {
  const year = new Date().getFullYear()
  const cells: [string, string][] = [
    ['Project', 'HomeServe · Turnkey renovation'],
    ['Location', 'Delhi NCR'],
    ['Scale', '1 : 50'],
    ['Sheet', 'A-08 / 08'],
    ['Rev', `03 · ${year}`],
  ]
  return (
    <dl className={cn('grid grid-cols-2 border-2 border-paper-100/40 font-mono md:grid-cols-[2fr_1fr_0.6fr_0.7fr_0.8fr]', className)}>
      {cells.map(([k, v], i) => (
        <div key={k} className={cn('border-paper-100/25 px-4 py-3', i !== cells.length - 1 && 'md:border-r', i < 4 && 'border-b md:border-b-0', i % 2 === 0 && 'border-r md:border-r')}>
          <dt className="text-[0.6875rem] uppercase tracking-[0.18em] text-cobalt-400">{k}</dt>
          <dd className="mt-1 text-[0.75rem] uppercase tracking-[0.06em] text-paper-100/85">{v}</dd>
        </div>
      ))}
    </dl>
  )
}
