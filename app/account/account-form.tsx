'use client'
import { useEffect, useState } from 'react'
import { type User } from '@/lib/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { updateProfile } from '@/app/login/actions'
import { SubmitButton } from '@/app/login/sumbit-button'

export default function AccountForm({ user, message }: { user: User | null; message?: string }) {
  const [name, setName] = useState<string>(user?.name || '')
  const [email, setEmail] = useState<string>(user?.email || '')

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
    }
  }, [user])

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="mt-40 mx-auto max-w-xl p-8 sm:p-0 mb-24">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
        </div>

        {message && (
          <div className={`mb-4 p-4 border rounded-md ${message.includes('successfully')
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
            }`}>
            <p className="text-sm text-center">{message}</p>
          </div>
        )}

        <form action={updateProfile} className="space-y-6">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Email cannot be changed. Contact support if you need to update your email.
            </p>
          </div>

          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="mt-1"
              required
              minLength={2}
            />
          </div>

          <div>
            <Label>Account Status</Label>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.verified
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
                }`}>
                {user.verified ? 'Verified' : 'Unverified'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-4 pt-6">
            <SubmitButton
              className="flex-1"
              pendingText="Updating..."
              disabled={!name.trim() || name.trim().length < 2}
            >
              Update Profile
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  )
}