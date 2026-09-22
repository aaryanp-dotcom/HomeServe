import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { noIndex } from '@/lib/seo'
import { LayoutDashboard, Briefcase, User } from 'lucide-react'
import { AppSidebar, AppTopBar } from '@/components/shared/Navigation'
import { PageEnter } from '@/components/motion/PageEnter'
import { SheetStrip } from '@/components/arch/SheetStrip'

async function getUser() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cs: { name: string; value: string; options?: Record<string, unknown> }[]) { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
      },
    },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/contractor/dashboard')
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, email, avatar_url')
    .eq('user_id', user.id)
    .single()
  return { user, profile }
}

const NAV = [
  { label: 'Dashboard',  href: '/contractor/dashboard',  icon: <LayoutDashboard size={17} /> },
  { label: 'My Jobs',    href: '/contractor/jobs',       icon: <Briefcase size={17} /> },
  { label: 'Profile',    href: '/contractor/profile',    icon: <User size={17} /> },
]

export const metadata: Metadata = noIndex

export default async function ContractorLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getUser()

  return (
    <div className="flex min-h-screen bg-paper-100">
      <AppSidebar
        items={NAV}
        user={{
          name: profile?.full_name ?? 'Site contractor',
          email: profile?.email,
          role: 'HomeServe site team',
          avatar: profile?.avatar_url,
        }}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <AppTopBar
          user={{ name: profile?.full_name ?? 'Site contractor', avatar: profile?.avatar_url }}
        />
        <SheetStrip prefix="C" items={NAV.map(({ label, href }) => ({ label, href }))} />
        <main className="flex-1 pb-24 lg:pb-0">
          <PageEnter>{children}</PageEnter>
        </main>
      </div>
    </div>
  )
}
