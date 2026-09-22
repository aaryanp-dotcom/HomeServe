import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Infinite horizontal ticker. Content is duplicated so the loop is seamless. */
export function Marquee({
  children,
  className,
  pauseOnHover = true,
}: {
  children: ReactNode
  className?: string
  pauseOnHover?: boolean
}) {
  return (
    <div
      className={cn(
        'group relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]',
        className,
      )}
    >
      {[0, 1].map((i) => (
        <div
          key={i}
          aria-hidden={i === 1}
          className={cn(
            'flex shrink-0 min-w-full items-center justify-around gap-10 pr-10 animate-marquee motion-reduce:animate-none',
            pauseOnHover && 'group-hover:[animation-play-state:paused]',
          )}
        >
          {children}
        </div>
      ))}
    </div>
  )
}
