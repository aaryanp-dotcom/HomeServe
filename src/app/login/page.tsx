'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthShell, AuthAlert } from '@/components/auth/AuthShell'
import { GoogleSignInButton, AuthDivider } from '@/components/auth/GoogleSignInButton'
import { safeNext } from '@/lib/auth/redirect'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(params.get('error') ? 'That sign-in link did not work. Please sign in again.' : null)
  const [unconfirmed, setUnconfirmed] = useState(false)
  const [resent, setResent] = useState(false)

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null); setUnconfirmed(false)
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (authError) {
        if (/confirm/i.test(authError.message)) { setUnconfirmed(true); setError('Please confirm your email first. We sent you a link when you signed up.'); return }
        setError(/invalid login/i.test(authError.message) ? 'That email and password do not match.' : authError.message)
        return
      }
      if (data.user) {
        const { data: profile } = await supabase.from('user_profiles').select('role').eq('user_id', data.user.id).single()
        router.push(safeNext(params.get('redirect'), profile?.role ?? 'homeowner'))
        router.refresh()
      }
    } catch {
      setError('Sign in failed. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function resend() {
    // Same password-free resend endpoint the signup page uses, delivered via Resend
    // rather than Supabase's own mailer.
    const res = await fetch('/api/auth/signup/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })
    if (res.ok) setResent(true)
  }

  return (
    <AuthShell
      eyebrow="Sign in"
      title="Welcome back."
      subtitle="Sign in to follow your project, service requests and payments."
      footer={<>New to HomeServe? <Link href="/signup" className="font-semibold text-cobalt-600 underline-offset-4 hover:underline">Create an account</Link></>}
    >
      <form onSubmit={handleLogin} className="space-y-5" noValidate>
        {error && <AuthAlert>{error}{unconfirmed && !resent && email && <> <button type="button" onClick={resend} className="font-semibold underline underline-offset-2">Resend the email</button></>}{resent && ' A new email is on its way.'}</AuthAlert>}
        <Input label="Email" type="email" name="email" autoComplete="username" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false}
          value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
        <div>
          <Input label="Password" type={showPw ? 'text' : 'password'} name="password" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} required
            rightElement={
              <button type="button" onClick={() => setShowPw((p) => !p)} aria-label={showPw ? 'Hide password' : 'Show password'} aria-pressed={showPw}
                className="pointer-events-auto -mr-2 flex h-10 w-10 items-center justify-center text-stone-600 hover:text-ink-900">
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            } />
          <div className="mt-2 text-right"><Link href="/forgot-password" className="text-sm font-medium text-cobalt-600 underline-offset-4 hover:underline">Forgot password?</Link></div>
        </div>
        <Button type="submit" size="lg" fullWidth loading={loading}>Sign in</Button>
      </form>
      <div className="mt-6 space-y-6">
        <AuthDivider />
        <GoogleSignInButton next={params.get('redirect')} />
      </div>
    </AuthShell>
  )
}

export default function LoginPage() {
  return <Suspense fallback={null}><LoginForm /></Suspense>
}
