import AccountForm from './account-form'
import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function Account({ searchParams }: any) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const params = await searchParams

  if (!user) {
    redirect('/login')
  }

  const accountFormUser = {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.full_name || '',
    verified: !!user.email_confirmed_at,
    created: user.created_at || '',
    updated: user.updated_at || '',
  }

  return <AccountForm user={accountFormUser} message={params?.message} />
}