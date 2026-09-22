import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * HomeServe button — blueprint style: square, flat, colour change on hover.
 * Sizes grow on touch screens (pointer: coarse) so every button is a comfortable tap target on
 * iOS Safari and Android Chrome without changing the desktop density.
 */
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap select-none touch-manipulation',
    'font-semibold tracking-[-0.005em] transition-colors duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-400 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-100',
    'disabled:pointer-events-none disabled:opacity-40 active:translate-y-px',
  ],
  {
    variants: {
      variant: {
        default:     'bg-ink-900 text-white hover:bg-cobalt-600',
        primary:     'bg-cobalt-500 text-white hover:bg-cobalt-600',
        secondary:   'border border-ink-900/25 bg-white text-ink-900 hover:border-ink-900',
        outline:     'border-2 border-ink-900 bg-transparent text-ink-900 hover:bg-ink-900 hover:text-white',
        ghost:       'bg-transparent text-ink-800 hover:bg-ink-900/[0.06]',
        destructive: 'bg-rose-600 text-white hover:bg-rose-700',
        emerald:     'bg-sage-700 text-white hover:bg-sage-800',
        link:        'h-auto p-0 text-cobalt-600 underline-offset-4 hover:underline',
      },
      size: {
        xs:        'h-8 px-2.5 text-xs [@media(pointer:coarse)]:h-10',
        sm:        'h-9 px-3.5 text-sm [@media(pointer:coarse)]:h-11',
        md:        'h-10 px-4 text-sm [@media(pointer:coarse)]:h-11',
        lg:        'h-12 px-6 text-base',
        xl:        'h-14 px-8 text-base',
        icon:      'h-10 w-10 [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11',
        'icon-sm': 'h-8 w-8 [@media(pointer:coarse)]:h-10 [@media(pointer:coarse)]:w-10',
        'icon-lg': 'h-12 w-12',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, fullWidth, children, disabled, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), fullWidth && 'w-full', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <svg className="h-4 w-4 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : leftIcon ? (
        <span className="flex-shrink-0">{leftIcon}</span>
      ) : null}
      {children}
      {rightIcon && !loading && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  ),
)
Button.displayName = 'Button'

export { Button, buttonVariants }
