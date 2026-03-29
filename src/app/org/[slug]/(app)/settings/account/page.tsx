import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { getCurrentUser } from '@/lib/auth'
import { ChangePasswordForm } from '@/components/settings/change-password-form'

export const metadata: Metadata = {
  title: 'My Account — Rekru',
}

export default async function AccountPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-xl">
      <PageHeader
        title="My Account"
        description="Update your password"
      />

      <div
        className="rounded-xl border bg-white p-6"
        style={{ borderColor: '#e8e5e0' }}
      >
        <p
          className="text-sm font-semibold mb-4"
          style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}
        >
          Change Password
        </p>
        <ChangePasswordForm />
      </div>
    </div>
  )
}
