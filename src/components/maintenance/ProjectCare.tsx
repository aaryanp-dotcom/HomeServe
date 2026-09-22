import Link from 'next/link'
import { ShieldCheck, Wrench, ArrowRight } from 'lucide-react'
import { CategoryIcon } from './CategoryIcon'
import { getActivePlans } from '@/lib/maintenance/data'
import { fmtDate, warrantyStatus, type WarrantyFacts } from '@/lib/maintenance/format'
import { CATEGORY_META, WARRANTY_VS_MAINTENANCE, remindersForMonth } from '@/lib/maintenance/config'

type Booking = WarrantyFacts & { id: string; status: string }

/**
 * After handover: what the warranty says (facts entered by HomeServe, nothing assumed),
 * then — separately and quietly — what upkeep might be worth thinking about.
 * Warranty and maintenance are deliberately two blocks with their own wording.
 */
export async function ProjectCare({ booking }: { booking: Booking }) {
  const handedOver = !!booking.handover_date || booking.status === 'completed'
  if (!handedOver) return null

  const w = warrantyStatus(booking)
  const plans = await getActivePlans()
  const reminders = remindersForMonth(new Date().getMonth()).slice(0, 2)

  return (
    <div className="space-y-4">
      {/* Warranty — a reassurance moment, not a spec sheet, so it gets the warm treatment. */}
      <section className="panel-warm p-5" aria-labelledby="warranty-h">
        <h2 id="warranty-h" className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-900">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-soft-sm bg-sage-50 text-sage-700"><ShieldCheck size={14} /></span>
          Warranty
        </h2>
        {w.state === 'not_handed_over' && <p className="text-sm text-stone-600">Handover and warranty details will be recorded here once your project is handed over. The terms are set out in your project agreement.</p>}
        {w.state === 'terms_in_agreement' && <p className="text-sm text-stone-600">Handed over on <strong>{fmtDate(w.handover)}</strong>. Your warranty terms are set out in your project agreement.</p>}
        {(w.state === 'active' || w.state === 'ended') && (
          <p className="text-sm text-stone-700">
            Handed over on <strong>{fmtDate(w.handover)}</strong>. Warranty period <strong>{booking.warranty_months} months</strong>, {w.state === 'active' ? <>active until <strong>{fmtDate(w.ends)}</strong> ({w.daysLeft} day{w.daysLeft === 1 ? '' : 's'} left).</> : <>ended on <strong>{fmtDate(w.ends)}</strong>.</>}
          </p>
        )}
        {booking.warranty_terms && <p className="mt-3 whitespace-pre-line border-t border-stone-100 pt-3 text-xs leading-relaxed text-stone-500">{booking.warranty_terms}</p>}
        <p className="mt-3 text-xs text-stone-500">{WARRANTY_VS_MAINTENANCE.warranty}</p>
        <Link href="/homeowner/warranty/new" className="coarse:min-h-11 mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-cobalt-600 hover:text-cobalt-700">Raise a warranty request <ArrowRight size={12} /></Link>
      </section>

      {/* Maintenance — separate, optional */}
      <section className="panel-warm bg-paper-50 p-5" aria-labelledby="care-h">
        <h2 id="care-h" className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-900">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-soft-sm bg-cobalt-50 text-cobalt-600"><Wrench size={14} /></span>
          Looking after your home
        </h2>
        <p className="text-xs leading-relaxed text-stone-500">{WARRANTY_VS_MAINTENANCE.maintenance}</p>
        {reminders.length > 0 && (
          <ul className="mt-3 space-y-2.5">
            {reminders.map((r) => (
              <li key={r.title} className="flex items-start gap-2.5 text-sm">
                <CategoryIcon category={r.category} size={15} className="mt-0.5 shrink-0 text-cobalt-500" />
                <span className="text-stone-600"><strong className="text-stone-900">{r.title}: </strong>{r.body}{' '}
                  <Link href={`/homeowner/maintenance/new?category=${r.category}&project=${booking.id}`} className="font-medium text-cobalt-600 hover:underline">Request {CATEGORY_META[r.category].label.toLowerCase()}</Link>
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-stone-200 pt-3 text-xs">
          <Link href="/maintenance" className="font-semibold text-stone-800 hover:text-cobalt-600">Browse maintenance services</Link>
          {plans.length > 0 && <Link href="/maintenance/plans" className="text-stone-500 hover:text-cobalt-600">Optional membership plans</Link>}
        </div>
        {plans.length > 0 && <p className="mt-2 text-[0.6875rem] text-stone-400">{WARRANTY_VS_MAINTENANCE.membership}</p>}
      </section>
    </div>
  )
}
