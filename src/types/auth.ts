import type { UserRole, UserStatus } from '@prisma/client'

export type { UserRole, UserStatus }

export type SessionData = {
  userId: string
}

export type AuthUser = {
  id: string
  fullName: string
  email: string
  role: UserRole | null
  status: UserStatus
}
