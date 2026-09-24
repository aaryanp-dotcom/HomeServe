'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bookmark, X, ArrowRight, Trash2, Sparkles, CheckCircle2 } from 'lucide-react'
import { THEMES } from '@/lib/themes/data'
import { Theme } from '@/lib/themes/types'
import { toggleThemeSave } from '@/lib/themes/device'
import { cn } from '@/lib/utils'

export function SavedThemesDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [savedSlugs, setSavedSlugs] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  const syncSavedSlugs = () => {
    try {
      const raw = localStorage.getItem('hs_saved_themes')
      const parsed = raw ? (JSON.parse(raw) as string[]) : []
      setSavedSlugs(parsed)
    } catch {
      setSavedSlugs([])
    }
  }

  useEffect(() => {
    setMounted(true)
    syncSavedSlugs()

    const handleStorage = () => syncSavedSlugs()
    window.addEventListener('storage', handleStorage)

    // Custom event to trigger updates from any ThemeCard / ThemeDetail save button
    const handleCustomSync = () => syncSavedSlugs()
    window.addEventListener('hs_saved_updated', handleCustomSync)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('hs_saved_updated', handleCustomSync)
    }
  }, [])

  const savedThemes: Theme[] = savedSlugs
    .map((slug) => THEMES.find((t) => t.slug === slug))
    .filter((t): t is Theme => Boolean(t))

  const handleRemove = async (slug: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await toggleThemeSave(slug, false)
    syncSavedSlugs()
    window.dispatchEvent(new Event('hs_saved_updated'))
  }

  const handleClearAll = () => {
    try {
      localStorage.setItem('hs_saved_themes', JSON.stringify([]))
      syncSavedSlugs()
      window.dispatchEvent(new Event('hs_saved_updated'))
    } catch {}
  }

  if (!mounted) return null

  return (
    <>
      {/* Floating Trigger Button on bottom-right of viewport */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label={`View saved themes moodboard (${savedThemes.length} saved)`}
        className={cn(
          'fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-ink-900 text-white font-mono text-xs font-semibold uppercase tracking-wider border-2 border-white shadow-2xl transition-all duration-300 hover:bg-cobalt-600 hover:scale-105 active:scale-95 coarse:min-h-12',
          savedThemes.length === 0 && 'opacity-90 hover:opacity-100'
        )}
      >
        <Bookmark
          size={16}
          className={savedThemes.length > 0 ? 'fill-rose-500 text-rose-500' : 'text-white'}
        />
        <span>Moodboard</span>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cobalt-400 text-[0.6875rem] font-bold text-ink-900">
          {savedThemes.length}
        </span>
      </button>

      {/* Backdrop overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
        />
      )}

      {/* Slide-over Drawer Panel */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white border-l-2 border-ink-900 shadow-2xl transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b-2 border-ink-900 bg-blueprint p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center border border-ink-900 bg-cobalt-400 text-ink-900">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-ink-900 leading-tight">
                Your Design Moodboard
              </h2>
              <p className="font-mono text-[0.6875rem] text-stone-500 uppercase tracking-wider">
                {savedThemes.length} {savedThemes.length === 1 ? 'Theme Saved' : 'Themes Saved'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close moodboard drawer"
            className="flex h-9 w-9 items-center justify-center border border-ink-900 bg-white text-ink-900 hover:bg-stone-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {savedThemes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 border border-stone-200 text-stone-400">
                <Bookmark size={28} />
              </div>
              <div className="space-y-1.5 max-w-xs">
                <p className="font-display font-bold text-stone-800">Your moodboard is empty</p>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Browse our design themes and click the heart icon on any style to build your personal inspiration board.
                </p>
              </div>
              <Link
                href="/themes"
                onClick={() => setIsOpen(false)}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-ink-900 text-white font-mono text-xs font-semibold uppercase tracking-wider hover:bg-cobalt-600 transition-colors"
              >
                Browse {THEMES.length} Themes <ArrowRight size={13} />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <span className="text-xs text-stone-500 font-mono">Saved Inspiration</span>
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1 text-[0.6875rem] font-mono text-rose-600 hover:text-rose-800 uppercase tracking-wider"
                >
                  <Trash2 size={12} /> Clear all
                </button>
              </div>

              <div className="space-y-3">
                {savedThemes.map((theme) => (
                  <div
                    key={theme.slug}
                    className="group relative flex gap-3 border border-ink-900/15 bg-paper-50 p-2.5 transition-colors hover:border-ink-900 hover:bg-white"
                  >
                    <Link
                      href={`/themes/${theme.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="relative h-20 w-24 shrink-0 overflow-hidden border border-ink-900 bg-stone-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={theme.coverImage}
                        alt={theme.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </Link>

                    <div className="flex flex-1 flex-col justify-between min-w-0 pr-6">
                      <div>
                        <p className="font-mono text-[0.625rem] uppercase tracking-wider text-stone-500">
                          {theme.category}
                        </p>
                        <Link
                          href={`/themes/${theme.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="font-display font-bold text-sm text-ink-900 hover:text-cobalt-600 truncate block"
                        >
                          {theme.name}
                        </Link>
                        <p className="text-[0.6875rem] text-stone-500 mt-0.5 font-mono">
                          From {theme.budget.basic}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 pt-1">
                        {theme.colors.slice(0, 3).map((col, ci) => (
                          <span
                            key={ci}
                            className="inline-block h-2.5 w-2.5 rounded-full border border-black/20"
                            style={{ backgroundColor: col.hex }}
                            title={col.name}
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleRemove(theme.slug, e)}
                      aria-label={`Remove ${theme.name} from saved themes`}
                      className="absolute top-2.5 right-2.5 text-stone-400 hover:text-rose-600 transition-colors p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer with Enquiry Trigger */}
        {savedThemes.length > 0 && (
          <div className="border-t-2 border-ink-900 bg-stone-50 p-5 space-y-3">
            <div className="flex items-start gap-2 text-xs text-stone-600">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Your saved themes will be pre-attached to your HomeServe renovation consultation.
              </span>
            </div>

            <Link
              href={`/get-started?themes=${savedThemes.map((t) => t.slug).join(',')}`}
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center justify-center gap-2 bg-ink-900 py-3.5 px-4 font-mono text-xs font-semibold uppercase tracking-wider text-white hover:bg-cobalt-600 transition-colors shadow-sm"
            >
              Start Renovation with These Styles <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
