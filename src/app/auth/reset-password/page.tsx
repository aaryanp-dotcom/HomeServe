'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthShell, AuthAlert } from '@/components/auth/AuthShell'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // null = still checking, false = the link was not valid (no recovery session)
  const [ready, setReady] = useState<boolean | null>(null)

  const [supabase] = useState(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!))

  // The emailed link carries a one-time code that the browser client exchanges for a recovery session on load.
  useEffect(() => {
    let cancelled = false
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) setReady(true)
    })
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession()
      if (!cancelled) setReady((r) => r ?? !!data.session)
    }, 1200)
    return () => { cancelled = true; clearTimeout(t); subscription.unsubscribe() }
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('The two passwords do not match.'); return }
    setLoading(true); setError(null)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      await supabase.auth.signOut()
      setDone(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3
  const strengthColor = ['bg-ink-900/10', 'bg-rose-600', 'bg-amber-500', 'bg-sage-600'][strength]

  if (done) {
    return (
      <AuthShell eyebrow="Password reset" title="Password updated." subtitle="Taking you to sign in…" footer={<Link href="/login" className="font-semibold text-cobalt-600 underline-offset-4 hover:underline">Sign in now</Link>}>
        <div className="flex h-14 w-14 items-center justify-center bg-sage-600 text-white"><CheckCircle size={26} /></div>
      </AuthShell>
    )
  }

  if (ready === false) {
    return (
      <AuthShell eyebrow="Password reset" title="This link has expired." subtitle="Reset links work once and expire after a short time."
        footer={<Link href="/login" className="font-semibold text-cobalt-600 underline-offset-4 hover:underline">Back to sign in</Link>}>
        <Link href="/forgot-password" className="inline-flex h-11 items-center bg-ink-900 px-6 text-sm font-semibold text-white hover:bg-cobalt-600">Request a new link</Link>
      </AuthShell>
    )
  }

  const toggle = (
    <button type="button" onClick={() => setShowPw((p) => !p)} aria-label={showPw ? 'Hide password' : 'Show password'} aria-pressed={showPw}
      className="pointer-events-auto -mr-2 flex h-10 w-10 items-center justify-center text-stone-600 hover:text-ink-900">
      {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  )

  return (
    <AuthShell eyebrow="Password reset" title="Choose a new password." subtitle="Use at least 8 characters.">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && <AuthAlert>{error}</AuthAlert>}
        <div>
          <Input label="New password" type={showPw ? 'text' : 'password'} name="password" autoComplete="new-password" minLength={8}
            value={password} onChange={(e) => setPassword(e.target.value)} required rightElement={toggle} />
          {password && (
            <div className="mt-2 flex gap-1" aria-hidden="true">{[1, 2, 3].map((i) => <span key={i} className={`h-1 flex-1 ${i <= strength ? strengthColor : 'bg-ink-900/10'}`} />)}</div>
          )}
        </div>
        <Input label="Confirm password" type={showPw ? 'text' : 'password'} name="confirm" autoComplete="new-password"
          value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        <Button type="submit" size="lg" fullWidth loading={loading} disabled={ready === null}>Update password</Button>
      </form>
    </AuthShell>
  )
}
