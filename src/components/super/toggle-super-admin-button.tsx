'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Shield } from 'lucide-react'
import { toggleSuperAdmin } from '@/actions/super-admin'

interface ToggleSuperAdminButtonProps {
  userId: string
  isSuperAdmin: boolean
  isCurrentUser: boolean
}

export function ToggleSuperAdminButton({
  userId,
  isSuperAdmin,
  isCurrentUser,
}: ToggleSuperAdminButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleToggle() {
    setError(null)
    startTransition(async () => {
      const result = await toggleSuperAdmin(userId)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error ?? 'Failed to update')
      }
    })
  }

  if (isCurrentUser) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
        style={{ backgroundColor: '#f5f3ff', color: '#7c3aed' }}
        title="You cannot remove your own super admin status"
      >
        <ShieldCheck className="h-3 w-3" />
        You
      </span>
    )
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all duration-150 disabled:opacity-50"
        style={
          isSuperAdmin
            ? {
                fontFamily: 'var(--font-body)',
                backgroundColor: '#f5f3ff',
                color: '#7c3aed',
                border: '1px solid #ddd6fe',
              }
            : {
                fontFamily: 'var(--font-body)',
                backgroundColor: '#f0eeeb',
                color: '#6b6560',
                border: '1px solid #e8e5e0',
              }
        }
        title={isSuperAdmin ? 'Revoke super admin' : 'Grant super admin'}
      >
        {isSuperAdmin ? (
          <ShieldCheck className="h-3 w-3" />
        ) : (
          <Shield className="h-3 w-3" />
        )}
        {isPending
          ? 'Saving...'
          : isSuperAdmin
            ? 'Super Admin'
            : 'Make Super Admin'}
      </button>
      {error && (
        <p
          className="text-[11px]"
          style={{ fontFamily: 'var(--font-body)', color: '#dc2626' }}
        >
          {error}
        </p>
      )}
    </div>
  )
}
