'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface SessionUser {
  name?: string
  email?: string
  avatar?: string
  role?: string
}

/**
 * Client-side auth state for components that render on static/SSG marketing pages, where a server-fetched
 * `user` prop either isn't available or would force the page off the static path. Resolves the current
 * session on mount and stays in sync via onAuthStateChange, so nav/UI reflects sign-in/sign-out without a
 * full page reload. `loading` is only true before the first resolution — callers that want to avoid a
 * flash of the signed-out state can gate on it.
 */
export function useSessionUser(): { user: SessionUser | null; loading: boolean } {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const supabase = createClient()

    async function resolve(authUser: { id: string; email?: string | null } | null | undefined) {
      if (!authUser) {
        if (active) { setUser(null); setLoading(false) }
        return
      }
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, avatar_url, role')
        .eq('user_id', authUser.id)
        .single()
      if (!active) return
      setUser({
        name: profile?.full_name ?? authUser.email?.split('@')[0],
        email: authUser.email ?? undefined,
        avatar: profile?.avatar_url ?? undefined,
        role: profile?.role,
      })
      setLoading(false)
    }

    supabase.auth.getUser().then(({ data }) => resolve(data.user))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      resolve(session?.user ?? null)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}
