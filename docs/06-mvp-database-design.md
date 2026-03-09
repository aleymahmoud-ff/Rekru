# Recruitment Cycle MVP — Database Design

**Version:** 2.0 (MVP)
**Date:** 2026-03-09
**Database:** PostgreSQL via Prisma (hosted on Vercel Postgres / Neon)

---

## Entity Relationship Overview

```
users
  └── conducts interviews

jobs
  └── has many: job_candidates

candidates
  └── has many: job_candidates

job_candidates
  ├── belongs to: jobs
  ├── belongs to: candidates
  ├── current_stage → interview_stages
  └── has many: interviews

interview_stages (configured by admin)
  └── has many: stage_questions

stage_questions
  └── has many: question_options

interviews (one per job_candidate per stage)
  ├── belongs to: job_candidates
  ├── belongs to: interview_stages
  ├── conducted by: users
  └── has many: interview_answers

interview_answers
  ├── belongs to: interviews
  ├── belongs to: stage_questions
  └── belongs to: question_options (selected answer)
```

---

## Tables

---

### 1. `users`

| Column          | Type         | Constraints                    | Notes                          |
|-----------------|--------------|--------------------------------|--------------------------------|
| `id`            | UUID         | PK, DEFAULT gen_random_uuid()  |                                |
| `full_name`     | VARCHAR(255) | NOT NULL                       |                                |
| `email`         | VARCHAR(255) | NOT NULL, UNIQUE               |                                |
| `password_hash` | TEXT         | NOT NULL                       |                                |
| `role`          | ENUM         | NULL                           | `admin`, `user` — set by admin at approval |
| `status`        | ENUM         | NOT NULL, DEFAULT `pending`    | `pending`, `active`, `inactive` |
| `created_at`    | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()        |                                |
| `updated_at`    | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()        |                                |

---

### 2. `jobs`

| Column        | Type         | Constraints                    | Notes                          |
|---------------|--------------|--------------------------------|--------------------------------|
| `id`          | UUID         | PK, DEFAULT gen_random_uuid()  |                                |
| `title`       | VARCHAR(255) | NOT NULL                       | e.g., "Senior Developer"      |
| `description` | TEXT         | NULL                           | Optional job description       |
| `status`      | ENUM         | NOT NULL, DEFAULT `open`       | `open`, `closed`               |
| `created_by`  | UUID         | FK → users(id), NOT NULL       |                                |
| `created_at`  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()        |                                |
| `updated_at`  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()        |                                |

**Indexes:** `jobs_status_idx` on `status`

---

### 3. `candidates`

| Column      | Type         | Constraints                    | Notes                          |
|-------------|--------------|--------------------------------|--------------------------------|
| `id`        | UUID         | PK, DEFAULT gen_random_uuid()  |                                |
| `full_name` | VARCHAR(255) | NOT NULL                       |                                |
| `email`     | VARCHAR(255) | NOT NULL, UNIQUE               |                                |
| `phone`     | VARCHAR(50)  | NOT NULL                       |                                |
| `cv_link`   | TEXT         | NULL                           | URL to external CV             |
| `created_at`| TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()        |                                |
| `updated_at`| TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()        |                                |

---

### 4. `job_candidates`

Links a candidate to a job and tracks their progress through the pipeline.

| Column           | Type         | Constraints                    | Notes                          |
|------------------|--------------|--------------------------------|--------------------------------|
| `id`             | UUID         | PK, DEFAULT gen_random_uuid()  |                                |
| `job_id`         | UUID         | FK → jobs(id), NOT NULL        |                                |
| `candidate_id`   | UUID         | FK → candidates(id), NOT NULL  |                                |
| `current_stage_id`| UUID        | FK → interview_stages(id), NULL| NULL = completed pipeline      |
| `status`         | ENUM         | NOT NULL, DEFAULT `active`     | `active`, `hired`, `rejected`, `on_hold` |
| `hired_at`       | TIMESTAMPTZ  | NULL                           | Set when status → hired        |
| `created_at`     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()        |                                |
| `updated_at`     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()        |                                |

**Constraints:**
- `UNIQUE(job_id, candidate_id)` — a candidate can only be added to a job once

**Indexes:**
- `job_candidates_job_idx` on `job_id`
- `job_candidates_candidate_idx` on `candidate_id`
- `job_candidates_status_idx` on `status`
- `job_candidates_stage_idx` on `current_stage_id`

