import { createClient } from '@/app/lib/supabase/server'
import { cookies } from 'next/headers'

export interface User {
    id: string
    email: string
    name?: string
    verified: boolean
    avatar?: string
    created: string
    updated: string
}

export async function getCurrentUser(): Promise<User | null> {
    try {
        const cookieStore = await cookies()
        const supabase = createClient(cookieStore)
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
            return null
        }

        // Map Supabase user to our User interface
        const mappedUser: User = {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
            verified: user.email_confirmed_at !== null,
            avatar: user.user_metadata?.avatar_url,
            created: user.created_at,
            updated: user.updated_at || user.created_at
        }

        return mappedUser
    } catch (error) {
        console.error('Error getting current user:', error)
        return null
    }
}

export async function getAuthStatus(): Promise<{ isAuthenticated: boolean; user: User | null }> {
    try {
        const user = await getCurrentUser()
        return { isAuthenticated: user !== null, user }
    } catch (error) {
        console.error('Error checking auth status:', error)
        return { isAuthenticated: false, user: null }
    }
}

export async function isAuthenticated(): Promise<boolean> {
    const user = await getCurrentUser()
    return user !== null
}
