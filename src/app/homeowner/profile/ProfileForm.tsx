'use client'

import { useState, useTransition } from 'react'
import { updateHomeownerProfile } from './actions'
import { Avatar } from '@/components/ui/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/shared'
import { CheckCircle, Edit2, X } from 'lucide-react'

interface ProfileFormProps {
  profile: {
    user_id: string
    full_name: string | null
    phone: string | null
    city: string | null
    state: string | null
    avatar_url: string | null
  }
  email: string
}

export default function ProfileForm({ profile, email }: ProfileFormProps) {
  const [editing, setEditing]     = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [fullName, setFullName]   = useState(profile.full_name ?? '')
  const [phone, setPhone]         = useState(profile.phone ?? '')
  const [city, setCity]           = useState(profile.city ?? '')
  const [state, setState]         = useState(profile.state ?? '')

  function handleCancel() {
    setFullName(profile.full_name ?? '')
    setPhone(profile.phone ?? '')
    setCity(profile.city ?? '')
    setState(profile.state ?? '')
    setEditing(false)
    setError(null)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await updateHomeownerProfile({
        full_name: fullName,
        phone: phone || null,
        city: city || null,
        state: state || null,
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
    <form onSubmit={handleSave} className="space-y-5">
      {/* Avatar row */}
      <div className="flex items-center gap-4 p-5 border border-ink-900/15 bg-white">
        <Avatar name={fullName || 'U'} src={profile.avatar_url} size="xl" />
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-ink-900 truncate">{fullName || '—'}</p>
          <p className="text-sm text-stone-600">{email}</p>
        </div>
        {!editing && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<Edit2 size={13} />}
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
        )}
      </div>

      {/* Fields */}
      <div className="p-5 border border-ink-900/15 bg-white space-y-4">
        <p className="panel-title">Personal Information</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {editing ? (
            <>
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <Input
                label="Phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
              <Input
                label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Noida"
              />
              <Input
                label="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Karnataka"
              />
            </>
          ) : (
            <>
              <div>
                <p className="text-xs text-stone-500 mb-1">Full Name</p>
                <p className="text-sm font-medium text-ink-900">{fullName || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-1">Email</p>
                <p className="text-sm font-medium text-ink-900">{email}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-1">Phone</p>
                <p className="text-sm font-medium text-ink-900">{phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-1">City</p>
                <p className="text-sm font-medium text-ink-900">{city || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-1">State</p>
                <p className="text-sm font-medium text-ink-900">{state || '—'}</p>
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200">
            <p className="text-xs text-rose-700">{error}</p>
          </div>
        )}

        {saved && (
          <div className="flex items-center gap-2 p-3 bg-sage-50 border border-sage-200">
            <CheckCircle size={14} className="text-sage-700" />
            <p className="text-xs text-sage-700 font-medium">Profile updated successfully.</p>
          </div>
        )}

        {editing && (
          <div className="flex gap-2 pt-1">
            <Button type="submit" size="sm" loading={isPending}>Save changes</Button>
            <Button type="button" variant="ghost" size="sm" leftIcon={<X size={13} />} onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </form>
  )
}
