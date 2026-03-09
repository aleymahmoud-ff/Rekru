# Review Findings — Broken Down by Reviewer

**Date:** 2026-02-18
**Source Document:** `03-review-outcomes.md`

---

## Reviewer Profiles

| # | Name | Role | Focus Area |
|---|---|---|---|
| 1 | **Reem** | Project Architect | Architecture, module boundaries, API design, system patterns |
| 2 | **Salma** | Database Engineer | Schema correctness, indexes, Prisma concerns, data integrity |
| 3 | **Zain** | Security Specialist | Auth security, data privacy, RBAC gaps, compliance |
| 4 | **Malak** | QA / Code Reviewer | Requirements completeness, edge cases, inconsistencies, testability |
| 5 | **Sara** | HR Consultant | Business process, candidate experience, evaluation methodology, compliance |

---

---

## 1. Reem — Project Architect

**Total findings: 10**
**Verdict:** *"The gaps are not in the fundamentals — they are in the edges. Resolve the `on_hold` return path and the missing status history table before the first migration runs."*

---

### What Reem Praised
- Pipeline model (sequential + skippable) — clean and pragmatic
- `candidates.current_status` as denormalized snapshot — correct for fast filtering and dashboard queries
- Separate stage tables (vs one polymorphic `stage_records` table) — right call given different columns per stage
- `notifications` partial index on unread — genuine performance decision
- Migration order correctly sequenced for FK dependencies

---

### Reem's Findings

| ID | Finding | Severity |
|---|---|---|
| R-ARCH-01 | No audit / history trail — "Recent activity" dashboard widget cannot be built | HIGH |
| R-ARCH-02 | State transition rules are undefined — nothing enforces stage order at DB or service layer | HIGH |
| R-ARCH-03 | "On Hold" conflated at stage outcome level AND candidate status level — return path undefined | CRITICAL |
| R-ARCH-04 | Polymorphic `category_evaluations` — no DB-level FK integrity, application layer is sole enforcer | HIGH |
| R-ARCH-05 | No soft delete strategy defined for positions and evaluation categories | MEDIUM |
| R-ARCH-06 | Missing `hired_at` field on `candidates` — time-to-hire metric cannot be accurately calculated | HIGH |
| R-ARCH-07 | `title_applying` inconsistency — Stage 3 uses `position_applied` (TEXT), others use `title_applying` (VARCHAR 255) | MEDIUM |
| R-ARCH-08 | Final Interview visibility for Hiring Manager undefined — requirements and DB access rules conflict | HIGH |
| R-ARCH-09 | Notification failure behavior undefined — if notification write fails, does the stage transition roll back? | MEDIUM |
| R-ARCH-10 | Admin module covers too many concerns — recommend splitting User Management / Configuration / Recruitment Setup | LOW |

---

### Reem's Top Recommendations
1. Add `candidate_status_history` table before build starts
2. Write the full state machine transition map before any business logic is coded
3. Resolve the `on_hold` UNIQUE constraint conflict
4. Add `hired_at TIMESTAMPTZ` to `candidates`
5. Standardize `title_applying` column name across all 4 stage tables
6. Replace polymorphic `category_evaluations` with 3 typed join tables

---

---

## 2. Salma — Database Engineer

**Total findings: 18**
**Verdict:** *"The polymorphic `category_evaluations` design is the most significant problem. Prisma has no native support for it — you lose all relation helpers for that entire table."*

---

### What Salma Praised
- Stage tables correctly separated (each stage has its own table with its own columns)
- UNIQUE constraint on `candidate_id` in all stage tables — correct prevention of duplicate evaluations
- `notifications` partial index on `(recipient_id, is_read) WHERE is_read = false` — genuine performance decision
- `TIMESTAMPTZ` used throughout — correct choice, avoids timezone bugs

---

### Salma's Findings

