# User Stories — Rekru Access Control & Interview Flow

> Written: 2026-03-10

These stories walk through the full lifecycle of the system, from an admin setting up the workspace to users conducting interviews with limited or full access.

---

## Story 1 — Admin Sets Up the Workspace

**Actor:** Admin
**Goal:** Prepare the system before any hiring begins

1. Admin logs in and lands on the **Dashboard**.
2. Admin navigates to **Settings → Interview Stages** and creates the pipeline:
   - `HR Interview`
   - `Technical Interview`
   - `Final Interview`
3. For each stage, admin adds **questions** (e.g. "Communication Skills") and **answer options** (e.g. Excellent / Good / Needs Improvement).
4. Admin navigates to **Settings → User Management** and creates users:
   - `Sara (user)` — HR Interviewer
   - `Ahmed (user)` — Technical Interviewer
   - `Layla (admin)` — HR Manager (full access)
5. For **Sara**, admin clicks **Stages** → checks `HR Interview` → saves.
6. For **Ahmed**, admin clicks **Stages** → checks `Technical Interview` → saves.
7. Layla is admin — no stage restrictions needed.

---

## Story 2 — Admin Creates a Job and Assigns the Team

**Actor:** Admin
**Goal:** Open a job and bring the right interviewers onto it

1. Admin navigates to **Jobs** and clicks **New Job**.
2. Fills in: Title, Description, and any job-specific questions → saves.
3. The job appears in the **Open** tab.
4. Admin opens the job detail page and clicks **Team**.
5. In the Team dialog, admin checks **Sara** and **Ahmed** → clicks **Save Team**.
6. Sara and Ahmed can now see this job in their Jobs list.

---

## Story 3 — Admin Adds Candidates

**Actor:** Admin
**Goal:** Start the pipeline with applicants

1. Admin opens the job and clicks **Add Candidate**.
2. Fills in candidate details (name, email, CV link) → submits.
3. Candidate appears in the job's candidate list at **Stage 1 (HR Interview)**, status `active`.
4. Admin repeats for all candidates.

---

## Story 4 — Limited-Access User (Sara — HR Interviewer)

**Actor:** Sara
**Access:** Assigned to `HR Interview` stage only; assigned to this one job

**Goal:** Conduct HR interviews for candidates in her queue

1. Sara logs in and sees the **Dashboard** — it shows only the candidates and counts relevant to her access (HR Interview stage, her assigned job).
2. Sara navigates to **Jobs** — she sees only the one job she was assigned to (other jobs are hidden).
3. Sara opens the **Interviews** section and selects `HR Interview`.
4. She sees a list of candidates waiting at HR Interview for her job.
5. Sara clicks a candidate → lands on the **Conduct Interview** page.
6. She fills in answers for each question and chooses an outcome:
   - **Pass** → candidate moves to `Technical Interview`
   - **Fail** → candidate is marked `rejected`
   - **On Hold** → candidate stays at `HR Interview` for re-evaluation later
7. Sara submits. The candidate's pipeline updates immediately.
8. Sara **cannot** access the Technical Interview or Final Interview pages — `notFound()` is returned if she tries.
9. Sara **cannot** add candidates — she is not an admin.

---

## Story 5 — Limited-Access User (Ahmed — Technical Interviewer)

**Actor:** Ahmed
**Access:** Assigned to `Technical Interview` stage only; assigned to this one job

**Goal:** Conduct technical interviews after HR passes candidates forward

1. Ahmed logs in and lands on the **Dashboard** — shows counts for Technical Interview only.
2. Ahmed opens **Interviews → Technical Interview**.
3. He sees all candidates who passed HR Interview and are now at his stage.
4. Ahmed conducts an interview, fills in the scorecard, and picks an outcome:
   - **Pass** → candidate moves to `Final Interview`
   - **Fail** → candidate is `rejected`
   - **On Hold** → stays at Technical Interview
5. Ahmed **cannot** see HR Interview results (not in his stage access) and cannot access Final Interview.

---

## Story 6 — Full-Access User (Layla — HR Manager / Admin)

**Actor:** Layla (admin)
**Access:** Full access to all jobs, all stages, all candidates

**Goal:** Oversee the entire pipeline and manage edge cases

1. Layla logs in and sees the full **Dashboard** — all jobs, all stages, all candidates.
2. Layla navigates to **Jobs** and can see both Open and Closed jobs.
3. On any job detail page, Layla sees the **Job Performance Panel**:
   - Total / Active / Hired / Rejected / On Hold counts
   - Active candidates broken down by stage (e.g. "3 at HR Interview, 1 at Technical Interview")
   - Stage breakdown table with pass/fail/on-hold counts and pass rates
4. Layla can conduct interviews at **any** stage (not restricted by stage access).
5. Layla can re-interview a candidate who was previously put On Hold.
6. Layla can close a job once hiring is done → it moves to the **Closed → Completed** tab (if at least one candidate was hired).
7. Layla can manage the team on any job (add/remove interviewers).

---

## Story 7 — Re-Interview (On Hold Candidate)

**Actor:** Sara or Layla
**Goal:** Complete a deferred interview decision

1. A candidate was previously set to **On Hold** at HR Interview.
2. Sara (or Layla) opens **Interviews → HR Interview** and finds the candidate.
3. The **Re-interview** button is available (interview page pre-fills previous answers and notes).
4. Sara updates her assessment and submits with a new outcome.
5. The previous interview is marked as edited (updated timestamp + updatedBy recorded).

---

## Story 8 — Closing a Job

**Actor:** Admin
**Goal:** Mark a job as closed when hiring is done or cancelled

1. Admin opens the job detail page.
2. Clicks **Close Job** → job status changes to `closed`.
3. Job moves to **Closed** tab on the Jobs list.
4. If any candidate reached `hired`, the job appears under **Closed → Completed**.
5. If no candidate was hired, the job appears under **Closed → Pending**.
6. Closed jobs are read-only — no new candidates can be added.

---

## Story 9 — User Changes Their Password

**Actor:** Any authenticated user
**Goal:** Update their password after first login (admin set the initial password)

1. User clicks **My Account** in the sidebar (bottom of the nav).
2. Lands on `/settings/account` — Change Password form.
3. Enters current password, new password, and confirms new password.
4. Submits → on success, sees a green confirmation message.
5. On next login, the new password is required.

---

## Access Matrix Summary

| Feature                        | Admin | User (assigned) | User (not assigned) |
|-------------------------------|-------|-----------------|---------------------|
| See all jobs                  | ✅    | ❌ (own only)    | ❌                  |
| Add candidates                | ✅    | ❌              | ❌                  |
| Conduct interview (assigned stage) | ✅ | ✅            | ❌                  |
| Conduct interview (other stage) | ✅  | ❌              | ❌                  |
| View job performance panel    | ✅    | ✅ (assigned job) | ❌                 |
| Close / edit / delete jobs    | ✅    | ❌              | ❌                  |
| Manage team (job assignments) | ✅    | ❌              | ❌                  |
| Manage stage access           | ✅    | ❌              | ❌                  |
| Create users                  | ✅    | ❌              | ❌                  |
| Approve / deactivate users    | ✅    | ❌              | ❌                  |
| Change own password           | ✅    | ✅              | ✅                  |
