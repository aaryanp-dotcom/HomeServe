import Link from 'next/link'
import { Home } from 'lucide-react'

const POINTS = [
  'Follow site progress with photo updates',
  'Review quotations and pay per milestone',
  'Book home maintenance and keep every record in one place',
]

/**
 * Shared frame for sign-in, sign-up and password screens.
 * Desktop: blueprint panel + form. Phones: a single column with a compact header (no hero image, so it
 * loads fast on mobile data). Uses dvh so it fits iOS Safari's collapsing toolbar.
 */
export function AuthShell({ eyebrow, title, subtitle, children, footer }: {
  eyebrow: string; title: string; subtitle?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode
}) {
  return (
    <div className="grid min-h-[100dvh] bg-paper-100 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="bg-blueprint-dark relative hidden flex-col justify-between overflow-hidden p-10 text-paper-100 lg:flex" aria-hidden="true">
        <Link href="/" tabIndex={-1} className="flex w-fit items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center bg-cobalt-400"><Home size={16} className="text-white" /></span>
          <span className="text-lg font-extrabold tracking-[-0.04em] text-white">HomeServe</span>
        </Link>
        <div>
          <p className="mb-5 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-paper-100/60">Delhi NCR · Renovation &amp; home care</p>
          <p className="max-w-md font-display text-[2.6rem] font-bold leading-[1.02] tracking-[-0.03em] text-white">
            One team, from first sketch to <span className="inline-block bg-cobalt-400 px-[0.12em] text-white">every repair after.</span>
          </p>
          <ul className="mt-8 space-y-3">
            {POINTS.map((t) => (
              <li key={t} className="flex items-start gap-3 text-sm text-paper-100/80">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center bg-cobalt-400 text-ink-900">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M5 12l5 5L20 7" /></svg>
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <dl className="grid grid-cols-3 border border-paper-100/25 font-mono text-[0.6875rem] uppercase tracking-[0.12em]">
          {[['Project', 'Your home'], ['Location', 'Delhi NCR'], ['Sheet', 'A-00']].map(([k, v]) => (
            <div key={k} className="border-r border-paper-100/25 px-3 py-2 last:border-r-0">
              <dt className="text-paper-100/60">{k}</dt><dd className="mt-0.5 text-white">{v}</dd>
            </div>
          ))}
        </dl>
      </aside>

      <main className="flex flex-col px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-10">
        <Link href="/" className="flex w-fit items-center gap-2.5 py-2 lg:hidden">
          <span className="flex h-8 w-8 items-center justify-center bg-cobalt-400"><Home size={16} className="text-white" /></span>
          <span className="text-lg font-extrabold tracking-[-0.04em] text-ink-900">HomeServe</span>
        </Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
          <p className="eyebrow mb-3">{eyebrow}</p>
          <h1 className="font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.03em] text-ink-900 sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-stone-600">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 border-t border-ink-900/15 pt-6 text-sm text-stone-600">{footer}</div>}
        </div>
      </main>
    </div>
  )
}

export function AuthAlert({ children, tone = 'error' }: { children: React.ReactNode; tone?: 'error' | 'success' | 'info' }) {
  const cls = tone === 'error' ? 'border-rose-300 bg-rose-50 text-rose-800' : tone === 'success' ? 'border-sage-500/40 bg-sage-50 text-sage-900' : 'border-ink-900/20 bg-white text-ink-800'
  return <div role={tone === 'error' ? 'alert' : 'status'} className={`border p-3 text-sm ${cls}`}>{children}</div>
}
