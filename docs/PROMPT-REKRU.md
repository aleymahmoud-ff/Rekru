# UI Screenshot Mockup Prompt Kit — filled in for Rekru

The generic kit in `PROMPT.md`, completed for **Rekru**. Every value below is taken from
the real application (`src/app`, `src/components`, `prisma/schema.prisma`), so the
mockups use the product's actual vocabulary rather than invented labels.

---

## 0. The brief

```text
PRODUCT NAME:      Rekru
ONE-LINE PITCH:    Recruitment cycle management — every candidate scored against the
                   same questions, at every stage, with a full audit trail.
PRIMARY USER:      HR / recruitment admin running the hiring pipeline
DEMO PERSONA:      Layla Haddad, Admin
DEMO ORG/TENANT:   Wander

SCREENS (9):       Dashboard, Jobs, Job Detail, Add Candidate, Interviews,
                   Stage Queue, Conduct Interview, Analytics, Interview Stages

BRAND
  primary colour:  #1e3a5f   (navy — sidebar, primary buttons, headings)
  accent colours:  #e8913a amber (brand accent, active nav marker)
                   #3b82f6 blue   (Active status)
                   #059669 green  (Hired / Pass)
                   #dc2626 red    (Rejected / Fail)
                   #f59e0b orange (On Hold)
  neutrals:        page bg #f8f7f4 · card #ffffff · border #e8e5e0 ·
                   text #1a1a1a · muted #6b6560 · faint #9c9690 ·
                   inner surface #faf9f7 · hover #f0eeeb
  font:            Outfit (display/headings) + DM Sans (body/UI); tabular numerals
  corner radius:   12px cards (rounded-xl), 8px controls (rounded-lg)
  logo:            wordmark "Rekru" in white bold, followed by a 6px amber (#e8913a)
                   dot, on the navy sidebar

APP SHELL
  navigation:      left sidebar only — there is NO top bar (each page renders its own
                   PageHeader instead)
  nav items:       Dashboard · Jobs · Interviews    [main group]
                   Analytics                        [admin only, separated above]
                   SETTINGS ─ Interview Stages · User Management · General
                   footer: user avatar + name + role, "My Account", "Sign out"
  header shows:    nothing global — per page: 28px bold title, muted subtitle,
                   optional right-aligned action buttons

DEMO DATA (all fictional)
  jobs:            Senior Backend Engineer · Product Designer · Data Analyst ·
                   Customer Success Lead · Marketing Manager (Closed) ·
                   QA Engineer (Closed)
  candidates:      Nadia Farouk · Omar Bishara · Yasmin Tarek · Karim Nasser ·
                   Dina Halabi · Sami Rahal
  team:            Layla Haddad (Admin) · Hana Aziz (User) · Rami Sabbagh (User) ·
                   Tarek Mansour (User)
  stages:          HR Interview · Technical Interview · Culture Fit · Final Interview
  questions:       Communication Skills · Professionalism · Cultural Fit ·
                   Technical Knowledge · Problem Solving
  options:         Below Expectations (1) · Meets Expectations (2) ·
                   Exceeds Expectations (3)
  statuses:        Active · Hired · Rejected · On Hold  (candidates)
                   Open · Closed                        (jobs)
                   Pass · Fail · On Hold                (interview outcomes)
                   Pending · Active · Inactive          (users)
```

---

## 1. Master prompt