| ID | Finding | Severity |
|---|---|---|
| S-DB-01 | `candidates.email` missing UNIQUE constraint — duplicate candidates allowed | HIGH |
| S-DB-02 | Polymorphic `category_evaluations` — no FK integrity + Prisma has no native support | CRITICAL |
| S-DB-03 | Missing UNIQUE on `category_evaluations(category_id, stage_type, stage_record_id)` — conflicting ratings allowed | HIGH |
| S-DB-04 | `task_assessments.position_applied` duplicates `candidates.position_id` as free text — can silently diverge | MEDIUM |
| S-DB-05 | `ON DELETE` behaviour undefined on ALL foreign keys — PostgreSQL defaults to RESTRICT everywhere | MEDIUM |
| S-DB-06 | Missing indexes: `evaluated_by` on all 4 stage tables, `candidates.created_by`, `notifications.created_at` | MEDIUM |
| S-DB-07 | `evaluation_categories` index misses `is_active` — form-loading queries will not use it optimally | MEDIUM |
| S-DB-08 | Full-text search index on `candidates.full_name` mentioned but never defined — needs `pg_trgm` GIN index | MEDIUM |
| S-DB-09 | `user_role` ENUM — adding new roles requires `ALTER TYPE`, which has migration risks | LOW |
| S-DB-10 | `stage_type` ENUM couples evaluation categories tightly to the 4-stage pipeline | LOW |
| S-DB-11 | `candidates.source` is free text — inconsistent entries will break dashboard analytics by source | LOW |
| S-DB-12 | Missing `candidate_status_history` table — time-in-stage metrics are impossible | HIGH |
| S-DB-13 | Missing `evaluation_categories.description` field — evaluators have no guidance on what to assess | LOW |
| S-DB-14 | Missing `task_assessments.task_sent_at` and `task_due_at` — operational gap even without in-app task delivery | LOW |
| S-DB-15 | Missing `updated_by` on stage tables — no record of who last modified an evaluation | MEDIUM |
| S-DB-16 | `app_settings` single-row `CHECK(id = 1)` cannot be expressed in Prisma schema | LOW |
| S-DB-17 | `DECIMAL(12,2)` for salary — Prisma returns `Decimal` objects, not plain `number`; frontend must handle this | MEDIUM |
| S-DB-18 | Missing `salary_currency` field — currency is a silent assumption | LOW |

---

### Salma's Top Recommendations
1. Replace polymorphic `category_evaluations` with 3 typed join tables — most critical DB decision
2. Add UNIQUE to `candidates.email`
3. Add UNIQUE to `(category_id, stage_type, stage_record_id)` in `category_evaluations`
4. Define `ON DELETE` behavior for every FK before migrations run
5. Define the `pg_trgm` full-text index concretely
6. Add `candidate_status_history` table
7. Consider replacing `app_settings` single-row table with a key-value table

---

---

## 3. Zain — Security Specialist

**Total findings: 16**
**Verdict:** *"The three areas needing immediate resolution: the polymorphic `category_evaluations` design, the missing user security columns, and salary data having no database-level protection."*

---

### What Zain Praised
- Stage tables separated — makes salary field restriction cleaner to enforce
- `candidates.created_by` FK — captures who added the record
- `app_settings.updated_by` — captures who changed config

---

### Zain's Findings

| ID | Finding | Severity |
|---|---|---|
| Z-SEC-01 | Polymorphic FK in `category_evaluations` — authorization corruption possible, no DB-level guard | CRITICAL |
| Z-SEC-02 | No brute-force protection fields on `users` (`failed_login_attempts`, `locked_until`) | HIGH |
| Z-SEC-03 | No token invalidation mechanism — deactivated user's JWT stays valid until natural expiry | HIGH |
| Z-SEC-04 | No password reset token fields on `users` | HIGH |
| Z-SEC-05 | No first-admin bootstrap mechanism — empty DB cannot approve first registration | HIGH |
| Z-SEC-06 | Salary fields have no DB-level protection — application layer alone is one bug away from a data leak | HIGH |
| Z-SEC-07 | Salary visibility contradiction — requirements narrative says "HR + CEO only," permission matrix includes Admin | MEDIUM |
| Z-SEC-08 | Registration is open to the internet — no domain filter, creating admin-fatigue and social engineering risk | MEDIUM |
| Z-SEC-09 | `role` assigned at registration time — registrant can claim any role including `admin` | MEDIUM |
| Z-SEC-10 | HR cannot read `final_interviews` — but HR manages the full pipeline and needs hiring outcomes | HIGH |
| Z-SEC-11 | Hiring Manager has no scope boundary — can evaluate any candidate regardless of position | HIGH |
| Z-SEC-12 | `evaluated_by` must come from session, never from request body — undocumented service-layer rule | HIGH |
| Z-SEC-13 | No data retention policy or right-to-erasure mechanism for rejected candidates (GDPR/PDPL risk) | HIGH |
| Z-SEC-14 | URL fields (`photo_url`, `cv_link`, `company_logo_url`) are unvalidated — SSRF risk | MEDIUM |
| Z-SEC-15 | No audit log table — no forensic trail for hiring decisions or record changes | HIGH |
| Z-SEC-16 | Cross-stage category mismatch in `category_evaluations` not enforced | HIGH |

