import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { getCurrentUser } from '@/lib/auth'
import { getAppSettings } from '@/actions/settings'
import { GeneralSettingsForm } from '@/components/settings/general-settings-form'

export const metadata: Metadata = {
  title: 'General Settings — Rekru',
}

export default async function GeneralSettingsPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') redirect('/dashboard')

  const settings = await getAppSettings()

  return (
    <div className="max-w-xl">
      <PageHeader
        title="General Settings"
        description="Configure app name and brand colors"
      />

      <div
        className="rounded-xl border bg-white p-6"
        style={{ borderColor: '#e8e5e0' }}
      >
        <GeneralSettingsForm
          appName={settings?.appName ?? 'Rekru'}
          primaryColor={settings?.primaryColor ?? '#1e3a5f'}
          secondaryColor={settings?.secondaryColor ?? '#f8f7f4'}
          accentColor={settings?.accentColor ?? '#e8913a'}
        />
      </div>
    </div>
  )
}
