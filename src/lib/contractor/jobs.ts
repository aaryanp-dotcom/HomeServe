import { createAdminClient } from '@/lib/supabase/admin'
import { CATEGORY_META, type MaintenanceCategory } from '@/lib/maintenance/config'

export type JobKind = 'renovation' | 'maintenance'
export type JobPhase = 'active' | 'done'

export interface ContractorJob {
  id: string
  kind: JobKind
  title: string
  subtitle: string
  date: string | null
  timeWindow: string | null
  status: string
  statusLabel: string
  statusVariant: 'success' | 'warning' | 'danger' | 'accent' | 'default'
  phase: JobPhase
  href: string
}

const BOOKING_STATUS: Record<string, { label: string; variant: ContractorJob['statusVariant']; phase: JobPhase }> = {
  pending:     { label: 'Pending',     variant: 'warning', phase: 'active' },
  confirmed:   { label: 'Confirmed',   variant: 'accent',  phase: 'active' },
  assigned:    { label: 'Assigned',    variant: 'accent',  phase: 'active' },
  in_progress: { label: 'In progress', variant: 'accent',  phase: 'active' },
  completed:   { label: 'Completed',   variant: 'success', phase: 'done' },
  cancelled:   { label: 'Cancelled',   variant: 'danger',  phase: 'done' },
  refunded:    { label: 'Refunded',    variant: 'default', phase: 'done' },
}

const VISIT_STATUS: Record<string, { label: string; variant: ContractorJob['statusVariant']; phase: JobPhase }> = {
  scheduled:   { label: 'Scheduled',   variant: 'accent',  phase: 'active' },
  rescheduled: { label: 'Rescheduled', variant: 'warning', phase: 'active' },
  completed:   { label: 'Completed',   variant: 'success', phase: 'done' },
  missed:      { label: 'Missed',      variant: 'danger',  phase: 'done' },
  cancelled:   { label: 'Cancelled',   variant: 'default', phase: 'done' },
}

/**
 * One combined feed of everything HomeServe has assigned to this contractor — renovation bookings and
 * maintenance visits alike. Before this, a maintenance visit the admin scheduled was invisible anywhere
 * in the contractor's portal (maintenance_visits had no assignee at all); this is the fix.
 */
export async function getContractorJobs(contractorId: string): Promise<ContractorJob[]> {
  const admin = createAdminClient()

  const [{ data: bookings }, { data: visits }] = await Promise.all([
    admin
      .from('bookings')
      .select('id, status, scheduled_date, service_category, project_title, address, city, services(name)')
      .eq('contractor_id', contractorId),
    admin
      .from('maintenance_visits')
      .select('id, scheduled_date, time_window, status, request_id, maintenance_requests(request_number, description, address_snapshot, city, category, service_id, maintenance_services(name))')
      .eq('technician_id', contractorId),
  ])

  const renovationJobs: ContractorJob[] = (bookings ?? []).map((b) => {
    const cfg = BOOKING_STATUS[b.status] ?? { label: b.status.replace(/_/g, ' '), variant: 'default' as const, phase: 'active' as const }
    const svc = Array.isArray(b.services) ? b.services[0]?.name : (b.services as { name?: string } | null)?.name
    return {
      id: b.id, kind: 'renovation',
      title: svc ?? b.project_title ?? b.service_category ?? 'Renovation job',
      subtitle: [b.address, b.city].filter(Boolean).join(', '),
      date: b.scheduled_date, timeWindow: null,
      status: b.status, statusLabel: cfg.label, statusVariant: cfg.variant, phase: cfg.phase,
      href: `/contractor/jobs/${b.id}`,
    }
  })

  const maintenanceJobs: ContractorJob[] = (visits ?? []).map((v) => {
    const req = Array.isArray(v.maintenance_requests) ? v.maintenance_requests[0] : v.maintenance_requests
    const cfg = VISIT_STATUS[v.status] ?? { label: v.status, variant: 'default' as const, phase: 'active' as const }
    const svcName = req ? (Array.isArray(req.maintenance_services) ? req.maintenance_services[0]?.name : (req.maintenance_services as { name?: string } | null)?.name) : undefined
    const categoryLabel = req?.category ? CATEGORY_META[req.category as MaintenanceCategory]?.label : undefined
    return {
      id: v.id, kind: 'maintenance',
      title: svcName ?? categoryLabel ?? 'Maintenance visit',
      subtitle: req ? [req.address_snapshot, req.city].filter(Boolean).join(', ') : '',
      date: v.scheduled_date, timeWindow: v.time_window,
      status: v.status, statusLabel: cfg.label, statusVariant: cfg.variant, phase: cfg.phase,
      href: `/contractor/visits/${v.id}`,
    }
  })

  return [...renovationJobs, ...maintenanceJobs].sort((a, b) => {
    if (!a.date && !b.date) return 0
    if (!a.date) return 1
    if (!b.date) return -1
    return a.date.localeCompare(b.date)
  })
}
