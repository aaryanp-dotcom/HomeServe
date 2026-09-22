'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/shared'
import { Button } from '@/components/ui/button'
import { CheckCircle, KeyRound } from 'lucide-react'

/**
 * Self-service password change for an already-authenticated session. The only other path to a
 * new password is the forgot-password email flow, which doesn't help someone who already knows
 * their current one and just wants to change it. Supabase's updateUser() re-uses the current
 * session — it doesn't need the old password re-entered, since the session itself is the proof
 * of identity.
 */
export function ChangePasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) { setError('Use at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    startTransition(async () => {
      const { error: err } = await createClient().auth.updateUser({ password })
      if (err) {
        setError(err.message)
        return
      }
      setPassword('')
      setConfirm('')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 border border-ink-900/15 bg-white space-y-4">
      <p className="panel-title flex items-center gap-2"><KeyRound size={14} /> Change Password</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
        <Input
          label="Confirm new password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200">
          <p className="text-xs text-rose-700">{error}</p>
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 p-3 bg-sage-50 border border-sage-200">
          <CheckCircle size={14} className="text-sage-700" />
          <p className="text-xs text-sage-700 font-medium">Password updated successfully.</p>
        </div>
      )}

      <Button type="submit" size="sm" loading={isPending} disabled={!password && !confirm}>
        Update password
      </Button>
    </form>
  )
}