---

### Zain's Top Recommendations
1. Replace polymorphic `category_evaluations` with 3 typed join tables
2. Add 6 security fields to `users` table in the initial migration (brute-force, token version, password reset)
3. Implement DB-level salary protection (RLS, column-level grants, or separate DB user per role)
4. Make `role` nullable at registration; Admin assigns actual role at approval
5. Add audit log table — append-only, no UPDATE/DELETE by any app role
6. Add `token_version` field — increment when user is deactivated or role changes
7. Validate all URL fields server-side to `https://` scheme only
8. Define and document data retention period for rejected candidates

---

---

## 4. Malak — QA / Code Reviewer

**Total findings: 32**
**Verdict:** *"The editing/correction workflow for submitted stage evaluations is entirely absent. Without it, any data entry error is permanent."*

---

### What Malak Praised
- Overall document structure is clear and well-organized
- Permission matrix format is easy to verify
- Data models include type, constraints, and notes — helpful for implementation

---

### Malak's Findings (Grouped)

#### Ambiguous Requirements (11)

| ID | Finding | Severity |
|---|---|---|
| M-AMB-01 | Skip outcome → `current_status` transition logic completely undefined | HIGH |
| M-AMB-02 | "On Hold" conflated at stage outcome and candidate status level — resume flow undefined | HIGH |
| M-AMB-03 | Can Admin conduct or override stage evaluations? Not stated | MEDIUM |
| M-AMB-04 | HR's read access to Stage 2+ data is undocumented but DB design grants it | MEDIUM |
| M-AMB-05 | `Title Applying For` duplicates `Position Applied` on candidate profile — always same? | MEDIUM |
| M-AMB-06 | Stage 3 has no date field — creates a gap in time-to-hire data | MEDIUM |
| M-AMB-07 | Binary Matching/Not Matching with no N/A option — forces inaccurate ratings | LOW |
| M-AMB-08 | Dashboard "Recent Activity" undefined — count, time window, role-filtered? | MEDIUM |
| M-AMB-09 | "Outcome" search filter is stage-level, not candidate-level — which stage? | MEDIUM |
| M-AMB-10 | Pending users never expire — no rejected status, no cleanup mechanism | MEDIUM |
| M-AMB-11 | Polymorphic FK — no DB-level integrity, untestable at DB layer | HIGH |

#### Edge Cases (10)

| ID | Finding | Severity |
|---|---|---|
| M-EDGE-01 | Skip outcome on Stage 4 (final stage) — result is undefined | HIGH |
| M-EDGE-02 | All 4 stages skipped — candidate becomes Hired with zero evaluations | HIGH |
| M-EDGE-03 | Same candidate email added twice — no UNIQUE constraint | HIGH |
| M-EDGE-04 | Candidates linked to a deactivated position — behavior undefined | MEDIUM |
| M-EDGE-05 | Historical evaluations when a category is deactivated — display undefined | MEDIUM |
| M-EDGE-06 | New categories added after evaluations already submitted — historical records incomplete | MEDIUM |
| M-EDGE-07 | Notification triggered when no eligible recipient role user exists in system | HIGH |
| M-EDGE-08 | First admin bootstrapping — chicken-and-egg problem | HIGH |
| M-EDGE-09 | Editing a stage record after candidate has already advanced — no correction flow | HIGH |
| M-EDGE-10 | Resuming a candidate from On Hold — which stage do they re-enter? | HIGH |

