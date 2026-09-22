'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthShell, AuthAlert } from '@/components/auth/AuthShell'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/reset-password` })
      if (resetError) throw resetError
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const back = <>Remembered it? <Link href="/login" className="font-semibold text-cobalt-600 underline-offset-4 hover:underline">Back to sign in</Link></>

  if (sent) {
    return (
      <AuthShell eyebrow="Password reset" title="Check your email."
        subtitle={<>If an account exists for <strong className="text-ink-900">{email}</strong>, a reset link is on its way. Check your spam folder too.</>} footer={back}>
        <div className="flex h-14 w-14 items-center justify-center bg-ink-900 text-white"><Mail size={26} /></div>
      </AuthShell>
    )
  }

  return (
    <AuthShell eyebrow="Password reset" title="Forgot your password?" subtitle="Enter your email and we will send you a link to choose a new one." footer={back}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <AuthAlert>{error}</AuthAlert>}
        <Input label="Email" type="email" name="email" autoComplete="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false}
          value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
        <Button type="submit" size="lg" fullWidth loading={loading}>Send reset link</Button>
      </form>
    </AuthShell>
  )
}
