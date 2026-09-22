import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, id, ...props }, ref) => {
    const generated = React.useId()
    const inputId = id ?? generated
    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && <label htmlFor={inputId} className="text-sm font-medium text-ink-800">{label}</label>}
        <div className="relative">
          <select
            id={inputId} ref={ref}
            aria-invalid={!!error || undefined}
            className={cn('field', error && 'field-error', className)}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        {hint && !error && <p className="text-xs text-stone-500">{hint}</p>}
        {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
      </div>
    )
  },
)
Select.displayName = 'Select'

export { Select }
