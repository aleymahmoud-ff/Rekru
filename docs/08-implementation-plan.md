# Recruitment Cycle MVP — Implementation Plan

**Version:** 1.0
**Date:** 2026-03-10

---

## Phase Overview

```
Phase 1: Foundation     →  Project setup, DB schema, Docker
Phase 2: Auth           →  Login, register, session, middleware
Phase 3: Core Backend   →  Server actions for all CRUD operations
Phase 4: UI Shell       →  Layout, sidebar, design system components
Phase 5: Pages          →  All application pages (parallel)
Phase 6: QA + Security  →  Review all code, fix issues
```

---

## Phase 1 — Foundation

**Goal:** Project scaffolded, database ready, Docker configured.

| Task | Assignee | Description | Dependencies |
|------|----------|-------------|--------------|
| 1.1 | **Reem** | Initialize Next.js 15 project with TypeScript, Tailwind CSS, shadcn/ui. Set up folder structure (`src/app`, `src/components`, `src/actions`, `src/lib`). Configure `tailwind.config.ts` with custom fonts (Outfit + DM Sans) and CSS variables. Install dependencies. | None |
| 1.2 | **Salma** | Write Prisma schema for all 10 tables. Run initial migration. Write seed script (admin user, default stages, questions, options, app_settings). | 1.1 |
| 1.3 | **Tarek** | Create `Dockerfile` (multi-stage), `docker-compose.yml` (app + postgres), `.env.example`, `.dockerignore`. | 1.1 |

**Deliverables:**
- `npm run dev` works
- `npx prisma studio` shows all 10 tables with seed data
- `docker compose up` runs the full stack

---

## Phase 2 — Auth

**Goal:** Users can register, admin can approve, login works with sessions.

| Task | Assignee | Description | Dependencies |
|------|----------|-------------|--------------|
| 2.1 | **Nabil** | Build auth system: password hashing (bcrypt), session management (JWT or iron-session), login/register server actions, auth middleware. `evaluated_by` / `interviewer_id` must always come from session — never from request body. | 1.2 |
| 2.2 | **Yoki** | Build Login page (`/login`) and Register page (`/register`). Clean forms with validation feedback. Redirect logic based on auth state. | 1.1, 2.1 (can start UI while Nabil builds actions) |
| 2.3 | **Zain** | Review auth implementation: password hashing, session security, middleware protection, role check logic. | 2.1 |

**Deliverables:**
- Users can register → appear as `pending`
- Admin can approve users and assign roles
- Login creates a session, middleware protects routes

---

## Phase 3 — Core Backend

**Goal:** All server actions working for Jobs, Candidates, Interviews, and Settings.

| Task | Assignee | Description | Dependencies |
|------|----------|-------------|--------------|
| 3.1 | **Nabil** | Job server actions: `createJob`, `getJobs`, `getJobById`, `updateJob`, `closeJob` | 2.1 |
| 3.2 | **Nabil** | Candidate server actions: `addCandidateToJob`, `getCandidatesByJob`, `getJobCandidate` | 2.1 |
| 3.3 | **Nabil** | Interview server actions: `conductInterview` (create interview + answers, update candidate stage/status), `getInterviewsByStage`, `getInterviewHistory` | 2.1 |
| 3.4 | **Nabil** | Settings server actions: CRUD for stages, questions, options. `getAppSettings`, `updateAppSettings`. User management: `approveUser`, `updateUserRole`, `deactivateUser`. | 2.1 |
| 3.5 | **Nabil** | Dashboard data: `getDashboardStats` (candidates per stage, status counts, recent interviews) | 3.1, 3.2, 3.3 |

**Business Logic in `conductInterview`:**
```
1. Create interview record with answers
2. If outcome = "pass" AND next stage exists → update job_candidate.current_stage_id
3. If outcome = "pass" AND no next stage → set status = "hired", set hired_at
4. If outcome = "fail" → set status = "rejected"
5. If outcome = "on_hold" → keep current stage, set status = "on_hold"
All in a single Prisma transaction.
```

**Deliverables:**
- All server actions tested via Prisma Studio / manual calls
- Pipeline state transitions work correctly

---

