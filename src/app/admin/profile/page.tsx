import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/button'
import { PageHeader, Panel } from '@/components/ui/layout'
import AdminProfileForm from './AdminProfileForm'
import { ChangePasswordForm } from '@/components/account/ChangePasswordForm'

export const metadata: Metadata = { title: 'My profile — Admin' }

export default async function AdminProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/admin/profile')

  const admin = createAdminClient()
  const { data: profile } = await admin.from('user_profiles').select('*').eq('user_id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/login')

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-5 sm:p-8">
      <PageHeader eyebrow="Administrator" title="My profile" description="Your own account details, as HomeServe sees them." />

      <AdminProfileForm
        profile={{ full_name: profile.full_name, phone: profile.phone, avatar_url: profile.avatar_url }}
        email={user.email ?? ''}
      />

      <ChangePasswordForm />

      <Panel title="Session">
        <form action="/api/auth/signout" method="POST">
          <Button type="submit" variant="outline" fullWidth className="border-rose-300 text-rose-700 hover:bg-rose-50">Sign out</Button>
        </form>
      </Panel>
    </div>
  )
}
