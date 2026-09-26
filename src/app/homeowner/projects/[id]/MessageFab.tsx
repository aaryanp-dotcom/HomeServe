'use client'

import { MessageCircle } from 'lucide-react'

/**
 * Persistent floating shortcut to the Messages panel, which otherwise sits at the bottom of
 * a long project page — Airbnb/Uber-style "always one tap from support" affordance, rather
 * than requiring a scroll hunt every time. Scrolls to the panel and focuses its input.
 */
export function MessageFab() {
  const goToMessages = () => {
    const panel = document.getElementById('project-messages')
    panel?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // Wait for the scroll to be underway before focusing, so mobile keyboards don't fight the scroll.
    window.setTimeout(() => document.getElementById('project-message-input')?.focus(), 400)
  }

  return (
    <button
      type="button"
      onClick={goToMessages}
      aria-label="Message your project team"
      className="coarse:min-h-11 coarse:min-w-11 fixed bottom-24 right-4 z-30 flex items-center gap-2 bg-ink-900 px-4 py-3 text-sm font-semibold text-white shadow-hard transition-all hover:bg-cobalt-600 hover:-translate-y-0.5 lg:bottom-8 lg:right-8"
    >
      <MessageCircle size={17} />
      <span className="hidden sm:inline">Message team</span>
    </button>
  )
}
