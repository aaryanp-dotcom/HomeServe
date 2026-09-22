'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Menu, X, ChevronDown, Bell,
  Wrench, Paintbrush, Hammer, Zap, Home, Droplets,
  TreePine, Sofa, Layers, ArrowRight,
  LogOut, User as UserIcon,
} from 'lucide-react'
import { Button, Avatar } from '@/components/ui/shared'
import { AnimatePresence, motion } from 'framer-motion'
import { TitleBlock } from '@/components/arch/TitleBlock'
import { useSessionUser } from '@/lib/supabase/useSessionUser'
import { ROLE_HOME, ROLE_PROFILE, ROLE_NOTIFICATIONS } from '@/lib/auth/redirect'

// ── Account menu (avatar → profile / sign out) ─────────────────────────────────
// Shared by MarketingNav and AppTopBar so "click the avatar" behaves the same
// everywhere a session is shown: it's a real menu, not a decorative image.

function UserMenu({
  user,
  profileHref,
}: {
  user: { name?: string; email?: string; avatar?: string }
  profileHref: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex cursor-pointer items-center"
      >
        <Avatar name={user.name ?? 'User'} src={user.avatar} size="sm" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-56 border-2 border-ink-900 bg-white shadow-hard"
          >
            {(user.name || user.email) && (
              <div className="border-b border-ink-900/10 px-4 py-3">
                {user.name && <p className="truncate text-sm font-semibold text-ink-900">{user.name}</p>}
                {user.email && <p className="truncate text-xs text-stone-500">{user.email}</p>}
              </div>
            )}
            <Link
              href={profileHref}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 transition-colors hover:bg-stone-50"
            >
              <UserIcon size={15} /> My profile
            </Link>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-rose-600 transition-colors hover:bg-rose-50"
              >
                <LogOut size={15} /> Sign out
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ServiceItem {
  icon: React.ReactNode
  label: string
  description: string
  href: string
}

interface MegaMenuColumn {
  heading: string
  items: ServiceItem[]
}

interface NavItem {
  label: string
  href?: string
  megaMenu?: {
    columns: MegaMenuColumn[]
    featured?: {
      image: string
      title: string
      description: string
      href: string
    }
  }
}

// ── Data ──────────────────────────────────────────────────────────────────────

const SERVICE_COLUMNS: MegaMenuColumn[] = [
  {
    heading: 'Full Renovation',
    items: [
      { icon: <Home size={16} />, label: 'Full Home Renovation', description: 'End-to-end renovation & execution', href: '/services/full-home-renovation' },
      { icon: <Layers size={16} />, label: 'Modular Kitchen', description: 'Custom kitchens & cabinetry', href: '/services/modular-kitchen' },
      { icon: <Sofa size={16} />, label: 'Living Room', description: 'Transform your living space', href: '/services/living-room' },
      { icon: <Paintbrush size={16} />, label: 'Bedroom', description: 'Bedroom design & renovation', href: '/services/bedroom' },
    ],
  },
  {
    heading: 'Key Services',
    items: [
      { icon: <Hammer size={16} />, label: 'Kitchen Renovation', description: 'Modular & civil kitchen work', href: '/services/kitchen-renovation' },
      { icon: <Droplets size={16} />, label: 'Bathroom Renovation', description: 'Full bathroom remodelling', href: '/services/bathroom-renovation' },
      { icon: <Paintbrush size={16} />, label: 'Painting', description: 'Interior & exterior painting', href: '/services/painting' },
      { icon: <TreePine size={16} />, label: 'False Ceiling', description: 'Gypsum, POP & wood ceilings', href: '/services/false-ceiling' },
    ],
  },
  {
    heading: 'Specialised Work',
    items: [
      { icon: <Layers size={16} />, label: 'Flooring', description: 'Tiles, marble & wooden flooring', href: '/services/flooring' },
      { icon: <Zap size={16} />, label: 'Electrical', description: 'Wiring, panels, fixtures', href: '/services/electrical' },
      { icon: <Droplets size={16} />, label: 'Plumbing', description: 'Pipes, fittings, sanitaryware', href: '/services/plumbing' },
      { icon: <Wrench size={16} />, label: 'Carpentry & Wardrobes', description: 'Custom furniture & woodwork', href: '/services/carpentry' },
    ],
  },
]

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Services',
    megaMenu: {
      columns: SERVICE_COLUMNS,
      featured: {
        image: 'https://images.unsplash.com/photo-1745301558339-44eb3217d5da?w=400&q=80',
        title: 'Full Home Renovation',
        description: 'From planning and design to execution and handover — one accountable team across Delhi NCR.',
        href: '/services/full-home-renovation',
      },
    },
  },
  { label: 'Designs', href: '/themes' },
  { label: 'Projects', href: '/projects' },
  { label: 'Cost Calculator', href: '/estimate' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Maintenance', href: '/maintenance' },
]

// Routes whose first section is a dark full-bleed hero. Everywhere else the nav
// starts in its solid light style so its links are readable on light backgrounds.
function hasDarkHero(pathname: string) {
  return (
    pathname === '/themes' ||
    pathname.startsWith('/services/') ||
    pathname.startsWith('/themes/')
  )
}

// ── Marketing Nav (landing page) ──────────────────────────────────────────────

export function MarketingNav({ user: userProp }: { user?: { name?: string; email?: string; avatar?: string; role?: string } | null }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const overDark = hasDarkHero(pathname)
  const solid = scrolled || !overDark

  // Marketing pages are mostly static (SSG) for SEO, so there's no server-fetched user available at
  // render time on most of them. A page that already knows the user can still pass it in explicitly
  // (including `null` to force signed-out without a client check); everywhere else we resolve the real
  // session client-side so the nav is never wrong just because the page under it happens to be static.
  const { user: sessionUser } = useSessionUser()
  const user = userProp !== undefined ? userProp : sessionUser
  const dashboardHref = ROLE_HOME[user?.role ?? ''] ?? '/homeowner/dashboard'
  const profileHref = ROLE_PROFILE[user?.role ?? ''] ?? '/homeowner/profile'
  const notificationsHref = ROLE_NOTIFICATIONS[user?.role ?? '']

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setActiveMenu(null)
  }, [pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setActiveMenu(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header
      className={cn(
        // `isolate` keeps this header's blur in its own stacking context — Safari has a known bug
        // where a fixed backdrop-blur element bleeds into other animated (transform/opacity) elements
        // further down the page, washing out their backgrounds so light text on a dark bar goes
        // near-invisible. Isolating the blurred element is the standard fix.
        'fixed top-0 inset-x-0 z-50 isolate transition-all duration-300',
        solid
          ? 'bg-paper-100/95 backdrop-blur-md border-b-2 border-ink-900'
          : 'bg-transparent',
      )}
    >
      <div className="container-site">
        <div className="flex items-center justify-between h-15">

          {/* Logo */}
          <Link href="/" className="flex min-h-11 items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 bg-cobalt-400 flex items-center justify-center">
              <Home size={16} className="text-white" />
            </div>
            <span className={cn(
              'text-lg font-extrabold tracking-[-0.04em] transition-colors',
              solid ? 'text-stone-900' : 'text-white',
            )}>
              HomeServe
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1" ref={menuRef}>
            {NAV_ITEMS.map((item) => (
              <div key={item.label} className="relative">
                {item.megaMenu ? (
                  <button
                    className={cn(
                      'flex items-center gap-1 whitespace-nowrap px-1.5 py-2 font-mono text-[0.75rem] uppercase tracking-[0.06em] font-medium transition-all duration-150 xl:px-3 xl:tracking-[0.1em]',
                      solid
                        ? 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                        : 'text-white/80 hover:text-white hover:bg-white/10',
                      activeMenu === item.label && (solid ? 'bg-stone-100 text-stone-900' : 'bg-white/10 text-white'),
                    )}
                    onMouseEnter={() => setActiveMenu(item.label)}
                    onMouseLeave={() => setActiveMenu(null)}
                    aria-expanded={activeMenu === item.label}
                  >
                    {item.label}
                    <ChevronDown
                      size={14}
                      className={cn('transition-transform duration-200', activeMenu === item.label && 'rotate-180')}
                    />
                  </button>
                ) : (
                  <Link
                    href={item.href!}
                    className={cn(
                      'flex items-center whitespace-nowrap px-1.5 py-2 font-mono text-[0.75rem] uppercase tracking-[0.06em] font-medium transition-all duration-150 xl:px-3 xl:tracking-[0.1em]',
                      solid
                        ? 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                        : 'text-white/80 hover:text-white hover:bg-white/10',
                    )}
                  >
                    {item.label}
                  </Link>
                )}

                {/* Mega Menu Dropdown */}
                {item.megaMenu && activeMenu === item.label && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 pt-3"
                    onMouseEnter={() => setActiveMenu(item.label)}
                    onMouseLeave={() => setActiveMenu(null)}
                  >
                    <div className="w-[760px] bg-paper-50 border-2 border-ink-900 shadow-hard p-6 grid grid-cols-4 gap-6 animate-fade-down">
                      {/* Columns */}
                      {item.megaMenu.columns.map((col) => (
                        <div key={col.heading}>
                          <p className="font-mono text-[0.6875rem] font-semibold text-cobalt-500 uppercase tracking-[0.16em] mb-3">
                            {col.heading}
                          </p>
                          <ul className="space-y-0.5">
                            {col.items.map((svc) => (
                              <li key={svc.label}>
                                <Link
                                  href={svc.href}
                                  className="flex items-start gap-2.5 p-2 hover:bg-stone-50 transition-colors group"
                                >
                                  <span className="mt-0.5 text-stone-400 group-hover:text-cobalt-500 transition-colors shrink-0">
                                    {svc.icon}
                                  </span>
                                  <div>
                                    <p className="text-sm font-medium text-stone-800 group-hover:text-cobalt-600 transition-colors">
                                      {svc.label}
                                    </p>
                                    <p className="text-xs text-stone-400 leading-snug mt-0.5">
                                      {svc.description}
                                    </p>
                                  </div>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}

                      {/* Featured tile */}
                      {item.megaMenu.featured && (
                        <Link
                          href={item.megaMenu.featured.href}
                          className="group relative overflow-hidden bg-stone-900 flex flex-col justify-end p-4 min-h-[180px]"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.megaMenu.featured.image}
                            alt={item.megaMenu.featured.title}
                            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-70 group-hover:scale-105 transition-all duration-500"
                          />
                          <div className="relative z-10">
                            <p className="text-xs font-semibold text-cobalt-300 mb-1">Featured</p>
                            <p className="text-sm font-semibold text-white leading-snug">
                              {item.megaMenu.featured.title}
                            </p>
                            <p className="text-xs text-white/70 mt-1 leading-relaxed line-clamp-2">
                              {item.megaMenu.featured.description}
                            </p>
                            <span className="mt-3 inline-flex items-center gap-1 text-xs text-cobalt-300 font-medium">
                              Explore <ArrowRight size={11} />
                            </span>
                          </div>
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {notificationsHref && (
                  <Link
                    href={notificationsHref}
                    className={cn(
                      'hidden lg:flex items-center justify-center h-9 w-9 transition-all duration-150',
                      solid
                        ? 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
                        : 'text-white/70 hover:text-white hover:bg-white/10',
                    )}
                    aria-label="Notifications"
                  >
                    <Bell size={17} />
                  </Link>
                )}
                <Link
                  href={dashboardHref}
                  className={cn(
                    'hidden lg:inline-flex items-center whitespace-nowrap px-1.5 py-2 font-mono text-[0.75rem] uppercase tracking-[0.06em] font-medium transition-all duration-150 xl:px-3 xl:tracking-[0.1em]',
                    solid
                      ? 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                      : 'text-white/80 hover:text-white hover:bg-white/10',
                  )}
                >
                  Dashboard
                </Link>
                <UserMenu user={user} profileHref={profileHref} />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={cn(
                    'hidden lg:inline-flex items-center whitespace-nowrap px-1.5 py-2 font-mono text-[0.75rem] uppercase tracking-[0.06em] font-medium transition-all duration-150 xl:px-3 xl:tracking-[0.1em]',
                    solid
                      ? 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                      : 'text-white/80 hover:text-white hover:bg-white/10',
                  )}
                >
                  Sign in
                </Link>
                <Link href="/get-started" className="hidden lg:block">
                  <Button
                    size="sm"
                    className={cn(
                      'inline-flex whitespace-nowrap',
                      !solid && 'bg-white text-stone-900 hover:bg-stone-100',
                    )}
                    variant={solid ? 'primary' : 'secondary'}
                  >
                    <span className="xl:hidden">Start renovation</span>
                    <span className="hidden xl:inline">Start Your Renovation</span>
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              className={cn(
                'lg:hidden flex items-center justify-center h-9 w-9 coarse:h-11 coarse:w-11 transition-all',
                solid
                  ? 'text-stone-600 hover:bg-stone-100'
                  : 'text-white hover:bg-white/10',
              )}
              onClick={() => setMobileOpen((p) => !p)}
              aria-expanded={mobileOpen}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        // This drawer renders inside the fixed header itself, not as its own full-screen overlay,
        // so without its own scroll container the header (and everything after the logo row) simply
        // grows past the viewport — on a phone, once nav items + every service under "Services" add
        // up to more than one screen's height, the bottom of the list (Services included) is stuck
        // with nothing to scroll: the page behind can still scroll, the fixed header can't.
        <div className="lg:hidden max-h-[calc(100dvh-3.75rem)] overflow-y-auto overscroll-contain border-t border-ink-900/15 bg-white animate-fade-down">
          <nav className="container-site py-4 space-y-1">
            {NAV_ITEMS.map((item) => (
              <div key={item.label}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="flex items-center px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <p className="px-3 py-2.5 text-sm font-medium text-stone-400">{item.label}</p>
                )}
                {item.megaMenu && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.megaMenu.columns.flatMap((col) => col.items).map((svc) => (
                      <Link
                        key={svc.label}
                        href={svc.href}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50"
                      >
                        <span className="text-stone-400">{svc.icon}</span>
                        {svc.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-3 border-t border-stone-100 flex flex-col gap-2">
              {user ? (
                <>
                  <Link href={dashboardHref}>
                    <Button variant="outline" fullWidth className="justify-start gap-2.5">
                      <Avatar name={user.name ?? 'User'} src={user.avatar} size="sm" />
                      {user.name ?? 'Dashboard'}
                    </Button>
                  </Link>
                  {notificationsHref && (
                    <Link href={notificationsHref}>
                      <Button variant="outline" fullWidth className="justify-start gap-2.5">
                        <Bell size={15} /> Notifications
                      </Button>
                    </Link>
                  )}
                  <Link href={profileHref}>
                    <Button variant="outline" fullWidth className="justify-start gap-2.5">
                      <UserIcon size={15} /> My profile
                    </Button>
                  </Link>
                  <form action="/api/auth/signout" method="post">
                    <Button type="submit" variant="outline" fullWidth className="justify-start gap-2.5 text-rose-700 border-rose-200 hover:bg-rose-50">
                      <LogOut size={15} /> Sign out
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline" fullWidth>Sign in</Button>
                  </Link>
                  <Link href="/get-started">
                    <Button fullWidth>Start Your Renovation</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

// ── App Sidebar (authenticated portals) ───────────────────────────────────────

interface SidebarItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: string | number
}

interface AppSidebarProps {
  items: SidebarItem[]
  user: { name: string; email?: string; role?: string; avatar?: string }
  onSignOut?: () => void
}

export function AppSidebar({ items, user, onSignOut }: AppSidebarProps) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  useEffect(() => setMoreOpen(false), [pathname])

  const signOut = onSignOut ? (
    <button
      onClick={onSignOut}
      aria-label="Sign out"
      className="p-2 text-stone-300 transition-colors hover:bg-white/10 hover:text-rose-300"
    >
      <LogOut size={15} />
    </button>
  ) : (
    <form action="/api/auth/signout" method="post">
      <button
        type="submit"
        aria-label="Sign out"
        className="p-2 text-stone-300 transition-colors hover:bg-white/10 hover:text-rose-300"
      >
        <LogOut size={15} />
      </button>
    </form>
  )

  // Mobile: first four destinations live in a bottom bar, the rest under "More".
  const primary = items.slice(0, 4)
  const overflow = items.slice(4)

  return (
    <>
      <aside aria-label="Account navigation" className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/5 bg-ink-950 lg:flex">
        {/* Logo */}
        <div className="flex h-[4.5rem] items-center px-6">
          <Link href="/" className="flex min-h-11 items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center bg-cobalt-400">
              <Home size={16} className="text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-[-0.04em] text-white">HomeServe</span>
          </Link>
        </div>

        {/* Nav */}
        <nav aria-label="Portal sections" className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {items.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group relative flex items-center justify-between gap-2.5 px-3.5 py-2.5 font-mono text-[0.75rem] font-medium uppercase tracking-[0.08em] transition-colors',
                  active ? 'text-white' : 'text-stone-300 hover:text-white',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-white/[0.08] ring-1 ring-inset ring-white/15"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  />
                )}
                {active && (
                  <motion.span
                    layoutId="sidebar-bar"
                    className="absolute -left-3 top-0 h-full w-1 bg-cobalt-400"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  />
                )}
                <span className="relative flex min-w-0 items-center gap-3">
                  <span className={cn('shrink-0 transition-colors', active ? 'text-cobalt-400' : 'text-stone-300 group-hover:text-stone-300')}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badge && (
                  <span className="relative min-w-[20px] shrink-0 bg-cobalt-500 px-1.5 text-center text-xs font-semibold text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="border-t border-white/5 p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar name={user.name} src={user.avatar} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-xs text-stone-300">{user.role ?? user.email}</p>
            </div>
            {signOut}
          </div>
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav aria-label="Portal shortcuts" className="fixed inset-x-0 bottom-0 z-40 isolate border-t-2 border-ink-900 bg-ink-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="flex items-stretch justify-around px-1">
          {primary.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn('flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.6875rem] font-medium', active ? 'text-white' : 'text-stone-300')}
              >
                <span className={cn(' px-4 py-1 transition-colors', active && 'bg-white/10 text-brass-300')}>{item.icon}</span>
                <span className="max-w-[4.5rem] truncate">{item.label}</span>
              </Link>
            )
          })}
          {overflow.length > 0 && (
            <button
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              className={cn('flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.6875rem] font-medium', moreOpen ? 'text-white' : 'text-stone-300')}
            >
              <span className=" px-4 py-1">
                <Menu size={17} />
              </span>
              More
            </button>
          )}
        </div>
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.button
              aria-label="Close menu"
              className="fixed inset-0 z-40 isolate bg-black/50 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              // Anchored to the bottom and grows upward with no cap — a role with enough overflow
              // items (admin now has 8) can push this off the top of a short phone screen with
              // nothing to scroll it back into view, same class of bug as the main drawer above.
              // max-h keeps it shrink-wrapped to content as before for roles with few items, and
              // caps + scrolls instead of overflowing for roles with many.
              className="fixed inset-x-3 bottom-[5.25rem] z-50 max-h-[min(70dvh,28rem)] overflow-y-auto overscroll-contain border border-white/10 bg-ink-900 p-2 shadow-2xl lg:hidden"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {overflow.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 text-sm font-medium',
                    isActive(item.href) ? 'bg-white/10 text-white' : 'text-stone-300 hover:bg-white/5',
                  )}
                >
                  <span className="text-brass-300">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              <div className="mt-1 flex items-center justify-between border-t border-white/5 px-4 py-3">
                <span className="truncate text-sm text-stone-300">{user.name}</span>
                {signOut}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// ── Top Bar (for app pages) ───────────────────────────────────────────────────

export function AppTopBar({
  title,
  actions,
  user,
  profileHref = '/homeowner/profile',
  notificationsHref,
  unreadCount = 0,
}: {
  title?: string
  actions?: React.ReactNode
  user?: { name: string; avatar?: string }
  /** Where the account menu's "My profile" link goes — pass the caller's own portal profile page. */
  profileHref?: string
  notificationsHref?: string
  /** Number of unread notifications; the badge is hidden when 0. */
  unreadCount?: number
}) {
  return (
    <header className="sticky top-0 z-30 isolate flex h-[4.5rem] shrink-0 items-center justify-between border-b-2 border-ink-900 bg-paper-100/90 px-5 backdrop-blur-md sm:px-8">
      <div className="flex items-center gap-4">
        <Link href="/" aria-label="HomeServe home" className="flex min-h-11 min-w-11 items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center bg-cobalt-500">
            <Home size={15} className="text-white" />
          </div>
        </Link>
        {title && <h1 className="text-base font-semibold tracking-tight text-stone-900">{title}</h1>}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        {user && (
          <div className="ml-2 flex items-center gap-2">
            {notificationsHref && (
              <Link
                href={notificationsHref}
                className="relative flex h-10 w-10 items-center justify-center text-stone-500 transition-all hover:bg-stone-100 hover:text-stone-900"
                aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center bg-cobalt-500 px-1 text-[0.6875rem] font-semibold text-white ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}
            <UserMenu user={user} profileHref={profileHref} />
          </div>
        )}
      </div>
    </header>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────

export function Footer({ showCta = true }: { showCta?: boolean }) {
  const year = new Date().getFullYear()

  const cols = [
    {
      heading: 'Services',
      links: [
        { label: 'Full Home Renovation', href: '/services/full-home-renovation' },
        { label: 'Kitchen Renovation', href: '/services/kitchen-renovation' },
        { label: 'Bathroom Renovation', href: '/services/bathroom-renovation' },
        { label: 'Painting', href: '/services/painting' },
        { label: 'Flooring', href: '/services/flooring' },
        { label: 'False Ceiling', href: '/services/false-ceiling' },
        { label: 'Carpentry & Wardrobes', href: '/services/carpentry' },
      ],
    },
    {
      heading: 'Locations',
      links: [
        { label: 'Delhi', href: '/locations/delhi' },
        { label: 'Noida', href: '/locations/noida' },
        { label: 'Greater Noida', href: '/locations/greater-noida' },
        { label: 'Ghaziabad', href: '/locations/ghaziabad' },
        { label: 'Gurugram', href: '/locations/gurugram' },
        { label: 'Faridabad', href: '/locations/faridabad' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Our Projects', href: '/projects' },
        { label: 'How It Works', href: '/how-it-works' },
        { label: 'Contact Us', href: '/contact' },
        { label: 'FAQs', href: '/faqs' },
      ],
    },
    {
      heading: 'Customer',
      links: [
        { label: 'My Account', href: '/homeowner/dashboard' },
        { label: 'My Projects', href: '/homeowner/bookings' },
        { label: 'Payments', href: '/homeowner/payments' },
        { label: 'Warranty & Support', href: '/homeowner/warranty' },
        { label: 'Home Maintenance', href: '/maintenance' },
      ],
    },
    {
      heading: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Cancellation & Refund', href: '/refund-policy' },
      ],
    },
  ]

  return (
    <footer className="bg-blueprint-dark relative overflow-hidden border-t-2 border-ink-900 text-stone-300">
      <div className={cn('mx-auto max-w-[1440px] px-5 sm:px-8', showCta ? 'pt-20' : 'pt-16')}>
        {showCta && (
          <div className="mb-16 flex flex-wrap items-end justify-between gap-8 border-b border-paper-100/20 pb-16">
            <h2
              className="max-w-3xl font-display text-[clamp(2rem,4vw,3.3rem)] font-bold leading-[1.04] tracking-[-0.03em] text-paper-100"
              
            >
              Let&apos;s make your home <span className="inline-block bg-cobalt-400 px-[0.14em] text-white">feel new.</span>
            </h2>
            <Link
              href="/get-started"
              className="group inline-flex items-center gap-3 bg-paper-100 py-4 pl-6 pr-4 text-sm font-semibold text-ink-900 transition-colors hover:bg-white"
            >
              Start your renovation
              <span className="flex h-8 w-8 items-center justify-center bg-cobalt-400 text-white transition-transform group-hover:translate-x-1">
                <ArrowRight size={16} />
              </span>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 gap-10 md:grid-cols-3 lg:grid-cols-[1.4fr_repeat(5,1fr)] lg:gap-8">
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center bg-cobalt-400">
                <Home size={16} className="text-white" />
              </div>
              <span className="text-lg font-extrabold tracking-[-0.04em] text-paper-100">HomeServe</span>
            </Link>
            <p className="max-w-[240px] text-sm leading-snug text-stone-300">
              Your trusted home renovation partner across Delhi NCR. From planning to handover, under one roof.
            </p>
          </div>

          {cols.map((col) => (
            <div key={col.heading}>
              <p className="mb-5 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-cobalt-400">{col.heading}</p>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="group/link relative inline-block text-sm text-stone-300 transition-colors hover:text-white"
                    >
                      {l.label}
                      <span className="absolute -bottom-0.5 left-0 h-0.5 w-full origin-left scale-x-0 bg-cobalt-400 transition-transform duration-300 group-hover/link:scale-x-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <TitleBlock className="mt-16" />
        <div className="flex flex-wrap items-center justify-between gap-4 py-6 font-mono text-[0.6875rem] uppercase tracking-wider text-stone-300">
          <p>© {year} HomeServe. All rights reserved.</p>
          <p>Delhi · Noida · Greater Noida · Ghaziabad · Gurugram · Faridabad</p>
        </div>
      </div>

      {/* Oversized wordmark, cropped by the bottom edge */}
      <div aria-hidden className="pointer-events-none select-none overflow-hidden">
        <p
          className="-mb-[0.2em] whitespace-nowrap text-center font-display font-bold leading-[0.82] tracking-[-0.03em] text-paper-100/[0.055]"
          style={{ fontSize: 'clamp(4.5rem, 17vw, 15rem)' }}
        >
          HomeServe
        </p>
      </div>
    </footer>
  )
}
