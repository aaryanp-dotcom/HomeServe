'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthShell, AuthAlert } from '@/components/auth/AuthShell'
import { GoogleSignInButton, AuthDivider } from '@/components/auth/GoogleSignInButton'
import { PrivacyNotice } from '@/components/privacy/PrivacyNotice'

/**
 * Public sign-up creates a homeowner account and nothing else. There is no role choice: HomeServe's
 * own team and contractor accounts are created by an administrator, and the database ignores any role
 * sent from the browser.
 */
export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [resent, setResent] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)

  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3
  const strengthLabel = ['', 'Too short', 'Good', 'Strong'][strength]
  const strengthColor = ['bg-ink-900/10', 'bg-rose-600', 'bg-amber-500', 'bg-sage-600'][strength]

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (name.trim().length < 2) { setError('Please enter your full name.'); return }
    if (phone && !/^[6-9]\d{9}$/.test(phone)) { setError('Enter a 10-digit Indian mobile number, or leave it blank.'); return }
    if (password.length < 8) { setError('Choose a password of at least 8 characters.'); return }
    if (!privacyAccepted) { setError('Please read and accept the Privacy Policy to continue.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: name.trim(), email: email.trim(), phone: phone || undefined, password }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Sign up failed. Please try again.')
        return
      }
      // Account is created but unconfirmed — always show the "check your email" step next.
      setSentTo(email.trim())
    } catch {
      setError('Sign up failed. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function resend() {
    if (!sentTo) return
    const res = await fetch('/api/auth/signup/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: sentTo }),
    })
    if (res.ok) setResent(true)
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
              value={password} onChange={(e) => setPassword(e.target.value)} required hint="At least 8 characters (used only to sign you in)."
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
        <PrivacyNotice
          accepted={privacyAccepted}
          onAcceptChange={setPrivacyAccepted}
          context="signup"
        />
        <Button type="submit" size="lg" fullWidth loading={loading} disabled={!privacyAccepted}>Create account</Button>
      </form>
      <div className="mt-6 space-y-6">
        <AuthDivider />
        <GoogleSignInButton disabled={!privacyAccepted} />
        {!privacyAccepted && (
          <p className="-mt-3 text-center text-xs text-stone-500">Accept the privacy notice above to continue with Google.</p>
        )}
      </div>
    </AuthShell>
  )
}
