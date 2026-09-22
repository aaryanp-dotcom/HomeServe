import { Marquee } from '@/components/motion/Marquee'

const ITEMS = [
  'Free site visit',
  'Itemised line-by-line BOQ',
  'Milestone-based payments',
  'Dedicated site supervisor',
  'One accountable team',
  'Post-completion warranty',
]

/** Facts taken from how HomeServe actually works — no invented statistics. */
export function Ticker() {
  return (
    <div className="border-y-2 border-ink-900 bg-ink-900 py-4">
      <Marquee>
        {ITEMS.map((t) => (
          <span key={t} className="flex items-center gap-10 whitespace-nowrap font-mono text-xs font-medium uppercase tracking-[0.16em] text-paper-100">
            {t}
            <span className="h-2 w-2 bg-cobalt-400" />
          </span>
        ))}
      </Marquee>
    </div>
  )
}
