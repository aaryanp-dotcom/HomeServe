import Link from 'next/link'
import { ArrowRight, Phone } from 'lucide-react'
import { Reveal } from '@/components/motion/Reveal'
import { Elevation } from '@/components/arch/Elevation'

export function FinalCTA() {
  return (
    <section className="bg-blueprint-orange border-b-2 border-ink-900">
      <div className="relative mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:py-28">
        <Elevation className="pointer-events-none absolute bottom-6 right-4 hidden w-[46%] max-w-[40rem] opacity-40 lg:block" />
        <Reveal>
          <p className="mb-6 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-900/70">[ Ready when you are ]</p>
          <h2
            className="font-display font-bold leading-[0.98] tracking-[-0.03em] text-ink-900"
            style={{ fontSize: 'clamp(2.75rem, 7.2vw, 6.5rem)' }}
          >
            Let&apos;s build<br />your home.
          </h2>
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <Link
              href="/get-started"
              className="group inline-flex items-center gap-3 bg-ink-900 py-4 pl-7 pr-4 text-base font-semibold text-white transition-colors hover:bg-ink-800"
            >
              Start your renovation
              <span className="flex h-9 w-9 items-center justify-center bg-cobalt-400 transition-transform group-hover:translate-x-1">
                <ArrowRight size={18} />
              </span>
            </Link>
            <a
              href="tel:+911234567890"
              className="inline-flex items-center gap-2 border-2 border-ink-900 px-7 py-[0.95rem] text-base font-semibold text-ink-900 transition-colors hover:bg-ink-900 hover:text-white"
            >
              <Phone size={17} /> Call us
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
