import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { noIndex } from '@/lib/seo'
import {
  LayoutDashboard, CalendarDays, CreditCard, Bell,
  User, Wrench, Star, ClipboardList, ShieldCheck, Hammer, BadgeCheck, History, LifeBuoy,
} from 'lucide-react'
import { AppSidebar, AppTopBar } from '@/components/shared/Navigation'
import { PageEnter } from '@/components/motion/PageEnter'
import { SheetStrip } from '@/components/arch/SheetStrip'
import { dedupeFeed } from '@/lib/notifications/feed'

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
  if (!user) redirect('/login?redirect=/homeowner/dashboard')
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, email, role, avatar_url')
    .eq('user_id', user.id)
    .single()
  // One unread item per event, not one per channel / delivery attempt.
  const { data: unreadRows } = await supabase
    .from('notification_logs')
    .select('id, event, created_at, read_at, booking_id, reference_id')
    .eq('user_id', user.id)
    .is('read_at', null)
    .order('created_at', { ascending: false })
    .limit(100)
  return { user, profile, unread: dedupeFeed(unreadRows ?? []).length }
}

const NAV = [
  { label: 'Dashboard',     href: '/homeowner/dashboard',     icon: <LayoutDashboard size={17} /> },
  { label: 'My Requests',   href: '/homeowner/requests',      icon: <ClipboardList size={17} /> },
  { label: 'My Projects',   href: '/homeowner/projects',      icon: <CalendarDays size={17} /> },
  { label: 'Services',      href: '/services',                icon: <Wrench size={17} /> },
  { label: 'Payments',      href: '/homeowner/payments',      icon: <CreditCard size={17} /> },
  { label: 'Warranty',      href: '/homeowner/warranty',      icon: <ShieldCheck size={17} /> },
  { label: 'Maintenance',   href: '/homeowner/maintenance',   icon: <Hammer size={17} /> },
  { label: 'Membership',    href: '/homeowner/membership',    icon: <BadgeCheck size={17} /> },
  { label: 'History',       href: '/homeowner/history',       icon: <History size={17} /> },
  { label: 'Notifications', href: '/homeowner/notifications', icon: <Bell size={17} /> },
  { label: 'Reviews',       href: '/homeowner/reviews',       icon: <Star size={17} /> },
  { label: 'Profile',       href: '/homeowner/profile',       icon: <User size={17} /> },
  { label: 'Support',       href: '/homeowner/support',       icon: <LifeBuoy size={17} /> },
]

export const metadata: Metadata = noIndex

export default async function HomeownerLayout({ children }: { children: React.ReactNode }) {
  const { profile, unread } = await getUser()

  return (
    <div className="flex min-h-screen bg-paper-100">
      <AppSidebar
        items={NAV}
        user={{
          name: profile?.full_name ?? 'Homeowner',
          email: profile?.email,
          role: 'Homeowner',
          avatar: profile?.avatar_url,
        }}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppTopBar
          user={{ name: profile?.full_name ?? 'Homeowner', avatar: profile?.avatar_url }}
          profileHref="/homeowner/profile"
          notificationsHref="/homeowner/notifications"
          unreadCount={unread}
        />
        <SheetStrip prefix="H" items={NAV.map(({ label, href }) => ({ label, href }))} />
        <main className="flex-1 pb-24 lg:pb-0">
          <PageEnter>{children}</PageEnter>
        </main>
      </div>
    </div>
  )
}
