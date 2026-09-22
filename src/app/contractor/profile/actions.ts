'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface ContractorProfileUpdate {
  full_name: string
  phone: string | null
  city: string | null
  state: string | null
  bio: string | null
  experience_years: number
  is_available: boolean
  specializations: string[]
}

export async function updateContractorProfile(data: ContractorProfileUpdate): Promise<{ error?: string } | undefined> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Update user_profiles
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      full_name: data.full_name,
      phone: data.phone,
      city: data.city,
      state: data.state,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (profileError) return { error: profileError.message }

  // Update contractor_profiles
  const { error: contractorError } = await supabase
    .from('contractor_profiles')
    .update({
      bio: data.bio,
      experience_years: data.experience_years,
      is_available: data.is_available,
      specializations: data.specializations,
      city: data.city,
    })
    .eq('user_id', user.id)

  if (contractorError) return { error: contractorError.message }

  revalidatePath('/contractor/profile')
}
