import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import WarrantyForm from './WarrantyForm'

export const metadata: Metadata = { title: 'Raise Warranty Request' }

export default async function NewWarrantyRequestPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/homeowner/warranty/new')

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/homeowner/warranty" aria-label="Back" className="inline-flex items-center justify-center coarse:min-h-11 coarse:min-w-11 p-2 hover:bg-stone-100 transition-colors">
          <ArrowLeft size={16} className="text-stone-500" />
        </Link>
        <div>
          <h1 className="page-title">Raise a Warranty Request</h1>
          <p className="text-sm text-stone-500">Report an issue with your completed HomeServe project</p>
        </div>
      </div>

      <div className="p-6 border border-ink-900/15 bg-white">
        <WarrantyForm userId={user.id} />
      </div>
    </div>
  )
}