```text
You are a senior front-end engineer producing pixel-faithful HTML "screenshot" mockups
of a web app's screens, for use as marketing, portfolio and documentation images.

GOAL
Self-contained HTML pages that look like real, polished screenshots of a finished
product. Each page is a fixed 1920×1080 canvas, captured to PNG with headless Chrome.

HARD CONSTRAINTS
- Vanilla HTML + CSS + a little vanilla JS. No frameworks, no build tooling, no Tailwind
  or CDN runtime, no external requests of any kind at render time.
- EVERY file must be self-contained: all CSS in a <style> block, all JS in a <script>
  block, fonts as a safe system stack (or inlined base64 woff2), images as inline SVG or
  data: URIs. A screen must render correctly when that single file is opened on its own,
  in any folder.
- Icons: inline SVG paths (Lucide-style, 24×24 viewBox, stroke-width 2, round caps) via
  an SVG <symbol> sprite injected at the top of <body>; reference them with
  <svg class="icon"><use href="#i-name"/></svg>. No icon fonts, no icon libraries.
  Rekru uses Lucide, so match these exact glyphs: layout-dashboard, briefcase,
  clipboard-list, bar-chart-2, settings, users, palette, user-circle, log-out,
  file-text, upload, plus, pencil, check-circle-2, x-circle, clock, alert-circle,
  grip-vertical, trash-2.
- Charts: hand-built inline SVG — bars, funnels, donuts, progress bars — with
  coordinates computed for the exact card width. No chart libraries.
- Theme: light by default; a dark variant applied by adding class "dark" to the canvas
  element when the URL contains ?theme=dark. Define every colour as a CSS custom
  property on :root and override the same names under .dark — never hard-code a colour
  in a component rule.
- Viewing: a small script scales the fixed canvas DOWN to fit smaller browser windows
  (transform: scale, transform-origin: top left, resize listener), forces scale 1 when
  the window is at least the canvas size, and honours ?fit=off to force 1:1 for capture.
- The app shell (sidebar) must be identical on every screen. Generate it once in JS from
  a nav array and inject it around the page's single <main> element, driven by a data
  attribute on <body> (e.g. <body data-page="/dashboard">) that marks the active nav
  item. Never hand-write the shell into each page.

DESIGN SYSTEM (use exactly these values)
- Canvas: 1920×1080. Card radius 12px, control radius 8px. Base font size 14px.
- Font: "Outfit" for headings and numbers, "DM Sans" for body, each with a system
  fallback stack (-apple-system, "Segoe UI", Roboto, sans-serif). Tabular numerals for
  all figures.
- Light tokens:  page bg #f8f7f4 · card #ffffff · nav surface #1e3a5f ·
  inner surface #faf9f7 · text #1a1a1a · muted text #6b6560 · faint text #9c9690 ·
  border #e8e5e0
- Dark tokens:   page bg #14161a · card #1c1f24 · nav surface #16273d ·
  inner surface #22262d · text #f2f1ef · muted text #a8a49f · faint text #7d7975 ·
  border #2e333a
- Primary: #1e3a5f with #ffffff foreground. Brand accent #e8913a.
- Active nav item: background rgba(255,255,255,0.10), text #ffffff, and a 2px #e8913a
  left border. Inactive nav text rgba(255,255,255,0.60), transparent left border.
- Status pills — each is {text, tint background, border}:
    Active   #3b82f6 / #eff6ff / #bfdbfe
    Hired    #059669 / #ecfdf5 / #a7f3d0
    Rejected #dc2626 / #fef2f2 / #fecaca
    On Hold  #f59e0b / #fffbeb / #fde68a
  Interview outcomes reuse the same triple: Pass=green, Fail=red, On Hold=orange.
  "Edited" badges use the On Hold palette.
- Chart series in order: #1e3a5f, #e8913a, #3b82f6, #059669, #f59e0b. Gridlines barely
  visible. Lighten every series in dark mode.
- Depth: 1px #e8e5e0 borders plus a very soft shadow. No heavy drop shadows, no
  gradients, no glassmorphism, no rounded-pill everything.

APP SHELL (identical on every screen)
- Left sidebar, 240px, background #1e3a5f, fixed full height. Top: 64px logo row with
  "Rekru" in 20px white bold (Outfit) followed by a 6px #e8913a dot. Below it a
  1px rgba(255,255,255,0.10) divider.
- Nav list, 12px horizontal padding, items 8px/12px with a 4px gap between icon and
  label, 14px medium text:
    Dashboard (layout-dashboard) · Jobs (briefcase) · Interviews (clipboard-list)
    — 12px gap —
    Analytics (bar-chart-2)
    — 20px gap, then the label "SETTINGS" in 10px semibold uppercase, letter-spacing
      0.1em, rgba(255,255,255,0.35) —
    Interview Stages (settings) · User Management (users) · General (palette)
- Sidebar footer, above a divider: a 32px circular #e8913a avatar with white initials
  "LH", the name "Layla Haddad" in 14px white, the role "Admin" in 11px
  rgba(255,255,255,0.45); then "My Account" (user-circle) and "Sign out" (log-out) rows
  in rgba(255,255,255,0.50).
- There is NO top bar. Content area starts at x=240 and fills the rest, 24px padding,
  inner column capped at 1280px. Each screen opens with a page header: 28px bold title
  (#1a1a1a, Outfit), a 14px muted subtitle (#6b6560), and optional right-aligned
  actions, then 24px of space.

PRODUCT CONTEXT
Rekru is a recruitment cycle management app for a single organisation. Core concepts:
a JOB collects CANDIDATES; each candidate moves through ordered INTERVIEW STAGES; each
stage owns STAGE QUESTIONS; each question offers scored OPTIONS (Below Expectations=1,
Meets Expectations=2, Exceeds Expectations=3). An INTERVIEW records one answer per
question plus notes and an outcome — Pass advances the candidate to the next stage, Fail
rejects them, On Hold keeps them at the current stage for a re-interview. The last stage
is marked final and adds a separate hire decision. Questions are either universal (asked
for every job) or job-specific (linked to chosen jobs). Admins configure stages,
questions and users; non-admin users see only the jobs they are assigned to.

Demo tenant "Wander", signed-in persona "Layla Haddad, Admin".
Demo data to reuse consistently across every screen:
  jobs:       Senior Backend Engineer · Product Designer · Data Analyst ·
              Customer Success Lead · Marketing Manager (Closed) · QA Engineer (Closed)
  candidates: Nadia Farouk · Omar Bishara · Yasmin Tarek · Karim Nasser ·
              Dina Halabi · Sami Rahal
  team:       Layla Haddad (Admin) · Hana Aziz · Rami Sabbagh · Tarek Mansour
  stages:     HR Interview · Technical Interview · Culture Fit · Final Interview
All data is illustrative and fictional. Never invent a real company's name, logo or
customer. Use realistic, POPULATED data so the screens look like a system in daily use:
uneven numbers, full tables, a mix of statuses, at least one candidate on hold and one
rejected.

QUALITY BAR — a screen is done only when all of these hold
- Nothing is clipped and nothing overflows the canvas; no horizontal scrollbar.
- No large empty area at the bottom of a card. If a card looks sparse, add rows, or push
  a summary/footer to the bottom of it — do not leave dead space.
- Text uses real Rekru vocabulary, never lorem ipsum and never placeholder labels.
  Say "Interview Stages", not "Steps". "On Hold", not "Paused". "Job", not "Requisition".
- Numbers are internally consistent: the stage counts sum to the Active total; a job's
  hired + rejected + active + on hold equals its candidate count; pass rates match the
  bars; "Showing X of Y" matches the rows drawn.
- Light and dark both look deliberate; nothing disappears against its background.

OUTPUT
Return complete files, never snippets or diffs. For each screen, one self-contained
.html file. Also produce a short CATALOG.md with a paragraph per screen: what it shows,
and where it should be used in marketing.

Reply "ready" and wait for me to request the first screen — do not generate anything yet.
```

