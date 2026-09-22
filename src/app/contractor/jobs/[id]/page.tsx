import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, bookingStatusLabel, bookingStatusColor } from '@/lib/utils'
import ContractorJobActions from '@/components/contractor/JobActions'
import { ChevronLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Job Detail' }
interface Props { params: Promise<{ id: string }> }

export default async function ContractorJobDetail({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/contractor/jobs/${id}`)

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase.from('user_profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'contractor') redirect('/login')

  const { data: job } = await adminSupabase
    .from('bookings')
    .select('*, service:services(*), milestones(*)')
    .eq('id', id)
    .eq('contractor_id', user.id)
    .single()

  if (!job) notFound()
  // bookings.homeowner_id references auth.users, not user_profiles, so PostgREST cannot embed the profile: look it up directly.
  const { data: customer } = await adminSupabase.from('user_profiles').select('full_name, phone, city').eq('user_id', job.homeowner_id).maybeSingle()

  const milestones = (job.milestones as any[]) ?? []

  function milestoneBadgeVariant(status: string): 'emerald' | 'blue' | 'outline' {
    if (status === 'approved') return 'emerald'
    if (status === 'completed') return 'blue'
    return 'outline'
  }

  return (
    <div className="mx-auto max-w-3xl p-5 sm:p-8">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <Link href="/contractor/jobs" className="flex items-center gap-1 text-stone-600 hover:text-ink-900 transition-colors">
          <ChevronLeft size={14} />
          My Jobs
        </Link>
        <span className="text-stone-500">/</span>
        <span className="text-ink-900 font-medium">{job.booking_number}</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{(job.service as any)?.name ?? job.project_title ?? job.service_category}</h1>
          <p className="text-sm text-stone-600 mt-0.5">
            {job.booking_number} · {job.booking_type === 'project' ? 'Project (20/40/40)' : 'Instant Service'}
          </p>
        </div>
        <Badge variant={bookingStatusColor(job.status) as any} size="lg" className="flex-shrink-0">
          {bookingStatusLabel(job.status)}
        </Badge>
      </div>

      <div className="space-y-5">
        <Card>
          <CardHeader><CardTitle>Job Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 text-sm min-[480px]:grid-cols-2">
            <div><p className="text-stone-500 text-xs mb-1">Customer</p><p className="font-medium text-ink-900">{customer?.full_name}</p></div>
            <div><p className="text-stone-500 text-xs mb-1">Phone</p><p className="font-medium text-ink-900">{customer?.phone ?? '—'}</p></div>
            <div className="min-[480px]:col-span-2"><p className="text-stone-500 text-xs mb-1">Address</p><p className="font-medium text-ink-900">{job.address}, {job.city}</p></div>
            <div><p className="text-stone-500 text-xs mb-1">Date</p><p className="font-medium text-ink-900">{formatDate(job.scheduled_date)} at {job.scheduled_time}</p></div>
            {job.description && (
              <div className="min-[480px]:col-span-2"><p className="text-stone-500 text-xs mb-1">Description</p><p className="font-medium text-ink-900">{job.description}</p></div>
            )}
          </CardContent>
        </Card>

        {job.booking_type === 'project' && milestones.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Milestones</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {milestones
                .sort((a: any, b: any) => a.milestone_number - b.milestone_number)
                .map((m: any) => (
                  <div
                    key={m.id}
                    className={`border p-4 transition-colors ${
                      m.status === 'approved'
                        ? 'border-sage-200 bg-sage-50'
                        : m.status === 'completed'
                          ? 'border-cobalt-100 bg-cobalt-50/40'
                          : 'border-ink-900/15'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-sm text-ink-900">{m.title}</span>
                        {m.notes && <p className="text-xs text-stone-600 mt-1">{m.notes}</p>}
                      </div>
                      <Badge variant={milestoneBadgeVariant(m.status)}>{m.status}</Badge>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        <ContractorJobActions job={job as any} milestones={milestones} />
      </div>
    </div>
  )
}
