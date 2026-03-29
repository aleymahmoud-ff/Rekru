'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle, X } from 'lucide-react'
import { deleteOrganization } from '@/actions/super-admin'

interface DeleteOrgButtonProps {
  orgId: string
  orgName: string
}

export function DeleteOrgButton({ orgId, orgName }: DeleteOrgButtonProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteOrganization(orgId)
      if (result.success) {
        router.push('/super/orgs')
        router.refresh()
      } else {
        setError(result.error ?? 'Deletion failed')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150 hover:bg-red-50"
        style={{
          fontFamily: 'var(--font-body)',
          color: '#dc2626',
          borderColor: '#fecaca',
          backgroundColor: '#fef2f2',
        }}
      >
        <Trash2 className="h-4 w-4" />
        Delete Organization
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isPending && setOpen(false)}
          />

          {/* Dialog */}
          <div
            className="relative w-full max-w-md rounded-2xl border shadow-xl"
            style={{ backgroundColor: '#ffffff', borderColor: '#e8e5e0' }}
          >
            {/* Close */}
            <button
              type="button"
              onClick={() => !isPending && setOpen(false)}
              disabled={isPending}
              className="absolute right-4 top-4 rounded-lg p-1 transition-colors hover:bg-[#f0eeeb] disabled:opacity-40"
            >
              <X className="h-4 w-4" style={{ color: '#9c9690' }} />
            </button>

            <div className="p-6">
              {/* Warning icon */}
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full mb-4"
                style={{ backgroundColor: '#fef2f2' }}
              >
                <AlertTriangle className="h-6 w-6" style={{ color: '#dc2626' }} />
              </div>

              <h2
                className="text-lg font-bold mb-1"
                style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a' }}
              >
                Delete organization?
              </h2>
              <p
                className="text-sm mb-2"
                style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}
              >
                You are about to permanently delete{' '}
                <span className="font-semibold" style={{ color: '#1a1a1a' }}>
                  {orgName}
                </span>{' '}
                and all its data. This includes all users, jobs, candidates, and interviews.
              </p>
              <p
                className="text-sm font-medium mb-5"
                style={{ fontFamily: 'var(--font-body)', color: '#dc2626' }}
              >
                This action cannot be undone.
              </p>

              {error && (
                <p
                  className="text-sm mb-4 rounded-lg border px-3 py-2"
                  style={{
                    fontFamily: 'var(--font-body)',
                    color: '#dc2626',
                    backgroundColor: '#fef2f2',
                    borderColor: '#fecaca',
                  }}
                >
                  {error}
                </p>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-[#f0eeeb] disabled:opacity-40"
                  style={{
                    fontFamily: 'var(--font-body)',
                    color: '#6b6560',
                    borderColor: '#e8e5e0',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-60"
                  style={{ fontFamily: 'var(--font-body)', backgroundColor: '#dc2626' }}
                >
                  {isPending ? 'Deleting...' : 'Delete permanently'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
