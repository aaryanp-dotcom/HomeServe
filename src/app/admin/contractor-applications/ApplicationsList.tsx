'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Copy, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ContractorApplication } from '@/lib/contractor-applications/types'
import { STATUS_LABEL } from '@/lib/contractor-applications/types'

function randomPassword() {
  // Readable, copy-paste-friendly — this is relayed to the contractor directly by the admin
  // (phone/WhatsApp), not emailed, so it doesn't need to dodge autocorrect-hostile symbols.
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function ApplicationCard({ app, onReviewed }: { app: ContractorApplication; onReviewed: (updated: ContractorApplication) => void }) {
  const [mode, setMode] = useState<'idle' | 'approve' | 'reject'>('idle')
  const [password, setPassword] = useState(randomPassword())
  const [emailOverride, setEmailOverride] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ createdNewAccount: boolean; temporaryPassword: string | null; accountEmail: string } | null>(null)

  async function submit(body: Record<string, unknown>) {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/contractor-applications/${app.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error ?? 'Action failed')
      if (body.action === 'approve') {
        setResult({ createdNewAccount: d.createdNewAccount, temporaryPassword: d.temporaryPassword, accountEmail: d.accountEmail })
        onReviewed({ ...app, status: 'approved', approved_user_id: d.userId })
      } else {
        onReviewed({ ...app, status: 'rejected', rejection_reason: reason })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="border border-sage-300 bg-sage-50 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sage-800">
          <CheckCircle size={16} />
          <p className="text-sm font-semibold">Approved — {app.full_name} is now a contractor</p>
        </div>
        {result.createdNewAccount && result.temporaryPassword ? (
          <div className="bg-white border border-sage-200 p-3 space-y-2">
            <p className="text-xs text-stone-500">
              A new account was created. Share these sign-in details with {app.full_name.split(' ')[0]} directly
              (call or WhatsApp) — this password is shown once and isn&apos;t stored anywhere.
            </p>
            <div className="flex items-center justify-between gap-3 bg-stone-50 border border-stone-200 px-3 py-2 font-mono text-sm">
              <span>{result.accountEmail} · {result.temporaryPassword}</span>
              <button type="button"
                onClick={() => navigator.clipboard.writeText(`${result.accountEmail} / ${result.temporaryPassword}`)}
                className="text-stone-500 hover:text-ink-900" aria-label="Copy credentials">
                <Copy size={14} />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-stone-600">
            {app.full_name} already had an account — it was promoted to contractor. Their existing password is unchanged.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="border border-ink-900/15 bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-ink-900">{app.full_name}</p>
          <p className="text-xs text-stone-500">
            {app.email ? `${app.email} · ` : ''}{app.phone}{app.city ? ` · ${app.city}` : ''}
          </p>
          <p className="text-xs text-stone-400 mt-0.5">{app.experience_years} yrs experience</p>
        </div>
        <Badge variant={app.status === 'pending' ? 'amber' : app.status === 'approved' ? 'emerald' : 'default'}>
          {STATUS_LABEL[app.status]}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {app.specializations.map((s) => (
          <span key={s} className="text-[11px] bg-cobalt-50 text-cobalt-700 px-2 py-0.5 border border-cobalt-100">{s}</span>
        ))}
      </div>

      {app.message && <p className="text-sm text-stone-600 border-t border-stone-100 pt-2">{app.message}</p>}

      {app.status === 'rejected' && app.rejection_reason && (
        <p className="text-xs text-rose-600 border-t border-stone-100 pt-2">Reason: {app.rejection_reason}</p>
      )}

      {app.status === 'pending' && (
        <div className="border-t border-stone-100 pt-3">
          {error && <p className="text-xs text-rose-700 mb-2">{error}</p>}

          {mode === 'idle' && (
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={() => setMode('approve')}>Approve</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setMode('reject')}>Reject</Button>
            </div>
          )}

          {mode === 'approve' && (
            <div className="space-y-2.5">
              <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>If no account exists for this email yet, one is created with the password below — not emailed, since mail delivery hasn&apos;t been confirmed working. You relay it yourself.</span>
              </div>
              {!app.email && (
                <input type="email" value={emailOverride} onChange={(e) => setEmailOverride(e.target.value)}
                  placeholder="Email to create their login with (this application has none on file)"
                  className="field text-sm" aria-label="Account email" />
              )}
              <div className="flex items-center gap-2">
                <input readOnly value={password} className="field font-mono text-sm flex-1" aria-label="Temporary password" />
                <Button type="button" size="sm" variant="outline" onClick={() => setPassword(randomPassword())}>Regenerate</Button>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" loading={submitting} disabled={!app.email && !emailOverride.trim()}
                  onClick={() => submit({ action: 'approve', temporaryPassword: password, email: emailOverride.trim() || undefined })}>
                  Confirm approval
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setMode('idle')}>Cancel</Button>
              </div>
            </div>
          )}

          {mode === 'reject' && (
            <div className="space-y-2.5">
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
                placeholder="Reason (shared with the applicant by email)" className="field text-sm" />
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" loading={submitting} disabled={!reason.trim()}
                  onClick={() => submit({ action: 'reject', rejectionReason: reason.trim() })}>
                  <XCircle size={14} /> Confirm rejection
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setMode('idle')}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ApplicationsList({ initialApplications }: { initialApplications: ContractorApplication[] }) {
  const [applications, setApplications] = useState(initialApplications)

  const handleReviewed = (updated: ContractorApplication) => {
    setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
  }

  if (applications.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 border border-dashed border-stone-200">
        <p className="text-sm text-stone-400">No applications yet</p>
      </div>
    )
  }

  const pending = applications.filter((a) => a.status === 'pending')
  const reviewed = applications.filter((a) => a.status !== 'pending')

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div className="space-y-3">
          <p className="panel-title">Pending ({pending.length})</p>
          {pending.map((app) => <ApplicationCard key={app.id} app={app} onReviewed={handleReviewed} />)}
        </div>
      )}
      {reviewed.length > 0 && (
        <div className="space-y-3">
          <p className="panel-title">Reviewed</p>
          {reviewed.map((app) => <ApplicationCard key={app.id} app={app} onReviewed={handleReviewed} />)}
        </div>
      )}
    </div>
  )
}
