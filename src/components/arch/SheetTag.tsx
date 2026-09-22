import { cn } from '@/lib/utils'

/** Drawing-sheet marker shown above interior page titles, e.g. "SHEET A-09 — ABOUT". */
export function SheetTag({ code, title, className, tone = 'light' }: { code: string; title: string; className?: string; tone?: 'light' | 'dark' }) {
  const dark = tone === 'dark'
  return (
    <p
      className={cn(
        'mb-5 flex items-center gap-3 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em]',
        dark ? 'text-white/70' : 'text-ink-900/60',
        className,
      )}
    >
      <span className={cn('border px-1.5 py-0.5', dark ? 'border-white/50 text-white' : 'border-ink-900 text-ink-900')}>Sheet {code}</span>
      <span className={cn('h-px w-8', dark ? 'bg-white/40' : 'bg-ink-900/40')} />
      {title}
      <span className={cn('ml-auto hidden text-[0.6875rem] sm:block', dark ? 'text-white/60' : 'text-ink-900/60')}>Rev 03</span>
    </p>
  )
}
