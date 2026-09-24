import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  // Redirect on the origin the form was posted to. NEXT_PUBLIC_APP_URL can point at a
  // different host (or localhost), and the CSP's `form-action 'self'` also applies to the
  // redirect a form submission follows — a cross-origin target gets the whole sign-out
  // navigation blocked. 303 so the browser follows up with a GET, not a re-POST.
  return NextResponse.redirect(new URL('/login', req.nextUrl.origin), { status: 303 })
}
