import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ArrowLeft } from 'lucide-react'
import SiteVisitForm from './SiteVisitForm'

export const metadata: Metadata = { title: 'Schedule Site Visit — Admin' }

export default async function NewSiteVisitPage({
  searchParams,
}: {
  searchParams: Promise<{ request?: string }>
}) {
  const { request: requestId } = await searchParams

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
  if (profile?.role !== 'admin') redirect('/homeowner/dashboard')

  // Load renovation requests for dropdown
  const { data: requests } = await supabase
    .from('renovation_requests')
    .select('id, request_number, full_name, city, locality')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-6 lg:p-8 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/site-visits" aria-label="Back" className="inline-flex items-center justify-center coarse:min-h-11 coarse:min-w-11 p-2 hover:bg-stone-100 transition-colors">
          <ArrowLeft size={16} className="text-stone-500" />
        </Link>
        <div>
          <h1 className="page-title">Schedule Site Visit</h1>
          <p className="text-sm text-stone-500">Create a new site visit for a renovation request</p>
        </div>
      </div>

      <SiteVisitForm
        requests={requests ?? []}
        defaultRequestId={requestId}
      />
    </div>
  )
}
