import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Rekru — Sign in',
  description: 'Sign in to your Rekru account',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2" style={{ backgroundColor: '#f8f7f4' }}>
      {/* Left branding panel */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: '#1e3a5f' }}
      >
        {/* Decorative background shapes */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2"
          style={{ backgroundColor: '#e8913a' }}
        />
        <div
          className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 translate-y-1/2 -translate-x-1/2"
          style={{ backgroundColor: '#e8913a' }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <span
            className="text-white font-display text-3xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Rekru
          </span>
        </div>

        {/* Center copy */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <div
              className="h-1 w-12 rounded-full"
              style={{ backgroundColor: '#e8913a' }}
            />
            <h1
              className="text-white text-4xl font-bold leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Hiring, organized.
              <br />
              <span style={{ color: '#e8913a' }}>From first contact</span>
              <br />
              to final offer.
            </h1>
          </div>
          <p
            className="text-white/70 text-base leading-relaxed max-w-sm"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Rekru gives your team a single place to move candidates through
            every stage of the recruitment cycle — with clarity and confidence.
          </p>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 grid grid-cols-3 gap-6">
          {[
            { value: '4', label: 'Pipeline stages' },
            { value: '∞', label: 'Candidates tracked' },
            { value: '1', label: 'Source of truth' },
          ].map(({ value, label }) => (
            <div key={label} className="space-y-1">
              <p
                className="text-white text-3xl font-extrabold"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {value}
              </p>
              <p
                className="text-white/50 text-xs font-medium"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div
        className="flex flex-col items-center justify-center p-6 lg:p-12"
        style={{ backgroundColor: '#f8f7f4' }}
      >
        {/* Mobile-only logo */}
        <div className="lg:hidden mb-10 text-center">
          <span
            className="font-display text-3xl font-bold"
            style={{
              fontFamily: 'var(--font-display)',
              color: '#1e3a5f',
            }}
          >
            Rekru
          </span>
          <p
            className="mt-1 text-sm"
            style={{ fontFamily: 'var(--font-body)', color: '#6b6560' }}
          >
            Recruitment Cycle Management
          </p>
        </div>

        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
