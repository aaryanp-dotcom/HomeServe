'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Marks notifications read once the list has been shown, then refreshes the header badge. */
export function MarkRead({ hasUnread }: { hasUnread: boolean }) {
  const router = useRouter()
  useEffect(() => {
    if (!hasUnread) return
    const t = setTimeout(async () => {
      const res = await fetch('/api/notifications', { method: 'POST' })
      if (res.ok) router.refresh()
    }, 1200)
    return () => clearTimeout(t)
  }, [hasUnread, router])
  return null
}
