# V2 Plan — Jobs Performance, User Creation & Access Control

> Written: 2026-03-10
> Status: Planning

---

## Overview

Three features are planned for V2:

1. **Jobs Performance & History** — closed jobs view + effort metrics on all jobs
2. **Admin User Creation** — admin can create users directly, bypassing self-registration
3. **User Access Control** — per-user stage access and job assignment

---

## Feature 1: Jobs Performance & History

### Problem
- The jobs list only shows open jobs
- There is no way to see closed/completed jobs or the effort invested in them
- There is no per-job performance summary (how many candidates, which stages, what outcomes)

### Plan

#### 1a. Closed Jobs Tab
Add an Open / Closed tab switcher to the jobs list page (`/jobs`).

- **Open tab** (default): jobs with `status = 'open'`
- **Closed tab**: jobs with `status = 'closed'`

`getJobs(status?)` already accepts a `status` filter — the tab just passes it.

**UI change**: Replace the flat list with a tab bar. No backend change needed.

#### 1b. Job Performance Panel
On each job detail page (`/jobs/[id]`), add a collapsible or always-visible summary section above the candidate list:

| Metric | How to compute |
|--------|---------------|
| Total candidates | `job.jobCandidates.length` |
| Active in pipeline | count where `status = 'active'` |
| Hired | count where `status = 'hired'` |
| Rejected | count where `status = 'rejected'` |
| On Hold | count where `status = 'on_hold'` |
| Interviews conducted | sum of all `interviews` across all candidates |
| Stage breakdown | group candidates by `currentStage.name` |
| Pass rate per stage | interviews at stage: pass / total |

All data is already fetched by `getJobWithCandidates()` — this is a pure UI addition, no new queries needed.

**New component**: `src/components/jobs/job-performance-panel.tsx`
- Receives `jobCandidates` (already fetched)
- Computes all metrics client-side from the array
- Shows stat cards: Total / Active / Hired / Rejected / On Hold
- Shows a stage funnel table: stage name → candidates currently there → interviews done → pass/fail/on_hold counts

#### 1c. Effort View on Open Jobs
Same `job-performance-panel.tsx` component renders on open jobs too (metrics are always relevant regardless of job status).

No separate implementation needed — it's the same panel shown at all times.

---

## Feature 2: Admin User Creation

### Problem
Users currently must self-register at `/register` and wait for admin approval. Admins cannot proactively create accounts for team members.

### Plan

#### 2a. Schema — No Changes
No schema changes needed. New users will be created with `status = 'active'` and a role assigned immediately.

#### 2b. New Action: `createUser`
Location: `src/actions/settings.ts`

```
createUser({
  fullName: string
  email: string
  password: string        // admin sets initial password
  role: 'admin' | 'user'
})
```

- Checks caller is admin
- Hashes the password with bcrypt
- Creates user with `status = 'active'` (no approval needed)
- Revalidates `/settings/users`

#### 2c. Validation
Add `createUserSchema` to `src/lib/validations/settings.ts`:
```
fullName: string (min 2)
email: string (valid email)
password: string (min 8)
role: 'admin' | 'user'
```

#### 2d. UI
Add an "Add User" dialog to `/settings/users` — same pattern as the existing `CreateJobDialog`.

The dialog collects: Full Name, Email, Password, Role.

On success, the new user appears in the users table immediately as Active.

**New component**: `src/components/settings/create-user-dialog.tsx`

---

## Feature 3: User Access Control

### Problem
- All non-admin users currently see all jobs and all interview stages
- There is no way to restrict a user to only the stages they should conduct (e.g. HR only sees HR Interview stage)
- There is no job assignment — users see all jobs

### Design Decisions

| Question | Decision |
|----------|----------|
| Who is unrestricted? | `admin` role — always sees everything, no filtering applied |
| Stage access = who can conduct interviews | A `UserStageAccess` join table: `userId × stageId` |
| Job visibility = which jobs appear in /jobs | A `JobAssignment` join table: `userId × jobId` |
| Empty stage access for a user | User sees no interview queue (can still see assigned jobs) |
| Empty job assignment for a user | User sees no jobs |
| Access set by | Admin only, during user creation or via user settings page |

### 3a. Schema Changes

**New table: `user_stage_access`**
```
model UserStageAccess {
  id      String @id @default(uuid())
  userId  String @map("user_id")
  stageId String @map("stage_id")

  user  User           @relation(...)
  stage InterviewStage @relation(...)

  @@unique([userId, stageId])
  @@map("user_stage_access")
}
```

**New table: `job_assignments`**
```
model JobAssignment {
  id     String @id @default(uuid())
  userId String @map("user_id")
  jobId  String @map("job_id")

  user User @relation(...)
  job  Job  @relation(...)

  @@unique([userId, jobId])
  @@map("job_assignments")
}
```

Add reverse relations to `User`, `InterviewStage`, and `Job`.

**Migration**: `add_user_stage_access_and_job_assignments`

### 3b. Enforcement — Where Filtering Happens

