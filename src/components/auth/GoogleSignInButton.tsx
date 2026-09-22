'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { AuthAlert } from '@/components/auth/AuthShell'

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.9-2.26 5.36-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.94 23.94 0 000 24c0 3.87.92 7.52 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.82l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

/**
 * Google is not switched on in Supabase yet (Authentication → Providers → Google needs a Google Cloud
 * OAuth client id/secret, which only the account owner can create), so this will currently fail with a
 * clear message rather than a broken redirect. The button and callback wiring are ready for the moment
 * it's turned on — no further code changes needed then.
 */
export function GoogleSignInButton({ next }: { next?: string | null }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const redirectTo = new URL('/auth/callback', window.location.origin)
    if (next) redirectTo.searchParams.set('next', next)
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectTo.toString(), queryParams: { prompt: 'select_account' } },
    })
    if (authError) {
      setError('Google sign-in is not available right now — please use your email and password.')
      setLoading(false)
    }
    // On success the browser navigates away to Google immediately, so there's no "loaded" state to reset.
  }

  return (
    <div>
      <Button type="button" variant="secondary" size="lg" fullWidth loading={loading} leftIcon={!loading ? <GoogleMark /> : undefined} onClick={handleClick}>
        Continue with Google
      </Button>
      {error && <div className="mt-3"><AuthAlert tone="error">{error}</AuthAlert></div>}
    </div>
  )
}

export function AuthDivider({ label = 'or' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-stone-500" role="separator">
      <span className="h-px flex-1 bg-ink-900/15" aria-hidden="true" />
      {label}
      <span className="h-px flex-1 bg-ink-900/15" aria-hidden="true" />
    </div>
  )
}
