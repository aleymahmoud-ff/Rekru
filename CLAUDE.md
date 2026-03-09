# Project: Rekru — Recruitment Cycle Management

## Tech Stack
- Framework: Next.js 15 (App Router)
- Language: TypeScript
- Database: PostgreSQL via Prisma ORM
- Auth: Custom email + password (self-registration + admin approval)
- Styling: Tailwind CSS + shadcn/ui
- Database Hosting: Vercel Postgres (Neon)
- Deployment: Vercel
- Repo: https://github.com/aleymahmoud-ff/Rekru

## Architecture
- Single-organization app (no multi-tenancy)
- Simple roles: admin, user (no complex RBAC)
- Server Actions for mutations
- Prisma for all database access
- Configurable interview pipeline: stages → questions → options (all admin-managed)

## Core Flow
Job Request → Add Candidates → HR Interview → Technical Interview → Final Interview → Hired/Rejected
- Each stage has admin-configured questions with admin-configured answer options
- Pass → next stage. Fail → rejected. On Hold → stays. Pass last stage → hired.
- See `docs/05-mvp-requirements.md` and `docs/06-mvp-database-design.md` for full spec

## Key Conventions
- All components go in `src/components/`
- All server actions in `src/actions/`
- All API routes in `src/app/api/`
- Database schema in `prisma/schema.prisma`
- Migrations in `prisma/migrations/`
- Use `cn()` helper for conditional class names
- zod schemas for all input validation

## Commands
- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run lint` — Run ESLint
- `npx prisma migrate dev` — Run migrations
- `npx prisma generate` — Regenerate Prisma client
- `npx prisma studio` — Browse database

## MVP Scope — What's NOT Included
- No salary tracking
- No email notifications
- No file uploads (CV is URL only)
- No export/reports
- No offer management
- No audit log (V2)

## The Team
- **Reem** — Project Architect (technical lead, architecture decisions)
- **Tumtum** — UI/UX Designer (design system, accessibility, user flows)
- **Yoki** — Frontend Developer (React components, pages, client logic)
- **Nabil** — Backend Developer (APIs, server actions, business logic)
- **Salma** — Database Engineer (Prisma schema, migrations, queries)
- **Zain** — Security Specialist (audits, auth review, hardening)
- **Malak** — QA / Code Reviewer (testing, standards, bug tracking)
- **Tarek** — DevOps (Docker, CI/CD, deployment, infrastructure)
- **Layla** — Technical Writer (docs, API docs, changelogs, guides)
- **Omar** — Cloud Integration Specialist (external services, file storage, email future)

## Agent Team Coordination Rules
- Each teammate owns specific directories — do NOT edit files outside your scope
- Always pull latest before starting work
- Communicate blockers through the shared task list
- Zain (Security) must review all auth-related changes
- Malak (QA) must check all changes before they're considered done
- Reem (Architect) approves all structural changes

## CRITICAL: Discovery Before Creation (Anti-Duplication Protocol)
Every teammate MUST follow this before writing ANY utility, helper, constant, mapping, or shared logic:

### Step 1: Search First
Before creating a new function, constant array, enum, type, config object, or mapping:
```bash
grep -r "keyword" src/lib/ src/utils/ src/helpers/ src/config/
grep -r "functionName\|CONSTANT_NAME" --include="*.ts" --include="*.tsx" src/
```

### Step 2: Check the Shared Registry
Read `/docs/shared-registry.md` before creating anything reusable. If a utility already exists, USE IT.

### Step 3: Register New Utilities
If you create a new shared utility, constant, or mapping, you MUST:
1. Add it to `/docs/shared-registry.md` with: name, file path, purpose, and your name
2. Notify teammates who might need it through the task list

### Step 4: No Hardcoded Lists
Never hardcode lists or enums that already exist as utility functions. Examples of violations:
- ❌ Creating `STATUS_LIST = [...]` when `getCandidateStatuses()` already returns this
- ❌ Defining inline role unions when a shared enum/type exists
- ✅ `import { getCandidateStatuses } from '@/lib/candidate-utils'`

### What Happens When You Skip This
Malak (QA) WILL flag duplication as a blocking issue — not advisory. Duplicated logic must be resolved before the task is marked complete.
