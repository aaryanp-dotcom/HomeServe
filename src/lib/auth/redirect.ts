/** Where a signed-in user of each role lands by default. */
export const ROLE_HOME: Record<string, string> = {
  homeowner: '/homeowner/dashboard',
  contractor: '/contractor/dashboard',
  admin: '/admin/dashboard',
}

const PORTAL: Record<string, string> = { homeowner: '/homeowner', contractor: '/contractor', admin: '/admin' }

/**
 * Only follow a `redirect` / `next` value that is a same-site path inside the user's own portal (or a
 * public page). Anything else — another origin, protocol-relative URLs, another role's portal — falls
 * back to the role's dashboard, so the parameter can never be used as an open redirect.
 */
export function safeNext(raw: string | null | undefined, role: string): string {
  const home = ROLE_HOME[role] ?? '/homeowner/dashboard'
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\') || /[\r\n]/.test(raw)) return home
  const isPortal = Object.values(PORTAL).some((p) => raw === p || raw.startsWith(p + '/'))
  if (isPortal) return raw === PORTAL[role] || raw.startsWith((PORTAL[role] ?? '/homeowner') + '/') ? raw : home
  return raw
}
