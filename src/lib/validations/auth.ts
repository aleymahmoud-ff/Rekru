import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  orgName: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must be at most 100 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

/**
 * Converts a human-readable org name into a URL-safe slug.
 * Example: "  Acme Corp  " → "acme-corp"
 */
export function slugifyOrgName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')      // spaces → hyphens
    .replace(/[^a-z0-9-]/g, '') // strip non-alphanumeric (keep hyphens)
    .replace(/-{2,}/g, '-')    // collapse consecutive hyphens
    .replace(/^-|-$/g, '')     // trim leading/trailing hyphens
}

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
