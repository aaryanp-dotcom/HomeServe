import { cn } from '@/lib/utils'

/**
 * Blueprint section header: mono index + eyebrow on a rule, heavy grotesk title.
 * Emphasise a word in `title` with <Hl>.
 */
export function SectionHeading({
  index,
  eyebrow,
  title,
  body,
  tone = 'light',
  className,
}: {
  index?: string
  eyebrow: string
  title: React.ReactNode
  body?: React.ReactNode
  tone?: 'light' | 'dark'
  className?: string
}) {
  const dark = tone === 'dark'
  return (
    <div className={cn('max-w-3xl', className)}>
      <p
        className={cn(
          'mb-6 flex items-center gap-3 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em]',
          dark ? 'text-paper-100/60' : 'text-ink-900/60',
        )}
      >
        {index && <span className={dark ? 'text-cobalt-400' : 'text-cobalt-600'}>{index}</span>}
        <span className={cn('h-px w-10', dark ? 'bg-paper-100/40' : 'bg-ink-900/40')} />
        {eyebrow}
      </p>
      <h2
        className={cn(
          'font-display font-bold leading-[1] tracking-[-0.03em]',
          'text-[clamp(2.1rem,3.9vw,3.5rem)]',
          dark ? 'text-paper-100' : 'text-ink-900',
        )}
        
      >
        {title}
      </h2>
      {body && (
        <p className={cn('mt-6 max-w-xl text-lg leading-snug', dark ? 'text-paper-100/60' : 'text-ink-900/65')}>{body}</p>
      )}
    </div>
  )
}
