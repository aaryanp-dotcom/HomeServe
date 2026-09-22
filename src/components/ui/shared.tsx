import * as React from 'react'
import { cn } from '@/lib/utils'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'

// ── Button ────────────────────────────────────────────────────────────────────

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'link'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
}

const buttonBase =
  'inline-flex items-center justify-center gap-2 font-semibold select-none touch-manipulation transition-colors duration-200 ease-smooth focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40'

const buttonVariants: Record<string, string> = {
  primary:   'bg-ink-900 text-white hover:bg-cobalt-600 active:bg-cobalt-700',
  secondary: 'bg-white text-ink-900 border border-ink-900/20 hover:border-ink-900 active:bg-paper-100',
  ghost:     'text-ink-800 hover:bg-ink-900/[0.06] active:bg-ink-900/10',
  outline:   'border-2 border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white',
  danger:    'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800',
  link:      'text-cobalt-600 hover:text-cobalt-700 underline-offset-4 hover:underline p-0 h-auto',
}

const buttonSizes: Record<string, string> = {
  xs: 'h-8  px-2.5 text-xs  gap-1   [@media(pointer:coarse)]:h-10',
  sm: 'h-9  px-3   text-sm  gap-1.5 [@media(pointer:coarse)]:h-11',
  md: 'h-10 px-4   text-sm  gap-2   [@media(pointer:coarse)]:h-11',
  lg: 'h-11 px-5   text-base gap-2',
  xl: 'h-13 px-7   text-base gap-2.5',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconRight,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          buttonBase,
          buttonVariants[variant],
          buttonSizes[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {loading ? (
          <Spinner size={size === 'xs' || size === 'sm' ? 'sm' : 'md'} />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
        {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
      </button>
    )
  },
)
Button.displayName = 'Button'

// ── Spinner ───────────────────────────────────────────────────────────────────

export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const s = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5' }[size]
  return (
    <svg
      className={cn('animate-spin', s, className)}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'flat' | 'raised'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const cardVariants: Record<string, string> = {
  default:     'bg-white border border-ink-900/15',
  interactive: 'bg-white border border-ink-900/15 cursor-pointer transition-all duration-200 ease-smooth hover:border-ink-900 hover:shadow-hard hover:-translate-y-0.5 hover:-translate-x-0.5',
  flat:        'bg-paper-100',
  raised:      'bg-white border border-ink-900 shadow-hard',
}

const cardPadding: Record<string, string> = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6 md:p-8',
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants[variant], cardPadding[padding], className)}
      {...props}
    >
      {children}
    </div>
  ),
)
Card.displayName = 'Card'

// ── Badge ─────────────────────────────────────────────────────────────────────

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'outline'
  size?: 'sm' | 'md'
  dot?: boolean
}

const badgeVariants: Record<string, string> = {
  default: 'bg-ink-900/[0.07] text-ink-700',
  accent:  'bg-cobalt-100 text-cobalt-700',
  success: 'bg-sage-100 text-sage-800',
  warning: 'bg-amber-100 text-amber-800',
  danger:  'bg-rose-100 text-rose-700',
  outline: 'border border-ink-900/25 text-ink-700',
}

const badgeSizes: Record<string, string> = {
  sm: 'px-1.5 py-0.5 text-[0.6875rem]',
  md: 'px-2 py-[3px] text-[0.6875rem]',
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot = false, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1.5 font-mono font-medium uppercase tracking-[0.06em]',
        badgeVariants[variant],
        badgeSizes[size],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 shrink-0',
            {
              'bg-stone-400': variant === 'default',
              'bg-cobalt-500': variant === 'accent',
              'bg-sage-500': variant === 'success',
              'bg-amber-500': variant === 'warning',
              'bg-rose-500': variant === 'danger',
            },
          )}
        />
      )}
      {children}
    </span>
  ),
)
Badge.displayName = 'Badge'

