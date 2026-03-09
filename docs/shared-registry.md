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

---

## Shared Constants / Enums

| Name | File Path | Purpose | Created By |
|------|-----------|---------|------------|
| `ROLES` | `src/config/roles.ts` | All user role definitions and labels | Nabil |
| `STAGE_OUTCOMES` | `src/config/stages.ts` | Pass/Fail/On Hold/Skip outcome definitions | Nabil |
| `CANDIDATE_STATUSES` | `src/config/stages.ts` | All candidate pipeline status values | Nabil |

---

## Type Definitions

| Name | File Path | Purpose | Created By |
|------|-----------|---------|------------|
| `ActionResponse<T>` | `src/types/api.ts` | Standard server action response wrapper | Nabil |
| `UserRole` | `src/types/auth.ts` | Union type of all role values | Nabil |

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

---

## Rules

1. If your function could be used by another teammate → register it here
2. If you need a utility → search this file before writing your own
3. Duplicates found by Malak (QA) are **blocking issues**
4. Conflicts resolved by Reem (Architect)
