'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface ProfileUpdate {
  full_name: string
  phone: string | null
}

export async function updateAdminProfile(data: ProfileUpdate): Promise<{ error?: string } | undefined> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('user_profiles')
    .update({
      full_name: data.full_name,
      phone: data.phone,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/admin/profile')
}
