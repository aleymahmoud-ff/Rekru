# Recruitment Cycle Management App — Requirements Document

**Project Name:** Recruitment Cycle Management
**Client:** Wander
**Date:** 2026-02-16
**Version:** 1.0

---

## 1. Project Overview

A web application to manage the recruitment pipeline from initial HR screening through to CEO final approval. The system tracks candidates through a sequential 4-stage process, enabling multiple stakeholders (HR, Hiring Managers, CEO) to collaborate on hiring decisions.

---

## 2. Process Flow

### 2.1 Pipeline Stages

The recruitment cycle consists of **4 sequential stages**. Stages follow a fixed order but individual stages can be **skipped** when not applicable.

```
Stage 1          Stage 2              Stage 3        Stage 4           Final
HR Interview  →  Technical Feedback → Task        →  Final Interview → Hired
(HR)             (Hiring Manager)     (External)     (CEO)
```

### 2.2 Stage Outcomes

Each stage can result in one of the following:

| Outcome     | Description                                           |
|-------------|-------------------------------------------------------|
| **Pass**    | Candidate moves to the next stage                     |
| **Fail**    | Candidate is rejected and removed from active pipeline|
| **On Hold** | Candidate is paused for later review                  |
| **Skip**    | Stage is bypassed; candidate moves to the next stage  |

### 2.3 Final Outcome

When a candidate passes the Final Interview (Stage 4), they are marked as **Hired**. This is the end of the recruitment cycle — no onboarding or further processes.

---

## 3. User Roles & Permissions

### 3.1 Role Definitions

| Role              | Description                                                        |
|-------------------|--------------------------------------------------------------------|
| **Admin**         | System administrator. Manages users, settings, evaluation categories, and app configuration |
| **HR**            | Human Resources team. Conducts Stage 1 (HR Interview), manages candidate pipeline |
| **Hiring Manager**| Department managers. Conducts Stage 2 (Technical Feedback), records Stage 3 (Task) results |
| **CEO**           | Executive. Conducts Stage 4 (Final Interview)                      |

### 3.2 Permission Matrix

| Feature / Action              | Admin | HR  | Hiring Manager | CEO |
|-------------------------------|-------|-----|----------------|-----|
| Manage users & roles          | ✅    | ❌  | ❌             | ❌  |
| Approve new registrations     | ✅    | ❌  | ❌             | ❌  |
| Configure app settings        | ✅    | ❌  | ❌             | ❌  |
| Define evaluation categories  | ✅    | ❌  | ❌             | ❌  |
| Manage position list          | ✅    | ✅  | ❌             | ❌  |
| Create / edit candidates      | ✅    | ✅  | ❌             | ❌  |
| Conduct HR Interview (S1)     | ❌    | ✅  | ❌             | ❌  |
| Conduct Technical Feedback (S2)| ❌   | ❌  | ✅             | ❌  |
| Record Task Result (S3)       | ❌    | ❌  | ✅             | ❌  |
| Conduct Final Interview (S4)  | ❌    | ❌  | ❌             | ✅  |
| View salary data              | ✅    | ✅  | ❌             | ✅  |
| View dashboard                | ✅    | ✅  | ✅             | ✅  |
| Search & filter candidates    | ✅    | ✅  | ✅             | ✅  |

### 3.3 Authentication

- **Self-registration**: Users can register with email and password
- **Admin approval**: New accounts require admin approval before access is granted
- **Role assignment**: Admin assigns the appropriate role upon approval

---

## 4. Data Models

### 4.1 Candidate Profile

| Field              | Type     | Required | Notes                                    |
|--------------------|----------|----------|------------------------------------------|
| Full Name          | Text     | ✅       |                                          |
| Email              | Email    | ✅       |                                          |
| Phone              | Text     | ✅       |                                          |
| Photo              | URL      | ❌       | URL to hosted photo                      |
| LinkedIn URL       | URL      | ❌       |                                          |
| CV Link            | URL      | ❌       | Link to CV on external drive (no upload) |
| Source             | Text     | ❌       | Where the candidate applied from         |
| Position Applied   | Dropdown | ✅       | From the positions list                  |
| Current Status     | Enum     | ✅       | Auto-managed by the system               |
| Created Date       | DateTime | ✅       | Auto-generated                           |