---

### 5. `interview_stages`

Admin-configured pipeline stages.

| Column       | Type         | Constraints                    | Notes                          |
|--------------|--------------|--------------------------------|--------------------------------|
| `id`         | UUID         | PK, DEFAULT gen_random_uuid()  |                                |
| `name`       | VARCHAR(255) | NOT NULL                       | e.g., "HR Interview"          |
| `sort_order` | INTEGER      | NOT NULL                       | Determines pipeline sequence   |
| `is_active`  | BOOLEAN      | NOT NULL, DEFAULT TRUE         |                                |
| `created_at` | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()        |                                |
| `updated_at` | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()        |                                |

**Indexes:** `interview_stages_order_idx` on `(is_active, sort_order)`

---

### 6. `stage_questions`

Questions within a stage, configured by admin.

| Column       | Type         | Constraints                    | Notes                          |
|--------------|--------------|--------------------------------|--------------------------------|
| `id`         | UUID         | PK, DEFAULT gen_random_uuid()  |                                |
| `stage_id`   | UUID         | FK → interview_stages(id), NOT NULL, ON DELETE CASCADE |      |
| `question_text`| TEXT       | NOT NULL                       | e.g., "Communication Skills"  |
| `sort_order` | INTEGER      | NOT NULL                       |                                |
| `is_active`  | BOOLEAN      | NOT NULL, DEFAULT TRUE         |                                |
| `created_at` | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()        |                                |
| `updated_at` | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()        |                                |

**Indexes:** `stage_questions_stage_idx` on `(stage_id, is_active, sort_order)`

---

### 7. `question_options`

Answer choices for a question, configured by admin.

| Column       | Type         | Constraints                    | Notes                          |
|--------------|--------------|--------------------------------|--------------------------------|
| `id`         | UUID         | PK, DEFAULT gen_random_uuid()  |                                |
| `question_id`| UUID         | FK → stage_questions(id), NOT NULL, ON DELETE CASCADE |        |
| `label`      | VARCHAR(255) | NOT NULL                       | e.g., "Meets Expectations"    |
| `value`      | INTEGER      | NOT NULL                       | Numeric score, e.g., 1, 2, 3  |
| `sort_order` | INTEGER      | NOT NULL                       |                                |
| `created_at` | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()        |                                |

**Indexes:** `question_options_question_idx` on `(question_id, sort_order)`

---

### 8. `interviews`

A completed interview — one per (job_candidate, stage) combination.

| Column           | Type         | Constraints                    | Notes                          |
|------------------|--------------|--------------------------------|--------------------------------|
| `id`             | UUID         | PK, DEFAULT gen_random_uuid()  |                                |
| `job_candidate_id`| UUID        | FK → job_candidates(id), NOT NULL |                             |
| `stage_id`       | UUID         | FK → interview_stages(id), NOT NULL |                           |
| `interviewer_id` | UUID         | FK → users(id), NOT NULL       | Who conducted it               |
| `outcome`        | ENUM         | NOT NULL                       | `pass`, `fail`, `on_hold`      |
| `overall_notes`  | TEXT         | NULL                           | Optional                       |
| `conducted_at`   | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()        | When the interview happened    |
| `created_at`     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()        |                                |

**Constraints:**
- `UNIQUE(job_candidate_id, stage_id)` — one interview per candidate per stage

**Indexes:**
- `interviews_job_candidate_idx` on `job_candidate_id`
- `interviews_interviewer_idx` on `interviewer_id`

---

### 9. `interview_answers`

Individual question answers within an interview.

| Column       | Type         | Constraints                    | Notes                          |
|--------------|--------------|--------------------------------|--------------------------------|
| `id`         | UUID         | PK, DEFAULT gen_random_uuid()  |                                |
| `interview_id`| UUID        | FK → interviews(id), NOT NULL, ON DELETE CASCADE |              |
| `question_id`| UUID         | FK → stage_questions(id), NOT NULL |                            |
| `option_id`  | UUID         | FK → question_options(id), NOT NULL | Selected answer            |
| `notes`      | TEXT         | NULL                           | Optional per-question notes    |
| `created_at` | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()        |                                |

**Constraints:**
- `UNIQUE(interview_id, question_id)` — one answer per question per interview

**Indexes:**
- `interview_answers_interview_idx` on `interview_id`

---

### 10. `app_settings`

Single-row configuration table.

