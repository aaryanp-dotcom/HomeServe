'use client'

import { useState, useTransition } from 'react'
import { updateContractorProfile } from './actions'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/shared'
import { CheckCircle, Edit2, X, ToggleLeft, ToggleRight } from 'lucide-react'

interface ContractorProfileFormProps {
  profile: {
    full_name: string | null
    phone: string | null
    city: string | null
    state: string | null
    avatar_url: string | null
  }
  contractorProfile: {
    bio: string | null
    experience_years: number
    is_available: boolean
    specializations: string[]
  } | null
  email: string
}

export default function ContractorProfileForm({ profile, contractorProfile, email }: ContractorProfileFormProps) {
  const [editing, setEditing]     = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [fullName, setFullName]           = useState(profile.full_name ?? '')
  const [phone, setPhone]                 = useState(profile.phone ?? '')
  const [city, setCity]                   = useState(profile.city ?? '')
  const [state, setState]                 = useState(profile.state ?? '')
  const [bio, setBio]                     = useState(contractorProfile?.bio ?? '')
  const [expYears, setExpYears]           = useState(contractorProfile?.experience_years ?? 0)
  const [isAvailable, setIsAvailable]     = useState(contractorProfile?.is_available ?? true)
  const [specializations] = useState<string[]>(contractorProfile?.specializations ?? [])

  function handleCancel() {
    setFullName(profile.full_name ?? '')
    setPhone(profile.phone ?? '')
    setCity(profile.city ?? '')
    setState(profile.state ?? '')
    setBio(contractorProfile?.bio ?? '')
    setExpYears(contractorProfile?.experience_years ?? 0)
    setIsAvailable(contractorProfile?.is_available ?? true)
    setEditing(false)
    setError(null)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await updateContractorProfile({
        full_name: fullName,
        phone: phone || null,
        city: city || null,
        state: state || null,
        bio: bio || null,
        experience_years: expYears,
        is_available: isAvailable,
        specializations,
      })
      if (result?.error) {
        setError(result.error)
      } else {
        setSaved(true)
        setEditing(false)
        setTimeout(() => setSaved(false), 3000)
      }
    })
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">

      {/* Personal info card */}
      <div className="panel space-y-4 p-5">
        <div className="flex items-center justify-between">
          <p className="panel-title">Contact details</p>
          {!editing && (
            <Button type="button" variant="secondary" size="sm" leftIcon={<Edit2 size={13} />} onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {editing ? (
            <>
              <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              <Input label="Phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
              <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Delhi" />
              <Input label="State" value={state} onChange={(e) => setState(e.target.value)} placeholder="Delhi" />
            </>
          ) : (
            <>
              <div><p className="text-xs text-stone-500 mb-1">Full Name</p><p className="text-sm font-medium text-ink-900">{fullName || '—'}</p></div>
              <div><p className="text-xs text-stone-500 mb-1">Email</p><p className="text-sm font-medium text-ink-900">{email}</p></div>
              <div><p className="text-xs text-stone-500 mb-1">Phone</p><p className="text-sm font-medium text-ink-900">{phone || '—'}</p></div>
              <div><p className="text-xs text-stone-500 mb-1">City</p><p className="text-sm font-medium text-ink-900">{city || '—'}</p></div>
            </>
          )}
        </div>
      </div>

      {/* Contractor details card */}
      {contractorProfile !== null && (
        <div className="panel space-y-4 p-5">
          <p className="panel-title">Working details</p>

          {editing ? (
            <>
              <Textarea
                label="About you"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Trades you work in, notes for the office…"
                rows={3}
              />
              <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2">
                <Input
                  label="Experience (years)"
                  type="number"
                  min={0}
                  max={50}
                  value={expYears}
                  onChange={(e) => setExpYears(Number(e.target.value))}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-ink-900">Availability</label>
                  <button
                    type="button"
                    onClick={() => setIsAvailable((v) => !v)}
                    className={`flex h-11 items-center gap-2 border-2 px-3.5 text-sm font-semibold transition-colors ${
                      isAvailable
                        ? 'border-sage-600 bg-sage-50 text-sage-900'
                        : 'border-ink-900/25 bg-white text-stone-700'
                    }`}
                  >
                    {isAvailable ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    {isAvailable ? 'Available' : 'Unavailable'}
                  </button>
                </div>
              </div>

            </>
          ) : (
            <>
              {bio && (
                <div>
                  <p className="text-xs text-stone-500 mb-1">About you</p>
                  <p className="text-sm text-ink-900 leading-relaxed">{bio}</p>
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2">
                <div><p className="text-xs text-stone-500 mb-1">Experience</p><p className="text-sm font-medium text-ink-900">{expYears} years</p></div>
                <div>
                  <p className="text-xs text-stone-500 mb-1">Availability</p>
                  <span className={`font-mono text-[0.6875rem] uppercase tracking-wider px-2 py-0.5 border ${isAvailable ? 'border-sage-500/50 bg-sage-50 text-sage-900' : 'border-ink-900/20 bg-paper-50 text-stone-700'}`}>
                    {isAvailable ? '● Available' : '○ Unavailable'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Feedback */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-300">
          <p className="text-sm text-rose-800">{error}</p>
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 p-3 bg-sage-50 border border-sage-500/40">
          <CheckCircle size={14} className="text-sage-700" />
          <p className="text-sm text-sage-900 font-medium">Profile updated successfully.</p>
        </div>
      )}

      {/* Action buttons */}
      {editing && (
        <div className="flex gap-2">
          <Button type="submit" size="sm" loading={isPending}>Save changes</Button>
          <Button type="button" variant="ghost" size="sm" leftIcon={<X size={13} />} onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      )}
    </form>
  )
}
