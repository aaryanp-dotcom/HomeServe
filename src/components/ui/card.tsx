import * as React from 'react'
import { cn } from '@/lib/utils'

// Blueprint panel: flat white sheet, hairline ink border. `hover` adds the hard-shadow lift used on links.
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }>(
  ({ className, hover, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'border border-ink-900/15 bg-white',
        hover && 'cursor-pointer transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-ink-900 hover:shadow-hard',
        className,
      )}
      {...props}
    />
  ),
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('flex flex-col gap-1 p-5 pb-3 sm:p-6 sm:pb-4', className)} {...props} />,
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn('font-mono text-[0.6875rem] font-medium uppercase leading-none tracking-[0.16em] text-ink-900/60', className)} {...props} />
  ),
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <p ref={ref} className={cn('text-sm text-stone-500', className)} {...props} />,
)
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('px-5 pb-5 sm:px-6 sm:pb-6', className)} {...props} />,
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('flex items-center border-t border-ink-900/10 px-5 py-4 sm:px-6', className)} {...props} />,
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
