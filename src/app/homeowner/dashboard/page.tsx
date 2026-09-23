import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  Plus, CheckCircle, Clock, ChevronRight, CalendarDays,
  TrendingUp, Home, CreditCard, FileText, ArrowUpRight, Layers, Wrench,
  FileSignature, Star, ShieldCheck, AlertCircle, LifeBuoy,
} from 'lucide-react'
import { StatCard, Badge, Button, EmptyState } from '@/components/ui/shared'
import { ProgressFill } from '@/components/ui/ProgressFill'
import { Reveal } from '@/components/motion/Reveal'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'My Dashboard' }

// ── Helpers ───────────────────────────────────────────────────────────────────

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

type Variant = 'success' | 'warning' | 'danger' | 'accent' | 'default'
const STATUS: Record<string, { label: string; variant: Variant }> = {
  pending:          { label: 'Pending',         variant: 'warning' },
  payment_pending:  { label: 'Awaiting payment', variant: 'warning' },
  confirmed:        { label: 'Confirmed',       variant: 'accent' },
  assigned:         { label: 'Assigned',        variant: 'accent' },
  in_progress:      { label: 'In progress',     variant: 'accent' },
  milestone_1_done: { label: 'In progress',     variant: 'accent' },
  milestone_2_done: { label: 'In progress',     variant: 'accent' },
  completed:        { label: 'Completed',       variant: 'success' },
  cancelled:        { label: 'Cancelled',       variant: 'danger' },
  refunded:         { label: 'Refunded',        variant: 'default' },
}
const CLOSED = ['completed', 'cancelled', 'refunded']

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS[status] ?? { label: status.replace(/_/g, ' '), variant: 'default' as Variant }
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
}

const QUICK_ACTIONS = [
  { icon: <Plus size={18} />,       label: 'New request',      hint: 'Free site visit',   href: '/get-started' },
  { icon: <Home size={18} />,       label: 'Explore designs',  hint: 'Themes & palettes', href: '/themes' },
  { icon: <FileText size={18} />,   label: 'My projects',      hint: 'Progress & photos', href: '/homeowner/projects' },
  { icon: <CreditCard size={18} />, label: 'Payments',         hint: 'Milestones & receipts', href: '/homeowner/payments' },
  { icon: <Wrench size={18} />,     label: 'Home care',        hint: 'Repairs & servicing', href: '/homeowner/maintenance' },
  { icon: <LifeBuoy size={18} />,   label: 'Raise a ticket',   hint: 'Get in touch',      href: '/homeowner/support/new' },
]

const SUGGESTED_SERVICES = [
  { label: 'Modular Kitchen', slug: 'modular-kitchen', image: 'https://images.unsplash.com/photo-1755771984341-546c2a04f236?w=300&q=75', from: '₹80K' },
  { label: 'Living Room',     slug: 'living-room',     image: 'https://images.unsplash.com/photo-1745301558339-44eb3217d5da?w=300&q=75', from: '₹40K' },
  { label: 'Bathroom',        slug: 'bathroom-renovation', image: 'https://images.unsplash.com/photo-1789121274502-84fe89234993?w=300&q=75', from: '₹15K' },
]

type Milestone = { milestone_number: number; title: string; amount: number; status: string }
type BookingRow = {
  id: string
  status: string
  booking_type: string
  scheduled_date: string | null
  total_amount: number | null
  paid_amount: number | null
  service_category: string | null
  project_title: string | null
  booking_number: string
  services: { name?: string } | { name?: string }[] | null
  milestones: Milestone[] | null
}

