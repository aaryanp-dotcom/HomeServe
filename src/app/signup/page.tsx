'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Eye, EyeOff, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthShell, AuthAlert } from '@/components/auth/AuthShell'
import { GoogleSignInButton, AuthDivider } from '@/components/auth/GoogleSignInButton'

/**
 * Public sign-up creates a homeowner account and nothing else. There is no role choice: HomeServe's
 * own team and contractor accounts are created by an administrator, and the database ignores any role
 * sent from the browser.
 */
export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [resent, setResent] = useState(false)

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3
  const strengthLabel = ['', 'Too short', 'Good', 'Strong'][strength]
  const strengthColor = ['bg-ink-900/10', 'bg-rose-600', 'bg-amber-500', 'bg-sage-600'][strength]

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (name.trim().length < 2) { setError('Please enter your full name.'); return }
    if (phone && !/^[6-9]\d{9}$/.test(phone)) { setError('Enter a 10-digit Indian mobile number, or leave it blank.'); return }
    if (password.length < 8) { setError('Choose a password of at least 8 characters.'); return }
    setLoading(true)
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: { data: { full_name: name.trim(), phone: phone || undefined }, emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (authError) { setError(/already/i.test(authError.message) ? 'An account with this email already exists. Try signing in.' : authError.message); return }
      // Email confirmation is required: no session yet, so show the next step instead of a dashboard that would bounce to sign-in.
      if (data.session) { router.push('/homeowner/dashboard'); router.refresh() } else setSentTo(email.trim())
    } catch {
      setError('Sign up failed. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function resend() {
    if (!sentTo) return
    const { error: e } = await supabase.auth.resend({ type: 'signup', email: sentTo, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } })
    if (!e) setResent(true)
  }

  if (sentTo) {
    return (
      <AuthShell eyebrow="One more step" title="Check your email."
        subtitle={<>We sent a confirmation link to <strong className="text-ink-900">{sentTo}</strong>. Open it on this device to finish creating your account.</>}
        footer={<>Wrong address? <button type="button" onClick={() => setSentTo(null)} className="font-semibold text-cobalt-600 underline-offset-4 hover:underline">Go back</button> · Already confirmed? <Link href="/login" className="font-semibold text-cobalt-600 underline-offset-4 hover:underline">Sign in</Link></>}>
        <div className="space-y-4">
          <div className="flex h-14 w-14 items-center justify-center bg-ink-900 text-white"><MailCheck size={26} /></div>
          <p className="text-sm text-stone-600">It can take a minute to arrive. Check your spam folder if you do not see it.</p>
          {resent ? <AuthAlert tone="success">A new email is on its way.</AuthAlert> : <Button variant="secondary" onClick={resend}>Resend the email</Button>}
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell eyebrow="Create your account" title="Start with a free account."
      subtitle="Track your renovation, book home maintenance and keep every quotation, payment and warranty in one place."
      footer={<>Already have an account? <Link href="/login" className="font-semibold text-cobalt-600 underline-offset-4 hover:underline">Sign in</Link></>}>
      <form onSubmit={handleSignup} className="space-y-5" noValidate>
        {error && <AuthAlert>{error}</AuthAlert>}
        <Input label="Full name" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Aarav Mehta" />
        <Input label="Email" type="email" name="email" autoComplete="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false}
          value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
        <Input label="Mobile number (optional)" type="tel" name="phone" autoComplete="tel-national" inputMode="numeric" maxLength={10}
          value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="10-digit mobile" hint="Used only for updates about your projects and visits." />
        <div>
          <Input label="Password" type={showPw ? 'text' : 'password'} name="password" autoComplete="new-password" minLength={8}
            value={password} onChange={(e) => setPassword(e.target.value)} required hint="At least 8 characters."
            rightElement={
              <button type="button" onClick={() => setShowPw((p) => !p)} aria-label={showPw ? 'Hide password' : 'Show password'} aria-pressed={showPw}
                className="pointer-events-auto -mr-2 flex h-10 w-10 items-center justify-center text-stone-600 hover:text-ink-900">
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            } />
          {password && (
            <div className="mt-2 flex items-center gap-3" aria-live="polite">
              <div className="flex flex-1 gap-1">{[1, 2, 3].map((i) => <span key={i} className={`h-1 flex-1 ${i <= strength ? strengthColor : 'bg-ink-900/10'}`} />)}</div>
              <span className="w-16 text-right font-mono text-[0.6875rem] uppercase tracking-wider text-stone-600">{strengthLabel}</span>
            </div>
          )}
        </div>
        <Button type="submit" size="lg" fullWidth loading={loading}>Create account</Button>
      </form>
      <div className="mt-6 space-y-6">
        <AuthDivider />
        <GoogleSignInButton />
      </div>
    </AuthShell>
  )
}
