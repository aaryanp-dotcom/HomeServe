import Link from 'next/link'
import { MarketingNav, Footer } from '@/components/shared/Navigation'
import { SheetTag } from '@/components/arch/SheetTag'
import { PlanWatermark } from '@/components/arch/PlanWatermark'

export function LegalPage({ code, title, updated, intro, children }: {
  code: string
  title: string
  updated: string
  intro: string
  children: React.ReactNode
}) {
  return (
    <>
      <MarketingNav />
      <main className="min-h-screen bg-paper-100 pt-20">
        <div className="relative overflow-hidden border-b-2 border-ink-900 bg-blueprint">
          <PlanWatermark />
          <div className="relative mx-auto max-w-3xl px-4 py-14 sm:px-6">
            <SheetTag code={code} title="Legal" />
            <h1 className="mb-4 font-display text-4xl font-bold leading-[1.05] tracking-[-0.03em] text-ink-900 sm:text-5xl">{title}</h1>
            <p className="max-w-xl text-base text-stone-500">{intro}</p>
            <p className="mt-4 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-900/50">Last updated {updated}</p>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <article className="prose prose-stone max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:tracking-[-0.02em] prose-headings:text-ink-900 prose-h2:mt-10 prose-h2:text-2xl prose-h3:text-lg prose-p:leading-relaxed prose-p:text-stone-600 prose-li:text-stone-600 prose-a:text-cobalt-600 prose-strong:text-ink-900">
            {children}
          </article>

          <div className="mt-14 border-2 border-ink-900 bg-white p-6">
            <p className="panel-title mb-2">Questions about this page</p>
            <p className="text-sm text-stone-600">Write to us through the <Link href="/contact" className="font-semibold text-cobalt-600 underline-offset-4 hover:underline">contact form</Link> or, if you already have an account, <Link href="/homeowner/support/new" className="font-semibold text-cobalt-600 underline-offset-4 hover:underline">raise a support ticket</Link>.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
