import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Check, Minus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { JoinMembership } from '@/components/maintenance/JoinMembership'
import type { AddressSuggestion } from '@/components/maintenance/PropertyPicker'
import { getActivePlans } from '@/lib/maintenance/data'
import { coveredCategoriesText, describePlanBenefits, describePlanLimits, planPriceText, planPurchasable, rupees } from '@/lib/maintenance/format'
import { WARRANTY_VS_MAINTENANCE } from '@/lib/maintenance/config'
import { NCR_CITY_LIST } from '@/lib/maintenance/schemas'
import type { Property } from '@/lib/maintenance/types'

export const metadata: Metadata = { title: 'Start a Membership' }

export default async function JoinPage({ searchParams }: { searchParams: { plan?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/homeowner/membership/join?plan=${searchParams.plan ?? ''}`)}`)

  const plans = await getActivePlans()
  const plan = plans.find((p) => p.code === searchParams.plan)

  const [{ data: props }, { data: live }, { data: projects }] = await Promise.all([
    supabase.from('customer_properties').select('*').order('created_at'),
    supabase.from('maintenance_subscriptions').select('property_id, plan_snapshot').in('status', ['active', 'upcoming']),
    supabase.from('bookings').select('id, project_title, booking_number, address, city').eq('homeowner_id', user.id).eq('booking_type', 'project'),
  ])
  const taken: Record<string, string> = {}
  for (const s of live ?? []) taken[s.property_id] = (s.plan_snapshot as { name?: string }).name ?? 'HomeServe'
  const suggestions: AddressSuggestion[] = (projects ?? []).flatMap((b) => {
    const city = NCR_CITY_LIST.find((c) => c.toLowerCase() === (b.city ?? '').trim().toLowerCase()) ?? ((b.city ?? '').toLowerCase() === 'gurgaon' ? 'Gurugram' : null)
    return city && b.address ? [{ label: b.project_title ?? b.booking_number, address_line: b.address, city, booking_id: b.id }] : []
  })

  return (
    <div className="mx-auto max-w-3xl p-5 sm:p-8">
      <Link href="/maintenance/plans" className="coarse:min-h-11 mb-5 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-ink-900"><ArrowLeft size={14} /> All plans</Link>
      {!plan || !planPurchasable(plan) ? (
        <div className="border-2 border-ink-900 bg-white p-6">
          <h1 className="page-title">That plan is not available</h1>
          <p className="mt-2 text-stone-600">It may not be open for purchase yet. See the plans that are currently offered.</p>
          <Link href="/maintenance/plans" className="mt-4 inline-block font-medium text-cobalt-600 underline-offset-4 hover:underline">View plans</Link>
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-cobalt-600">HomeServe membership</p>
            <h1 className="mt-1 page-title">{plan.name}</h1>
            <p className="mt-1 text-stone-500">{plan.tagline}</p>
          </div>

          <section className="grid gap-6 border-2 border-ink-900 bg-white p-6 sm:grid-cols-2">
            <div>
              <p className="font-display text-3xl font-bold tracking-[-0.03em] text-ink-900">{planPriceText(plan)}</p>
              <p className="mt-1 text-xs text-stone-500">{plan.term_months}-month term, paid once. It does not renew automatically; we will remind you before it ends.</p>
              <h2 className="mt-5 font-semibold text-ink-900">Included</h2>
              <ul className="mt-2 space-y-1.5 text-sm text-stone-700">
                {describePlanBenefits(plan).map((b) => <li key={b} className="flex gap-2"><Check size={14} className="mt-0.5 shrink-0 text-sage-700" />{b}</li>)}
              </ul>
            </div>
            <div>
              <h2 className="font-semibold text-ink-900">Limits</h2>
              <ul className="mt-2 space-y-1.5 text-sm text-stone-600">
                {describePlanLimits(plan).map((b) => <li key={b} className="flex gap-2"><Minus size={14} className="mt-0.5 shrink-0 text-stone-400" />{b}</li>)}
              </ul>
              <h2 className="mt-5 font-semibold text-ink-900">Applies to</h2>
              <p className="mt-1 text-sm text-stone-600">{coveredCategoriesText(plan)}</p>
            </div>
            <p className="border-t border-ink-900/10 pt-4 text-xs leading-snug text-stone-500 sm:col-span-2">
              {WARRANTY_VS_MAINTENANCE.membership} Benefits are used up as you request eligible services, and are shown in your membership area.
            </p>
          </section>

          <JoinMembership planId={plan.id} planName={plan.name} priceText={rupees(Number(plan.annual_price))}
            properties={(props ?? []) as Property[]} taken={taken} suggestions={suggestions} />
        </div>
      )}
    </div>
  )
}
