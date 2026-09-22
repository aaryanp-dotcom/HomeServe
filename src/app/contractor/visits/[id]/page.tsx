import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/shared'
import { PageHeader } from '@/components/ui/layout'
import { formatDate } from '@/lib/utils'
import { CATEGORY_META, slotLabel } from '@/lib/maintenance/config'
import type { MaintenanceCategory } from '@/lib/maintenance/config'
import { ChevronLeft, MapPin, Phone } from 'lucide-react'

export const metadata: Metadata = { title: 'Maintenance visit' }

const VISIT_STATUS: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'accent' | 'default' }> = {
  scheduled:   { label: 'Scheduled',   variant: 'accent' },
  rescheduled: { label: 'Rescheduled', variant: 'warning' },
  completed:   { label: 'Completed',   variant: 'success' },
  missed:      { label: 'Missed',      variant: 'danger' },
  cancelled:   { label: 'Cancelled',   variant: 'default' },
}

export default async function ContractorVisitDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/contractor/visits/${id}`)

  const admin = createAdminClient()
  const { data: profile } = await admin.from('user_profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'contractor') redirect('/login')

  // Scoped to this technician's own assignment — a stray id for someone else's visit 404s, not leaks.
  const { data: visit } = await admin
    .from('maintenance_visits')
    .select('id, scheduled_date, time_window, status, notes, request_id')
    .eq('id', id).eq('technician_id', user.id).maybeSingle()
  if (!visit) notFound()

  const { data: request } = await admin
    .from('maintenance_requests')
    .select('request_number, description, address_snapshot, city, category, urgency, user_id, service_id')
    .eq('id', visit.request_id).maybeSingle()
  if (!request) notFound()

  const [{ data: service }, { data: customer }] = await Promise.all([
    admin.from('maintenance_services').select('name').eq('id', request.service_id).maybeSingle(),
    admin.from('user_profiles').select('full_name, phone').eq('user_id', request.user_id).maybeSingle(),
  ])

  const cfg = VISIT_STATUS[visit.status] ?? { label: visit.status, variant: 'default' as const }

  return (
    <div className="mx-auto max-w-2xl p-5 sm:p-8">
      <Link href="/contractor/jobs" className="coarse:min-h-11 inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-ink-900"><ChevronLeft size={14} /> My jobs</Link>

      <PageHeader
        className="mt-4"
        eyebrow="Maintenance visit"
        title={service?.name ?? CATEGORY_META[request.category as MaintenanceCategory]?.label ?? 'Maintenance visit'}
        description={`${request.request_number}${request.urgency === 'urgent' ? ' · Urgent' : ''}`}
        actions={<Badge variant={cfg.variant}>{cfg.label}</Badge>}
      />

      <div className="mt-6 space-y-5">
        <Card>
          <CardHeader><CardTitle>Visit details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 text-sm min-[480px]:grid-cols-2">
            <div><p className="mb-1 text-xs text-stone-500">Customer</p><p className="font-medium text-ink-900">{customer?.full_name ?? '—'}</p></div>
            <div>
              <p className="mb-1 text-xs text-stone-500">Phone</p>
              {customer?.phone ? <a href={`tel:${customer.phone}`} className="inline-flex items-center gap-1.5 font-medium text-cobalt-600 hover:text-cobalt-700"><Phone size={13} />{customer.phone}</a> : <p className="text-ink-900">—</p>}
            </div>
            <div className="min-[480px]:col-span-2">
              <p className="mb-1 text-xs text-stone-500">Address</p>
              <p className="flex items-start gap-1.5 font-medium text-ink-900"><MapPin size={14} className="mt-0.5 shrink-0 text-stone-500" />{request.address_snapshot}{request.city ? `, ${request.city}` : ''}</p>
            </div>
            <div><p className="mb-1 text-xs text-stone-500">Date</p><p className="font-medium text-ink-900">{formatDate(visit.scheduled_date)}</p></div>
            <div><p className="mb-1 text-xs text-stone-500">Time window</p><p className="font-medium text-ink-900">{slotLabel(visit.time_window)}</p></div>
            <div className="min-[480px]:col-span-2">
              <p className="mb-1 text-xs text-stone-500">What the customer described</p>
              <p className="text-ink-900">{request.description}</p>
            </div>
            {visit.notes && (
              <div className="min-[480px]:col-span-2 border-t border-ink-900/10 pt-3">
                <p className="mb-1 text-xs text-stone-500">Note from HomeServe</p>
                <p className="text-ink-900">{visit.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
        <p className="text-sm text-stone-600">To reschedule, mark this visit done, or record what was needed, contact HomeServe — visit status is updated from the office for now.</p>
      </div>
    </div>
  )
}
