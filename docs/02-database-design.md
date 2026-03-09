# Recruitment Cycle Management — Database Design

**Version:** 1.0
**Database:** PostgreSQL
**Date:** 2026-02-17

---

## Entity Relationship Overview

```
users
  └── has many: stage evaluations (as evaluator)

positions
  └── has many: candidates

candidates
  ├── belongs to: positions
  ├── has one:  hr_interviews
  ├── has one:  technical_feedbacks
  ├── has one:  task_assessments
  └── has one:  final_interviews

evaluation_categories
  └── has many: category_evaluations

hr_interviews
  └── has many: category_evaluations

technical_feedbacks
  └── has many: category_evaluations

final_interviews
  └── has many: category_evaluations

notifications
  └── belongs to: users (recipient)

app_settings
  (single-row configuration table)
```

---

## Tables

---

### 1. `users`

Stores all system users across all roles.

| Column          | Type                        | Constraints              | Notes                         |
|-----------------|-----------------------------|--------------------------|-------------------------------|
| `id`            | UUID                        | PK, DEFAULT gen_random_uuid() |                          |
| `full_name`     | VARCHAR(255)                | NOT NULL                 |                               |
| `email`         | VARCHAR(255)                | NOT NULL, UNIQUE         |                               |
| `password_hash` | TEXT                        | NOT NULL                 | Hashed password               |
| `role`          | ENUM                        | NOT NULL                 | `admin`, `hr`, `hiring_manager`, `ceo` |
| `status`        | ENUM                        | NOT NULL, DEFAULT `pending` | `pending`, `active`, `inactive` |
| `created_at`    | TIMESTAMPTZ                 | NOT NULL, DEFAULT NOW()  |                               |
| `updated_at`    | TIMESTAMPTZ                 | NOT NULL, DEFAULT NOW()  |                               |

**Indexes:**
- `users_email_idx` — UNIQUE on `email`

**Notes:**
- New users register with status `pending`
- Admin changes status to `active` and assigns a role on approval

---

### 2. `positions`

Simple list of job position titles.

| Column       | Type         | Constraints                   | Notes                  |
|--------------|--------------|-------------------------------|------------------------|
| `id`         | UUID         | PK, DEFAULT gen_random_uuid() |                        |
| `title`      | VARCHAR(255) | NOT NULL, UNIQUE              | e.g., "Backend Engineer" |
| `is_active`  | BOOLEAN      | NOT NULL, DEFAULT TRUE        | Hide inactive positions|
| `created_at` | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()       |                        |
| `updated_at` | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()       |                        |

---

### 3. `candidates`

Core candidate profile data.

| Column           | Type         | Constraints                    | Notes                          |
|------------------|--------------|--------------------------------|--------------------------------|
| `id`             | UUID         | PK, DEFAULT gen_random_uuid()  |                                |
| `full_name`      | VARCHAR(255) | NOT NULL                       |                                |
| `email`          | VARCHAR(255) | NOT NULL                       |                                |
| `phone`          | VARCHAR(50)  | NOT NULL                       |                                |
| `photo_url`      | TEXT         | NULL                           | URL to hosted photo            |
| `linkedin_url`   | TEXT         | NULL                           |                                |
| `cv_link`        | TEXT         | NULL                           | Link to CV on Google Drive etc.|
| `source`         | VARCHAR(255) | NULL                           | Where they applied from        |
| `position_id`    | UUID         | FK → positions(id), NOT NULL   |                                |
| `current_status` | ENUM         | NOT NULL, DEFAULT `new`        | See candidate status enum      |
| `created_by`     | UUID         | FK → users(id), NOT NULL       | HR user who added them         |
| `created_at`     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()        |                                |
| `updated_at`     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()        |                                |

**Candidate Status ENUM values:**
```
new
hr_interview
technical_feedback
task
final_interview
hired
rejected
on_hold
```

**Indexes:**
- `candidates_position_id_idx` — on `position_id`
- `candidates_status_idx` — on `current_status`
- `candidates_created_at_idx` — on `created_at`
- Full-text search index on `full_name`

---

### 4. `evaluation_categories`

Admin-defined evaluation aspects per stage.

| Column       | Type         | Constraints                    | Notes                          |
|--------------|--------------|--------------------------------|--------------------------------|
| `id`         | UUID         | PK, DEFAULT gen_random_uuid()  |                                |
| `name`       | VARCHAR(255) | NOT NULL                       | e.g., "Communication"         |
| `stage`      | ENUM         | NOT NULL                       | `hr_interview`, `technical_feedback`, `final_interview` |
| `sort_order` | INTEGER      | NOT NULL, DEFAULT 0            | Display order within stage     |
| `is_active`  | BOOLEAN      | NOT NULL, DEFAULT TRUE         |                                |
| `created_at` | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()        |                                |
| `updated_at` | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()        |                                |

**Indexes:**
- `eval_categories_stage_idx` — on `stage`
- `eval_categories_stage_order_idx` — on `(stage, sort_order)`

> Stage 3 (Task) has no evaluation categories — only a Pass/Fail/On Hold/Skip outcome and notes.

---

