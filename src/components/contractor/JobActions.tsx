'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Milestone, BookingStatus } from '@/types'

interface Job {
  id: string
  status: BookingStatus
  booking_type: 'instant' | 'project'
}

interface Props {
  job: Job
  milestones: Milestone[]
}

const STATUS_TRANSITIONS: Partial<Record<BookingStatus, BookingStatus>> = {
  assigned: 'in_progress',
  in_progress: 'completed',
}

const STATUS_LABELS: Partial<Record<BookingStatus, string>> = {
  assigned: '🚀 Mark as Started',
  in_progress: '✅ Mark as Completed',
}

export default function ContractorJobActions({ job, milestones }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [milestoneLoading, setMilestoneLoading] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const nextStatus = STATUS_TRANSITIONS[job.status]
  const nextStatusLabel = STATUS_LABELS[job.status]

  const updateJobStatus = async () => {
    if (!nextStatus) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/bookings/${job.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to update status')
        return
      }
      router.refresh()
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const completeMilestone = async (milestoneId: string, milestoneNumber: number) => {
    setMilestoneLoading(milestoneId)
    setError(null)
    try {
      const res = await fetch('/api/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: job.id,
          milestone_number: milestoneNumber,
          notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to complete milestone')
        return
      }
      router.refresh()
    } catch {
      setError('Something went wrong.')
    } finally {
      setMilestoneLoading(null)
    }
  }

  const pendingMilestones = milestones.filter(m => m.status === 'in_progress' || (m.status === 'pending' && job.status === 'in_progress'))

  return (
    <Card>
      <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-rose-700">{error}</p>}

        {/* Main status transition */}
        {nextStatus && nextStatusLabel && (
          <Button onClick={updateJobStatus} loading={loading} className="w-full" size="lg">
            {nextStatusLabel}
          </Button>
        )}

        {/* Milestone completion (project bookings) */}
        {job.booking_type === 'project' && pendingMilestones.length > 0 && (
          <div className="space-y-3 border-t border-ink-900/10 pt-4">
            <p className="text-sm font-medium text-stone-700">Complete a Milestone</p>
            <Input
              label="Notes / Work summary (optional)"
              placeholder="Describe what was completed..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            {pendingMilestones.map((m) => (
              <Button
                key={m.id}
                variant="outline"
                onClick={() => completeMilestone(m.id, m.milestone_number)}
                loading={milestoneLoading === m.id}
                className="w-full border-cobalt-300 text-cobalt-700"
              >
                ✓ Complete: {m.title}
              </Button>
            ))}
          </div>
        )}

        {!nextStatus && job.status !== 'completed' && job.status !== 'cancelled' && (
          <p className="text-sm text-stone-500 text-center">No actions available for current status.</p>
        )}

        {(job.status === 'completed' || job.status === 'cancelled') && (
          <p className="text-sm text-stone-500 text-center font-medium">
            {job.status === 'completed' ? '✅ This job is complete.' : '❌ This job was cancelled.'}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
