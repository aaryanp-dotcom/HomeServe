import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Layers, CheckCircle, LayoutGrid } from 'lucide-react'
import { StatCard } from '@/components/ui/shared'
import AdminServicesManager from '@/components/admin/ServicesManager'

export const metadata: Metadata = { title: 'Services — Admin' }

export default async function AdminServicesPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cs: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') redirect('/login')

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .order('category', { ascending: true })

  const allServices = services ?? []
  const active     = allServices.filter((s) => s.is_active).length
  const categories = new Set(allServices.map((s) => s.category)).size

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="page-title">Services</h1>
        <p className="text-sm text-stone-500 mt-0.5">Manage the service catalog shown to homeowners.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total services" value={allServices.length} icon={<Layers size={18} />} />
        <StatCard label="Active"         value={active}             icon={<CheckCircle size={18} />} change={`${active} of ${allServices.length}`} positive />
        <StatCard label="Categories"     value={categories}         icon={<LayoutGrid size={18} />} />
      </div>

      <div className="border border-ink-900/15 bg-white p-5">
        <h2 className="panel-title mb-4">Service catalog</h2>
        <AdminServicesManager services={allServices} />
      </div>
    </div>
  )
}
