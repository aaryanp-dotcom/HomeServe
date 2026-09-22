'use client'

import { usePathname } from 'next/navigation'

/**
 * Numbers every portal page like a drawing sheet, derived from its position in the
 * sidebar (e.g. homeowner "My Projects" → SHEET H-03). Sub-pages inherit the parent's sheet.
 */
export function SheetStrip({ items, prefix }: { items: { label: string; href: string }[]; prefix: string }) {
  const pathname = usePathname()
  const idx = items.findIndex((i) => pathname === i.href || pathname.startsWith(i.href + '/'))
  const item = idx >= 0 ? items[idx] : null
  const detail = item && pathname !== item.href
  return (
    <div role="region" aria-label="Current page sheet" className="flex items-center justify-between gap-4 border-b border-ink-900/20 bg-paper-50 px-5 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-900/60 sm:px-8">
      <span className="flex items-center gap-2.5 truncate">
        <b className="border border-ink-900 px-1.5 py-0.5 font-semibold text-ink-900">
          Sheet {prefix}-{String((idx >= 0 ? idx : 0) + 1).padStart(2, '0')}
        </b>
        <span className="truncate">{item?.label ?? 'Portal'}{detail ? ' · Detail' : ''}</span>
      </span>
      <span className="hidden shrink-0 sm:block">HomeServe · Delhi NCR · Rev 03</span>
    </div>
  )
}
