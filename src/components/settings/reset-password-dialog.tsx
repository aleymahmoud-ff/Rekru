'use client'

import { useState, useTransition } from 'react'
import { resetUserPassword } from '@/actions/settings'
import { KeyRound, Copy, Check, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
  userId: string
  userName: string
  userEmail: string
}

type Mode = 'generate' | 'manual'

export function ResetPasswordDialog({ userId, userName, userEmail }: Props) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('generate')
  const [manualPassword, setManualPassword] = useState('')
  const [newPassword, setNewPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleOpenChange(next: boolean) {
    setOpen(next)
    // Clear the plaintext password out of component state as soon as the
    // dialog closes so it isn't left sitting in memory or re-shown later.
    if (!next) {
      setNewPassword(null)
      setManualPassword('')
      setMode('generate')
      setError(null)
      setCopied(false)
    }
  }

  function handleReset() {
    setError(null)
    startTransition(async () => {
      const result = await resetUserPassword({
        userId,
        password: mode === 'manual' ? manualPassword : undefined,
      })
      if (result.success && result.password) {
        setNewPassword(result.password)
      } else {
        setError(result.error ?? 'Failed to reset password')
      }
    })
  }

  async function handleCopy() {
    if (!newPassword) return
    try {
      await navigator.clipboard.writeText(newPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy automatically — select the password and copy it manually.')
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-[#f0eeeb]"
        style={{ fontFamily: 'var(--font-body)', borderColor: '#e8e5e0', color: '#1e3a5f' }}
      >
        <KeyRound className="h-3 w-3 inline mr-1" />
        Reset Password
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-display)' }}>
              Reset Password: {userName}
            </DialogTitle>
          </DialogHeader>

          {newPassword ? (
            /* ---- Result: show the new password once ---- */
            <div className="space-y-4 mt-2">
              <p className="text-xs" style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}>
                The password for <span style={{ color: '#1a1a1a' }}>{userEmail}</span> has been
                reset. Share it with them now — it cannot be shown again.
              </p>

              <div
                className="rounded-lg border p-3"
                style={{ backgroundColor: '#f8f7f5', borderColor: '#e8e5e0' }}
              >
                <div className="flex items-center gap-2">
                  <code
                    className="flex-1 select-all break-all text-sm tracking-wide"
                    style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', color: '#1a1a1a' }}
                  >
                    {newPassword}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopy}
                    aria-label="Copy password to clipboard"
                    className="shrink-0 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors hover:bg-white"
                    style={{ fontFamily: 'var(--font-body)', borderColor: '#e8e5e0', color: '#1e3a5f' }}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 inline mr-1" style={{ color: '#059669' }} />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 inline mr-1" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div
                className="flex gap-2 rounded-lg border p-3"
                style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}
              >
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
                <p className="text-xs" style={{ fontFamily: 'var(--font-body)', color: '#92400e' }}>
                  Send it over a private channel and ask the user to change it from
                  Settings &rarr; Account after signing in.
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-600" style={{ fontFamily: 'var(--font-body)' }}>{error}</p>
              )}

              <button
                onClick={() => handleOpenChange(false)}
                className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: '#1e3a5f', fontFamily: 'var(--font-body)' }}
              >
                Done
              </button>
            </div>
          ) : (
            /* ---- Form: choose how to set the new password ---- */
            <div className="space-y-4 mt-2">
              <p className="text-xs" style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}>
                This replaces the current password for{' '}
                <span style={{ color: '#1a1a1a' }}>{userEmail}</span>. The new password is
                displayed once so you can share it with them.
              </p>

              <div className="space-y-1.5">
                <label
                  className="flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer hover:bg-[#faf9f7] transition-colors"
                  style={{ borderColor: mode === 'generate' ? '#1e3a5f' : '#e8e5e0' }}
                >
                  <input
                    type="radio"
                    name="reset-mode"
                    checked={mode === 'generate'}
                    onChange={() => setMode('generate')}
                    className="h-4 w-4 mt-0.5"
                    style={{ accentColor: '#1e3a5f' }}
                  />
                  <span>
                    <span className="block text-sm" style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}>
                      Generate a secure password
                    </span>
                    <span className="block text-xs mt-0.5" style={{ fontFamily: 'var(--font-body)', color: '#9c9690' }}>
                      Recommended — 14 random characters
                    </span>
                  </span>
                </label>

                <label
                  className="flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer hover:bg-[#faf9f7] transition-colors"
                  style={{ borderColor: mode === 'manual' ? '#1e3a5f' : '#e8e5e0' }}
                >
                  <input
                    type="radio"
                    name="reset-mode"
                    checked={mode === 'manual'}
                    onChange={() => setMode('manual')}
                    className="h-4 w-4 mt-0.5"
                    style={{ accentColor: '#1e3a5f' }}
                  />
                  <span className="text-sm" style={{ fontFamily: 'var(--font-body)', color: '#1a1a1a' }}>
                    Set a password myself
                  </span>
                </label>
              </div>

              {mode === 'manual' && (
                <div className="space-y-2">
                  <Label htmlFor="rp-password" style={{ fontFamily: 'var(--font-body)' }}>
                    New Password
                  </Label>
                  <Input
                    id="rp-password"
                    type="text"
                    value={manualPassword}
                    onChange={(e) => setManualPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    autoComplete="off"
                    style={{ fontFamily: 'var(--font-body)' }}
                  />
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600" style={{ fontFamily: 'var(--font-body)' }}>{error}</p>
              )}

              <button
                disabled={isPending || (mode === 'manual' && manualPassword.length < 8)}
                onClick={handleReset}
                className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#dc2626', fontFamily: 'var(--font-body)' }}
              >
                {isPending ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
