import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { noIndex } from '@/lib/seo'
import {
  LayoutDashboard, Users, CreditCard,
  Package, Flag, PhoneCall, MapPin, FileText, Hammer, LifeBuoy, HardHat, User,
} from 'lucide-react'
import { AppSidebar, AppTopBar } from '@/components/shared/Navigation'
import { PageEnter } from '@/components/motion/PageEnter'
import { SheetStrip } from '@/components/arch/SheetStrip'

async function getUser() {
  const cookieStore = await cookies()
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
  if (!user) redirect('/login?redirect=/admin/dashboard')
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, email, role, avatar_url')
    .eq('user_id', user.id)
    .single()
  if (profile?.role !== 'admin') redirect('/homeowner/dashboard')

  // MFA enforcement lives in middleware.ts, not here. This layout wraps every
  // route under /admin/*, including /admin/mfa/setup and /admin/mfa/verify
  // themselves (Next.js layouts apply to all nested segments — there's no way
  // for a layout to exclude its own child routes). A redirect-if-not-verified
  // check here would redirect the MFA setup page to itself, since it can't
  // tell "I'm already on the escape-hatch page" apart from any other admin
  // page. Middleware has the actual request pathname and can exclude
  // /admin/mfa from the check, so that's where this belongs.

  return { user, profile }
}

const NAV = [
  { label: 'Dashboard',    href: '/admin/dashboard',    icon: <LayoutDashboard size={17} /> },
  { label: 'Leads',        href: '/admin/leads',         icon: <PhoneCall size={17} /> },
  { label: 'Site Visits',  href: '/admin/site-visits',   icon: <MapPin size={17} /> },
  { label: 'Quotations',   href: '/admin/quotations',    icon: <FileText size={17} /> },
  { label: 'Projects',     href: '/admin/projects',      icon: <Package size={17} /> },
  { label: 'Payments',     href: '/admin/payments',      icon: <CreditCard size={17} /> },
  { label: 'Maintenance',  href: '/admin/maintenance',   icon: <Hammer size={17} /> },
  { label: 'Customers',    href: '/admin/customers',     icon: <Users size={17} /> },
  { label: 'Site Team',    href: '/admin/team',          icon: <HardHat size={17} /> },
  { label: 'Services',     href: '/admin/services',      icon: <Flag size={17} /> },
  { label: 'Tickets',      href: '/admin/tickets',       icon: <LifeBuoy size={17} /> },
  { label: 'My Profile',   href: '/admin/profile',       icon: <User size={17} /> },
]

export const metadata: Metadata = noIndex

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getUser()

  return (
    <div className="flex min-h-screen bg-paper-100">
      <AppSidebar
        items={NAV}
        user={{
          name: profile?.full_name ?? 'Admin',
          email: profile?.email,
          role: 'Administrator',
          avatar: profile?.avatar_url,
        }}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <AppTopBar
          user={{ name: profile?.full_name ?? 'Admin', avatar: profile?.avatar_url }}
          profileHref="/admin/profile"
        />
        <SheetStrip prefix="A" items={NAV.map(({ label, href }) => ({ label, href }))} />
        <main className="flex-1 pb-24 lg:pb-0">
          <PageEnter>{children}</PageEnter>
        </main>
      </div>
    </div>
  )
}
