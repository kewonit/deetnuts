'use client'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { type User } from '@supabase/supabase-js'
import Avatar from './avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ToastAction } from '@/components/ui/toast'
import { useToast } from '@/components/ui/use-toast'

export default function AccountForm({ user }: { user: User | null }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [fullname, setFullname] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [website, setWebsite] = useState<string | null>(null)
  const [avatar_url, setAvatarUrl] = useState<string | null>(null)
  const { toast } = useToast()

  const getProfile = useCallback(async () => {
    try {
      setLoading(true)

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`full_name, username, website, avatar_url`)
        .eq('id', user?.id)
        .single()

      if (error && status !== 406) {
        console.log(error)
        throw error
      }

      if (data) {
        setFullname(data.full_name)
        setUsername(data.username)
        setWebsite(data.website)
        setAvatarUrl(data.avatar_url)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error loading user data!",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [user, supabase, toast])

  useEffect(() => {
    getProfile()
  }, [user, getProfile])

  async function updateProfile({
    username,
    website,
    avatar_url,
  }: {
    username: string | null
    fullname: string | null
    website: string | null
    avatar_url: string | null
  }) {
    try {
      setLoading(true)

      const { error } = await supabase.from('profiles').upsert({
        id: user?.id as string,
        full_name: fullname,
        username,
        website,
        avatar_url,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      toast({
        title: "Success",
        description: "Profile updated successfully!",
        action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error updating the data!",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-40 mx-auto max-w-xl p-8 sm:p-0 mb-24">
        <div>
          {/* 
            <Avatar
                uid={user?.id ?? null}
                url={avatar_url}
                size={100}
                onUpload={(url) => {
                    setAvatarUrl(url)
                    updateProfile({ fullname, username, website, avatar_url: url })
                }}
            />
          */}
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="text" value={user?.email} disabled />
        </div>
        <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
            id="fullName"
            type="text"
            value={fullname || ''}
            onChange={(e) => setFullname(e.target.value)}
            />
        </div>
        <div>
            <Label htmlFor="username">Username</Label>
            <Input
            id="username"
            type="text"
            value={username || ''}
            onChange={(e) => setUsername(e.target.value)}
            />
        </div>
        {/* 
        <div>
            <Label htmlFor="website">Website</Label>
            <Input
            id="website"
            type="url"
            value={website || ''}
            onChange={(e) => setWebsite(e.target.value)}
            />
        </div>
        */}
        <div className='grid grid-cols-2 space-x-4 my-4'>
            <div>
                <Button
                className="primary block w-full"
                variant="noShadow"
                onClick={() => updateProfile({ fullname, username, website, avatar_url })}
                disabled={loading}
                >
                {loading ? 'Loading ...' : 'Update'}
                </Button>
            </div>
            <div>
                <form action="/auth/signout" method="post">
                <Button className="button block w-full" type="submit" variant="neutral">
                    Sign out
                </Button>
                </form>
            </div>
        </div>
    </div>
  )
}