import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Avatar } from '@/components/ui/shared'
import { Button } from '@/components/ui/button'
import { PageHeader, Panel } from '@/components/ui/layout'
import ContractorProfileForm from './ContractorProfileForm'

export const metadata: Metadata = { title: 'My profile' }

export default async function ContractorProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/contractor/profile')

  const admin = createAdminClient()
  const [{ data: profile }, { data: contractorProfile }] = await Promise.all([
    admin.from('user_profiles').select('*').eq('user_id', user.id).single(),
    admin.from('contractor_profiles').select('*').eq('user_id', user.id).single(),
  ])
  if (!profile) redirect('/login')

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-5 sm:p-8">
      <PageHeader eyebrow="Site team" title="My profile" description="Your contact details and availability, as HomeServe sees them." />

      <div className="panel flex items-center gap-4 p-5">
        <Avatar name={profile.full_name ?? 'C'} src={profile.avatar_url} size="xl" />
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold tracking-[-0.02em] text-ink-900">{profile.full_name}</p>
          <p className="truncate text-sm text-stone-600">{user.email}</p>
          <p className="mt-1 font-mono text-[0.6875rem] uppercase tracking-wider text-stone-600">
            HomeServe site team · since {new Date(profile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })}
          </p>
        </div>
      </div>

      <ContractorProfileForm
        profile={{ full_name: profile.full_name, phone: profile.phone, city: contractorProfile?.city ?? profile.city, state: profile.state, avatar_url: profile.avatar_url }}
        contractorProfile={contractorProfile ? {
          bio: contractorProfile.bio,
          experience_years: contractorProfile.experience_years,
          is_available: contractorProfile.is_available,
          specializations: contractorProfile.specializations ?? [],
        } : null}
        email={user.email ?? ''}
      />

      <Panel title="Session">
        <form action="/api/auth/signout" method="POST">
          <Button type="submit" variant="outline" fullWidth className="border-rose-300 text-rose-700 hover:bg-rose-50">Sign out</Button>
        </form>
      </Panel>
    </div>
  )
}
