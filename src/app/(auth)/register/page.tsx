'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { register } from '@/actions/auth'
import { registerSchema } from '@/lib/validations/auth'
import { cn } from '@/lib/utils'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full font-medium py-2.5 rounded-lg transition-opacity text-white"
      style={{ backgroundColor: '#1e3a5f' }}
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Creating account…
        </span>
      ) : (
        'Create account'
      )}
    </Button>
  )
}

interface FieldErrors {
  orgName?: string
  fullName?: string
  email?: string
  password?: string
}

export default function RegisterPage() {
  const [state, action] = useActionState(register, { success: false })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  // Clear field errors when the server returns a fresh result
  useEffect(() => {
    if (state.success) {
      setFieldErrors({})
    }
  }, [state])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget
    const raw = {
      orgName: (form.elements.namedItem('orgName') as HTMLInputElement)?.value,
      fullName: (form.elements.namedItem('fullName') as HTMLInputElement)?.value,
      email: (form.elements.namedItem('email') as HTMLInputElement)?.value,
      password: (form.elements.namedItem('password') as HTMLInputElement)?.value,
    }

    const result = registerSchema.safeParse(raw)
    if (!result.success) {
      e.preventDefault()
      const errors: FieldErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FieldErrors
        if (!errors[field]) errors[field] = issue.message
      }
      setFieldErrors(errors)
    } else {
      setFieldErrors({})
    }
  }

  // Registration now redirects automatically — this is a fallback
  if (state.success) {
    return (
      <Card
        className="w-full shadow-sm border rounded-xl"
        style={{ borderColor: '#e8e5e0', backgroundColor: '#ffffff' }}
      >
        <CardContent className="py-10 flex flex-col items-center text-center space-y-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: '#d1fae5' }}
          >
            <CheckCircle2 className="h-7 w-7" style={{ color: '#059669' }} />
          </div>
          <div className="space-y-1.5">
            <h2
              className="text-xl font-bold"
              style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a' }}
            >
              Organization created!
            </h2>
            <p
              className="text-sm leading-relaxed max-w-xs"
              style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}
            >
              Redirecting to your dashboard...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className="w-full shadow-sm border rounded-xl"
      style={{ borderColor: '#e8e5e0', backgroundColor: '#ffffff' }}
    >
      <CardHeader className="space-y-1 pb-4">
        <CardTitle
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--font-display)', color: '#1a1a1a' }}
        >
          Create your organization
        </CardTitle>
        <CardDescription
          className="text-sm"
          style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}
        >
          Set up a new Rekru workspace for your team
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={action} onSubmit={handleSubmit} className="space-y-4">
          {/* Server error */}
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

          {/* Organization Name */}
          <div className="space-y-1.5">
            <Label
              htmlFor="orgName"
              className="text-xs font-medium"
              style={{ color: '#1a1a1a', fontFamily: 'var(--font-body)' }}
            >
              Organization name
            </Label>
            <Input
              id="orgName"
              name="orgName"
              type="text"
              placeholder="Acme Corp"
              required
              className={cn('rounded-lg text-sm', fieldErrors.orgName && 'border-red-400')}
              style={{ borderColor: fieldErrors.orgName ? undefined : '#e8e5e0', fontFamily: 'var(--font-body)' }}
            />
            {fieldErrors.orgName && (
              <p className="text-xs" style={{ color: '#dc2626', fontFamily: 'var(--font-body)' }}>
                {fieldErrors.orgName}
              </p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label
              htmlFor="fullName"
              className="text-xs font-medium"
              style={{ color: '#1a1a1a', fontFamily: 'var(--font-body)' }}
            >
              Your full name
            </Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="Jane Smith"
              required
              className={cn('rounded-lg text-sm', fieldErrors.fullName && 'border-red-400')}
              style={{ borderColor: fieldErrors.fullName ? undefined : '#e8e5e0', fontFamily: 'var(--font-body)' }}
            />
            {fieldErrors.fullName && (
              <p className="text-xs" style={{ color: '#dc2626', fontFamily: 'var(--font-body)' }}>
                {fieldErrors.fullName}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-xs font-medium"
              style={{ color: '#1a1a1a', fontFamily: 'var(--font-body)' }}
            >
              Email address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              className={cn('rounded-lg text-sm', fieldErrors.email && 'border-red-400')}
              style={{ borderColor: fieldErrors.email ? undefined : '#e8e5e0', fontFamily: 'var(--font-body)' }}
            />
            {fieldErrors.email && (
              <p className="text-xs" style={{ color: '#dc2626', fontFamily: 'var(--font-body)' }}>
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              className="text-xs font-medium"
              style={{ color: '#1a1a1a', fontFamily: 'var(--font-body)' }}
            >
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
              className={cn('rounded-lg text-sm', fieldErrors.password && 'border-red-400')}
              style={{ borderColor: fieldErrors.password ? undefined : '#e8e5e0', fontFamily: 'var(--font-body)' }}
            />
            {fieldErrors.password && (
              <p className="text-xs" style={{ color: '#dc2626', fontFamily: 'var(--font-body)' }}>
                {fieldErrors.password}
              </p>
            )}
            <p className="text-xs" style={{ color: '#9c9690', fontFamily: 'var(--font-body)' }}>
              Must be at least 6 characters
            </p>
          </div>

          <div className="pt-1">
            <SubmitButton />
          </div>
        </form>

        <p
          className="mt-5 text-center text-sm"
          style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}
        >
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium underline underline-offset-4 transition-colors hover:opacity-80"
            style={{ color: '#1e3a5f' }}
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