// ── Input ─────────────────────────────────────────────────────────────────────

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, iconLeft, iconRight, id, ...props }, ref) => {
    const generated = React.useId()
    const inputId = id ?? generated
    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && <label htmlFor={inputId} className="text-sm font-medium text-ink-800">{label}</label>}
        <div className="relative">
          {iconLeft && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">{iconLeft}</span>}
          <input
            ref={ref}
            id={inputId}
            className={cn('field', error && 'field-error', iconLeft && 'pl-9', iconRight && 'pr-9', className)}
            aria-invalid={!!error || undefined}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {iconRight && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-500">{iconRight}</span>}
        </div>
        {error && <p id={`${inputId}-error`} role="alert" className="text-xs text-rose-700">{error}</p>}
        {hint && !error && <p id={`${inputId}-hint`} className="text-xs text-stone-500">{hint}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'

// ── Textarea ──────────────────────────────────────────────────────────────────

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    const generated = React.useId()
    const inputId = id ?? generated
    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && <label htmlFor={inputId} className="text-sm font-medium text-ink-800">{label}</label>}
        <textarea
          ref={ref}
          id={inputId}
          rows={4}
          className={cn('field min-h-[6rem] resize-y py-2.5', error && 'field-error', className)}
          aria-invalid={!!error || undefined}
          {...props}
        />
        {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
        {hint && !error && <p className="text-xs text-stone-500">{hint}</p>}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'

// ── Avatar ────────────────────────────────────────────────────────────────────

export interface AvatarProps {
  src?: string | null
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const avatarSizes: Record<string, string> = {
  xs: 'h-6 w-6 text-2xs',
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
  xl: 'h-14 w-14 text-lg',
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const initials = name
    ?.split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-cobalt-100 flex items-center justify-center font-semibold text-cobalt-700 shrink-0',
        avatarSizes[size],
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? 'Avatar'} className="h-full w-full object-cover" />
      ) : (
        <span>{initials ?? '?'}</span>
      )}
    </div>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────

export function Divider({
  label,
  className,
}: {
  label?: string
  className?: string
}) {
  if (label) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <span className="flex-1 border-t border-ink-900/15" />
        <span className="text-xs text-stone-400 font-medium">{label}</span>
        <span className="flex-1 border-t border-ink-900/15" />
      </div>
    )
  }
  return <div className={cn('border-t border-ink-900/15', className)} />
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-shimmer bg-gradient-to-r from-stone-100 via-stone-50 to-stone-100 bg-[length:200%_100%] ',
        className,
      )}
      {...props}
    />
  )
}

// ── Progress ──────────────────────────────────────────────────────────────────

export function Progress({
  value = 0,
  max = 100,
  label,
  variant = 'default',
  size = 'md',
  className,
}: {
  value?: number
  max?: number
  label?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  const barColors: Record<string, string> = {
    default: 'bg-cobalt-500',
    success: 'bg-sage-500',
    warning: 'bg-amber-500',
    danger:  'bg-rose-500',
  }

  const heights: Record<string, string> = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="flex justify-between mb-1.5">
          <span className="text-xs font-medium text-stone-600">{label}</span>
          <span className="text-xs text-stone-400">{pct.toFixed(0)}%</span>
        </div>
      )}
      <div className={cn('w-full bg-stone-100', heights[size])}>
        <div
          className={cn(' transition-all duration-500 ease-spring', heights[size], barColors[variant])}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