#### Inconsistencies Between Documents (7)

| ID | Finding | Severity |
|---|---|---|
| M-INC-01 | `candidates.email` missing UNIQUE constraint (requirements treats it as identifier) | HIGH |
| M-INC-02 | Salary visibility: requirements says "HR + CEO," DB design includes Admin | HIGH |
| M-INC-03 | Stage 3 field named `assessment_notes` in DB vs "Task Assessment" in requirements | LOW |
| M-INC-04 | Skip outcome not included in notification trigger logic | MEDIUM |
| M-INC-05 | "Hired" not in `stage_outcome` ENUM — implicit pass→hired translation undocumented | HIGH |
| M-INC-06 | HR access to `final_interviews` — requirements and DB access rules conflict | MEDIUM |
| M-INC-07 | `evaluated_by` role enforcement is a comment only — no constraint or documented rule | MEDIUM |

#### Missing Notification Triggers (5)

| ID | Finding | Severity |
|---|---|---|
| M-NOT-01 | No notification when candidate is Rejected | MEDIUM |
| M-NOT-02 | No notification when candidate is placed On Hold | MEDIUM |
| M-NOT-03 | No Hired confirmation notification loop back to HR | LOW |
| M-NOT-04 | No notification when a stage is Skipped | LOW |
| M-NOT-05 | "Candidate status changes → HR" too broad — will create notification spam | MEDIUM |

#### Missing Validation Rules (7)

| ID | Field | Gap | Severity |
|---|---|---|---|
| M-VAL-01 | `candidates.phone` | No format validation | MEDIUM |
| M-VAL-02 | URL fields | No `https://` enforcement | MEDIUM |
| M-VAL-03 | Salary fields | No min/max or currency defined | MEDIUM |
| M-VAL-04 | `positions.title` | No minimum length | LOW |
| M-VAL-05 | `evaluation_categories.name` | No UNIQUE per stage | MEDIUM |
| M-VAL-06 | Color fields in `app_settings` | No hex format validation | MEDIUM |
| M-VAL-07 | `interview_date` | No past/future constraint | LOW |

#### Testability Concerns (4)

| ID | Finding | Severity |
|---|---|---|
| M-TEST-01 | Polymorphic FK is untestable at DB layer — 100% reliance on application integration tests | HIGH |
| M-TEST-02 | "Time-to-hire" formula undefined — any implementation is equally valid and untestable | MEDIUM |
| M-TEST-03 | Role enforcement on `evaluated_by` is comment-only — ambiguous where to test | MEDIUM |
| M-TEST-04 | Notification transaction boundary undefined — failure-path testing impossible to specify | MEDIUM |

---

### Malak's Top 5 Must-Resolve
1. First admin bootstrap + password reset — app cannot launch without these
2. `pass on Stage 4 = hired` — must be an explicit documented business rule, not implicit code
3. Stage Skip transition logic + Stage 4 Skip outcome — core feature with zero defined behavior
4. `candidates.email` UNIQUE — intentional or oversight? Document the decision
5. Editing/correction flow for submitted stage evaluations — no correction path exists

---

---

## 5. Sara — Senior HR Consultant

**Total findings: 10 major themes**
**Verdict:** *"This document describes a recruitment tracking tool, not a recruitment management system. The process ends when the CEO says yes — but a candidate isn't hired until they accept a written offer."*

---

### What Sara Praised
- Four-stage funnel model (screen → assess → test → approve) is structurally logical
- Role separation between HR, Hiring Manager, and CEO reflects real-world org structure
- Dashboard with pipeline metrics — good for operational visibility
- Notice period and salary fields in Stage 1 — appropriate HR screening data

---

### Sara's Findings

