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
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null); setUnconfirmed(false)
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (authError) {
        if (/confirm/i.test(authError.message)) { setUnconfirmed(true); setError('Please confirm your email first. We sent you a code when you signed up.'); return }
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
    // rather than Supabase's own mailer, as a 6-digit code entered inline below.
    const res = await fetch('/api/auth/signup/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })
    if (res.ok) setResent(true)
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setVerifying(true)
    try {
      const { data, error: otpError } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' })
      if (otpError) { setError(/expired/i.test(otpError.message) ? 'That code has expired. Request a new one.' : 'Incorrect code. Please check and try again.'); return }
      if (data.user) {
        const { data: profile } = await supabase.from('user_profiles').select('role').eq('user_id', data.user.id).single()
        router.push(safeNext(params.get('redirect'), profile?.role ?? 'homeowner'))
        router.refresh()
      }
    } catch {
      setError('Could not verify that code. Please check your connection and try again.')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Sign in"
      title="Welcome back."
      subtitle="Sign in to follow your project, service requests and payments."
      footer={<>New to HomeServe? <Link href="/signup" className="font-semibold text-cobalt-600 underline-offset-4 hover:underline">Create an account</Link></>}
    >
      <form onSubmit={handleLogin} className="space-y-5" noValidate>
        {error && <AuthAlert>{error}{unconfirmed && !resent && email && <> <button type="button" onClick={resend} className="font-semibold underline underline-offset-2">Resend the code</button></>}</AuthAlert>}
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

      {resent && (
        <form onSubmit={verifyCode} className="mt-5 space-y-3 border-t border-ink-900/10 pt-5">
          <p className="text-sm text-stone-600">We sent a 6-digit code to <strong className="text-ink-900">{email}</strong>.</p>
          <Input
            label="Confirmation code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
            value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="123456" required
            className="text-center text-2xl font-mono tracking-[0.5em]"
          />
          <Button type="submit" size="lg" fullWidth loading={verifying} disabled={code.length !== 6}>Verify &amp; sign in</Button>
        </form>
      )}

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