## Phase 4 — UI Shell

**Goal:** App layout, sidebar navigation, shared components ready.

| Task | Assignee | Description | Dependencies |
|------|----------|-------------|--------------|
| 4.1 | **Tumtum** | Review and finalize design system. Define all component variants in `docs/07-design-system.md`. Provide Yoki with exact specs for sidebar, cards, badges, pipeline board. | None (can start immediately) |
| 4.2 | **Yoki** | Build app layout: sidebar navigation (dark, with logo + nav items + user menu), main content area, header with breadcrumbs. CSS variables for brand colors loaded from `app_settings`. | 1.1, 4.1 |
| 4.3 | **Yoki** | Build shared components: `StatusBadge`, `PipelineBoard`, `StageColumn`, `CandidateCard`, `InterviewRatingOption`, `StatCard`, `DataTable`, `EmptyState`, `PageHeader`. | 4.2 |

**Deliverables:**
- Navigate between all pages with sidebar
- Shared components render with mock data
- Brand colors injected from CSS variables

---

## Phase 5 — Pages

**Goal:** All pages built and connected to server actions.

| Task | Assignee | Description | Dependencies |
|------|----------|-------------|--------------|
| 5.1 | **Yoki** | **Dashboard** (`/dashboard`): Stat cards (total candidates, active, hired, rejected), pipeline board showing candidates per stage, recent interviews table. | 3.5, 4.3 |
| 5.2 | **Yoki** | **Jobs List** (`/jobs`): Card grid of jobs with title, status badge, candidate count, created date. Filter by Open/Closed. "Create Job" button + modal/dialog. | 3.1, 4.3 |
| 5.3 | **Yoki** | **Job Detail** (`/jobs/[id]`): Job info header, pipeline board for this job's candidates (columns = stages, cards = candidates). "Add Candidate" button. Candidate click → view history. | 3.1, 3.2, 4.3 |
| 5.4 | **Yoki** | **Add Candidate** (`/jobs/[id]/candidates/new`): Form with name, email, phone, CV link. On submit → candidate added to job at first stage. | 3.2, 4.3 |
| 5.5 | **Yoki** | **Interview Queue** (`/interviews/[stageId]`): List of candidates ready for this stage (filtered by `current_stage_id`). Click to conduct interview. | 3.3, 4.3 |
| 5.6 | **Yoki** | **Conduct Interview** (`/interviews/[stageId]/[jobCandidateId]`): Candidate info at top, then each question with large selectable option cards, optional notes per question, overall notes, outcome selector (Pass/Fail/On Hold), submit. THE KEY PAGE — must be visually impressive. | 3.3, 4.3 |
| 5.7 | **Yoki** | **Settings — Stages** (`/settings/stages`): Drag-reorder list of stages. Add/edit/deactivate stages. Click stage → manage questions. | 3.4, 4.3 |
| 5.8 | **Yoki** | **Settings — Questions** (`/settings/stages/[id]/questions`): List of questions for a stage. Add/edit/deactivate questions. Each question expands to show its options. Add/edit/remove options. | 3.4, 4.3 |
| 5.9 | **Yoki** | **Settings — Users** (`/settings/users`): Table of users with status, role. Pending users have Approve/Reject buttons. Role dropdown to change roles. | 3.4, 4.3 |
| 5.10 | **Yoki** | **Settings — General** (`/settings/general`): App name input, color pickers for primary/secondary/accent. Live preview of color changes. | 3.4, 4.3 |

**Deliverables:**
- All 12 pages from the requirements are functional
- Full flow works: Create Job → Add Candidate → Interview through all stages → Hired

---

## Phase 6 — QA + Security

**Goal:** All code reviewed, bugs fixed, security validated.

| Task | Assignee | Description | Dependencies |
|------|----------|-------------|--------------|
| 6.1 | **Malak** | Full code review: check all server actions for edge cases, all UI for loading/error/empty states, duplication check across codebase, verify pipeline state machine works correctly. | 5.* |
| 6.2 | **Zain** | Security audit: verify auth middleware on all routes, check for XSS in user inputs, validate URL fields, ensure `evaluated_by` comes from session, review password hashing. | 5.* |
| 6.3 | **Tarek** | Verify Docker build works, test `docker compose up` from scratch (clean DB + seed + app), verify environment variables. | 5.* |
| 6.4 | **Layla** | Write README.md with setup instructions, document the seed data, write brief user guide. | 6.1, 6.2 |