### 5. `hr_interviews`

Stage 1 — HR Interview records.

| Column             | Type         | Constraints                     | Notes                          |
|--------------------|--------------|----------------------------------|--------------------------------|
| `id`               | UUID         | PK, DEFAULT gen_random_uuid()    |                                |
| `candidate_id`     | UUID         | FK → candidates(id), NOT NULL, UNIQUE | One per candidate         |
| `interview_date`   | TIMESTAMPTZ  | NOT NULL                         |                                |
| `title_applying`   | VARCHAR(255) | NOT NULL                         |                                |
| `notice_period`    | VARCHAR(100) | NOT NULL                         | e.g., "1 month", "Immediate"  |
| `current_salary`   | DECIMAL(12,2)| NOT NULL                         | Restricted to HR + CEO         |
| `expected_salary`  | DECIMAL(12,2)| NOT NULL                         | Restricted to HR + CEO         |
| `overall_notes`    | TEXT         | NULL                             | Optional                       |
| `outcome`          | ENUM         | NOT NULL                         | `pass`, `fail`, `on_hold`, `skip` |
| `evaluated_by`     | UUID         | FK → users(id), NOT NULL         | Must be HR role                |
| `created_at`       | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()          |                                |
| `updated_at`       | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()          |                                |

---

### 6. `technical_feedbacks`

Stage 2 — Technical Feedback records.

| Column           | Type         | Constraints                      | Notes                          |
|------------------|--------------|----------------------------------|--------------------------------|
| `id`             | UUID         | PK, DEFAULT gen_random_uuid()    |                                |
| `candidate_id`   | UUID         | FK → candidates(id), NOT NULL, UNIQUE | One per candidate         |
| `interview_date` | TIMESTAMPTZ  | NOT NULL                         |                                |
| `title_applying` | VARCHAR(255) | NOT NULL                         |                                |
| `overall_notes`  | TEXT         | NULL                             | Optional                       |
| `outcome`        | ENUM         | NOT NULL                         | `pass`, `fail`, `on_hold`, `skip` |
| `evaluated_by`   | UUID         | FK → users(id), NOT NULL         | Must be Hiring Manager role    |
| `created_at`     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()          |                                |
| `updated_at`     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()          |                                |

---

### 7. `task_assessments`

Stage 3 — Task results.

| Column           | Type         | Constraints                      | Notes                              |
|------------------|--------------|----------------------------------|------------------------------------|
| `id`             | UUID         | PK, DEFAULT gen_random_uuid()    |                                    |
| `candidate_id`   | UUID         | FK → candidates(id), NOT NULL, UNIQUE | One per candidate             |
| `position_applied`| VARCHAR(255)| NOT NULL                         |                                    |
| `assessment_notes`| TEXT        | NULL                             | Hiring Manager's task review notes |
| `outcome`        | ENUM         | NOT NULL                         | `pass`, `fail`, `on_hold`, `skip`  |
| `evaluated_by`   | UUID         | FK → users(id), NOT NULL         | Must be Hiring Manager role        |
| `created_at`     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()          |                                    |
| `updated_at`     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()          |                                    |

---

### 8. `final_interviews`

Stage 4 — Final Interview records.

| Column           | Type         | Constraints                      | Notes                          |
|------------------|--------------|----------------------------------|--------------------------------|
| `id`             | UUID         | PK, DEFAULT gen_random_uuid()    |                                |
| `candidate_id`   | UUID         | FK → candidates(id), NOT NULL, UNIQUE | One per candidate         |
| `interview_date` | TIMESTAMPTZ  | NOT NULL                         |                                |
| `title_applying` | VARCHAR(255) | NOT NULL                         |                                |
| `overall_notes`  | TEXT         | NULL                             | Optional                       |
| `outcome`        | ENUM         | NOT NULL                         | `pass`, `fail`, `on_hold`, `skip` |
| `evaluated_by`   | UUID         | FK → users(id), NOT NULL         | Must be CEO role               |
| `created_at`     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()          |                                |
| `updated_at`     | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()          |                                |

---

### 9. `category_evaluations`

Links a category rating to its parent stage record.
One row per category per stage record.

| Column              | Type    | Constraints                     | Notes                               |
|---------------------|---------|---------------------------------|-------------------------------------|
| `id`                | UUID    | PK, DEFAULT gen_random_uuid()   |                                     |
| `category_id`       | UUID    | FK → evaluation_categories(id), NOT NULL |                            |
| `stage_type`        | ENUM    | NOT NULL                        | `hr_interview`, `technical_feedback`, `final_interview` |
| `stage_record_id`   | UUID    | NOT NULL                        | ID of the parent stage record       |
| `rating`            | ENUM    | NOT NULL                        | `matching`, `not_matching`          |
| `notes`             | TEXT    | NULL                            | Optional per-category notes         |
| `created_at`        | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()     |                                     |

**Indexes:**
- `cat_eval_stage_idx` — on `(stage_type, stage_record_id)`
- `cat_eval_category_idx` — on `category_id`