**Candidate Statuses:**
- `New` — Just added, not yet interviewed
- `HR Interview` — Currently in Stage 1
- `Technical Feedback` — Currently in Stage 2
- `Task` — Currently in Stage 3
- `Final Interview` — Currently in Stage 4
- `Hired` — Successfully completed all stages
- `Rejected` — Failed at any stage
- `On Hold` — Paused for later review

### 4.2 Stage 1 — HR Interview

| Field              | Type     | Required | Notes                              |
|--------------------|----------|----------|------------------------------------|
| Candidate          | FK       | ✅       | Reference to candidate             |
| Interview Date     | DateTime | ✅       |                                    |
| Title Applying For | Text     | ✅       |                                    |
| Notice Period      | Text     | ✅       | e.g., "1 month", "immediate"      |
| Current Salary     | Number   | ✅       | Visible to HR + CEO only           |
| Expected Salary    | Number   | ✅       | Visible to HR + CEO only           |
| Category Evaluations| Array   | ✅       | See evaluation system (Section 5)  |
| Overall Notes      | Text     | ❌       | Optional free-text notes           |
| Outcome            | Enum     | ✅       | Pass / Fail / On Hold / Skip       |
| Evaluated By       | FK       | ✅       | Reference to HR user               |

### 4.3 Stage 2 — Technical Feedback

| Field              | Type     | Required | Notes                              |
|--------------------|----------|----------|------------------------------------|
| Candidate          | FK       | ✅       | Reference to candidate             |
| Interview Date     | DateTime | ✅       |                                    |
| Title Applying For | Text     | ✅       |                                    |
| Category Evaluations| Array   | ✅       | See evaluation system (Section 5)  |
| Overall Notes      | Text     | ❌       | Optional free-text notes           |
| Outcome            | Enum     | ✅       | Pass / Fail / On Hold / Skip       |
| Evaluated By       | FK       | ✅       | Reference to Hiring Manager user   |

### 4.4 Stage 3 — Task

| Field              | Type     | Required | Notes                              |
|--------------------|----------|----------|------------------------------------|
| Candidate          | FK       | ✅       | Reference to candidate             |
| Position Applied   | Text     | ✅       |                                    |
| Task Assessment    | Text     | ❌       | Notes about task evaluation        |
| Outcome            | Enum     | ✅       | Pass / Fail / On Hold / Skip       |
| Evaluated By       | FK       | ✅       | Reference to Hiring Manager user   |

> **Note:** Task sending and receiving happens outside the application for now. The Hiring Manager only records the result in the system.

### 4.5 Stage 4 — Final Interview

| Field              | Type     | Required | Notes                              |
|--------------------|----------|----------|------------------------------------|
| Candidate          | FK       | ✅       | Reference to candidate             |
| Interview Date     | DateTime | ✅       |                                    |
| Title Applying For | Text     | ✅       |                                    |
| Category Evaluations| Array   | ✅       | See evaluation system (Section 5)  |
| Overall Notes      | Text     | ❌       | Optional free-text notes           |
| Outcome            | Enum     | ✅       | Pass / Fail / On Hold / Skip       |
| Evaluated By       | FK       | ✅       | Reference to CEO user              |

### 4.6 Positions List

| Field     | Type     | Required | Notes             |
|-----------|----------|----------|--------------------|
| Title     | Text     | ✅       | Position name      |
| Active    | Boolean  | ✅       | Show/hide in lists |

Simple dropdown list — no detailed job descriptions or vacancy tracking.

---

## 5. Evaluation System

### 5.1 Overview

Instead of individual questions, the system uses **evaluation categories** (also called "aspects"). Each category represents a skill or trait that the evaluator assesses.