---

## 2. Per-screen prompts

### 1 — dashboard.html

```text
Now produce dashboard.html — the "Dashboard" screen.
Use the shared shell and design system, with <body data-page="/dashboard"> so
"Dashboard" is the active nav item.

Layout and content:
- Page header: title "Dashboard", subtitle "Welcome back, Layla".
- Row 1: five stat cards in one row, each an icon tile (soft tint) + label + big value:
  Open Jobs 4 (briefcase, #1e3a5f on #eef2f7) · Active 23 (#3b82f6 on #eff6ff) ·
  Hired 7 (#059669 on #ecfdf5) · Rejected 14 (#dc2626 on #fef2f2) ·
  On Hold 3 (#f59e0b on #fffbeb).
- Row 2: section heading "Candidates by Stage" (18px semibold), then four cards in a
  row, each with the stage name, a big count, and a thin progress bar showing its share:
  HR Interview 9 · Technical Interview 7 · Culture Fit 4 · Final Interview 3.
  These must sum to the Active total of 23.
- Row 3: section heading "Recent Interviews", then a card containing 8 rows. Each row:
  candidate name (medium) with the job title beneath in faint text; the stage name;
  the interviewer; a relative date ("2 days ago"); and a right-aligned outcome pill.
  Mix the outcomes — at least four Pass, two Fail, two On Hold — and give one row a
  small amber "Edited" badge next to the outcome.
- Pin a footer row to the bottom of the Recent Interviews card: "Showing 8 of 47
  interviews" in faint text on the left.

Fill the full canvas height — no dead space at the bottom of any card.
Return the complete self-contained file.
```

