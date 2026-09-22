import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CheckCircle, XCircle } from 'lucide-react'
import { AuthShell } from '@/components/auth/AuthShell'
import { noIndex } from '@/lib/seo'

export const metadata: Metadata = { title: 'Confirm your email', ...noIndex }

interface Props {
  searchParams: Promise<{ token_hash?: string; type?: string; error?: string; error_description?: string }>
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const params = await searchParams
  let failed = !!params.error

  if (params.token_hash && params.type === 'email') {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash: params.token_hash, type: 'email' })
    if (!error) redirect('/homeowner/dashboard')
    failed = true
  }

  const link = 'font-semibold text-cobalt-600 underline-offset-4 hover:underline'
  return failed ? (
    <AuthShell eyebrow="Email confirmation" title="We could not confirm that link."
      subtitle={params.error_description ?? 'It may have expired or already been used.'}
      footer={<>Already confirmed? <Link href="/login" className={link}>Sign in</Link></>}>
      <div className="space-y-5">
        <div className="flex h-14 w-14 items-center justify-center bg-rose-600 text-white"><XCircle size={26} /></div>
        <Link href="/login" className="inline-flex h-11 items-center bg-ink-900 px-6 text-sm font-semibold text-white hover:bg-cobalt-600">Go to sign in</Link>
      </div>
    </AuthShell>
  ) : (
    <AuthShell eyebrow="Email confirmation" title="Email confirmed." subtitle="Your account is ready. Sign in to continue.">
      <div className="space-y-5">
        <div className="flex h-14 w-14 items-center justify-center bg-sage-600 text-white"><CheckCircle size={26} /></div>
        <Link href="/login" className="inline-flex h-11 items-center bg-ink-900 px-6 text-sm font-semibold text-white hover:bg-cobalt-600">Sign in</Link>
      </div>
    </AuthShell>
  )
}
