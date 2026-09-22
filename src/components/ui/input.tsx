import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightElement?: React.ReactNode
}

/** Text field. `.field` (globals.css) carries the blueprint look and the 16px-on-touch rule that stops iOS Safari zooming on focus. */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightElement, id, type, ...props }, ref) => {
    const generated = React.useId()
    const inputId = id ?? generated
    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && <label htmlFor={inputId} className="text-sm font-medium text-ink-800">{label}</label>}
        <div className="relative flex items-center">
          {leftIcon && <div className="pointer-events-none absolute left-3.5 flex items-center text-stone-500">{leftIcon}</div>}
          <input
            id={inputId} ref={ref} type={type}
            aria-invalid={!!error || undefined}
            aria-describedby={error ? `${inputId}-e` : hint ? `${inputId}-h` : undefined}
            className={cn('field', error && 'field-error', leftIcon && 'pl-10', rightElement && 'pr-10', className)}
            {...props}
          />
          {rightElement && <div className="absolute right-3.5 flex items-center text-stone-500">{rightElement}</div>}
        </div>
        {hint && !error && <p id={`${inputId}-h`} className="text-xs text-stone-500">{hint}</p>}
        {error && <p id={`${inputId}-e`} role="alert" className="text-xs text-rose-700">{error}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'

export { Input }
