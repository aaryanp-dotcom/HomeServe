import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ArrowLeft } from 'lucide-react'
import QuotationBuilder from './QuotationBuilder'

export const metadata: Metadata = { title: 'New Quotation — Admin' }

export default async function NewQuotationPage({
  searchParams,
}: {
  searchParams: Promise<{ request?: string }>
}) {
  const { request: requestId } = await searchParams

  const cookieStore = cookies()
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

  // Pre-load request data if coming from a lead
  let requestData = null
  if (requestId) {
    const { data } = await supabase
      .from('renovation_requests')
      .select('*')
      .eq('id', requestId)
      .single()
    requestData = data
  }

  // Prefer what our surveyor measured; fall back to the customer's own figure.
  let defaultArea: { sqft: number; source: 'measured' | 'stated' } | null = null
  if (requestId) {
    const { data: visit } = await supabase
      .from('site_visits')
      .select('measured_area_sqft')
      .eq('request_id', requestId)
      .not('measured_area_sqft', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (visit?.measured_area_sqft) defaultArea = { sqft: Number(visit.measured_area_sqft), source: 'measured' }
    else if (requestData?.carpet_area_sqft) defaultArea = { sqft: Number(requestData.carpet_area_sqft), source: 'stated' }
  }

  const { data: requests } = await supabase
    .from('renovation_requests')
    .select('id, request_number, full_name, mobile, email, city, locality')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-6 lg:p-8 max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/quotations" aria-label="Back" className="inline-flex items-center justify-center coarse:min-h-11 coarse:min-w-11 p-2 hover:bg-stone-100 transition-colors">
          <ArrowLeft size={16} className="text-stone-500" />
        </Link>
        <div>
          <h1 className="page-title">New Quotation</h1>
          <p className="text-sm text-stone-500">Build a detailed renovation quotation</p>
        </div>
      </div>

      <QuotationBuilder
        requests={requests ?? []}
        defaultRequest={requestData}
        defaultArea={defaultArea}
      />
    </div>
  )
}
