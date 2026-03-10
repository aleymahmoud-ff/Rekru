'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { login } from '@/actions/auth'
import { cn } from '@/lib/utils'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      className={cn(
        'w-full font-medium py-2.5 rounded-lg transition-opacity',
        'text-white',
      )}
      style={{ backgroundColor: '#1e3a5f' }}
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Signing in…
        </span>
      ) : (
        'Sign in'
      )}
    </Button>
  )
}

export default function LoginPage() {
  const [state, action] = useActionState(login, { success: false })

  return (
    <Card
      className="w-full shadow-sm border rounded-xl"
      style={{ borderColor: '#e8e5e0', backgroundColor: '#ffffff' }}
    >
      <CardHeader className="space-y-1 pb-4">
        <CardTitle
          className="text-2xl font-bold"
          style={{
            fontFamily: 'var(--font-display)',
            color: '#1a1a1a',
          }}
        >
          Welcome back
        </CardTitle>
        <CardDescription
          className="text-sm"
          style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}
        >
          Sign in to your Rekru account
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={action} className="space-y-4">
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
              className="rounded-lg text-sm"
              style={{ borderColor: '#e8e5e0', fontFamily: 'var(--font-body)' }}
            />
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
              autoComplete="current-password"
              placeholder="••••••••"
              required
              className="rounded-lg text-sm"
              style={{ borderColor: '#e8e5e0', fontFamily: 'var(--font-body)' }}
            />
          </div>

          <div className="pt-1">
            <SubmitButton />
          </div>
        </form>

        <p
          className="mt-5 text-center text-sm"
          style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}
        >
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-medium underline underline-offset-4 transition-colors hover:opacity-80"
            style={{ color: '#1e3a5f' }}
          >
            Register
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
