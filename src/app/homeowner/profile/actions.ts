'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface ProfileUpdate {
  full_name: string
  phone: string | null
  city: string | null
  state: string | null
}

export async function updateHomeownerProfile(data: ProfileUpdate): Promise<{ error?: string } | undefined> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('user_profiles')
    .update({
      full_name: data.full_name,
      phone: data.phone,
      city: data.city,
      state: data.state,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/homeowner/profile')
}
