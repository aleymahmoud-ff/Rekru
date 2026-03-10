'use client'

import { useActionState } from 'react'
import { updateAppSettings } from '@/actions/settings'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function GeneralSettingsForm({
  appName,
  primaryColor,
  secondaryColor,
  accentColor,
}: {
  appName: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
}) {
  const [state, formAction, isPending] = useActionState(updateAppSettings, { success: false })

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label style={{ fontFamily: 'var(--font-body)' }}>App Name</Label>
        <Input name="appName" defaultValue={appName} style={{ fontFamily: 'var(--font-body)' }} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-xs" style={{ fontFamily: 'var(--font-body)' }}>Primary</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              name="primaryColor"
              defaultValue={primaryColor}
              className="h-9 w-9 rounded border cursor-pointer"
              style={{ borderColor: '#e8e5e0' }}
            />
            <Input
              defaultValue={primaryColor}
              className="font-mono text-xs"
              readOnly
              tabIndex={-1}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs" style={{ fontFamily: 'var(--font-body)' }}>Secondary</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              name="secondaryColor"
              defaultValue={secondaryColor}
              className="h-9 w-9 rounded border cursor-pointer"
              style={{ borderColor: '#e8e5e0' }}
            />
            <Input
              defaultValue={secondaryColor}
              className="font-mono text-xs"
              readOnly
              tabIndex={-1}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs" style={{ fontFamily: 'var(--font-body)' }}>Accent</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              name="accentColor"
              defaultValue={accentColor}
              className="h-9 w-9 rounded border cursor-pointer"
              style={{ borderColor: '#e8e5e0' }}
            />
            <Input
              defaultValue={accentColor}
              className="font-mono text-xs"
              readOnly
              tabIndex={-1}
            />
          </div>
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-red-600" style={{ fontFamily: 'var(--font-body)' }}>{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-green-600" style={{ fontFamily: 'var(--font-body)' }}>Settings saved!</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: '#1e3a5f', fontFamily: 'var(--font-body)' }}
      >
        {isPending ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  )
}
