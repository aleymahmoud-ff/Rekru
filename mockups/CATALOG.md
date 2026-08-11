# Rekru screenshot mockups — catalog

Nine screens, each a self-contained HTML file rendered to PNG at 1920×1080 in light and
dark. All data is fictional and illustrative. Caption every published image
**"Illustrative data."**

```
mockups/
  src/app.css          design tokens + components   (single source of styling)
  src/shell.js         icon sprite, sidebar, theme, fit-to-window scaling
  src/pages/*.html     one fragment per screen (a single <main>)
  build.js             inlines CSS + JS into each screen  → node build.js
  shoot.sh             renders all 18 PNGs               → bash shoot.sh
  *.html               the shipped self-contained files
  png/*.png            light and -dark renders
```

Change a colour in `src/app.css` or a nav label in `src/shell.js`, then
`node build.js && bash shoot.sh` — all nine screens regenerate in about a minute.

---

## The screens

**dashboard** — The whole product at a glance: five status counters, the active pipeline
split across four stages, and eleven recent interviews with outcome pills and an "Edited"
badge. *Lead with this one.* It is the shot that says "this is a system in daily use".

**jobs** — Scale and portfolio view. Four open roles as cards, each with candidate count,
hires, conversion, a status-segmented bar, and its own active-by-stage breakdown; two
closed roles summarised below. Customer Success Lead deliberately shows a role in
trouble — 0% conversion, 3 rejected, 2 on hold. Use where you need to show breadth.

**job-detail** — Depth per object. A performance panel with a stage funnel, then four
candidates each showing their full interview history: outcomes, interviewers, dates, an
"Edited" badge, a hire decision, and a rejection reason. The clearest single image of the
audit trail.

**add-candidate** — How little friction there is to get data in. A four-field form with a
CV upload, an inline note explaining which stage the candidate will enter, and a side
panel previewing the pipeline. Good for an onboarding or "getting started" section.

**interviews** — The interviewer's home. Four stage cards with waiting counts and question
counts, then a queue of seven candidates sorted by longest waiting, with two ageing
entries flagged amber. Use when the audience is the person doing interviews, not running
them.

**stage-queue** — One stage in depth. Seven candidates waiting with their previous
outcome, plus that stage's five scored questions, what each outcome does, and the five
most recently completed interviews. Shows the loop closing.

**conduct-interview** — *The hardest problem solved.* Five questions each scored on a
three-point scale, notes per answer, overall notes, and a Pass/Fail/On Hold outcome — with
the candidate's profile, CV link, prior stages and running scores alongside. This is the
image that distinguishes Rekru from a spreadsheet. **Use it second, right after the
dashboard.**

**analytics** — The insight no spreadsheet gives you. A four-stage funnel split
pass/fail/on-hold, job performance ranked by conversion with time-to-hire, and a
rejection-drivers table showing which specific answers precede failure — System Design
explains every technical rejection. Strong third image.

**interview-stages** — Maturity and control. The pipeline as reorderable rows with the
final stage locked, the question set for one stage with scope badges and scored options,
and a log of recent configuration changes. Use for buyers who ask "can we change it?"

---

## Suggested order for a case study

1. **dashboard** — the whole product
2. **conduct-interview** — structured, scored, auditable
3. **analytics** — rejection drivers
4. **job-detail** — depth and history
5. **interview-stages** — configurability

Three to five beats nine. Pair light and dark of the same screen rather than showing two
unrelated screens.

---

## Numbers, and how they reconcile

Every figure across all nine screens comes from one consistent dataset. If you edit one,
edit its dependants.

| | |
|---|---|
| Candidates | 47 = 23 active + 7 hired + 14 rejected + 3 on hold |
| Active by stage | HR 9 + Technical 7 + Culture Fit 4 + Final 3 = 23 |
| Jobs | 6 (4 open, 2 closed) — 12 + 10 + 8 + 8 + 5 + 4 = 47 |
| Interviews | 38 + 23 + 14 + 8 = 83 conducted |
| Failures | 6 + 4 + 3 + 1 = 14 = the rejected count |
| Hires | 7 passes at Final Interview = 7 hired |
| Per-job stage splits | sum per stage to 9 / 7 / 4 / 3 |

The rejection-driver counts never exceed the failures at their stage, and each percentage
is that count over that stage's failures.

---

## Rendering

```bash
node build.js     # inline CSS/JS into the nine .html files
bash shoot.sh     # 18 PNGs into png/  (light + dark, exactly 1920×1080)
```

`--headless=old` gives an exact viewport; the newer headless mode subtracts window chrome
and letterboxes the image. `?fit=off` forces 1:1; without it the page scales to the
window. For retina, add `--force-device-scale-factor=2` for 3840×2160.

For the web, export ~1600px WebP and keep the PNG for decks. Render a dedicated 1200×630
crop for social rather than letting a platform squash the 16:9.

---

## Fidelity notes

Taken from the real application, not invented: the colour tokens, the status and outcome
palettes, the sidebar at 240px on `#1e3a5f` with a 2px `#e8913a` active marker, the nav
labels and their grouping, the 28px page title over a muted subtitle, Outfit/DM Sans, the
Lucide icon set, and the 1–3 scored options.

Two deliberate departures, both to keep the mockups honest:

1. **No top bar and no tenant switcher.** Rekru has neither — the sidebar carries the user
   card and each page renders its own header. Rekru is single-organisation, so nothing in
   the chrome names an organisation.
2. **No Export button, no email actions.** Neither exists in the product. Adding one to
   the Analytics screen would be a promise the app cannot keep.

One departure for composition: **add-candidate** centres its two cards vertically rather
than stretching them. A four-field form has no honest way to fill 1080px, and stretching
it leaves hollow cards — which the quality bar forbids.
