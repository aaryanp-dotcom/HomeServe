import { cn } from '@/lib/utils'

/** Orange highlight block used to emphasise one word in a display headline. */
export function Hl({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-block bg-cobalt-400 px-[0.14em] text-white [box-decoration-break:clone]', className)}>
      {children}
    </span>
  )
}