export function StatCard({
  label,
  value,
  change,
  positive,
  icon,
  className,
}: {
  label: string
  value: string | number
  change?: string
  positive?: boolean
  icon?: React.ReactNode
  className?: string
}) {
  return (
    <Card
      variant="default"
      className={cn('p-4 sm:p-5 transition-all duration-200 ease-smooth hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-ink-900 hover:shadow-hard', className)}
    >
      <div className="relative">
        {icon && (
          <div className="absolute right-0 top-0 hidden bg-ink-900 p-2 text-white min-[480px]:block sm:p-2.5">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="mb-2 font-mono min-[480px]:pr-12 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-stone-500">{label}</p>
          <p className="mt-3 font-display text-[1.65rem] font-bold leading-none tracking-[-0.02em] text-ink-900 sm:text-[2.1rem]">
            <AnimatedNumber value={value} />
          </p>
          {change !== undefined && (
            <p
              className={cn(
                'mt-2 text-xs font-medium',
                positive ? 'text-sage-700' : 'text-rose-700',
              )}
            >
              {positive ? '↑' : '↓'} {change}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  tone = 'drafting',
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  /** 'drafting' (default) is the technical/spec-sheet empty state, for admin and document-like screens.
   *  'warm' is for customer-facing moments (nothing to review yet, no notifications) where a blank
   *  drawing sheet reads as cold rather than simply "all clear." */
  tone?: 'drafting' | 'warm'
}) {
  if (tone === 'warm') {
    return (
      <div className={cn('panel-warm flex flex-col items-center justify-center gap-4 px-6 py-14 text-center', className)}>
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-soft-sm bg-cobalt-50 text-cobalt-600">
            {icon}
          </div>
        )}
        <div className="max-w-xs">
          <p className="font-display text-lg font-bold tracking-[-0.02em] text-ink-900">{title}</p>
          {description && <p className="mt-1 text-sm text-stone-600">{description}</p>}
        </div>
        {action}
      </div>
    )
  }
  return (
    <div className={cn('relative flex flex-col items-center justify-center gap-4 border border-dashed border-ink-900/30 bg-white/60 px-6 py-14 text-center', className)}>
      {/* drawing-frame corner ticks */}
      {['left-0 top-0 border-l-2 border-t-2', 'right-0 top-0 border-r-2 border-t-2', 'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map((c) => (
        <span key={c} aria-hidden className={cn('absolute h-3 w-3 border-ink-900', c)} />
      ))}
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center bg-ink-900 text-white">
          {icon}
        </div>
      )}
      <div className="max-w-xs">
        <p className="font-display text-lg font-bold tracking-[-0.02em] text-ink-900">{title}</p>
        {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Compatibility aliases ─────────────────────────────────────────────────────
// These maintain backwards compat with pages that import older names.

export function StarRating({ rating, max = 5, showValue = false, className }: {
  rating: number; max?: number; size?: 'sm' | 'md' | 'lg'; showValue?: boolean; className?: string
}) {
  return (
    <span className={`inline-flex items-center gap-1 ${className ?? ''}`}>
      <span className="inline-flex gap-0.5">
        {Array.from({ length: max }).map((_, i) => (
          <span key={i} className={i < Math.floor(rating) ? 'text-amber-400' : 'text-stone-200'}>★</span>
        ))}
      </span>
      {showValue && <span className="text-xs font-semibold text-stone-600">{rating.toFixed(1)}</span>}
    </span>
  )
}

export function Alert({ variant = 'info', title, children, className, onClose }: {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  children: React.ReactNode
  className?: string
  onClose?: () => void
}) {
  const colors = {
    info:    'bg-cobalt-50 border-cobalt-200 text-cobalt-800',
    success: 'bg-sage-50 border-sage-200 text-sage-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    error:   'bg-rose-50 border-rose-200 text-rose-800',
  }
  return (
    <div className={`border p-4 flex gap-3 ${colors[variant]} ${className ?? ''}`}>
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold text-sm mb-1">{title}</p>}
        <div className="text-sm leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button onClick={onClose} className="opacity-60 hover:opacity-100" aria-label="Close">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

/** @deprecated Use Progress instead */
export function ProgressBar(props: { value: number; max?: number; label?: string; showPercent?: boolean; color?: string; size?: 'sm' | 'md'; className?: string }) {
  return <Progress value={props.value} max={props.max} label={props.showPercent ? props.label : undefined} className={props.className} />
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-stone-400 animate-pulse">Loading…</p>
    </div>
  )
}