### 5.2 Category Management

- **Admin** defines evaluation categories for each stage
- Each stage has its **own set of categories** (different from other stages)
- Examples:
  - **Stage 1 (HR):** Communication, Personality, Professionalism, Motivation
  - **Stage 2 (Technical):** Technical Skills, Problem Solving, Domain Knowledge, Code Quality
  - **Stage 4 (Final):** Leadership, Culture Fit, Strategic Thinking

### 5.3 Evaluation Process

For each category in a stage, the evaluator selects:

| Rating            | Description                                        |
|-------------------|----------------------------------------------------|
| **Matching**      | Candidate meets the expectations for this category |
| **Not Matching**  | Candidate does not meet expectations               |

Additionally:
- **Optional notes per category** — free text to elaborate on the rating
- **Optional overall notes per stage** — general comments about the candidate's performance in this stage

### 5.4 Evaluation Category Data Model

| Field       | Type     | Required | Notes                        |
|-------------|----------|----------|------------------------------|
| Name        | Text     | ✅       | e.g., "Communication"       |
| Stage       | Enum     | ✅       | Which stage this belongs to  |
| Sort Order  | Number   | ✅       | Display order                |
| Active      | Boolean  | ✅       | Can be deactivated           |

---

## 6. Features

### 6.1 Dashboard

Pipeline overview dashboard showing:
- **Candidates per stage** — visual pipeline/funnel view
- **Pass/Fail rates** — per stage and overall
- **Time-to-hire** — average time from candidate creation to hired
- **Active candidates count** — total in pipeline
- **Recent activity** — latest stage completions and status changes

### 6.2 Notifications (In-App Only)

| Trigger                              | Recipient        | Message                                           |
|--------------------------------------|------------------|----------------------------------------------------|
| Candidate passes Stage 1 (HR)        | Hiring Manager   | "New candidate ready for Technical Feedback"       |
| Candidate passes Stage 2 (Technical) | Hiring Manager   | "Candidate ready for Task evaluation"              |
| Candidate passes Stage 3 (Task)      | CEO              | "New candidate ready for Final Interview"          |
| Candidate status changes             | HR               | "Candidate [name] status changed to [status]"     |
| New user registration                | Admin            | "New user registration pending approval"           |

Notifications should:
- Show in a notification bell/dropdown in the app header
- Mark as read/unread
- Link to the relevant candidate page

### 6.3 Search & Filter

Ability to search and filter candidates by:
- **Name** — text search
- **Position** — dropdown filter
- **Status** — dropdown filter (current stage or final status)
- **Date range** — filter by creation date or interview dates
- **Outcome** — filter by pass/fail/on hold

### 6.4 App Configuration (Admin)

| Setting               | Description                                       |
|-----------------------|---------------------------------------------------|
| Brand Colors          | Primary, secondary, and accent colors             |
| Company Name          | Displayed in the app header                       |
| Company Logo          | URL to logo image                                 |
| Evaluation Categories | Manage categories per stage                       |
| Position List         | Manage available positions                        |

---

## 7. Non-Functional Requirements

| Requirement       | Specification                                          |
|--------------------|--------------------------------------------------------|
| **Platform**       | Web application (responsive for desktop & tablet)      |
| **Authentication** | Email + password with self-registration + admin approval |
| **Authorization**  | Role-based access control (RBAC)                       |
| **Data Privacy**   | Salary data restricted to HR + CEO roles               |
| **Tenancy**        | Single organization                                    |
| **Export**          | Not required for initial version                       |
| **Calendar**       | Not required for initial version                       |
| **Email**          | Not required for initial version (in-app notifications only) |

---

## 8. Future Considerations (Out of Scope for V1)

These features may be added in future versions:
- Task submission within the app (candidate portal with link)
- Email notifications
- Calendar integration / interview scheduling
- Export to Excel/CSV and PDF reports
- Multi-tenancy support
- Onboarding process after hiring
- Candidate self-service portal
