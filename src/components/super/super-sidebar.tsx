'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, ArrowLeft, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/actions/auth'
import type { AuthUser } from '@/types/auth'

interface SuperSidebarProps {
  user: AuthUser
}

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/super', icon: LayoutDashboard },
  { label: 'Organizations', href: '/super/orgs', icon: Building2 },
]

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
        'border-l-2',
        isActive
          ? 'text-white border-l-violet-400 bg-white/10'
          : 'text-white/60 border-l-transparent hover:text-white/90 hover:bg-white/5',
      )}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <Icon
        className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-white/50')}
      />
      <span>{item.label}</span>
    </Link>
  )
}

export function SuperSidebar({ user }: SuperSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col"
      style={{ backgroundColor: '#111827' }}
    >
      {/* Header */}
      <div className="flex h-16 items-center px-5 shrink-0 gap-2.5">
        <span
          className="text-white text-xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Rekru
        </span>
        <span
          className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ backgroundColor: '#7c3aed', color: '#ffffff' }}
        >
          Super
        </span>
      </div>

      <div className="mx-5 h-px bg-white/10" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={
              item.href === '/super'
                ? pathname === '/super'
                : pathname === item.href || pathname.startsWith(item.href + '/')
            }
          />
        ))}

        {/* Divider */}
        <div className="pt-4 pb-1">
          <div className="h-px bg-white/10" />
        </div>

        {/* Back to org */}
        <Link
          href={`/${user.orgSlug}/dashboard`}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            'border-l-2 border-l-transparent text-white/50 hover:text-white/80 hover:bg-white/5',
          )}
          style={{ fontFamily: 'var(--font-body)' }}
        >
          <ArrowLeft className="h-4 w-4 shrink-0 text-white/40" />
          <span>Back to Org</span>
        </Link>
      </nav>

      <div className="mx-5 h-px bg-white/10" />

      {/* User area */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3 px-1">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: '#7c3aed', fontFamily: 'var(--font-body)' }}
          >
            {user.fullName
              .split(' ')
              .slice(0, 2)
              .map((n) => n[0])
              .join('')
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-medium text-white"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {user.fullName}
            </p>
            <p
              className="text-[11px]"
              style={{ color: 'rgba(255,255,255,0.40)', fontFamily: 'var(--font-body)' }}
            >
              Super Admin
            </p>
          </div>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150 text-white/50 hover:text-white/90 hover:bg-white/5"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign out</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
