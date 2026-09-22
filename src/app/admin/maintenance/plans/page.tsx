import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { adminPage } from '@/lib/maintenance/page-auth'
import { PlanEditor } from '@/components/maintenance/PlanEditor'
import { Badge } from '@/components/ui/shared'
import { describePlanBenefits, planPriceText } from '@/lib/maintenance/format'
import type { MaintenancePlan } from '@/lib/maintenance/types'

export const metadata: Metadata = { title: 'Membership Plans — Admin' }

export default async function AdminPlansPage() {
  const { supabase } = await adminPage('/admin/maintenance/plans')
  const { data } = await supabase.from('maintenance_plans').select('*').order('sort_order')
  const plans = (data ?? []) as MaintenancePlan[]

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8">
      <Link href="/admin/maintenance" className="coarse:min-h-11 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-ink-900"><ArrowLeft size={14} /> Maintenance</Link>
      <div>
        <h1 className="page-title">Membership plans</h1>
        <p className="mt-1 text-sm text-stone-500">Every commercial term is configurable here. Customers see a plan only when it is active and has an annual price.</p>
      </div>
      <p className="flex gap-2 border-2 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <span><strong>Configuration is not final.</strong> The three plans were created as inactive drafts with no prices. The visit and inspection numbers are structural placeholders. Enter HomeServe&apos;s real prices and benefits, and review every value, before making a plan active.</span>
      </p>
      <div className="space-y-3">
        {plans.map((p) => (
          <details key={p.id} className="border-2 border-ink-900 bg-white" open={plans.length === 1}>
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-4">
              <span><span className="font-semibold text-ink-900">{p.name}</span>
                <span className="block text-xs text-stone-500">{describePlanBenefits(p).slice(0, 3).join(' · ') || 'No benefits configured'}</span></span>
              <span className="flex items-center gap-3 text-sm text-stone-600">{planPriceText(p)}<Badge variant={p.is_active ? 'success' : 'warning'} dot>{p.is_active ? 'Active' : 'Draft'}</Badge></span>
            </summary>
            <PlanEditor plan={p} />
          </details>
        ))}
      </div>
    </div>
  )
}