**Notes:**
- `stage_record_id` is a polymorphic reference. Depending on `stage_type`, it references:
  - `hr_interview` → `hr_interviews(id)`
  - `technical_feedback` → `technical_feedbacks(id)`
  - `final_interview` → `final_interviews(id)`
- A CHECK constraint ensures `stage_record_id` is not null
- Application layer enforces referential integrity for the polymorphic FK

---

### 10. `notifications`

In-app notifications.

| Column        | Type         | Constraints                     | Notes                                      |
|---------------|--------------|---------------------------------|--------------------------------------------|
| `id`          | UUID         | PK, DEFAULT gen_random_uuid()   |                                            |
| `recipient_id`| UUID         | FK → users(id), NOT NULL        | User who receives the notification         |
| `type`        | VARCHAR(100) | NOT NULL                        | e.g., `candidate_passed_hr`, `new_registration` |
| `title`       | VARCHAR(255) | NOT NULL                        | Short notification title                   |
| `message`     | TEXT         | NOT NULL                        | Full notification message                  |
| `candidate_id`| UUID         | FK → candidates(id), NULL       | Related candidate (if applicable)          |
| `is_read`     | BOOLEAN      | NOT NULL, DEFAULT FALSE         |                                            |
| `created_at`  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()         |                                            |

**Indexes:**
- `notifications_recipient_idx` — on `recipient_id`
- `notifications_unread_idx` — on `(recipient_id, is_read)` WHERE `is_read = false`

---

### 11. `app_settings`

Single-row table for global application configuration.

| Column            | Type         | Constraints              | Notes                          |
|-------------------|--------------|--------------------------|--------------------------------|
| `id`              | INTEGER      | PK, DEFAULT 1            | Always 1 — single row          |
| `company_name`    | VARCHAR(255) | NOT NULL                 |                                |
| `company_logo_url`| TEXT         | NULL                     |                                |
| `primary_color`   | VARCHAR(7)   | NOT NULL, DEFAULT `#000000` | Hex color code              |
| `secondary_color` | VARCHAR(7)   | NOT NULL, DEFAULT `#ffffff` | Hex color code              |
| `accent_color`    | VARCHAR(7)   | NOT NULL, DEFAULT `#0066cc` | Hex color code              |
| `updated_at`      | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW()  |                                |
| `updated_by`      | UUID         | FK → users(id), NULL     | Admin who last updated         |

---

## ENUMs Summary

```sql
CREATE TYPE user_role AS ENUM (
  'admin', 'hr', 'hiring_manager', 'ceo'
);

CREATE TYPE user_status AS ENUM (
  'pending', 'active', 'inactive'
);

CREATE TYPE candidate_status AS ENUM (
  'new', 'hr_interview', 'technical_feedback',
  'task', 'final_interview', 'hired', 'rejected', 'on_hold'
);

CREATE TYPE stage_outcome AS ENUM (
  'pass', 'fail', 'on_hold', 'skip'
);

CREATE TYPE stage_type AS ENUM (
  'hr_interview', 'technical_feedback', 'final_interview'
);

CREATE TYPE category_rating AS ENUM (
  'matching', 'not_matching'
);
```

---

## Relationships Diagram (Text)

```
users (1) ──────────────── (M) notifications
users (1) ──────────────── (M) hr_interviews        [evaluated_by]
users (1) ──────────────── (M) technical_feedbacks   [evaluated_by]
users (1) ──────────────── (M) task_assessments      [evaluated_by]
users (1) ──────────────── (M) final_interviews       [evaluated_by]
users (1) ──────────────── (M) candidates             [created_by]

positions (1) ──────────── (M) candidates

candidates (1) ──────────── (1) hr_interviews
candidates (1) ──────────── (1) technical_feedbacks
candidates (1) ──────────── (1) task_assessments
candidates (1) ──────────── (1) final_interviews

hr_interviews (1) ──────── (M) category_evaluations
technical_feedbacks (1) ── (M) category_evaluations
final_interviews (1) ────── (M) category_evaluations

evaluation_categories (1) ─ (M) category_evaluations
```

---

## Data Access Rules (Application Layer)

| Data                    | Who Can Read                    | Who Can Write          |
|-------------------------|---------------------------------|------------------------|
| `current_salary`        | HR, CEO, Admin                  | HR                     |
| `expected_salary`       | HR, CEO, Admin                  | HR                     |
| `hr_interviews`         | HR, CEO, Admin                  | HR                     |
| `technical_feedbacks`   | HR, Hiring Manager, CEO, Admin  | Hiring Manager         |
| `task_assessments`      | HR, Hiring Manager, CEO, Admin  | Hiring Manager         |
| `final_interviews`      | CEO, Admin                      | CEO                    |
| `users` table           | Admin only                      | Admin only             |
| `app_settings`          | All (for brand colors)          | Admin only             |
| `evaluation_categories` | All (read for forms)            | Admin only             |

---

## Migration Order

Run migrations in this order to respect foreign key dependencies:

```
1. app_settings
2. users
3. positions
4. candidates
5. evaluation_categories
6. hr_interviews
7. technical_feedbacks
8. task_assessments
9. final_interviews
10. category_evaluations
11. notifications
```
