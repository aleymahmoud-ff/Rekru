'use client'

import { useActionState } from 'react'
import { changePassword } from '@/actions/settings'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle } from 'lucide-react'

type State = { success: boolean; error?: string }

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState<State, FormData>(
    changePassword,
    { success: false }
  )

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword" style={{ fontFamily: 'var(--font-body)' }}>
          Current Password
        </Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          style={{ fontFamily: 'var(--font-body)' }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword" style={{ fontFamily: 'var(--font-body)' }}>
          New Password
          <span className="ml-1 font-normal" style={{ color: '#9c9690' }}>(min. 8 characters)</span>
        </Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          style={{ fontFamily: 'var(--font-body)' }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" style={{ fontFamily: 'var(--font-body)' }}>
          Confirm New Password
        </Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          style={{ fontFamily: 'var(--font-body)' }}
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600" style={{ fontFamily: 'var(--font-body)' }}>
          {state.error}
        </p>
      )}

      {state.success && (
        <div className="flex items-center gap-2 text-sm" style={{ color: '#059669', fontFamily: 'var(--font-body)' }}>
          <CheckCircle className="h-4 w-4" />
          Password changed successfully
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: '#1e3a5f', fontFamily: 'var(--font-body)' }}
      >
        {isPending ? 'Saving...' : 'Change Password'}
      </button>
    </form>
  )
}
