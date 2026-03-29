'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { createOrganization } from '@/actions/super-admin'
import { PageHeader } from '@/components/shared/page-header'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'

export default function NewOrgPage() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createOrganization, { success: false })

  useEffect(() => {
    if (state.success) {
      router.push('/super/orgs')
      router.refresh()
    }
  }, [state.success, router])

  return (
    <div className="max-w-xl">
      <PageHeader
        title="Create Organization"
        description="Set up a new tenant with an admin user"
      />

      <form action={formAction} className="space-y-5">
        {state.error && (
          <div
            className="flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm"
            style={{
              backgroundColor: '#fef2f2',
              borderColor: '#fecaca',
              color: '#dc2626',
              fontFamily: 'var(--font-body)',
            }}
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        <div
          className="rounded-xl border bg-white p-6 space-y-4"
          style={{ borderColor: '#e8e5e0' }}
        >
          <p
            className="text-sm font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a' }}
          >
            Organization
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs" style={{ fontFamily: 'var(--font-body)' }}>
              Organization Name
            </Label>
            <Input
              name="orgName"
              placeholder="Acme Corp"
              required
              style={{ fontFamily: 'var(--font-body)' }}
            />
          </div>
        </div>

        <div
          className="rounded-xl border bg-white p-6 space-y-4"
          style={{ borderColor: '#e8e5e0' }}
        >
          <p
            className="text-sm font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a' }}
          >
            Admin User
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs" style={{ fontFamily: 'var(--font-body)' }}>
              Full Name
            </Label>
            <Input
              name="adminName"
              placeholder="Jane Smith"
              required
              style={{ fontFamily: 'var(--font-body)' }}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" style={{ fontFamily: 'var(--font-body)' }}>
              Email
            </Label>
            <Input
              name="adminEmail"
              type="email"
              placeholder="admin@acme.com"
              required
              style={{ fontFamily: 'var(--font-body)' }}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" style={{ fontFamily: 'var(--font-body)' }}>
              Password
            </Label>
            <Input
              name="adminPassword"
              type="password"
              placeholder="••••••••"
              required
              style={{ fontFamily: 'var(--font-body)' }}
            />
            <p className="text-xs" style={{ color: '#9c9690', fontFamily: 'var(--font-body)' }}>
              At least 6 characters
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors hover:bg-[#faf9f7]"
            style={{ fontFamily: 'var(--font-body)', borderColor: '#e8e5e0', color: '#6b6560' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-lg px-4 py-3 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#1e3a5f', fontFamily: 'var(--font-body)' }}
          >
            {isPending ? 'Creating...' : 'Create Organization'}
          </button>
        </div>
      </form>
    </div>
  )
}
