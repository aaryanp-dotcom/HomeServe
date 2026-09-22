'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Input, Textarea } from '@/components/ui/shared'
import { AddPhotos } from './AddPhotos'
import { ADMIN_TRANSITIONS, REQUEST_STATUS, TIME_SLOTS, type RequestStatus } from '@/lib/maintenance/config'
import { rupees } from '@/lib/maintenance/format'

interface Staff { user_id: string; full_name: string }
interface VisitRow { id: string; scheduled_date: string; time_window: string; status: string; technician_id: string | null }

const ACTION_LABEL: Record<RequestStatus, string> = {
  requested: 'Reopen as requested', confirmed: 'Confirm request', scheduled: 'Mark scheduled', visit_underway: 'Team is visiting',
  in_progress: 'Mark in progress', completed: 'Mark completed', customer_confirmed: 'Customer confirmed', closed: 'Close request', cancelled: 'Cancel request',
}

const box = 'border-2 border-ink-900 bg-white p-5'
const h = 'mb-3 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-900/60'

export function AdminRequestPanel({
  id, status, paymentStatus, amountDue, assignedTo, teamLabel, staff, technicians, visits, visitFee, labourCharge, materials, todayIso,
}: {
  id: string
  status: RequestStatus
  paymentStatus: string
  amountDue: number
  assignedTo: string | null
  teamLabel: string | null
  staff: Staff[]
  /** The site contractor(s) who can actually be sent out to do the visit — distinct from `staff`
   *  (admin/ops accounts), who only ever "own" the ticket internally. */
  technicians: Staff[]
  visits: VisitRow[]
  visitFee: number
  labourCharge: number
  materials: { item: string; qty: number; unit_price: number }[]
  todayIso: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // form state
  const [note, setNote] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [summary, setSummary] = useState('')
  const [message, setMessage] = useState('')
  const [assignee, setAssignee] = useState(assignedTo ?? '')
  const [team, setTeam] = useState(teamLabel ?? '')
  const [date, setDate] = useState('')
  const [window_, setWindow] = useState('any')
  const [visitNote, setVisitNote] = useState('')
  const [technician, setTechnician] = useState(technicians.length === 1 ? technicians[0].user_id : '')
  const [visitTechnician, setVisitTechnician] = useState<Record<string, string>>(
    Object.fromEntries(visits.map((v) => [v.id, v.technician_id ?? ''])),
  )
  const [fee, setFee] = useState(String(visitFee || ''))
  const [labour, setLabour] = useState(String(labourCharge || ''))
  const [mats, setMats] = useState(materials.length ? materials.map((m) => ({ item: m.item, qty: String(m.qty), unit_price: String(m.unit_price) })) : [])
  const [waive, setWaive] = useState(paymentStatus === 'waived')

  async function post(body: Record<string, unknown>, key: string, after?: () => void) {
    setBusy(key); setMsg(null)
    try {
      const res = await fetch(`/api/admin/maintenance/requests/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setMsg({ ok: false, text: data.error ?? 'Action failed' }); return }
      after?.()
      setMsg({ ok: true, text: key === 'charges' ? `Saved. Amount due: ${rupees(Number(data.calc?.amount_due ?? 0))}` : 'Saved' })
      router.refresh()
    } finally { setBusy('') }
  }

  const next = ADMIN_TRANSITIONS[status].filter((s) => s !== 'scheduled' || visits.some((v) => v.status === 'scheduled'))
  const needsSummary = (s: RequestStatus) => s === 'completed'
  const canCharge = status !== 'cancelled' && paymentStatus !== 'paid'

  return (
    <div className="space-y-6">
      {msg && <p role="status" className={`border p-3 text-sm ${msg.ok ? 'border-sage-500/40 bg-sage-50 text-sage-900' : 'border-rose-300 bg-rose-50 text-rose-700'}`}>{msg.text}</p>}

      {/* status */}
      <section className={box}>
        <h2 className={h}>Move request</h2>
        {next.length === 0 ? <p className="text-sm text-stone-500">This request is {REQUEST_STATUS[status].label.toLowerCase()}. No further moves.</p> : (
          <div className="space-y-3">
            {next.some(needsSummary) && <Textarea rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Completion summary shown to the customer (used when marking Completed)" aria-label="Completion summary" />}
            <Input value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Note (optional, shown to the customer; cancellation reason)" aria-label="Status note" />
            <div className="flex flex-wrap gap-2">
              {next.map((s) => (
                <Button key={s} size="sm" variant={s === 'cancelled' ? 'danger' : 'primary'} loading={busy === `s-${s}`}
                  onClick={() => { if (s !== 'cancelled' || window.confirm('Cancel this request?')) void post({ action: 'status', status: s, note: statusNote || null, completion_summary: summary || null }, `s-${s}`, () => { setStatusNote(''); setSummary('') }) }}>
                  {ACTION_LABEL[s]}
                </Button>
              ))}
            </div>
            {status === 'confirmed' && !visits.some((v) => v.status === 'scheduled') && <p className="text-xs text-stone-500">Schedule a visit below to move to Scheduled.</p>}
          </div>
        )}
      </section>

      {/* assignment */}
      <section className={box}>
        <h2 className={h}>Internal responsibility</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="assignee" className="text-sm font-medium text-stone-700">Owner</label>
            <select id="assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} className="field w-full">
              <option value="">Unassigned</option>
              {staff.map((s) => <option key={s.user_id} value={s.user_id}>{s.full_name}</option>)}
            </select>
          </div>
          <Input label="Team / trade (optional)" value={team} onChange={(e) => setTeam(e.target.value)} placeholder="e.g. Plumbing team" />
        </div>
        <Button size="sm" className="mt-3" variant="secondary" loading={busy === 'assign'} onClick={() => post({ action: 'assign', assigned_to: assignee || null, team_label: team || null }, 'assign')}>Save</Button>
      </section>

      {/* visits */}
      <section className={box}>
        <h2 className={h}>Visits</h2>
        {visits.length > 0 && (
          <ul className="mb-4 divide-y divide-ink-900/10 border border-ink-900/15 text-sm">
            {visits.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <span><strong>{v.scheduled_date}</strong> · {v.time_window} · <span className="font-mono text-xs uppercase text-stone-500">{v.status}</span></span>
                <span className="flex flex-wrap items-center gap-1.5">
                  {technicians.length > 0 && (
                    <>
                      <select aria-label={`Technician for the ${v.scheduled_date} visit`} value={visitTechnician[v.id] ?? ''}
                        onChange={(e) => setVisitTechnician({ ...visitTechnician, [v.id]: e.target.value })}
                        className="field h-9 py-0 text-xs">
                        <option value="">No technician set</option>
                        {technicians.map((t) => <option key={t.user_id} value={t.user_id}>{t.full_name}</option>)}
                      </select>
                      {(visitTechnician[v.id] ?? '') !== (v.technician_id ?? '') && (
                        <Button size="xs" variant="secondary" loading={busy === `t-${v.id}`}
                          onClick={() => post({ action: 'technician', visit_id: v.id, technician_id: visitTechnician[v.id] || null }, `t-${v.id}`)}>Save</Button>
                      )}
                    </>
                  )}
                  {v.status === 'scheduled' && (
                    <>
                      <Button size="xs" variant="secondary" loading={busy === `v-${v.id}-completed`} onClick={() => post({ action: 'visit_status', visit_id: v.id, status: 'completed' }, `v-${v.id}-completed`)}>Done</Button>
                      <Button size="xs" variant="ghost" loading={busy === `v-${v.id}-missed`} onClick={() => post({ action: 'visit_status', visit_id: v.id, status: 'missed' }, `v-${v.id}-missed`)}>Missed</Button>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
        {!['requested', 'completed', 'customer_confirmed', 'closed', 'cancelled'].includes(status) ? (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input type="date" label="Visit date" min={todayIso} value={date} onChange={(e) => setDate(e.target.value)} />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="win" className="text-sm font-medium text-stone-700">Time window</label>
                <select id="win" value={window_} onChange={(e) => setWindow(e.target.value)} className="field w-full">
                  {TIME_SLOTS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            {technicians.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="tech" className="text-sm font-medium text-stone-700">Technician (optional)</label>
                <select id="tech" value={technician} onChange={(e) => setTechnician(e.target.value)} className="field w-full">
                  <option value="">Not set yet</option>
                  {technicians.map((t) => <option key={t.user_id} value={t.user_id}>{t.full_name}</option>)}
                </select>
              </div>
            )}
            <Input label="Note for the customer (optional)" value={visitNote} onChange={(e) => setVisitNote(e.target.value)} />
            <Button size="sm" disabled={!date} loading={busy === 'schedule'} onClick={() => post({ action: 'schedule', scheduled_date: date, time_window: window_, notes: visitNote || null, technician_id: technician || null }, 'schedule', () => { setDate(''); setVisitNote('') })}>
              {visits.some((v) => v.status === 'scheduled') ? 'Reschedule visit' : 'Schedule visit'}
            </Button>
          </div>
        ) : <p className="text-sm text-stone-500">{status === 'requested' ? 'Confirm the request before scheduling a visit.' : 'Visits can no longer be scheduled.'}</p>}
      </section>

      {/* charges */}
      <section className={box}>
        <h2 className={h}>Charges and materials</h2>
        {!canCharge ? <p className="text-sm text-stone-500">{paymentStatus === 'paid' ? 'Paid — charges are locked.' : 'No charges on a cancelled request.'}</p> : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input type="number" min={0} step="0.01" label="Visit fee (₹)" value={fee} onChange={(e) => setFee(e.target.value)} />
              <Input type="number" min={0} step="0.01" label="Labour (₹)" value={labour} onChange={(e) => setLabour(e.target.value)} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-stone-700">Materials recorded</p>
              {mats.map((m, i) => (
                <div key={i} className="mb-2 grid grid-cols-[1fr_5rem_7rem_2rem] items-center gap-2">
                  <input aria-label="Item" value={m.item} onChange={(e) => setMats(mats.map((x, j) => j === i ? { ...x, item: e.target.value } : x))} placeholder="Item" className="field" />
                  <input aria-label="Quantity" type="number" min={0} step="any" value={m.qty} onChange={(e) => setMats(mats.map((x, j) => j === i ? { ...x, qty: e.target.value } : x))} placeholder="Qty" className="field" />
                  <input aria-label="Unit price" type="number" min={0} step="0.01" value={m.unit_price} onChange={(e) => setMats(mats.map((x, j) => j === i ? { ...x, unit_price: e.target.value } : x))} placeholder="₹ each" className="field" />
                  <button type="button" aria-label="Remove material" onClick={() => setMats(mats.filter((_, j) => j !== i))} className="text-stone-400 hover:text-rose-700"><Trash2 size={15} /></button>
                </div>
              ))}
              <Button type="button" size="xs" variant="ghost" icon={<Plus size={12} />} onClick={() => setMats([...mats, { item: '', qty: '1', unit_price: '' }])}>Add material</Button>
            </div>
            <label className="flex items-center gap-2 text-sm text-stone-700"><input type="checkbox" checked={waive} onChange={(e) => setWaive(e.target.checked)} className="h-4 w-4 accent-[#FF4D17]" /> Waive whatever is due after membership benefits</label>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" loading={busy === 'charges'}
                onClick={() => post({ action: 'charges', visit_fee: Number(fee || 0), labour_charge: Number(labour || 0), waive, materials: mats.filter((m) => m.item.trim()).map((m) => ({ item: m.item, qty: Number(m.qty || 1), unit_price: Number(m.unit_price || 0) })) }, 'charges')}>
                Save and apply membership benefits
              </Button>
              <span className="text-xs text-stone-500">Currently due: {rupees(amountDue)} ({paymentStatus.replace('_', ' ')})</span>
            </div>
          </div>
        )}
      </section>

      {/* photos */}
      <section className={box}>
        <h2 className={h}>Photos</h2>
        <div className="flex flex-wrap gap-2">
          <AddPhotos requestId={id} kind="before" label="Add before photos" />
          <AddPhotos requestId={id} kind="after" label="Add after photos" />
          <AddPhotos requestId={id} kind="completion" label="Add completion photos" />
        </div>
        <p className="mt-2 text-xs text-stone-500">Photos are visible to the customer.</p>
      </section>

      {/* comms */}
      <section className={box}>
        <h2 className={h}>Communicate</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message to the customer (visible on their request page)" aria-label="Message to customer" />
            <Button size="sm" loading={busy === 'message'} disabled={!message.trim()} onClick={() => post({ action: 'message', body: message }, 'message', () => setMessage(''))}>Send to customer</Button>
          </div>
          <div className="space-y-2 border-t border-ink-900/10 pt-4">
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal note (never shown to the customer)" aria-label="Internal note" />
            <Button size="sm" variant="secondary" loading={busy === 'note'} disabled={!note.trim()} onClick={() => post({ action: 'note', body: note }, 'note', () => setNote(''))}>Add internal note</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
