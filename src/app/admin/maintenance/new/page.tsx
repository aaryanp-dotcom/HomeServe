import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { adminPage } from '@/lib/maintenance/page-auth'
import { AdminNewRequest } from '@/components/maintenance/AdminNewRequest'
import type { MaintenanceCategory } from '@/lib/maintenance/config'

export const metadata: Metadata = { title: 'New Request — Admin' }

export default async function AdminNewRequestPage() {
  const { supabase } = await adminPage('/admin/maintenance/new')
  const { data } = await supabase.from('maintenance_services').select('id, name, category').eq('is_active', true).order('sort_order')
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-5 sm:p-8">
      <Link href="/admin/maintenance" className="coarse:min-h-11 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-ink-900"><ArrowLeft size={14} /> Maintenance</Link>
      <div>
        <h1 className="page-title">Create a request for a customer</h1>
        <p className="mt-1 text-sm text-stone-500">For customers who phone or message. They see it in their account like any other request.</p>
      </div>
      <AdminNewRequest services={(data ?? []) as { id: string; name: string; category: MaintenanceCategory }[]} />
    </div>
  )
}
