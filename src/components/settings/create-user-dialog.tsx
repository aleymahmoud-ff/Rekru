'use client'

import { useState, useActionState } from 'react'
import { createUser } from '@/actions/settings'
import { UserPlus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type State = { success: boolean; error?: string }

export function CreateUserDialog() {
  const [open, setOpen] = useState(false)

  const [state, formAction, isPending] = useActionState(
    async (_prev: State, formData: FormData) => {
      const result = await createUser({
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role'),
      })
      if (result.success) setOpen(false)
      return result
    },
    { success: false }
  )

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
        style={{ backgroundColor: '#1e3a5f', fontFamily: 'var(--font-body)' }}
      >
        <UserPlus className="h-4 w-4" />
        Add User
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-display)' }}>Add User</DialogTitle>
          </DialogHeader>

          <form action={formAction} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="cu-fullName" style={{ fontFamily: 'var(--font-body)' }}>Full Name</Label>
              <Input
                id="cu-fullName"
                name="fullName"
                placeholder="Jane Smith"
                required
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cu-email" style={{ fontFamily: 'var(--font-body)' }}>Email</Label>
              <Input
                id="cu-email"
                name="email"
                type="email"
                placeholder="jane@company.com"
                required
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cu-password" style={{ fontFamily: 'var(--font-body)' }}>
                Initial Password
                <span className="ml-1 font-normal" style={{ color: '#9c9690' }}>(share with user)</span>
              </Label>
              <Input
                id="cu-password"
                name="password"
                type="password"
                placeholder="Min. 8 characters"
                required
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cu-role" style={{ fontFamily: 'var(--font-body)' }}>Role</Label>
              <select
                id="cu-role"
                name="role"
                defaultValue="user"
                className="w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  fontFamily: 'var(--font-body)',
                  borderColor: '#e8e5e0',
                  backgroundColor: '#ffffff',
                  color: '#1a1a1a',
                }}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {state.error && (
              <p className="text-sm text-red-600" style={{ fontFamily: 'var(--font-body)' }}>
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#1e3a5f', fontFamily: 'var(--font-body)' }}
            >
              {isPending ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
