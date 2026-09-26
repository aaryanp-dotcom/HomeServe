import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getActiveServices } from '@/lib/maintenance/data'
import { indicativePrice } from '@/lib/maintenance/format'
import { RequestForm, type FormService, type MemberMap } from '@/components/maintenance/RequestForm'
import type { AddressSuggestion } from '@/components/maintenance/PropertyPicker'
import type { Property, Subscription } from '@/lib/maintenance/types'
import { NCR_CITY_LIST } from '@/lib/maintenance/schemas'

export const metadata: Metadata = { title: 'Request a Service' }

const CITY_ALIAS: Record<string, string> = { gurgaon: 'Gurugram', 'greater noida': 'Greater Noida', 'new delhi': 'Delhi' }
const asNcrCity = (c?: string | null) => {
  if (!c) return null
  const k = c.trim().toLowerCase()
  return CITY_ALIAS[k] ?? NCR_CITY_LIST.find((n) => n.toLowerCase() === k) ?? null
}

export default async function NewMaintenanceRequestPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/homeowner/maintenance/new')

  const [services, { data: props }, { data: subs }, { data: projects }] = await Promise.all([
    getActiveServices(),
    supabase.from('customer_properties').select('*').order('created_at'),
    supabase.from('maintenance_subscriptions').select('property_id, plan_snapshot, status').eq('status', 'active'),
    supabase.from('bookings').select('id, project_title, booking_number, address, city').eq('homeowner_id', user.id).eq('booking_type', 'project'),
  ])

  const formServices: FormService[] = services.map((s) => {
    const p = indicativePrice(s)
    return { id: s.id, slug: s.slug, name: s.name, category: s.category, summary: s.summary, inclusions: s.inclusions, exclusions: s.exclusions, photos_helpful: s.photos_helpful, priceText: p.text, hasPrice: p.hasPrice }
  })

  const members: MemberMap = {}
  for (const s of (subs ?? []) as Pick<Subscription, 'property_id' | 'plan_snapshot'>[]) {
    members[s.property_id] = { plan: s.plan_snapshot.name, categories: s.plan_snapshot.eligible_categories }
  }

  const suggestions: AddressSuggestion[] = (projects ?? []).flatMap((b) => {
    const city = asNcrCity(b.city)
    return city && b.address ? [{ label: b.project_title ?? b.booking_number, address_line: b.address, city, booking_id: b.id }] : []
  })

  const initial = formServices.find((s) => s.slug === sp.service)
    ?? formServices.find((s) => s.category === sp.category)

  return (
    <div className="mx-auto max-w-3xl p-5 sm:p-8">
      <Link href="/homeowner/maintenance" className="coarse:min-h-11 mb-5 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-ink-900"><ArrowLeft size={14} /> Home maintenance</Link>
      <h1 className="page-title">Request a service</h1>
      <p className="mb-8 mt-1 text-sm text-stone-500">Booked directly with HomeServe. We confirm first — you only pay once the work is done.</p>
      {formServices.length === 0
        ? <p className="border border-ink-900/15 bg-white p-6 text-stone-600">Maintenance services are not available to book yet.</p>
        : <RequestForm services={formServices} initialServiceId={initial?.id} properties={(props ?? []) as Property[]} members={members} suggestions={suggestions} projectId={(projects ?? []).some((b) => b.id === sp.project) ? sp.project : undefined} />}
    </div>
  )
}
