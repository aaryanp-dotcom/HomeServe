'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function MfaSetupClient() {
  const [qr, setQr] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [enrolling, setEnrolling] = useState(true)

  useEffect(() => {
    async function startEnrollment() {
      const supabase = createClient()
      const { data, error: err } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'HomeServe Admin' })
      if (err || !data) {
        setError(err?.message ?? 'Could not start MFA enrollment')
        setEnrolling(false)
        return
      }
      setFactorId(data.id)
      setQr(data.totp.qr_code)
      setSecret(data.totp.secret)
      setEnrolling(false)
    }
    startEnrollment()
  }, [])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!factorId || !code.trim()) return
    setLoading(true)
    setError(null)
    const supabase = createClient()

    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId })
    if (cErr || !challenge) {
      setError(cErr?.message ?? 'Could not create MFA challenge')
      setLoading(false)
      return
    }

    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.trim(),
    })

    if (vErr) {
      setError('Invalid code. Please try again.')
      setLoading(false)
      return
    }

    // MFA enrolled and verified — redirect to admin dashboard
    window.location.href = '/admin/dashboard'
  }

  if (enrolling) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-stone-500 text-sm">Setting up MFA…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-paper-200 p-8 w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-stone-900">Set up two-factor authentication</h1>
          <p className="text-sm text-stone-500">
            Admin accounts require MFA. Scan this QR code with an authenticator app (Google
            Authenticator, Authy, or similar), then enter the 6-digit code below.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {qr && (
          <div className="flex flex-col items-center gap-3">
            {/* dangerouslySetInnerHTML is intentional: Supabase returns a data URI SVG */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR code for TOTP enrollment" className="w-48 h-48 rounded-lg border border-paper-200" />
            {secret && (
              <details className="text-xs text-stone-500 text-center w-full">
                <summary className="cursor-pointer select-none">Can&apos;t scan? Enter manually</summary>
                <code className="block mt-2 break-all font-mono bg-paper-100 rounded p-2">{secret}</code>
              </details>
            )}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="mfa-code" className="block text-sm font-medium text-stone-700">
              6-digit code
            </label>
            <input
              id="mfa-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              autoComplete="one-time-code"
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
            {loading ? 'Verifying…' : 'Enable two-factor authentication'}
          </button>
        </form>
      </div>
    </div>
  )
}