### 2 — jobs.html

```text
Now produce jobs.html — the "Jobs" screen. <body data-page="/jobs">.

- Page header: title "Jobs", subtitle "Manage open roles and track hiring progress",
  right-aligned primary button "+ New Job" (navy, white text, plus icon).
- A two-tab row beneath the header: "Open (4)" active, "Closed (2)" inactive.
  Active tab: navy text with a 2px navy underline; inactive: muted, no underline.
- A grid of four job cards, two per row. Each card:
    title (16px semibold) · muted one-line description ·
    a row of three inline mini-stats: Candidates, Hired, Conversion ·
    a horizontal segmented progress bar split by status colour (active / hired /
      rejected / on hold) ·
    a footer line "Created by Layla Haddad · 12 Mar 2026" in faint text, and a
      right-aligned "Open" status pill.
  Use: Senior Backend Engineer (9 candidates, 2 hired, 22%) ·
       Product Designer (6, 1, 17%) · Data Analyst (5, 2, 40%) ·
       Customer Success Lead (7, 0, 0%).
  Give Customer Success Lead a visible problem cue: 3 rejected, 0 hired, and an amber
  "2 on hold" note.
- Below the grid, a card "Recently Closed" listing the two closed jobs as compact rows
  with their final outcome ("Marketing Manager — 1 hired of 8", "QA Engineer — closed,
  no hire") and a grey "Closed" pill.

Fill the canvas. Return the complete self-contained file.
```

### 3 — job-detail.html

```text
Now produce job-detail.html — the "Job Detail" screen. <body data-page="/jobs">.

- Page header: title "Senior Backend Engineer", subtitle "Created by Layla Haddad ·
  12 Mar 2026", right-aligned: "Manage Team", "Edit", "Delete", a "Close Job" toggle,
  and a navy "+ Add Candidate" button.
- Row 1 — a "Job Performance" panel: four inline stats (Total 9 · Hired 2 · Rejected 3 ·
  Active 4) and, to the right, a compact horizontal funnel of the four stages with the
  count entering each (9 → 7 → 5 → 3).
- Row 2 — the candidate list, one card per candidate, each a header strip plus an
  interview history block:
    Header strip: name (medium) with "email · phone" in faint text beneath; on the right
    a "View CV" link with a file-text icon, an "Upload"/"Replace" control, the current
    stage name, a small trash icon, and a status pill.
    History block: one row per completed interview — stage name, outcome pill,
    interviewer, date, and for one of them an amber "Edited" badge.
  Show four candidates: Nadia Farouk (Active, at Final Interview, 3 interviews, all
  Pass) · Omar Bishara (On Hold, at Technical Interview, 2 interviews, last one On
  Hold) · Yasmin Tarek (Hired, 4 interviews) · Karim Nasser (Rejected, 2 interviews,
  last one Fail).

Fill the canvas; if space runs short, show three candidates fully rather than four
clipped. Return the complete self-contained file.
```

### 4 — add-candidate.html

```text
Now produce add-candidate.html — the "Add Candidate" form. <body data-page="/jobs">.

- Page header: title "Add Candidate", subtitle "Senior Backend Engineer".
- A single centred card, max 640px wide, containing a vertical form:
    Full name        [ Dina Halabi ]
    Email            [ dina.halabi@example.com ]
    Phone            [ +20 100 555 0142 ]
    CV (optional)    [ file input showing "dina-halabi-cv.pdf" chosen, with a muted
                       hint "PDF or Word document, up to 8 MB" ]
  Labels 12px medium above 40px inputs with 8px radius and a #e8e5e0 border.
- An inline info note above the buttons, in the On Hold palette: "This candidate will
  enter the pipeline at HR Interview, the first active stage."
- Footer: a muted "Cancel" link and a navy "Add Candidate" primary button, right
  aligned.
- To the right of the form card, a narrower side card "What happens next" listing the
  four stages as a vertical stepper with the first one highlighted.

Do not leave the lower half of the canvas empty — let the two cards sit in a centred
row that occupies the vertical middle, with generous but deliberate spacing.
Return the complete self-contained file.
```

