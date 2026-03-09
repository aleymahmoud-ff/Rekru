# Plan Review Outcomes — All Team Findings

**Date:** 2026-02-17
**Reviewed by:** Reem (Architect), Salma (Database), Zain (Security), Malak (QA), Sara (HR Consultant)
**Documents Reviewed:** `01-requirements.md` v1.0, `02-database-design.md` v1.0
**Status:** Pending client decisions and document updates

---

## How to Use This Document

- **DECISION REQUIRED** — Client or product owner must answer before development starts
- **MUST FIX** — Schema or requirements change required before first migration
- **RECOMMENDATION** — Strongly advised improvement, not blocking
- **FUTURE V2** — Valid suggestion deferred to next version

---

## Part 1 — Critical Blockers (Must Resolve Before Development)

---

### B-01 — Polymorphic `category_evaluations` Table Design
**Raised by:** Reem, Salma, Zain, Malak
**Severity:** CRITICAL

The `category_evaluations` table uses a polymorphic pattern where `stage_record_id` is a bare UUID with no database-level foreign key. PostgreSQL cannot enforce referential integrity, and Prisma has no native support for polymorphic associations — meaning `stage_record_id` must be stored as a plain `String`, losing all Prisma relation features (`include`, `select`, type-safe traversal, cascade).

Additionally, nothing prevents a `category_evaluation` row from referencing a category that belongs to a different stage (e.g., a "Leadership" category from Stage 4 attached to an HR Interview record).

**Decision Required:**
Choose one of:
- **Option A (Recommended):** Replace with 3 separate typed join tables with proper FKs:
  - `hr_interview_evaluations (id, hr_interview_id FK, category_id FK, rating, notes, created_at)`
  - `technical_feedback_evaluations (id, technical_feedback_id FK, category_id FK, rating, notes, created_at)`
  - `final_interview_evaluations (id, final_interview_id FK, category_id FK, rating, notes, created_at)`
- **Option B:** Keep one table but use three nullable FKs + a CHECK constraint ensuring exactly one is set.
- **Option C:** Keep current design but add a DB trigger to validate `stage_record_id` existence on every INSERT.

---

### B-02 — "On Hold" Return Path + UNIQUE Constraint Conflict
**Raised by:** Reem, Malak
**Severity:** CRITICAL

Every stage table has `UNIQUE(candidate_id)`, correctly preventing duplicate evaluations. However, this constraint also prevents re-evaluating a candidate who returns from "On Hold" — creating a new stage record for the same candidate would throw a database error.

**Decision Required:**
- **Option A (Recommended):** Allow updating the existing stage record (outcome changes from `on_hold` to `pass/fail`). Keep the UNIQUE constraint. Document this as the only correction path.
- **Option B:** Remove the UNIQUE constraint. Add a `is_current BOOLEAN` or `version INTEGER` to track which record is active.
- **Option C:** Soft-delete the existing stage record and create a new one (`deleted_at` pattern). Use a partial UNIQUE index: `UNIQUE(candidate_id) WHERE deleted_at IS NULL`.

**Also define:** When a candidate is taken off "On Hold," which stage do they re-enter — the same stage where they were placed on hold, or do they start from Stage 1?

---

### B-03 — Stage Skip Logic is Undefined
**Raised by:** Reem, Malak, Sara
**Severity:** CRITICAL

The pipeline supports skipping stages, but the behavior is completely undefined:
- What is `candidates.current_status` during and after a skip?
- Does a Skip outcome on Stage 4 (the final stage) result in "Hired"? Or is that an error?
- Is it possible to skip all 4 stages, resulting in a candidate marked "Hired" with zero evaluations?

