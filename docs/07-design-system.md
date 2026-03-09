# Rekru — Design System

**Version:** 1.0
**Date:** 2026-03-10
**Owner:** Tumtum (UI/UX Designer)

---

## Design Direction: "Warm Precision"

A recruitment app should feel trustworthy, organized, and human — not cold and corporate. We're going for **warm precision**: clean geometric layouts with warm tones, strong typographic hierarchy, and subtle depth through layered cards and soft shadows. The aesthetic is inspired by modern fintech dashboards — data-dense but breathable, professional but approachable.

**What makes it unforgettable:** The pipeline visualization. Candidates flow through stages as a horizontal kanban-style board with smooth transitions. Each stage has a distinct warm color accent. The interview form feels like filling out a premium survey — big readable options, satisfying selection states.

---

## Typography

**Display Font:** `Outfit` — geometric sans-serif with personality, used for headings and stats
**Body Font:** `DM Sans` — clean, highly readable, used for all body text and UI elements

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
```

### Scale
| Usage | Font | Size | Weight | Tailwind Class |
|-------|------|------|--------|----------------|
| Page title | Outfit | 28px | 700 | `font-display text-[28px] font-bold` |
| Section heading | Outfit | 20px | 600 | `font-display text-xl font-semibold` |
| Card title | DM Sans | 16px | 600 | `font-body text-base font-semibold` |
| Body text | DM Sans | 14px | 400 | `font-body text-sm` |
| Caption / label | DM Sans | 12px | 500 | `font-body text-xs font-medium` |
| Stats / numbers | Outfit | 36px | 800 | `font-display text-4xl font-extrabold` |

---

## Color Palette

### Core Colors (CSS Variables)

```css
:root {
  /* Configurable brand colors — loaded from app_settings */
  --color-primary: #1e3a5f;        /* Deep navy */
  --color-secondary: #f8f7f4;      /* Warm off-white */
  --color-accent: #e8913a;         /* Warm amber */

  /* Fixed system colors — not configurable */
  --color-background: #f8f7f4;     /* Warm paper white */
  --color-surface: #ffffff;        /* Card backgrounds */
  --color-surface-hover: #faf9f7;  /* Hover state */
  --color-border: #e8e5e0;         /* Warm gray border */
  --color-border-strong: #d4d0ca;  /* Stronger borders */

  --color-text-primary: #1a1a1a;   /* Near black */
  --color-text-secondary: #6b6560; /* Warm gray */
  --color-text-muted: #9c9690;     /* Lighter warm gray */

  /* Pipeline stage colors */
  --color-stage-hr: #3b82f6;       /* Blue */
  --color-stage-technical: #8b5cf6;/* Purple */
  --color-stage-final: #f59e0b;    /* Amber */

  /* Status colors */
  --color-active: #3b82f6;         /* Blue */
  --color-hired: #059669;          /* Emerald green */
  --color-rejected: #dc2626;       /* Red */
  --color-on-hold: #f59e0b;        /* Amber */
  --color-pending: #6b7280;        /* Gray */
}
```

### Dark/Light Rule
- MVP ships with **light theme only**
- Background is warm off-white (`#f8f7f4`), never pure white
- Cards are pure white with subtle warm-gray borders
- Admin-configurable colors (`--color-primary`, `--color-accent`) are injected as CSS variables from `app_settings`

---

## Spacing & Layout

- **Base grid**: 4px (Tailwind default)
- **Page padding**: `px-6 py-6` (24px)
- **Card padding**: `p-5` (20px)
- **Card gap**: `gap-4` (16px)
- **Section spacing**: `space-y-6` (24px)
- **Max content width**: `max-w-7xl mx-auto` (1280px)

### Sidebar Layout
```
┌──────────┬────────────────────────────────────────┐
│          │  Header (breadcrumb + user menu)        │
│ Sidebar  ├────────────────────────────────────────┤
│ (240px)  │                                        │
│ fixed    │  Main Content                          │
│          │  (max-w-7xl, px-6 py-6)                │
│ Logo     │                                        │
│ Nav      │                                        │
│ items    │                                        │
│          │                                        │
└──────────┴────────────────────────────────────────┘
```