### 5 — interviews.html

```text
Now produce interviews.html — the "Interviews" stage overview. <body data-page="/interviews">.

- Page header: title "Interviews", subtitle "Candidates waiting at each stage".
- Four large stage cards in a row. Each: stage name (18px semibold), a very large count
  of candidates waiting, a muted line "candidates waiting", and a right-pointing chevron
  in the corner. Counts: HR Interview 9 · Technical Interview 7 · Culture Fit 4 ·
  Final Interview 3.
  Give the Final Interview card a subtle navy tint to mark it as the final stage, plus a
  small "Final" badge.
- Below, a card "Your Queue" with 7 rows — candidate, job, stage, days waiting, and a
  navy "Start Interview" button on each row. Make two rows show "6 days" and "9 days" in
  amber to signal ageing.
- Pin a footer to that card: "Showing 7 of 23 waiting candidates".

Return the complete self-contained file.
```

### 6 — stage-queue.html

```text
Now produce stage-queue.html — the candidate queue for one stage.
<body data-page="/interviews">.

- Page header: title "Technical Interview", subtitle "7 candidates waiting", with a
  muted back link "← All stages" above the title.
- A table filling most of the canvas, columns: Candidate · Job · Entered stage ·
  Previous outcome · Interviewer · (action). Seven populated rows using the demo
  candidates, each action cell holding a navy "Interview" button.
  Previous outcome shows a Pass pill for most rows and an On Hold pill for one
  (Omar Bishara, re-interview).
- A right-hand side card, 320px, titled "Stage Questions" listing the five questions
  asked at this stage, each with its three scored options as small chips
  ("Below 1 · Meets 2 · Exceeds 3"). Mark one question with a small "Job-specific" badge.
- Table footer pinned to the card bottom: "Showing 7 of 7" and disabled pagination.

Return the complete self-contained file.
```

### 7 — conduct-interview.html

```text
Now produce conduct-interview.html — the interview scoring screen.
<body data-page="/interviews">.

- Page header: title "Interview: Nadia Farouk", subtitle "Technical Interview ·
  Senior Backend Engineer".
- Two-column layout. LEFT (≈2/3): the scoring form card containing five question blocks.
  Each block: the question text (15px medium), a row of three selectable option chips
  ("Below Expectations", "Meets Expectations", "Exceeds Expectations") with the chosen
  one filled navy and the others outlined, and a one-line notes field beneath with real
  text in two of the five blocks.
  Questions: Technical Knowledge (Exceeds) · Problem Solving (Exceeds) ·
  Communication Skills (Meets) · Code Quality (Meets, badged "Job-specific") ·
  System Design (Below).
  Then an "Overall Notes" textarea holding two lines of real feedback, and an outcome
  selector: three large radio cards Pass / Fail / On Hold with Pass selected and
  tinted green.
  Footer: muted "Cancel" and a navy "Submit Interview" button.
- RIGHT (320px, sticky): the candidate profile card — 56px circular navy avatar with
  initials, name, then labelled rows for Email, Phone, Job, Stage, Added date, and a
  "CV" row with a "View CV" link. Beneath it a compact "Interview History" card showing
  the two earlier stages with Pass pills and dates.

Fill the canvas. Return the complete self-contained file.
```

### 8 — analytics.html

```text
Now produce analytics.html — the "Analytics" screen. <body data-page="/analytics">.

- Page header: title "Analytics", subtitle "Pipeline performance, conversion rates, and
  rejection insights", right-aligned a job filter dropdown reading "All jobs".
- Row 1: five summary stat cards — Total Candidates 47 · Active 23 · Hired 7 ·
  Rejected 14 · On Hold 3. These must reconcile (23+7+14+3 = 47).
- Row 2 left (≈2/3): "Stage Funnel" — a horizontal funnel of four bars, each labelled
  with the stage, total interviews, and a pass rate percentage; the bar is split into
  pass (green) / fail (red) / on hold (orange) segments.
  HR Interview 41 interviews, 78% pass · Technical Interview 32, 66% ·
  Culture Fit 21, 81% · Final Interview 17, 59%.
- Row 2 right: "Job Performance" — a ranked list of five jobs with candidates, hired,
  and a conversion percentage with a small trend arrow.
- Row 3: "Rejection Drivers" — a table showing which answers most often precede a
  failure. Columns: Stage · Question · Answer · Count · % of failures.
  Six rows, e.g. Technical Interview / System Design / Below Expectations / 7 / 54%.
  Sort descending by count and make the percentages plausible against the fail counts
  implied by the funnel above.

Return the complete self-contained file.
```

