import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/** Status chip: mono, uppercase, square. Colour names map onto the blueprint palette. */
const badgeVariants = cva('inline-flex items-center gap-1.5 font-mono font-medium uppercase tracking-[0.06em]', {
  variants: {
    variant: {
      default: 'bg-ink-900/[0.07] text-ink-700',
      navy:    'bg-ink-900 text-white',
      emerald: 'bg-sage-100 text-sage-800',
      blue:    'bg-cobalt-100 text-cobalt-700',
      gold:    'bg-amber-100 text-amber-800',
      red:     'bg-rose-100 text-rose-700',
      amber:   'bg-amber-100 text-amber-800',
      purple:  'bg-ink-900/[0.07] text-ink-700',
      outline: 'border border-ink-900/25 text-ink-700',
      dot:     'bg-ink-900/[0.07] text-ink-700',
    },
    size: {
      sm: 'px-1.5 py-0.5 text-[0.6875rem]',
      md: 'px-2 py-[3px] text-[0.6875rem]',
      lg: 'px-2.5 py-1 text-xs',
    },
  },
  defaultVariants: { variant: 'default', size: 'md' },
})

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean
  dotColor?: string
}

function Badge({ className, variant, size, dot, dotColor, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && <span aria-hidden="true" className={cn('inline-block h-1.5 w-1.5 flex-shrink-0', dotColor ?? 'bg-current')} />}
      {children}
    </span>
  )
}

export { Badge, badgeVariants }
