'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/server'
import { cookies } from 'next/headers'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const redirectTo = formData.get('redirect') as string || '/account'

  // Validate input
  if (!email || !email.includes('@')) {
    const params = new URLSearchParams({ message: 'Please enter a valid email address' })
    if (redirectTo && redirectTo !== '/account') params.set('redirect', redirectTo)
    return redirect(`/login?${params.toString()}`)
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Try to sign in with OTP - let Supabase handle whether user exists
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false, // Only send OTP to existing users
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback?redirect=${redirectTo}`,
    },
  })

  if (error) {
    // Check if the error suggests the user doesn't exist
    if (error.message.includes('Signups not allowed') ||
      error.message.includes('Email not confirmed') ||
      error.message.includes('Invalid login credentials')) {
      const params = new URLSearchParams({ message: 'No account found with that email. Please sign up first.' })
      if (redirectTo && redirectTo !== '/account') params.set('redirect', redirectTo)
      return redirect(`/signup?${params.toString()}`)
    }

    const params = new URLSearchParams({ message: `Could not authenticate user: ${error.message}` })
    if (redirectTo && redirectTo !== '/account') params.set('redirect', redirectTo)
    return redirect(`/login?${params.toString()}`)
  }

  redirect(`/auth/confirm?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectTo)}`)
}

export async function signup(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const redirectTo = formData.get('redirect') as string || '/account'

  if (!name || name.trim().length < 2) {
    const params = new URLSearchParams({ message: 'Name must be at least 2 characters long' })
    if (redirectTo && redirectTo !== '/account') params.set('redirect', redirectTo)
    return redirect(`/signup?${params.toString()}`)
  }

  if (!email || !email.includes('@')) {
    const params = new URLSearchParams({ message: 'Please enter a valid email address' })
    if (redirectTo && redirectTo !== '/account') params.set('redirect', redirectTo)
    return redirect(`/signup?${params.toString()}`)
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Try to create account with OTP - Supabase will handle if user already exists
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback?redirect=${redirectTo}`,
      data: {
        full_name: name.trim(),
      }
    },
  })

  if (error) {
    // Check if the error suggests the user already exists
    if (error.message.includes('User already registered')) {
      const params = new URLSearchParams({ message: 'An account with this email already exists. Please log in instead.' })
      if (redirectTo && redirectTo !== '/account') params.set('redirect', redirectTo)
      return redirect(`/login?${params.toString()}`)
    }

    const params = new URLSearchParams({ message: `Could not create account: ${error.message}` })
    if (redirectTo && redirectTo !== '/account') params.set('redirect', redirectTo)
    return redirect(`/signup?${params.toString()}`)
  }

  redirect(`/auth/confirm?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectTo)}`)
}

export async function verifyOtp(formData: FormData) {
  const email = formData.get('email') as string
  const otp = formData.get('otp') as string
  const redirectTo = formData.get('redirect') as string || '/account'

  if (!email || !otp) {
    return redirect(`/auth/confirm?message=Invalid OTP&email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectTo)}`)
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: 'email',
  })

  if (error) {
    return redirect(`/auth/confirm?message=Invalid or expired OTP. Please try again. Error: ${error.message}&email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectTo)}`)
  }

  revalidatePath('/', 'layout')
  redirect(redirectTo)
}

export async function signOut() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function updateProfile(formData: FormData) {
  const name = formData.get('name') as string

  if (!name || name.trim().length < 2) {
    redirect('/account?message=Name must be at least 2 characters long')
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      full_name: name.trim(),
    }
  })

  if (error) {
    redirect('/account?message=Failed to update profile. Please try again.')
  }

  revalidatePath('/account')
  redirect('/account?message=Profile updated successfully!')
}