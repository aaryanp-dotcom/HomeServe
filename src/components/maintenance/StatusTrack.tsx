import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/shared'
import { REQUEST_STATUS, REQUEST_STEPS, type RequestStatus } from '@/lib/maintenance/config'

export function RequestStatusBadge({ status, audience = 'customer' }: { status: RequestStatus; audience?: 'customer' | 'admin' }) {
  const s = REQUEST_STATUS[status]
  return <Badge variant={s.variant} dot>{audience === 'admin' ? s.label : s.customer}</Badge>
}

/** The lifecycle as a track: done · current · to come. Cancelled requests get a single banner instead. */
export function StatusTrack({ status }: { status: RequestStatus }) {
  if (status === 'cancelled') {
    return <p className="border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">This request was cancelled.</p>
  }
  // A closed request is finished: every step reads as done.
  const idx = status === 'closed' ? REQUEST_STEPS.length : REQUEST_STEPS.indexOf(status)
  return (
    <ol className="grid grid-cols-4 gap-y-4 sm:grid-cols-8" aria-label="Request progress">
      {REQUEST_STEPS.map((s, i) => {
        const done = i < idx, cur = i === idx
        return (
          <li key={s} className="flex flex-col items-center gap-1.5 text-center" aria-current={cur ? 'step' : undefined}>
            <span className={cn(
              'flex h-7 w-7 items-center justify-center border-2 font-mono text-[0.6875rem]',
              done ? 'border-ink-900 bg-ink-900 text-white' : cur ? 'border-cobalt-500 bg-cobalt-500 text-white' : 'border-ink-900/20 bg-white text-ink-900/60',
            )}>
              {done ? <Check size={13} /> : i + 1}
            </span>
            <span className={cn('px-0.5 text-[0.6875rem] leading-tight', cur ? 'font-semibold text-ink-900' : 'text-stone-500')}>
              {REQUEST_STATUS[s].label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
