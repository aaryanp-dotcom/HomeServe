import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, rows = 4, ...props }, ref) => {
    const generated = React.useId()
    const inputId = id ?? generated
    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && <label htmlFor={inputId} className="text-sm font-medium text-ink-800">{label}</label>}
        <textarea
          id={inputId} ref={ref} rows={rows}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${inputId}-e` : hint ? `${inputId}-h` : undefined}
          className={cn('field min-h-[6rem] resize-y py-2.5', error && 'field-error', className)}
          {...props}
        />
        {hint && !error && <p id={`${inputId}-h`} className="text-xs text-stone-500">{hint}</p>}
        {error && <p id={`${inputId}-e`} role="alert" className="text-xs text-rose-700">{error}</p>}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'

export { Textarea }