**Decision Required:**
1. Define the state machine: for each stage, what are the allowed `current_status` transitions for each outcome (pass / fail / on_hold / skip)?
2. Define whether Stage 4 Skip is a valid outcome.
3. Define a minimum number of stages that must be completed before a candidate can be marked Hired.
4. Define whether a stage skip requires written justification and a second approver (Sara's recommendation).

---

### B-04 — "Pass on Stage 4 = Hired" is an Implicit, Undocumented Rule
**Raised by:** Malak
**Severity:** HIGH

The `stage_outcome` ENUM contains `pass, fail, on_hold, skip` — there is no `hired` value. The system must translate a `pass` outcome on Stage 4 into the `hired` candidate status. This business rule exists only implicitly and is not documented in either requirements or database design documents.

**Must Fix:**
- Document this rule explicitly in `01-requirements.md` Section 2.3 and in the state machine definition.
- Ensure it is implemented as a single transactional operation: record stage outcome + update candidate status in one DB transaction.

---

### B-05 — First Admin Bootstrap Has No Mechanism
**Raised by:** Zain, Malak, Sara
**Severity:** HIGH

All new registrations require Admin approval. With an empty database, there is no Admin to approve the first user. The system cannot launch without a seeded Admin account.

**Must Fix:**
- Add a one-time CLI seed command that creates the initial Admin account.
- The seed must force an immediate password change on first login.
- The seed account must never be created through the registration UI.
- Document this in the deployment runbook (Tarek's responsibility).

---

### B-06 — Missing Security Fields on `users` Table
**Raised by:** Zain, Malak
**Severity:** HIGH — Must be in the initial migration

The `users` table is missing three categories of security columns:

| Missing Fields | Purpose |
|---|---|
| `failed_login_attempts INTEGER DEFAULT 0` | Brute-force / credential stuffing protection |
| `locked_until TIMESTAMPTZ NULL` | Account lockout after N failed attempts |
| `last_login_at TIMESTAMPTZ NULL` | Activity tracking |
| `token_version INTEGER DEFAULT 1` | Instant JWT invalidation when user is deactivated or role changes |
| `password_reset_token TEXT NULL` | Password reset flow |
| `password_reset_token_expires_at TIMESTAMPTZ NULL` | Token expiry for password reset |

**Must Fix:** Add all six fields to the `users` table in the initial migration.

---

### B-07 — Role Assigned at Registration Time
**Raised by:** Zain
**Severity:** HIGH

The current design requires `role` to be `NOT NULL` at registration. This means a user must self-declare their role when registering — including potentially claiming the `admin` role.

**Must Fix:**
- Make `role` nullable at registration (or default to a safe value like `hr`).
- The Admin sets the actual role at the point of approval.
- `role` should only become meaningful when `status = active`.

---

### B-08 — No Audit Log Table
**Raised by:** Zain, Salma, Sara, Malak
**Severity:** HIGH — Legal and compliance requirement

There is no mechanism to track who changed a candidate's status, who edited an evaluation, when salary data was accessed, or when a user's role was changed. This is indefensible in a hiring context where decisions may be disputed.

**Must Fix — Add `audit_logs` table:**
```
audit_logs
  id          UUID PK
  actor_id    UUID FK → users(id)
  action      VARCHAR(100)       -- e.g. 'candidate.status_changed', 'evaluation.submitted'
  table_name  VARCHAR(100)
  record_id   UUID
  old_values  JSONB NULL
  new_values  JSONB NULL
  ip_address  INET NULL
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
```
This table must be append-only. No application role should have UPDATE or DELETE permissions on it.

---

### B-09 — Missing `candidate_status_history` Table
**Raised by:** Reem, Salma, Malak
**Severity:** HIGH — Required for dashboard

The dashboard requires "time-to-hire" and "recent activity" metrics. These cannot be built without a status history table — `current_status` is a single value with no history.

**Must Fix — Add `candidate_status_history` table:**
```
candidate_status_history
  id           UUID PK
  candidate_id UUID FK → candidates(id)
  from_status  candidate_status ENUM
  to_status    candidate_status ENUM
  changed_by   UUID FK → users(id)
  changed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
```
Index on `(candidate_id, changed_at)`.

---

### B-10 — Missing `hired_at` Field on `candidates`
**Raised by:** Reem, Salma
**Severity:** HIGH

There is no `hired_at` timestamp on the `candidates` table. The "time-to-hire" dashboard metric (created_at → hired_at) cannot be calculated accurately.

**Must Fix:** Add `hired_at TIMESTAMPTZ NULL` to `candidates`. Set it in the same transaction that updates `current_status` to `hired`.

---

## Part 2 — Schema Corrections Required

---

### S-01 — Missing UNIQUE Constraint on `candidates.email`
**Raised by:** Salma, Zain, Malak
**Decision Required:** Is a person allowed to apply multiple times (different positions or different cycles)?
- If **No** → Add `UNIQUE` to `candidates.email`
- If **Yes** → Add a composite unique index or an `application_round` field; document the policy

---

### S-02 — Missing UNIQUE Constraint on `category_evaluations`
**Raised by:** Salma
**Must Fix:** Nothing prevents two conflicting ratings for the same category in the same interview.
Add: `UNIQUE(category_id, stage_type, stage_record_id)` (or equivalent per chosen table design from B-01)

---

### S-03 — Missing UNIQUE Constraint on `evaluation_categories(name, stage)`
**Raised by:** Malak
**Must Fix:** Admin can create two categories both named "Communication" for Stage 1. Add composite UNIQUE on `(name, stage)`.

---

### S-04 — `task_assessments.position_applied` Duplicates `candidates.position_id`
**Raised by:** Salma, Reem
**Must Fix:** This TEXT field duplicates data already captured as a proper FK on the candidate profile and can silently diverge. Options:
- Drop the column and join through `candidates.position_id`
- Replace with `position_id UUID FK → positions(id)` for snapshot accuracy

---

### S-05 — `title_applying` Inconsistency Across Stage Tables
**Raised by:** Reem, Malak
**Must Fix:** Stage 3 uses `position_applied (TEXT)` while Stages 1, 2, 4 use `title_applying (VARCHAR 255)`. Standardize the column name across all four stage tables.

---

### S-06 — `ON DELETE` Behaviour Undefined on All FKs
**Raised by:** Salma
**Must Fix:** No FK defines `ON DELETE` behaviour. PostgreSQL defaults to `RESTRICT` everywhere, which will cause unexpected errors. Define per relationship:

| FK | Recommended |
|---|---|
| `candidates.position_id → positions` | RESTRICT |
| `candidates.created_by → users` | RESTRICT |
| `hr_interviews.candidate_id → candidates` | CASCADE |
| `technical_feedbacks.candidate_id → candidates` | CASCADE |
| `task_assessments.candidate_id → candidates` | CASCADE |
| `final_interviews.candidate_id → candidates` | CASCADE |
| `notifications.candidate_id → candidates` | SET NULL |
| `category_evaluations → stage tables` | CASCADE |

---

### S-07 — Full-Text Search Index on `candidates.full_name` Not Defined
**Raised by:** Salma
**Must Fix:** The DB design mentions a "Full-text search index" but never defines it. Add:
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX candidates_fullname_trgm_idx ON candidates USING gin(full_name gin_trgm_ops);
```

---

### S-08 — Missing Indexes
**Raised by:** Salma
Add the following indexes not defined in the current design:

| Table | Column | Reason |
|---|---|---|
| `hr_interviews` | `evaluated_by` | Query by interviewer |
| `technical_feedbacks` | `evaluated_by` | Query by interviewer |
| `task_assessments` | `evaluated_by` | Query by interviewer |
| `final_interviews` | `evaluated_by` | Query by interviewer |
| `candidates` | `created_by` | Admin and dashboard queries |
| `notifications` | `created_at` | Recent activity ordering |
| `evaluation_categories` | `(stage, is_active, sort_order)` | Form loading query |
| `positions` | `is_active` | Dropdown filter |

---

### S-09 — Missing Fields Across Tables
**Raised by:** Salma, Sara, Zain

| Table | Field to Add | Type | Notes |
|---|---|---|---|
| `candidates` | `deleted_at` | TIMESTAMPTZ NULL | Soft delete / GDPR erasure |
| `candidates` | `notes` | TEXT NULL | General HR notes before any stage |
| `candidates` | `nationality` | VARCHAR(100) NULL | Critical in GCC markets |
| `candidates` | `work_authorization` | VARCHAR(100) NULL | Visa / permit status |
| `evaluation_categories` | `description` | TEXT NULL | Guide evaluators on what to assess |
| `task_assessments` | `task_sent_at` | TIMESTAMPTZ NULL | When task was sent to candidate |
| `task_assessments` | `task_due_at` | TIMESTAMPTZ NULL | Deadline given to candidate |
| `hr_interviews` | `updated_by` | UUID FK → users NULL | Audit who last modified |
| `technical_feedbacks` | `updated_by` | UUID FK → users NULL | Audit who last modified |
| `final_interviews` | `updated_by` | UUID FK → users NULL | Audit who last modified |

---

### S-10 — `app_settings` Hex Color Format Has No Validation
**Raised by:** Malak
**Must Fix:** Add a CHECK constraint enforcing valid hex format:
```sql
CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$')
```
Apply to all three color fields.

---

### S-11 — `salary_currency` Field Missing
**Raised by:** Salma
**Decision Required:** Does Wander operate in a single currency?
- If **Yes** → Document the assumed currency (e.g., EGP) as a system constant
- If **No** → Add `salary_currency CHAR(3) DEFAULT 'EGP'` to `hr_interviews`

---

## Part 3 — Requirements Gaps and Decisions

---

### R-01 — Salary Data Privacy Contradiction
**Raised by:** Zain, Malak
**Decision Required:** Section 3.2 of requirements says salary is visible to "HR + CEO only." The permission matrix in the same section shows Admin ✅. Section 7 narrative says "HR + CEO roles." Two sections contradict each other.
- **Resolve:** Should Admin see salary data? Update both documents to match.

---

### R-02 — Final Interview Data Visibility for HR
**Raised by:** Reem, Zain, Malak, Sara
**Decision Required:** The DB access rules restrict `final_interviews` to CEO + Admin only. But HR manages the pipeline and needs to know hiring outcomes.
- **Option A:** HR sees only `outcome` + `interview_date` from Stage 4 (not CEO's private notes)
- **Option B:** HR has no access to Stage 4 data at all
- **Option C:** HR has full read access to all stages

---

### R-03 — Hiring Manager Scope — Can They See All Candidates?
**Raised by:** Zain, Sara
**Decision Required:** Are Hiring Managers scoped to specific positions/departments, or do all Hiring Managers see all candidates?
- If **scoped** → Add `position_id` or `hiring_manager_id` to the candidate or a junction table
- If **all access** → Document explicitly as a known design decision

---

### R-04 — CEO as Sole Stage 4 Actor is Not Scalable
**Raised by:** Sara
**Decision Required:** Should the Final Interview be assignable to any user rather than hardcoded to the CEO role?
- **Option A (Recommended):** Make Stage 4 configurable — assigned per position seniority. CEO for senior roles, senior Hiring Manager for junior roles.
- **Option B:** Keep CEO-only for now, revisit in V2.

---

### R-05 — Offer Management Stage is Missing
**Raised by:** Sara
**Decision Required:** After CEO approval, is an Offer Management stage needed in V1?

Proposed statuses: `Offer Pending → Offer Sent → Offer Accepted / Offer Declined / Candidate Withdrawn → Hired`

- **Option A:** Add Offer Management as Stage 5 in V1
- **Option B:** Defer to V2, document as a known gap

---

### R-06 — Evaluation Rating Scale
**Raised by:** Sara
**Decision Required:** Replace binary "Matching / Not Matching" with a scaled rating?

Sara's recommendation — 3-point scale:
- **Below Expectations** (1)
- **Meets Expectations** (2)
- **Exceeds Expectations** (3)

Require written notes when score = 1. Advance only when no category scores 1 and overall average ≥ 2.

- **Option A:** Adopt 3-point scale
- **Option B:** Adopt 5-point scale (1–5, BARS)
- **Option C:** Keep binary Matching / Not Matching

---

### R-07 — Stage Skip Governance
**Raised by:** Sara, Malak
**Decision Required:** Should skipping a stage require:
- A written justification field (captured in the system)?
- A second approver?
- To be flagged on the dashboard?

---

### R-08 — Pre-Screen / CV Review Stage
**Raised by:** Sara
**Decision Required:** Add a Stage 0 (Application Review) before HR Interview?
- Simple shortlisting: Shortlisted / Not Shortlisted
- Prevents unqualified candidates from entering Stage 1

---

### R-09 — Reference Check Tracking
**Raised by:** Sara
**Decision Required:** Add reference check fields to the hired candidate record?
- Minimum: `references_checked BOOLEAN`, `reference_notes TEXT`, `references_checked_at TIMESTAMPTZ`

---

### R-10 — Candidate Notification / Communication Tracking
**Raised by:** Sara
**Decision Required:** Since email is out of scope for V1, should the system at least track whether key communications were sent manually?
- Track: Application received / Stage advance / Rejection / Offer sent (manual checkbox per event)

---

## Part 4 — Missing Validation Rules

| Field | Rule Missing | Recommended |
|---|---|---|
| `candidates.phone` | No format validation | Enforce min 7 digits, allow `+` prefix |
| `candidates.email` | No format validation at DB level | Validate at application layer with zod |
| `photo_url`, `linkedin_url`, `cv_link` | No URL format validation | Enforce `https://` scheme server-side |
| `company_logo_url` | SSRF risk — no domain allowlist | Validate against allowlisted domains |
| `current_salary`, `expected_salary` | No min/max defined | Define minimum (≥ 0) + document currency |
| `positions.title` | No minimum length | Min 2 characters |
| `interview_date` | No past/future constraint | Restrict to today or earlier for completed interviews |
| `evaluation_categories.name` | No UNIQUE per stage | Add `UNIQUE(name, stage)` |
| Color fields | No hex format validation | `CHECK ~ '^#[0-9A-Fa-f]{6}$'` |

---

## Part 5 — Missing Notification Triggers

Current triggers defined in requirements (Section 6.2) are incomplete. Missing:

| Trigger | Recipient | Priority |
|---|---|---|
| Candidate is Rejected (any stage) | HR | High |
| Candidate is placed On Hold | HR | High |
| Candidate is Hired (confirmation) | HR | Medium |
| Stage is Skipped | Next stage evaluator | Medium |
| User registration pending approval | Admin | Already defined |

Also flagged: The "Candidate status changes → HR" notification would fire on every single transition and will become notification spam. Scope it to terminal events (Hired, Rejected) only.

---

## Part 6 — Data Privacy & Compliance

**Raised by:** Zain, Sara

| Gap | Required Action |
|---|---|
| No candidate consent to data collection | Define consent mechanism or document legal basis |
| No data retention policy | Define maximum retention period for rejected candidates (recommend 12 months) |
| `deleted_at` for GDPR right-to-erasure | Add soft delete to `candidates` table (see S-09) |
| Mandatory `current_salary` field | Review legality in operating jurisdiction — salary history collection is restricted in some regions |
| Candidate photo visible during evaluation | Consider restricting photo display to profile management only, not evaluation forms |
| No minimum interview note requirement | Consider making `overall_notes` required (not optional) for Fail outcomes |

---

## Part 7 — Prisma-Specific Technical Notes

**Raised by:** Salma

| Issue | Mitigation |
|---|---|
| Polymorphic FK has no Prisma support | Resolve via B-01 before any schema work starts |
| `DECIMAL(12,2)` returns `Decimal` objects, not `number` | Frontend must handle Prisma Decimal type; document in shared registry |
| ENUM value removal requires raw SQL migration | Document — Prisma cannot auto-generate DROP ENUM VALUE migrations |
| `app_settings` single-row CHECK not expressible in Prisma schema | Use raw SQL migration for the constraint, or switch to key-value settings table |
| UUID PKs are not insertion-order sortable | Enforce `ORDER BY created_at` in all list queries — never `ORDER BY id` |

---

## Decision Register

Track all decisions made in response to this review:

| ID | Decision | Made By | Date | Status |
|---|---|---|---|---|
| B-01 | Polymorphic table design choice | — | — | PENDING |
| B-02 | On Hold return path | — | — | PENDING |
| B-03 | Skip logic + Stage 4 skip outcome | — | — | PENDING |
| R-01 | Admin salary visibility | — | — | PENDING |
| R-02 | HR access to Stage 4 data | — | — | PENDING |
| R-03 | Hiring Manager scope | — | — | PENDING |
| R-04 | CEO as sole Stage 4 actor | — | — | PENDING |
| R-05 | Offer Management stage | — | — | PENDING |
| R-06 | Evaluation rating scale | — | — | PENDING |
| R-07 | Stage skip governance | — | — | PENDING |
| R-08 | Pre-screen stage | — | — | PENDING |
| R-09 | Reference check tracking | — | — | PENDING |
| S-01 | `candidates.email` uniqueness policy | — | — | PENDING |
| S-11 | Salary currency | — | — | PENDING |

---

## Next Steps

1. Share this document with the client and go through the **Decision Register** together
2. For each PENDING decision, record the answer in the Decision Register with date
3. Once all PENDING items are resolved, update `01-requirements.md` and `02-database-design.md`
4. Salma writes the Prisma schema based on the finalized database design
5. Reem writes the architecture decision records in `/docs/adr/`
6. Development sprint planning begins