- Sidebar: `w-60` (240px), dark background using `--color-primary`
- Nav items: white text, subtle left border accent on active
- Main content: warm off-white background

---

## Components

### Cards
```
- Background: white (`--color-surface`)
- Border: 1px solid `--color-border`
- Border radius: `rounded-xl` (12px)
- Shadow: `shadow-sm` (subtle)
- Hover: `shadow-md` transition (for clickable cards)
- Padding: `p-5`
```

### Buttons
```
Primary:    bg-[--color-primary] text-white rounded-lg px-4 py-2.5 font-medium
Secondary:  bg-white border border-[--color-border] text-[--color-text-primary] rounded-lg
Accent:     bg-[--color-accent] text-white rounded-lg
Danger:     bg-red-600 text-white rounded-lg
Ghost:      bg-transparent text-[--color-text-secondary] hover:bg-[--color-surface-hover]
```

### Status Badges
```
Active:    bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-0.5
Hired:     bg-emerald-50 text-emerald-700 border border-emerald-200
Rejected:  bg-red-50 text-red-700 border border-red-200
On Hold:   bg-amber-50 text-amber-700 border border-amber-200
Pending:   bg-gray-50 text-gray-600 border border-gray-200
```

### Pipeline Board
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ HR Interview│  │  Technical  │  │   Final     │
│ ──────────  │  │ ──────────  │  │ ──────────  │
│ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │
│ │ Ahmed M │ │  │ │ Sara K  │ │  │ │ Omar H  │ │
│ │ ● Active│ │  │ │ ● Active│ │  │ │ ● Active│ │
│ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │
│ ┌─────────┐ │  │             │  │             │
│ │ Layla A │ │  │             │  │             │
│ │ ● Active│ │  │             │  │             │
│ └─────────┘ │  │             │  │             │
└─────────────┘  └─────────────┘  └─────────────┘
  3 candidates    1 candidate      1 candidate
```

Each column has a top colored bar matching the stage color. Candidate cards inside are compact with name + status badge.

### Interview Rating Options
```
┌──────────────────────────────────────────────────────┐
│  Communication Skills                                │
│                                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │
│  │    Below     │ │    Meets    │ │   Exceeds   │    │
│  │ Expectations │ │ Expectations│ │ Expectations│    │
│  └─────────────┘ └─────────────┘ └─────────────┘    │
│                                                      │
│  Notes (optional)                                    │
│  ┌──────────────────────────────────────────────┐    │
│  │                                              │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

Options are large clickable cards, not radio buttons. Selected option gets a filled background with the accent color. Unselected options have a subtle border.

---

## Animations

Keep it **subtle and purposeful** — no gratuitous motion.

- **Page transitions**: Fade-in with `0.15s ease` (CSS only)
- **Card hover**: `shadow-sm → shadow-md` with `transition-shadow duration-200`
- **Pipeline cards**: Stagger entrance with `animation-delay` (0, 50ms, 100ms per card)
- **Status badge**: Subtle pulse on new status change
- **Interview option select**: Scale `1.02` + border color change with `transition-all duration-150`
- **Navigation**: Active indicator slides with `transition-all duration-200`

---

## Responsive Breakpoints

| Breakpoint | Layout |
|---|---|
| `≥ 1280px` | Full sidebar + content |
| `768px – 1279px` | Collapsed sidebar (icons only) + content |
| `< 768px` | Not prioritized for MVP (desktop/tablet focus) |

---

## Icon System

Use **Lucide React** icons (already bundled with shadcn/ui):
- Navigation: `LayoutDashboard`, `Briefcase`, `Users`, `Settings`, `LogOut`
- Status: `CheckCircle2`, `XCircle`, `Clock`, `Pause`
- Actions: `Plus`, `ChevronRight`, `Search`, `Filter`
- Pipeline: `ArrowRight`, `MoveRight`
