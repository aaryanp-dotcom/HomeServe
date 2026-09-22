import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CalendarDays, CheckCircle, TrendingUp } from 'lucide-react'
import { StatCard } from '@/components/ui/shared'
import { Button } from '@/components/ui/button'
import ProfileForm from './ProfileForm'
import { ChangePasswordForm } from '@/components/account/ChangePasswordForm'

export const metadata: Metadata = { title: 'My Profile' }

export default async function HomeownerProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: bookings } = await adminSupabase
    .from('bookings')
    .select('id, status')
    .eq('homeowner_id', user.id)

  const stats = {
    total:     (bookings ?? []).length,
    completed: (bookings ?? []).filter((b) => b.status === 'completed').length,
    active:    (bookings ?? []).filter((b) => !['completed', 'cancelled', 'refunded'].includes(b.status)).length,
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl space-y-6">

      {/* Page title */}
      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="text-sm text-stone-600 mt-0.5">Manage your account details and preferences.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Bookings"  value={stats.total}     icon={<CalendarDays size={16} />} />
        <StatCard label="Active"    value={stats.active}    icon={<TrendingUp size={16} />} />
        <StatCard label="Completed" value={stats.completed} icon={<CheckCircle size={16} />} />
      </div>

      {/* Editable profile form */}
      <ProfileForm
        profile={{
          user_id:    profile.user_id,
          full_name:  profile.full_name,
          phone:      profile.phone,
          city:       profile.city,
          state:      profile.state,
          avatar_url: profile.avatar_url,
        }}
        email={user.email ?? ''}
      />

      {/* Account section */}
      <div className="p-5 border border-ink-900/15 bg-white space-y-3">
        <p className="panel-title">Account</p>
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium text-ink-900">Email Address</p>
            <p className="text-xs text-stone-600 mt-0.5">{user.email}</p>
          </div>
          <span className="text-xs bg-sage-50 text-sage-700 px-2 py-0.5 font-medium border border-sage-200">
            Verified
          </span>
        </div>
        <div className="border-t border-ink-900/10 pt-3">
          <p className="text-xs text-stone-500">
            Member since {new Date(profile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      <ChangePasswordForm />

      {/* Sign out */}
      <form action="/api/auth/signout" method="POST">
        <Button type="submit" variant="outline" fullWidth className="text-rose-700 border-rose-200 hover:bg-rose-50">
          Sign Out
        </Button>
      </form>
    </div>
  )
}