| ID | Finding | Severity |
|---|---|---|
| S-HR-01 | No Offer Management stage — "Hired" is triggered by CEO approval, not by offer acceptance | CRITICAL |
| S-HR-02 | No CV / Application Screening before Stage 1 — every candidate consumes interview time | HIGH |
| S-HR-03 | Binary Matching/Not Matching is not a professional evaluation methodology — legally fragile, eliminates nuance, makes ranking impossible | HIGH |
| S-HR-04 | CEO as sole Stage 4 actor does not scale — creates a bottleneck for all positions regardless of seniority | HIGH |
| S-HR-05 | No candidate communication at any stage — no confirmation, no stage update, no rejection notice | HIGH |
| S-HR-06 | Stage 3 (Task) is invisible to the candidate and data-poor internally — no brief, no deadline, no submission date tracked | MEDIUM |
| S-HR-07 | No reference checking stage or mechanism | MEDIUM |
| S-HR-08 | No background verification process | MEDIUM |
| S-HR-09 | No process SLAs — no defined maximum days between stages | MEDIUM |
| S-HR-10 | Multiple compliance gaps: no candidate consent, no data retention policy, mandatory current salary field (restricted in some jurisdictions), photo on evaluation forms is a bias risk | HIGH |

---

### Sara's Missing Stages

| Stage | Description | Priority |
|---|---|---|
| Stage 0: Application Review | CV pre-screen — Shortlisted / Not Shortlisted before HR Interview | MEDIUM |
| Stage 5: Offer Management | Offer Pending → Sent → Accepted / Declined / Withdrawn → Hired | CRITICAL |
| Stage 6: Reference Check | Minimum: checkbox + date + notes field | MEDIUM |
| Stage 7: Background Verification | Depending on role and jurisdiction | LOW (V2) |
| Onboarding Handoff | Record when file handed to HR Operations | LOW (V2) |

---

### Sara's Missing Data Fields

| Stage | Missing Fields |
|---|---|
| Candidate Profile | Nationality, work authorization, current location, application date, expected start date, duplicate check |
| Stage 1 — HR Interview | Reason for leaving current role, interview format, interview duration, current employer/industry, structured source dropdown |
| Stage 2 — Technical | Number of interviewers (panel support), interview format |
| Stage 3 — Task | Task title/description, sent date, due date, received date, scoring criteria |
| Stage 4 — Final | Interview duration, interview format, other stakeholders present |

---

### Sara's Top Recommendations
1. Add Offer Management as Stage 5 — essential for accurate "Hired" status
2. Replace binary rating with 3-point scale (Below / Meets / Exceeds Expectations)
3. Add pre-screen Stage 0 before HR Interview
4. Make Stage 4 assignable, not hardcoded to CEO
5. Define data retention policy and candidate consent mechanism before launch
6. Make stage skips a governed process with written justification
7. Add process SLAs per stage (visible on dashboard)
8. Plan manual candidate communication for V1 and track whether messages were sent

---

---

## Cross-Reviewer Agreement Summary

Issues raised independently by **3 or more reviewers** — highest confidence, highest priority:

| Finding | Reviewers | Priority |
|---|---|---|
| Replace polymorphic `category_evaluations` with 3 typed join tables | Reem, Salma, Zain, Malak | CRITICAL |
| Add `candidate_status_history` table | Reem, Salma, Malak | HIGH |
| `On Hold` return path + UNIQUE constraint conflict must be resolved | Reem, Malak, Sara | CRITICAL |
| Add audit log table | Zain, Salma, Sara, Malak | HIGH |
| `candidates.email` needs UNIQUE constraint decision | Salma, Zain, Malak | HIGH |
| Missing `hired_at` on `candidates` | Reem, Salma | HIGH |
| Salary visibility contradiction (Admin included or not?) | Zain, Malak | HIGH |
| HR access to Stage 4 data — requirements and DB rules conflict | Reem, Zain, Malak, Sara | HIGH |
| Stage Skip logic is completely undefined | Reem, Malak, Sara | HIGH |
| First admin bootstrap has no mechanism | Zain, Malak, Sara | HIGH |
| No password reset flow | Zain, Malak | HIGH |
| `title_applying` field duplicated across stages — inconsistent naming | Reem, Salma, Malak, Sara | MEDIUM |
| CEO as sole Stage 4 actor does not scale | Reem, Sara | HIGH |
| Binary Matching/Not Matching is not a sufficient rating methodology | Malak, Sara | HIGH |
