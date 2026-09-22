#!/usr/bin/env node
// Create or promote an internal HomeServe account. Public sign-up only ever creates homeowners;
// the administrator and the contractor accounts are made here, with the service-role key.
//   node scripts/set-role.mjs you@example.com admin                       # promote an existing account
//   node scripts/set-role.mjs you@example.com admin "Full Name" "Password" # create it, then promote
//   node scripts/set-role.mjs crew@example.com contractor "Ravi Kumar" "Password"
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local. Never run in a browser.
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY
const [email, role, name, password] = process.argv.slice(2)
if (!URL_ || !KEY || !email || !['admin', 'contractor', 'homeowner'].includes(role ?? '')) {
  console.error('Usage: node scripts/set-role.mjs <email> <admin|contractor|homeowner> [full name] [password]'); process.exit(1)
}

const call = async (path, method = 'GET', body) => {
  const r = await fetch(URL_ + path, { method, headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation,resolution=merge-duplicates' }, body: body ? JSON.stringify(body) : undefined })
  const t = await r.text(); return { status: r.status, json: t ? JSON.parse(t) : null }
}

const { json: list } = await call('/auth/v1/admin/users?per_page=1000')
let user = (list.users ?? []).find((u) => (u.email ?? '').toLowerCase() === email.toLowerCase())
if (!user) {
  if (!name || !password) { console.error(`No account for ${email}. Pass a full name and a password to create one.`); process.exit(1) }
  const c = await call('/auth/v1/admin/users', 'POST', { email, password, email_confirm: true, user_metadata: { full_name: name } })
  if (c.status >= 300) { console.error('Could not create the user:', c.json); process.exit(1) }
  user = c.json; console.log(`Created ${email}`)
}
const p = await call(`/rest/v1/user_profiles?user_id=eq.${user.id}`, 'PATCH', { role })
if (p.status >= 300 || !p.json?.length) { console.error('Could not set the role:', p.json); process.exit(1) }
if (role === 'contractor') {
  const cp = await call('/rest/v1/contractor_profiles?on_conflict=user_id', 'POST', { user_id: user.id, is_verified: true, contractor_type: 'employed' })
  if (cp.status >= 300) { console.error('Role set, but the contractor profile failed:', cp.json); process.exit(1) }
}
const home = { admin: '/admin/dashboard', contractor: '/contractor/dashboard', homeowner: '/homeowner/dashboard' }[role]
console.log(`${email} is now ${role === 'admin' ? 'an administrator' : `a ${role}`}. Sign in at /login and open ${home}.`)
