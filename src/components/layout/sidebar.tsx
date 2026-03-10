'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Briefcase,
  ClipboardList,
  Settings,
  Users,
  Palette,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/actions/auth'
import type { AuthUser } from '@/types/auth'

interface SidebarProps {
  user: AuthUser
}

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const mainNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Jobs', href: '/jobs', icon: Briefcase },
  { label: 'Interviews', href: '/interviews', icon: ClipboardList },
]

const settingsNav: NavItem[] = [
  { label: 'Interview Stages', href: '/settings/stages', icon: Settings },
  { label: 'User Management', href: '/settings/users', icon: Users },
  { label: 'General', href: '/settings/general', icon: Palette },
]

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  hr: 'HR',
  hiring_manager: 'Hiring Manager',
  ceo: 'CEO',
}

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
        'border-l-2',
        isActive
          ? 'text-white border-l-[#e8913a] bg-white/10'
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

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = user.role === 'admin'
  const roleLabel = user.role ? (ROLE_LABELS[user.role] ?? user.role) : 'User'

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col"
      style={{ backgroundColor: '#1e3a5f' }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center px-5 shrink-0">
        <span
          className="text-white text-xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Rekru
        </span>
        <div
          className="ml-2 h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: '#e8913a' }}
        />
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-white/10" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {mainNav.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
          />
        ))}

        {/* Settings section — admin only */}
        {isAdmin && (
          <div className="pt-5">
            <p
              className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-body)' }}
            >
              Settings
            </p>
            <div className="space-y-1">
              {settingsNav.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Divider */}
      <div className="mx-5 h-px bg-white/10" />

      {/* User area */}
      <div className="p-4 space-y-3">
        {/* User info */}
        <div className="flex items-center gap-3 px-1">
          {/* Avatar initials */}
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: '#e8913a', fontFamily: 'var(--font-body)' }}
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
              style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body)' }}
            >
              {roleLabel}
            </p>
          </div>
        </div>

        {/* Logout */}
        <form action={logout}>
          <button
            type="submit"
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150',
              'text-white/50 hover:text-white/90 hover:bg-white/5',
            )}
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