Every query that returns jobs or stages must filter by the current user's access when `role !== 'admin'`.

| Action / Query | Change |
|----------------|--------|
| `getJobs()` | Add `WHERE id IN (SELECT jobId FROM job_assignments WHERE userId = ?)` for non-admin |
| `getJobWithCandidates(jobId)` | Guard: check user is assigned to this job (or admin) |
| `getStagesWithCounts()` (interviews page) | Filter to stages in `user_stage_access` for non-admin |
| `getCandidatesForStage(stageId)` | Guard: check user has access to this stage |
| Conduct interview page | Guard: user must be assigned to the job AND have stage access |
| Add candidate page | Guard: user must be assigned to the job |

All guards return `notFound()` (or redirect) if the user lacks access.

### 3c. Admin UI — Setting Access on a User

On the Users settings page (`/settings/users`), add an "Access" or "Manage" button per user row that opens a dialog:

**Dialog content**:
- Section: **Stage Access** — checkbox list of all active stages (check = can conduct interviews there)
- Section: **Job Assignments** — checkbox list of all open jobs (check = can see and work on this job)
- Save button calls `setUserAccess({ userId, stageIds, jobIds })`

This dialog is also shown at step 2 of the "Add User" flow (after setting name/email/password/role, if role = 'user', show access settings).

**New action**: `setUserAccess(userId, stageIds, jobIds)` in `src/actions/settings.ts`
- Deletes existing `UserStageAccess` and `JobAssignment` rows for user
- Inserts the new selections in a transaction

**New component**: `src/components/settings/user-access-dialog.tsx`

### 3d. Sidebar / Navigation Changes

The sidebar currently shows all nav items to all users. With access control:

- `/jobs` is always shown but filtered server-side
- `/interviews` is always shown but filtered server-side (only their stages)
- `/settings` is only shown for `admin` (already the case)
- Dashboard counts are filtered per user

No sidebar structural changes needed — the filtering happens in the data layer.

### 3e. Dashboard Changes

`getStagesWithCounts()` currently returns all active stages. For non-admin users, it should return only their assigned stages and count only candidates in jobs they're assigned to.

---

## Implementation Order

### Phase 1 — Jobs Performance (no schema change, low risk)
1. Add Open/Closed tabs to jobs list page
2. Build `JobPerformancePanel` component
3. Add it to job detail page

### Phase 2 — Admin User Creation (no schema change)
1. Add `createUserSchema` validation
2. Add `createUser` action
3. Build `CreateUserDialog` component
4. Add to `/settings/users` page

### Phase 3 — Access Control (schema change required)
1. Add `UserStageAccess` and `JobAssignment` to Prisma schema
2. Run migration
3. Add `setUserAccess` action
4. Build `UserAccessDialog` component
5. Integrate access dialog into user creation flow (step 2 for role = 'user')
6. Apply filtering to `getJobs`, `getJobWithCandidates`, `getStagesWithCounts`, `getCandidatesForStage`
7. Add guards to interview and add-candidate pages
8. Update dashboard query

### Phase 4 — Polish
1. Update `JobAssignment` when a new job is created and no assignments exist (admins always see all)
2. Show "no access" empty state on `/jobs` if user has no job assignments

---

## Files to Create / Modify (Phase 3 summary)

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add `UserStageAccess`, `JobAssignment` models |
| `prisma/migrations/...` | New migration |
| `src/lib/validations/settings.ts` | Add `createUserSchema`, `setUserAccessSchema` |
| `src/actions/settings.ts` | Add `createUser`, `setUserAccess`, `getUserAccess` |
| `src/actions/jobs.ts` | Filter `getJobs`, `getJobWithCandidates` by user |
| `src/actions/interviews.ts` | Filter `getStagesWithCounts`, `getCandidatesForStage` by user |
| `src/components/settings/create-user-dialog.tsx` | New |
| `src/components/settings/user-access-dialog.tsx` | New |
| `src/app/(app)/settings/users/page.tsx` | Add Create User + Manage Access buttons |
| `src/app/(app)/jobs/page.tsx` | Add tabs (Open/Closed), apply user filter |
| `src/app/(app)/jobs/[id]/page.tsx` | Add `JobPerformancePanel`, add access guard |
| `src/app/(app)/interviews/[stageId]/[jobCandidateId]/page.tsx` | Add access guard |
| `src/components/jobs/job-performance-panel.tsx` | New |

---

## Open Questions (to confirm before building)

1. When a new job is created, should it be auto-assigned to all users, or must admin assign manually?
   - **Suggested default**: Manual assignment. Admins always see all jobs regardless.

2. Should stage access control block viewing interviews (read) or only conducting new ones (write)?
   - **Suggested default**: Controls both — users only see stages in their access list.

3. Should the user creation dialog send a welcome email with their password?
   - **Suggested default**: No (email not implemented in V1). Admin communicates credentials manually.

4. If a user's job assignment is removed mid-pipeline (candidate still active), what happens?
   - **Suggested default**: User loses visibility immediately. Candidate stays in pipeline unaffected.
