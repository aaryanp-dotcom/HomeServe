'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Contractor {
  user_id: string
  city: string | null
  user: { full_name: string; phone: string }[] | { full_name: string; phone: string } | null
}

interface Props {
  bookingId: string
  currentContractorId: string | null
  contractors: Contractor[]
  bookingStatus: string
}

const nameOf = (c: Contractor) => (Array.isArray(c.user) ? c.user[0]?.full_name : c.user?.full_name) ?? 'Site contractor'

/** HomeServe works with its own contractor(s); this assigns a job to one of the accounts set up by an admin. */
export default function AssignContractorForm({ bookingId, currentContractorId, contractors, bookingStatus }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<string>(currentContractorId ?? contractors[0]?.user_id ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const canAssign = ['confirmed', 'assigned'].includes(bookingStatus)

  const handleAssign = async () => {
    if (!selected) return
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, contractor_id: selected }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to assign the job'); return }
      setSuccess(true)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          Site contractor
          {currentContractorId && <Badge variant="emerald">Assigned</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!canAssign ? (
          <p className="text-sm text-stone-600">
            A job can be assigned when the booking is <strong>Confirmed</strong> or <strong>Assigned</strong>. Current status: <strong>{bookingStatus}</strong>.
          </p>
        ) : contractors.length === 0 ? (
          <p className="text-sm text-stone-600">
            No contractor account exists yet. Create one with <span className="font-mono text-xs">node scripts/set-role.mjs &lt;email&gt; contractor</span>.
          </p>
        ) : (
          <fieldset className="space-y-3">
            <legend className="sr-only">Choose who does this job</legend>
            <div className="space-y-2">
              {contractors.map((c) => (
                <label key={c.user_id} className={`flex min-h-[3.25rem] cursor-pointer items-center gap-3 border-2 p-3 transition-colors [&:has(:focus-visible)]:outline [&:has(:focus-visible)]:outline-2 [&:has(:focus-visible)]:outline-offset-2 [&:has(:focus-visible)]:outline-cobalt-600 ${selected === c.user_id ? 'border-ink-900 bg-white' : 'border-ink-900/15 hover:border-ink-900/40'}`}>
                  <input type="radio" name="contractor" value={c.user_id} checked={selected === c.user_id} onChange={() => setSelected(c.user_id)} className="sr-only" />
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-ink-900 font-display text-sm font-bold text-white">{nameOf(c).charAt(0)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink-900">{nameOf(c)}</span>
                    {c.city && <span className="block text-xs text-stone-600">{c.city}</span>}
                  </span>
                  {selected === c.user_id && <span aria-hidden="true" className="text-sm font-bold text-ink-900">✓</span>}
                </label>
              ))}
            </div>
            {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
            {success && <p role="status" className="text-sm text-sage-700">Assigned. The contractor has been notified.</p>}
            <Button onClick={handleAssign} loading={loading} disabled={!selected || loading} fullWidth>
              {currentContractorId ? 'Reassign job' : 'Assign job'}
            </Button>
          </fieldset>
        )}
      </CardContent>
    </Card>
  )
}
