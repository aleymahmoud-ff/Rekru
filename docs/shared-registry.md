# Shared Registry

> **Owner: Reem (Architect)**
> Single source of truth for all shared utilities, constants, mappings, and helpers.
> BEFORE creating anything reusable, search this file first.
> AFTER creating something reusable, add it here.

---

## How to Use

1. **Before building**: Search this file for existing utilities
2. **After building**: Add your new utility to the correct section below
3. **Duplication = blocker**: Malak (QA) flags duplicates as blocking issues
4. **Conflicts**: Reem (Architect) decides which version becomes canonical

---

## Utility Functions

| Name | File Path | Purpose | Created By |
|------|-----------|---------|------------|
| `cn()` | `src/lib/utils.ts` | Merges Tailwind class names conditionally | Reem |
| `getSession()` | `src/lib/auth.ts` | Returns the iron-session instance for the current request | Nabil |
| `getCurrentUser()` | `src/lib/auth.ts` | Reads session + fetches user from DB; returns `AuthUser \| null` (no password hash). Validates session orgId matches DB. | Nabil |
| `SESSION_OPTIONS` | `src/lib/auth.ts` | Shared iron-session config (cookie name, TTL, security flags) | Nabil |
| `getOrgContext(slug)` | `src/lib/org.ts` | Verifies current user belongs to the org identified by slug; redirects to /login otherwise. Returns `{ orgId, userId, user }`. | Nabil |
| `orgPath(slug, path)` | `src/lib/org.ts` | Builds an org-scoped URL path. Example: `orgPath('acme', '/dashboard')` → `/org/acme/dashboard` | Nabil |
| `slugifyOrgName(name)` | `src/lib/validations/auth.ts` | Converts a human-readable org name to a URL-safe slug (lowercase, spaces to hyphens, strips non-alphanumeric) | Nabil |

---

## Shared Constants / Enums

| Name | File Path | Purpose | Created By |
|------|-----------|---------|------------|
| `ROLES` | `src/config/roles.ts` | All user role definitions and labels | Nabil |
| `STAGE_OUTCOMES` | `src/config/stages.ts` | Pass/Fail/On Hold/Skip outcome definitions | Nabil |
| `CANDIDATE_STATUSES` | `src/config/stages.ts` | All candidate pipeline status values | Nabil |
| `loginSchema` | `src/lib/validations/auth.ts` | Zod schema for login form (email + password) | Nabil |
| `registerSchema` | `src/lib/validations/auth.ts` | Zod schema for registration form (fullName + email + password) | Nabil |

---

## Type Definitions

| Name | File Path | Purpose | Created By |
|------|-----------|---------|------------|
| `ActionResponse<T>` | `src/types/api.ts` | Standard server action response wrapper | Nabil |
| `UserRole` | `src/types/auth.ts` | Re-export of Prisma-generated UserRole union (`admin` \| `user`) | Nabil |
| `UserStatus` | `src/types/auth.ts` | Re-export of Prisma-generated UserStatus union (`pending` \| `active` \| `inactive`) | Nabil |
| `SessionData` | `src/types/auth.ts` | Shape of the iron-session payload `{ userId, orgId, orgSlug }` | Nabil |
| `AuthUser` | `src/types/auth.ts` | Safe user object returned to server actions (no password hash); includes `orgId` and `orgSlug` | Nabil |
| `LoginInput` | `src/lib/validations/auth.ts` | Inferred type from `loginSchema` | Nabil |
| `RegisterInput` | `src/lib/validations/auth.ts` | Inferred type from `registerSchema` | Nabil |

---

## UI Components

| Name | File Path | Purpose | Created By |
|------|-----------|---------|------------|
| `<Sidebar>` | `src/components/layout/sidebar.tsx` | Fixed left nav with role-aware settings section and logout. Props: `user: AuthUser` | Yoki |
| `<PageHeader>` | `src/components/shared/page-header.tsx` | Reusable page title/description/action bar. Props: `title`, `description?`, `action?` | Yoki |
| `<SuperSidebar>` | `src/components/super/super-sidebar.tsx` | Dark sidebar for the super admin panel. Links to /super and /super/orgs plus back-to-org. Props: `user: AuthUser` | Yoki |
| `<DeleteOrgButton>` | `src/components/super/delete-org-button.tsx` | Confirmation modal + delete action for an organization. Props: `orgId`, `orgName` | Yoki |
| `<ToggleSuperAdminButton>` | `src/components/super/toggle-super-admin-button.tsx` | Inline button to grant/revoke super admin on a user. Props: `userId`, `isSuperAdmin`, `isCurrentUser` | Yoki |

---

## Analytics Actions

| Name | File Path | Purpose | Created By |
|------|-----------|---------|------------|
| `getPipelineAnalytics(jobId?)` | `src/actions/analytics.ts` | Returns funnel stats, job performance, rejection drivers, and summary counts — optionally scoped to a single job. Admin-gated at page level. | Nabil |

---

## Super Admin

| Name | File Path | Purpose | Created By |
|------|-----------|---------|------------|
| `requireSuperAdmin()` | `src/lib/super-admin.ts` | Guards super admin routes — returns `{ error, user }`. Returns error if not authenticated or not isSuperAdmin. | Yoki |
| `getSuperAdminStats()` | `src/actions/super-admin.ts` | Platform-level counts: orgs, users, candidates, jobs, interviews. Returns null if not super admin. | Yoki |
| `getAllOrganizations()` | `src/actions/super-admin.ts` | All orgs with _count of users/jobs/candidates, ordered by createdAt desc. Returns [] if not super admin. | Yoki |
| `getOrganizationDetail(orgId)` | `src/actions/super-admin.ts` | Single org with users list and jobs/candidates/interviews counts. Returns null if not found or not super admin. | Yoki |
| `deleteOrganization(orgId)` | `src/actions/super-admin.ts` | Deletes org and ALL related data in a transaction (cascade order). Returns ActionResult. | Yoki |
| `toggleSuperAdmin(userId)` | `src/actions/super-admin.ts` | Toggles isSuperAdmin on a user. Cannot un-super yourself. Returns ActionResult. | Yoki |

---

## Mappings / Config Objects

| Name | File Path | Purpose | Created By |
|------|-----------|---------|------------|
| _(none yet)_ | — | — | — |

---

## Database Service Functions

| Name | File Path | Purpose | Created By |
|------|-----------|---------|------------|
| _(none yet — add as Salma builds them)_ | — | — | — |

---

## Integration Utilities

| Name | File Path | Purpose | Created By |
|------|-----------|---------|------------|
| `sendEmail()` | `src/lib/integrations/email.ts` | Email abstraction layer (no-op in V1) | Omar |
| `uploadCv()` / `getCvSignedUrl()` / `resolveCvUrl()` / `deleteCv()` / `isS3Configured()` / `isS3Key()` / `CV_ACCEPT` / `MAX_CV_BYTES` | `src/lib/s3.ts` | S3-compatible CV storage (Cranl Storage): upload, presigned view URLs, legacy-URL passthrough | Omar |

---

## Rules

1. If your function could be used by another teammate → register it here
2. If you need a utility → search this file before writing your own
3. Duplicates found by Malak (QA) are **blocking issues**
4. Conflicts resolved by Reem (Architect)