### 9 — interview-stages.html

```text
Now produce interview-stages.html — the "Interview Stages" settings screen.
<body data-page="/settings/stages">.

- Page header: title "Interview Stages", subtitle "Configure the stages every candidate
  moves through", right-aligned navy "+ Add Stage" button.
- A single card listing the four stages as draggable rows. Each row: a grip-vertical
  handle, the order number in a small navy circle, the stage name (15px medium), three
  muted counts ("5 questions · 7 candidates · 32 interviews"), an Active/Inactive
  toggle, an edit pencil, and a delete trash icon.
  The Final Interview row is visually locked: a small navy "Final" badge, no grip
  handle, and the toggle and trash rendered disabled, with a muted note beneath:
  "The final stage cannot be deactivated, reordered or deleted."
- Below, a second card "Questions — HR Interview" showing that stage's five questions as
  rows: question text, a scope badge (Universal or Job-specific), the three scored
  options as chips, and edit/delete icons. Pin an "+ Add Question" ghost row to the
  bottom of the card.

Fill the canvas. Return the complete self-contained file.
```

---

## 3. Rekru-specific fix-up prompts

Beyond the generic ones in `PROMPT.md`:

```text
The vocabulary drifted. Use Rekru's exact terms: "Interview Stages" not "Steps",
"On Hold" not "Paused", "Job" not "Requisition" or "Position", "Candidates" not
"Applicants", "Pass / Fail / On Hold" for outcomes, "Universal / Job-specific" for
question scope, "Hired / Rejected / Active / On Hold" for candidate status.
```
```text
The numbers do not reconcile. Enforce: stage counts sum to the Active total; each job's
hired + rejected + active + on hold equals its candidate count; funnel pass/fail/on-hold
segments sum to that stage's interview total; rejection-driver counts do not exceed the
fail counts implied by the funnel.
```
```text
The sidebar is wrong. It is 240px, #1e3a5f, with no top bar anywhere in the product.
The active nav item takes a 2px #e8913a left border plus a 10% white background. The
SETTINGS group sits under a 10px uppercase label at 35% white.
```
```text
Add the audit trail. Rekru tracks who edited an interview and when — put a small amber
"Edited" badge on at least one interview row per screen that lists interviews.
```

---

## 4. Rendering

Unchanged from `PROMPT.md` §4. For this pack:

```powershell
$screens = "dashboard","jobs","job-detail","add-candidate","interviews",
           "stage-queue","conduct-interview","analytics","interview-stages"
foreach ($s in $screens) {
  foreach ($t in @("","-dark")) {
    $q = if ($t) { "?fit=off&theme=dark" } else { "?fit=off" }
    & "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=old --disable-gpu `
      --hide-scrollbars --force-device-scale-factor=1 --virtual-time-budget=3000 `
      --window-size=1920,1080 --screenshot="png\$s$t.png" `
      "file:///D:/Apps/Wander/rekru/mockups/$s.html$q"
  }
}
```

---

## 5. Suggested order for a case study

1. **dashboard** — the whole product at a glance
2. **conduct-interview** — the hardest problem solved: structured, scored, auditable
3. **analytics** — rejection drivers, the insight nobody gets from a spreadsheet
4. **job-detail** — depth per object
5. **interview-stages** — configurability and control

Three to five beats nine. Caption every image "Illustrative data".

---

## Accuracy notes

Two things to keep the mockups honest about what Rekru actually is:

1. **Single organisation.** Rekru is not multi-tenant — there is no tenant switcher, no
   organisation column in the header, and no super-admin panel. "Wander" is the only
   organisation; show it nowhere in the chrome. If a future mockup adds a tenant
   selector, the product no longer matches the picture.
2. **No exports, no email.** There is no CSV/Excel export, no report download, and no
   email notification. Do not draw an "Export" button on the Analytics screen or a
   "Notify candidate" action anywhere — every one of those would be a promise the app
   cannot keep.