const titleOf = (b: BookingRow) => {
  const svc = Array.isArray(b.services) ? b.services[0]?.name : b.services?.name
  return b.project_title ?? svc ?? b.service_category ?? 'Renovation project'
}
const hrefOf = (b: BookingRow) =>
  b.booking_type === 'project' ? `/homeowner/projects/${b.id}` : `/homeowner/bookings/${b.id}`

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomeownerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [bookingsRes, profileRes, quotationsRes, maintReq, reviewedRes, activeSubRes] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, status, booking_type, scheduled_date, total_amount, paid_amount, service_category, project_title, booking_number, services(name), milestones(milestone_number, title, amount, status)')
      .eq('homeowner_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('user_profiles').select('full_name').eq('user_id', user.id).single(),
    // Quotations still waiting on the homeowner's decision.
    supabase.from('quotations').select('id, quotation_number, project_title, total_amount, status').in('status', ['sent', 'viewed']),
    // Maintenance requests HomeServe says are done, waiting on the homeowner to confirm.
    supabase.from('maintenance_requests').select('id, request_number, category').eq('user_id', user.id).eq('status', 'completed'),
    // Open (unreviewed) completed work, across both renovation and maintenance.
    supabase.from('reviews').select('booking_id, maintenance_request_id').eq('homeowner_id', user.id),
    // An active or upcoming membership, if any.
    supabase.from('maintenance_subscriptions').select('id, plan_snapshot, end_date').eq('user_id', user.id).in('status', ['active', 'upcoming']).order('end_date', { ascending: true }).limit(1).maybeSingle(),
  ])

  if (bookingsRes.error) console.error('[homeowner/dashboard] bookings query failed', bookingsRes.error.code, bookingsRes.error.hint)

  const bookings = (bookingsRes.data ?? []) as unknown as BookingRow[]
  const active = bookings.filter((b) => !CLOSED.includes(b.status))
  const featured = active.find((b) => b.booking_type === 'project') ?? active[0]

  const stats = {
    total: bookings.length,
    active: active.length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    paid: bookings.reduce((sum, b) => sum + Number(b.paid_amount ?? 0), 0),
  }

  // ── Needs your attention: quotations to decide on, work to confirm, payments due, reviews owed ──
  const pendingQuotations = quotationsRes.data ?? []
  const awaitingConfirmation = maintReq.data ?? []
  const reviewedBookingIds = new Set((reviewedRes.data ?? []).map((r) => r.booking_id).filter(Boolean))
  const unreviewedCompleted = bookings.filter((b) => b.status === 'completed' && !reviewedBookingIds.has(b.id))
  const paymentDue = active.filter((b) => Number(b.total_amount ?? 0) > Number(b.paid_amount ?? 0))
  const paymentDueTotal = paymentDue.reduce((s, b) => s + (Number(b.total_amount ?? 0) - Number(b.paid_amount ?? 0)), 0)

  const attention = [
    ...pendingQuotations.map((q) => ({
      key: `q-${q.id}`, icon: <FileSignature size={15} />,
      text: `Quotation ${q.quotation_number ?? ''} is ready to review${q.total_amount ? ` — ${inr(Number(q.total_amount))}` : ''}`,
      href: `/homeowner/quotations/${q.id}`, cta: 'Review',
    })),
    ...(paymentDue.length > 0 ? [{
      key: 'payments', icon: <CreditCard size={15} />,
      text: `${inr(paymentDueTotal)} due across ${paymentDue.length} project${paymentDue.length !== 1 ? 's' : ''}`,
      href: '/homeowner/payments', cta: 'View',
    }] : []),
    ...awaitingConfirmation.map((r) => ({
      key: `m-${r.id}`, icon: <ShieldCheck size={15} />,
      text: `${r.request_number} is marked done — confirm it's sorted`,
      href: `/homeowner/maintenance/${r.id}`, cta: 'Confirm',
    })),
    ...(unreviewedCompleted.length > 0 ? [{
      key: 'reviews', icon: <Star size={15} />,
      text: `Rate your experience on ${unreviewedCompleted.length} completed project${unreviewedCompleted.length !== 1 ? 's' : ''}`,
      href: '/homeowner/reviews', cta: 'Review',
    }] : []),
  ]

  const sub = activeSubRes.data as { id: string; plan_snapshot: { name?: string }; end_date: string } | null
  const homeCareOpenCount = awaitingConfirmation.length

  const firstName = profileRes.data?.full_name?.split(' ')[0] ?? 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const featuredPct = featured && Number(featured.total_amount) > 0
    ? (Number(featured.paid_amount ?? 0) / Number(featured.total_amount)) * 100
    : 0
  const featuredMilestones = [...(featured?.milestones ?? [])].sort((a, b) => a.milestone_number - b.milestone_number)

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-5 sm:p-8">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-sm text-stone-500">{greeting}</p>
          <h1 className="font-display text-[2.1rem] font-bold leading-none tracking-[-0.03em] text-ink-900 sm:text-[2.8rem]">
            {firstName}&apos;s home
          </h1>
        </div>
        <Link href="/get-started">
          <Button icon={<Plus size={16} />}>Start renovation</Button>
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total projects" value={stats.total} icon={<CalendarDays size={18} />} />
        <StatCard
          label="Active"
          value={stats.active}
          icon={<TrendingUp size={18} />}
          change={stats.active > 0 ? `${stats.active} ongoing` : undefined}
          positive
        />
        <StatCard label="Completed" value={stats.completed} icon={<CheckCircle size={18} />} />
        <StatCard label="Paid so far" value={stats.paid > 0 ? inr(stats.paid) : '—'} icon={<CreditCard size={18} />} />
      </div>

      {/* ── Needs your attention ── */}
      {attention.length > 0 && (
        <Reveal>
          <div className="rounded-soft border border-amber-500/30 bg-amber-50/60 p-5 shadow-soft">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-900"><AlertCircle size={16} />Needs your attention</p>
            <ul className="space-y-2">
              {attention.map((a) => (
                <li key={a.key}>
                  <Link href={a.href} className="group flex items-center justify-between gap-3 rounded-soft-sm border border-amber-500/20 bg-white px-4 py-3 text-sm transition-colors hover:border-amber-500/50">
                    <span className="flex min-w-0 items-center gap-2.5 text-ink-900"><span className="shrink-0 text-amber-700">{a.icon}</span><span className="truncate">{a.text}</span></span>
                    <span className="flex shrink-0 items-center gap-1 font-medium text-cobalt-600 group-hover:text-cobalt-700">{a.cta} <ChevronRight size={13} /></span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      )}

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {QUICK_ACTIONS.map(({ icon, label, hint, href }, i) => (
          <Reveal key={label} delay={i * 0.05} y={16} className="[&:last-child:nth-child(odd)]:col-span-2 sm:[&:last-child:nth-child(odd)]:col-span-1">
            <Link
              href={href}
              className="group flex h-full items-center gap-3 border border-ink-900/15 bg-white p-4 transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-ink-900 hover:shadow-hard"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-ink-900 text-white transition-colors duration-300 group-hover:bg-cobalt-400">
                {icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight text-ink-900 sm:truncate">{label}</span>
                <span className="block truncate text-xs text-stone-400">{hint}</span>
              </span>
            </Link>
          </Reveal>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">

          {/* ── Active project ── */}
          {featured && (
            <Reveal>
              <Link
                href={hrefOf(featured)}
                className="group relative block overflow-hidden bg-ink-950 p-6 text-white sm:p-8"
              >
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cobalt-500/25 blur-[70px]" />
                <div className="relative">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-brass-400">Active project</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-all duration-500 ease-spring group-hover:rotate-45 group-hover:bg-white group-hover:text-ink-950">
                      <ArrowUpRight size={16} />
                    </span>
                  </div>
                  <h2 className="font-display text-[1.6rem] font-bold leading-tight text-white sm:text-[2.2rem]">{titleOf(featured)}</h2>
                  <p className="mt-1 font-mono text-xs text-white/60">{featured.booking_number}</p>

                  <div className="mt-7">
                    <div className="mb-2 flex items-baseline justify-between text-sm">
                      <span className="text-white/60">Paid {inr(Number(featured.paid_amount ?? 0))}</span>
                      <span className="text-white/60">of {inr(Number(featured.total_amount ?? 0))}</span>
                    </div>
                    <ProgressFill percent={featuredPct} label="Payments made so far" className="bg-white/10" barClassName="from-cobalt-400 to-brass-400" />
                  </div>

                  {featuredMilestones.length > 0 && (
                    <ol className="mt-6 grid gap-2 sm:grid-cols-3">
                      {featuredMilestones.map((m) => {
                        const done = ['completed', 'approved'].includes(m.status)
                        const current = m.status === 'in_progress'
                        return (
                          <li
                            key={m.milestone_number}
                            className={cn(
                              'border px-4 py-3 text-xs',
                              done ? 'border-cobalt-400/40 bg-cobalt-500/15' : current ? 'border-brass-400/50 bg-brass-400/10' : 'border-white/10',
                            )}
                          >
                            <span className={cn('mb-1 flex items-center gap-1.5 font-medium', done ? 'text-white/90' : current ? 'text-brass-300' : 'text-white/60')}>
                              {done ? <CheckCircle size={12} /> : <Clock size={12} />}
                              {done ? 'Done' : current ? 'In progress' : 'Upcoming'}
                            </span>
                            <span className="block truncate text-sm text-white/85">{m.title}</span>
                            <span className="text-white/60">{inr(Number(m.amount))}</span>
                          </li>
                        )
                      })}
                    </ol>
                  )}
                </div>
              </Link>
            </Reveal>
          )}

          {/* ── Recent bookings ── */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-stone-900">Your projects</h2>
              <Link href="/homeowner/projects" className="coarse:min-h-11 flex items-center gap-1 text-xs font-medium text-cobalt-500 hover:text-cobalt-600">
                View all <ChevronRight size={13} />
              </Link>
            </div>

            <div className="space-y-2">
              {bookings.length === 0 ? (
                <EmptyState tone="warm"
                  icon={<CalendarDays size={20} />}
                  title="No projects yet"
                  description="Tell us about your home and we'll schedule a free site visit."
                  action={
                    <Link href="/get-started">
                      <Button size="sm" icon={<Plus size={14} />}>Start a renovation</Button>
                    </Link>
                  }
                />
              ) : (
                bookings.slice(0, 5).map((b, i) => (
                  <Reveal key={b.id} delay={i * 0.05} y={14}>
                    <Link
                      href={hrefOf(b)}
                      className="group flex items-center justify-between gap-4 border border-ink-900/15 bg-white p-4 transition-all duration-300 ease-spring hover:-translate-y-0.5 hover:border-ink-900/50 hover:border-ink-900"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-cobalt-50 text-cobalt-500">
                          <Layers size={17} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-stone-800">{titleOf(b)}</p>
                          <p className="mt-0.5 text-xs text-stone-400">
                            {b.scheduled_date
                              ? new Date(b.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                              : 'Date to be confirmed'}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <StatusBadge status={b.status} />
                        {b.total_amount != null && (
                          <span className="hidden text-sm font-semibold text-stone-700 sm:inline">{inr(Number(b.total_amount))}</span>
                        )}
                        <ChevronRight size={14} className="text-stone-500 transition-transform group-hover:translate-x-0.5 group-hover:text-stone-500" />
                      </div>
                    </Link>
                  </Reveal>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Side column ── */}
        <div className="space-y-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-soft bg-cobalt-600 p-6 shadow-soft">
              <div className="pointer-events-none absolute -bottom-16 -right-10 h-48 w-48 rounded-full bg-brass-400/30 blur-[60px]" />
              <div className="relative">
                <p className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-white/90">Ready to renovate?</p>
                <p className="font-display text-[1.4rem] font-bold leading-tight text-white">Tell us about your project.</p>
                <p className="mb-5 mt-2 text-sm text-white/90">Our team will schedule a free consultation and site visit.</p>
                <Link
                  href="/get-started"
                  className="flex items-center justify-center gap-2 rounded-soft-sm bg-white py-2.5 text-sm font-semibold text-cobalt-700 transition-colors hover:bg-cream-100"
                >
                  Start your renovation <ArrowUpRight size={15} />
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <Link href={sub ? '/homeowner/membership' : '/homeowner/maintenance'} className="group block border border-ink-900/15 bg-white p-4 transition-colors hover:border-ink-900/50">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-900"><Wrench size={15} className="text-cobalt-500" />Home care</p>
              {sub ? (
                <p className="text-sm text-stone-600">
                  <span className="font-medium text-ink-900">{sub.plan_snapshot?.name ?? 'Membership'}</span> member · renews {new Date(sub.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
              ) : (
                <p className="text-sm text-stone-600">No membership yet — book maintenance one visit at a time, or see what a membership covers.</p>
              )}
              {homeCareOpenCount > 0 && <p className="mt-1.5 text-xs font-medium text-cobalt-600">{homeCareOpenCount} request{homeCareOpenCount !== 1 ? 's' : ''} awaiting your confirmation</p>}
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-cobalt-600 group-hover:text-cobalt-700">Manage home care <ChevronRight size={12} /></span>
            </Link>
          </Reveal>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-stone-900">Explore services</h3>
            <div className="space-y-2">
              {SUGGESTED_SERVICES.map((svc, i) => (
                <Reveal key={svc.label} delay={i * 0.06} y={14}>
                  <Link
                    href={`/services/${svc.slug}`}
                    className="group flex items-center gap-3 border border-ink-900/15 bg-white p-3 transition-all duration-300 ease-spring hover:-translate-y-0.5 hover:border-ink-900/50 hover:border-ink-900"
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden ">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={svc.image} alt={svc.label} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-stone-800">{svc.label}</p>
                      <p className="text-xs text-stone-400">From {svc.from}</p>
                    </div>
                    <ChevronRight size={14} className="text-stone-500 transition-colors group-hover:text-cobalt-500" />
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
