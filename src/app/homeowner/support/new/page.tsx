import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronLeft, LifeBuoy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/layout'
import { hasServiceHistory } from '@/lib/support/eligibility'
import { NewTicketClient } from './NewTicketClient'

export const metadata: Metadata = { title: 'Raise a ticket' }

export default async function NewTicketPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/homeowner/support/new')

  const eligible = await hasServiceHistory(user.id)

  if (!eligible) {
    return (
      <div className="mx-auto max-w-xl space-y-6 p-5 sm:p-8">
        <Link href="/homeowner/support" className="coarse:min-h-11 inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-ink-900"><ChevronLeft size={14} /> My tickets</Link>
        <PageHeader eyebrow="Support" title="Raise a ticket" />
        <div className="panel-warm p-6">
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-soft-sm bg-cobalt-50 text-cobalt-600"><LifeBuoy size={18} /></span>
          <p className="font-display text-lg font-bold text-ink-900">This is for existing HomeServe customers.</p>
          <p className="mt-2 text-sm text-stone-600">You&apos;ll be able to raise a ticket here once you have an active or past renovation, maintenance request or membership with us.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/get-started" className="inline-flex h-10 items-center border-2 border-ink-900 bg-ink-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-cobalt-600 [@media(pointer:coarse)]:h-11">Start a renovation</Link>
            <Link href="/maintenance" className="inline-flex h-10 items-center border-2 border-ink-900 px-4 text-sm font-semibold text-ink-900 transition-colors hover:bg-ink-900 hover:text-white [@media(pointer:coarse)]:h-11">Book maintenance</Link>
          </div>
          <p className="mt-4 text-sm text-stone-600">Have a general question instead? <Link href="/contact" className="font-semibold text-cobalt-600 underline-offset-4 hover:underline">Use the contact form</Link>.</p>
        </div>
      </div>
    )
  }

  const { data: profile } = await supabase.from('user_profiles').select('full_name, email, phone').eq('user_id', user.id).single()

  return (
    <div className="mx-auto max-w-xl space-y-6 p-5 sm:p-8">
      <Link href="/homeowner/support" className="coarse:min-h-11 inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-ink-900"><ChevronLeft size={14} /> My tickets</Link>
      <PageHeader eyebrow="Support" title="Raise a ticket" description="Tell us what's going on and we'll get back to you by email." />
      <NewTicketClient
        defaultName={profile?.full_name ?? ''}
        defaultEmail={profile?.email ?? user.email ?? ''}
        defaultPhone={profile?.phone ?? ''}
      />
    </div>
  )
}
