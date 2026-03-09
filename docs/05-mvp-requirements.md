# Recruitment Cycle MVP — Requirements

**Version:** 2.0 (MVP)
**Date:** 2026-03-09

---

## Philosophy

Build a simple, impressive MVP. No over-engineering. Three core flows connected together:
1. Create a Job → Add Candidates
2. Run configurable Interview Stages (HR → Technical → Final)
3. Hire or Reject

---

## 1. Core Flow

```
Job Request → Add Candidates → HR Interview → Technical Interview → Final Interview → Hired / Rejected
```

- A **Job** is created (e.g., "Senior Developer")
- **Candidates** are added to that Job
- Adding a candidate to a job automatically makes them eligible for **Stage 1 (HR Interview)**
- Each stage is a configurable interview with questions and rating options
- Passing a stage moves the candidate to the next one
- The Final Interview (CEO approval) is typically 1 question: Hired or Not

---

## 2. User Roles

Only **two system roles**. Keep it simple.

| Role | Can Do |
|------|--------|
| **Admin** | Everything — manage users, configure stages/questions/options, create jobs, conduct any interview |
| **User** | Create jobs, add candidates, conduct interviews assigned to their stages |

- Self-registration + Admin approval (same as before)
- Admin assigns role at approval time

---

## 3. Modules

### 3.1 Job Management

- Create a Job with: **Title**, **Description** (optional), **Status** (Open / Closed)
- View list of all Jobs with status filter
- Open a Job to see its candidates and their progress through the pipeline

### 3.2 Candidate Management

- Add a Candidate: **Full Name**, **Email**, **Phone**, **CV Link** (URL, optional)
- Candidates are added directly to a Job (no standalone candidate pool in MVP)
- When a candidate is added to a job, their stage is automatically set to the first active interview stage
- View candidate pipeline per job (which stage each candidate is at)

### 3.3 Interview Configuration (Admin)

Admin configures the interview pipeline in Settings:

**Stages** — Admin defines interview stages in order. Default:
1. HR Interview
2. Technical Interview
3. Final Interview

Each stage has:
- **Stage Name** (e.g., "HR Interview")
- **Sort Order** (determines pipeline sequence)
- **Active** (can be toggled off)

**Questions per Stage** — Admin adds questions to each stage:
- **Question Text** (e.g., "Communication Skills", "Technical Problem Solving", "Hire this candidate?")
- **Sort Order**
- **Active**

**Options per Question** — Admin defines the answer choices for each question:
- **Label** (e.g., "Below Expectations", "Meets Expectations", "Exceeds Expectations")
- **Value** (numeric score, e.g., 1, 2, 3)
- **Sort Order**

This makes everything flexible:
- HR Interview might have 5 questions, each with 3 options (Below / Meets / Exceeds)
- Final Interview might have 1 question with 2 options (Hired / Not Hired)
- Admin can add or remove questions and options at any time

### 3.4 Conducting an Interview

- User selects a candidate from the stage's queue
- The interview form shows all active questions for that stage
- For each question, the interviewer selects one option from the configured choices
- Optional **notes** per question
- Optional **overall notes** for the interview
- Interviewer submits with an **outcome**: Pass / Fail / On Hold
- **Pass** → candidate moves to the next stage
- **Fail** → candidate is marked Rejected
- **On Hold** → candidate stays at current stage for later review
- If the candidate passes the last stage → automatically marked **Hired**

### 3.5 Dashboard (Simple)

- Count of candidates per stage (pipeline view)
- Count by status: Active / Hired / Rejected / On Hold
- Recent interviews conducted

---

## 4. Pages

| Page | Description |
|------|-------------|
| `/login` | Login page |
| `/register` | Self-registration |
| `/dashboard` | Pipeline overview + recent activity |
| `/jobs` | List of all jobs |
| `/jobs/[id]` | Job detail — candidate list with pipeline status per candidate |
| `/jobs/[id]/candidates/new` | Add candidate to job |
| `/interviews/[stage]` | List of candidates ready for this stage |
| `/interviews/[stage]/[candidateId]` | Conduct interview form |
| `/settings/stages` | Admin — manage interview stages |
| `/settings/stages/[id]/questions` | Admin — manage questions + options for a stage |
| `/settings/users` | Admin — approve users, assign roles |
| `/settings/general` | Admin — app name, brand colors |

---

## 5. What's NOT in MVP

- No email notifications
- No file uploads (CV is a URL link only)
- No export / reports
- No calendar integration
- No offer management stage
- No reference / background checks
- No candidate portal
- No salary tracking
- No complex RBAC (just admin/user)
- No audit log (V2)

---

## 6. Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **PostgreSQL** via **Prisma ORM**
- **Tailwind CSS** + **shadcn/ui**
- **Auth**: Custom email/password (self-registration + admin approval)
- **Database Hosting**: Vercel Postgres (Neon)
- **Deployment**: Vercel
- **Repo**: https://github.com/aleymahmoud-ff/Rekru
