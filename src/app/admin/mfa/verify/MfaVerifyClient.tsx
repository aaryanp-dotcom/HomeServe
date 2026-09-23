'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  factorId: string
}

export default function MfaVerifyClient({ factorId }: Props) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim() || code.length !== 6) return
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId })
    if (cErr || !challenge) {
      setError(cErr?.message ?? 'Could not create challenge')
      setLoading(false)
      return
    }

    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.trim(),
    })

    if (vErr) {
      setError('Incorrect code. Please try again.')
      setLoading(false)
      setCode('')
      return
    }

    // Session is now aal2 — go to admin dashboard
    window.location.href = '/admin/dashboard'
  }

  return (
    <div className="min-h-screen bg-paper-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-paper-200 p-8 w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-stone-900">Two-factor authentication</h1>
          <p className="text-sm text-stone-500">
            Enter the 6-digit code from your authenticator app to continue.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="mfa-code" className="block text-sm font-medium text-stone-700">
              Verification code
            </label>
            <input
              id="mfa-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              autoComplete="one-time-code"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-cobalt-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full rounded-lg bg-cobalt-600 hover:bg-cobalt-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 transition-colors"
          >
            {loading ? 'Verifying…' : 'Verify'}
          </button>
        </form>

        <p className="text-xs text-stone-400 text-center">
          Lost access to your authenticator app? Contact your account administrator.
        </p>
      </div>
    </div>
  )
}