---

## Agent Assignment Summary

| Agent | Phase | Tasks | Total |
|-------|-------|-------|-------|
| **Reem** (Architect) | 1 | Project init + folder structure | 1 task |
| **Salma** (Database) | 1 | Prisma schema + migrations + seed | 1 task |
| **Tarek** (DevOps) | 1, 6 | Docker setup + deployment verification | 2 tasks |
| **Nabil** (Backend) | 2, 3 | Auth + all server actions + dashboard data | 6 tasks |
| **Tumtum** (Designer) | 4 | Design system finalization | 1 task |
| **Yoki** (Frontend) | 2, 4, 5 | Login/Register + layout + all 10 app pages | 13 tasks |
| **Zain** (Security) | 2, 6 | Auth review + security audit | 2 tasks |
| **Malak** (QA) | 6 | Full code review + bug tracking | 1 task |
| **Layla** (Writer) | 6 | README + user guide | 1 task |
| **Omar** (Cloud) | — | Not needed in MVP (no external services) | 0 tasks |

---

## Parallel Execution Strategy

```
Week 1:
  ├── Reem: Project init (1.1)
  ├── Tumtum: Design system (4.1) ← can start immediately
  └── Tarek: Docker (1.3) ← after 1.1

  Then:
  ├── Salma: Prisma schema (1.2) ← after 1.1
  └── Yoki: Start login/register UI (2.2) ← after 1.1

Week 2:
  ├── Nabil: Auth system (2.1) ← after 1.2
  ├── Yoki: App layout + shared components (4.2, 4.3) ← after 4.1
  └── Zain: Auth review (2.3) ← after 2.1

Week 3:
  ├── Nabil: All server actions (3.1–3.5) ← after 2.1
  └── Yoki: Dashboard + Jobs pages (5.1–5.4) ← after 4.3 + server actions

Week 4:
  ├── Yoki: Interview + Settings pages (5.5–5.10) ← after 3.3, 3.4
  └── Nabil: Support / fixes

Week 5:
  ├── Malak: Full QA review (6.1)
  ├── Zain: Security audit (6.2)
  ├── Tarek: Docker verification (6.3)
  └── Layla: Documentation (6.4)
```

---

## File Ownership Map

```
prisma/
  schema.prisma          → Salma
  seed.ts                → Salma
  migrations/            → Salma

src/
  app/
    (auth)/
      login/page.tsx     → Yoki
      register/page.tsx  → Yoki
    (app)/
      layout.tsx         → Yoki (sidebar + header)
      dashboard/         → Yoki
      jobs/              → Yoki
      interviews/        → Yoki
      settings/          → Yoki
    api/                 → Nabil (if needed)

  actions/
    auth.ts              → Nabil
    jobs.ts              → Nabil
    candidates.ts        → Nabil
    interviews.ts        → Nabil
    settings.ts          → Nabil
    dashboard.ts         → Nabil

  components/
    ui/                  → Yoki (shadcn/ui)
    layout/              → Yoki (Sidebar, Header, Breadcrumbs)
    shared/              → Yoki (StatusBadge, PipelineBoard, etc.)

  lib/
    auth.ts              → Nabil
    db.ts                → Salma (Prisma client)
    utils.ts             → Reem

  middleware.ts          → Nabil + Zain review

Dockerfile             → Tarek
docker-compose.yml     → Tarek
.env.example           → Tarek + Zain
docs/                  → Layla
README.md              → Layla
```

---

## Critical Path

The longest dependency chain (determines minimum build time):

```
1.1 (Reem: init) → 1.2 (Salma: schema) → 2.1 (Nabil: auth) → 3.3 (Nabil: interviews) → 5.6 (Yoki: conduct interview page) → 6.1 (Malak: QA)
```

**The conduct interview page (5.6) is the hero page** — it's where the core value of the app lives. Everything else supports getting a candidate to that form.