| Column            | Type         | Constraints              | Notes                          |
|-------------------|--------------|--------------------------|--------------------------------|
| `id`              | INTEGER      | PK, DEFAULT 1            | Always 1                       |
| `app_name`        | VARCHAR(255) | NOT NULL, DEFAULT 'Rekru'     |                             |
| `primary_color`   | VARCHAR(7)   | NOT NULL, DEFAULT '#0066cc' |                              |
| `secondary_color` | VARCHAR(7)   | NOT NULL, DEFAULT '#ffffff' |                              |
| `accent_color`    | VARCHAR(7)   | NOT NULL, DEFAULT '#f59e0b' |                              |
| `updated_at`      | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()  |                                |

---

## ENUMs

```sql
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE user_status AS ENUM ('pending', 'active', 'inactive');
CREATE TYPE job_status AS ENUM ('open', 'closed');
CREATE TYPE candidate_pipeline_status AS ENUM ('active', 'hired', 'rejected', 'on_hold');
CREATE TYPE interview_outcome AS ENUM ('pass', 'fail', 'on_hold');
```

---

## Relationships Diagram

```
users (1) ─────────────── (M) jobs            [created_by]
users (1) ─────────────── (M) interviews      [interviewer_id]

jobs (1) ──────────────── (M) job_candidates
candidates (1) ────────── (M) job_candidates

job_candidates (1) ────── (M) interviews

interview_stages (1) ──── (M) stage_questions
interview_stages (1) ──── (M) interviews
interview_stages (1) ──── (M) job_candidates   [current_stage_id]

stage_questions (1) ───── (M) question_options
stage_questions (1) ───── (M) interview_answers

question_options (1) ──── (M) interview_answers [selected option]

interviews (1) ─────────── (M) interview_answers
```

---

## How the Pipeline Works (Data Flow)

### Step 1: Admin configures the pipeline
```
interview_stages: [HR Interview (order 1), Technical (order 2), Final (order 3)]
    └── stage_questions: ["Communication Skills", "Team Fit", ...]
        └── question_options: ["Below Expectations (1)", "Meets Expectations (2)", "Exceeds Expectations (3)"]
```

### Step 2: User creates a Job and adds Candidates
```
jobs: { title: "Senior Developer", status: "open" }
    └── job_candidates: { candidate_id, current_stage_id: [first active stage], status: "active" }
```

### Step 3: Interviewer conducts an interview
```
interviews: { job_candidate_id, stage_id, outcome: "pass" }
    └── interview_answers: [{ question_id, option_id, notes }, ...]

→ If outcome = "pass": job_candidates.current_stage_id = next stage
→ If outcome = "pass" AND no next stage: job_candidates.status = "hired"
→ If outcome = "fail": job_candidates.status = "rejected"
→ If outcome = "on_hold": stays at current stage
```

---

## Seed Data

Initial migration should seed:

```
Admin user:     admin@company.com (force password change on first login)
App settings:   default name + colors

Interview Stages:
  1. HR Interview (order: 1)
  2. Technical Interview (order: 2)
  3. Final Interview (order: 3)

HR Interview Questions:
  - Communication Skills → [Below Expectations (1), Meets Expectations (2), Exceeds Expectations (3)]
  - Professionalism → [Below Expectations (1), Meets Expectations (2), Exceeds Expectations (3)]
  - Cultural Fit → [Below Expectations (1), Meets Expectations (2), Exceeds Expectations (3)]

Technical Interview Questions:
  - Technical Knowledge → [Below Expectations (1), Meets Expectations (2), Exceeds Expectations (3)]
  - Problem Solving → [Below Expectations (1), Meets Expectations (2), Exceeds Expectations (3)]

Final Interview Questions:
  - Hire this candidate? → [Not Hired (0), Hired (1)]
```

---

## Total: 10 Tables

| # | Table | Purpose |
|---|-------|---------|
| 1 | `users` | System users (admin + user roles) |
| 2 | `jobs` | Job openings |
| 3 | `candidates` | Candidate profiles |
| 4 | `job_candidates` | Links candidate to job + tracks pipeline progress |
| 5 | `interview_stages` | Admin-configured pipeline stages |
| 6 | `stage_questions` | Questions within each stage |
| 7 | `question_options` | Answer choices per question |
| 8 | `interviews` | Completed interview records |
| 9 | `interview_answers` | Individual question answers |
| 10 | `app_settings` | App configuration (name, colors) |
