import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { adminPage } from '@/lib/maintenance/page-auth'
import { ServiceEditor } from '@/components/maintenance/ServiceEditor'
import { Badge } from '@/components/ui/shared'
import { CATEGORY_META, CATEGORY_ORDER } from '@/lib/maintenance/config'
import { indicativePrice } from '@/lib/maintenance/format'
import type { MaintenanceService } from '@/lib/maintenance/types'

export const metadata: Metadata = { title: 'Maintenance Catalogue — Admin' }

export default async function AdminServicesPage() {
  const { supabase } = await adminPage('/admin/maintenance/services')
  const { data } = await supabase.from('maintenance_services').select('*').order('sort_order')
  const rows = ((data ?? []) as MaintenanceService[]).sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) || a.sort_order - b.sort_order)

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8">
      <Link href="/admin/maintenance" className="coarse:min-h-11 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-ink-900"><ArrowLeft size={14} /> Maintenance</Link>
      <div>
        <h1 className="page-title">Service catalogue</h1>
        <p className="mt-1 text-sm text-stone-500">Everything customers see about each maintenance service. Prices are blank until you set them; blank shows as “Quoted after inspection”. Review the included / not-included wording before launch.</p>
      </div>
      <div className="space-y-3">
        {rows.map((s) => (
          <details key={s.id} className="border-2 border-ink-900 bg-white">
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-4">
              <span><span className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-cobalt-600">{CATEGORY_META[s.category].label}</span>
                <span className="block font-semibold text-ink-900">{s.name}</span></span>
              <span className="flex items-center gap-3 text-sm text-stone-600">{indicativePrice(s).text}<Badge variant={s.is_active ? 'success' : 'default'} dot>{s.is_active ? 'Live' : 'Hidden'}</Badge></span>
            </summary>
            <ServiceEditor service={s} />
          </details>
        ))}
      </div>
    </div>
  )
}
