import * as React from 'react'
import { cn } from '@/lib/utils'

/** Page heading used by every portal screen: mono eyebrow, display title, one-line lede, actions on the right. */
export function PageHeader({ eyebrow, title, description, actions, className }: {
  eyebrow?: React.ReactNode; title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; className?: string
}) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-x-6 gap-y-4', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-lede">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

/** A bordered sheet with an optional mono title. `strong` is for the one primary block on a page. */
export function Panel({ title, action, children, tone = 'default', className, padded = true }: {
  title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode
  tone?: 'default' | 'strong' | 'tint'; className?: string; padded?: boolean
}) {
  return (
    <section className={cn(tone === 'strong' ? 'panel-strong' : tone === 'tint' ? 'panel-tint' : 'panel', padded && 'p-5', className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="panel-title">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

/** Keyboard-scrollable table wrapper so wide tables work on phones and for keyboard users. */
export function ScrollTable({ children, label = 'Table', className }: { children: React.ReactNode; label?: string; className?: string }) {
  return (
    <div className={cn('table-scroll panel', className)} tabIndex={0} role="region" aria-label={label}>
      {children}
    </div>
  )
}
