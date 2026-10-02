import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { UserPlus } from 'lucide-react'
import { StatCard } from '@/components/ui/shared'
import type { ContractorApplication } from '@/lib/contractor-applications/types'
import { ApplicationsList } from './ApplicationsList'

export const metadata: Metadata = { title: 'Contractor Applications — Admin' }

export default async function AdminContractorApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin.from('user_profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') redirect('/homeowner/dashboard')

  const { data } = await admin
    .from('contractor_applications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  const applications = (data ?? []) as ContractorApplication[]
  const pending = applications.filter((a) => a.status === 'pending')

  return (
    <div className="p-6 lg:p-8 max-w-5xl space-y-6">
      <div>
        <h1 className="page-title">Contractor Applications</h1>
        <p className="text-sm text-stone-500 mt-0.5">
          Review applications from the public{' '}
          <a href="/careers" target="_blank" rel="noreferrer" className="text-cobalt-600 hover:underline">Careers</a>{' '}
          page. Applying never creates an account or assigns a role — approving one here does.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Pending review" value={pending.length} icon={<UserPlus size={18} />} />
        <StatCard label="Approved" value={applications.filter((a) => a.status === 'approved').length} icon={<UserPlus size={18} />} />
        <StatCard label="Total" value={applications.length} icon={<UserPlus size={18} />} />
      </div>

      <ApplicationsList initialApplications={applications} />
    </div>
  )
}
