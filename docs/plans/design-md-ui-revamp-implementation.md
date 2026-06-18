# Design.md UI Revamp Implementation Plan

## Goal

Melanjutkan revamp UI Qeerja berdasarkan `design.md` sampai seluruh aplikasi konsisten dengan arah Notion-like:

- Warm canvas `#f6f5f4`
- White/dark surface cards
- Clean Inter typography
- Rounded soft `8px`, `12px`, `16px`, pill CTA
- Hairline border `#e6e6e6`
- Soft layered shadows
- Primary blue `#0075de` sebagai satu-satunya warna action utama
- Sticker colors hanya untuk dekorasi/status kecil, bukan CTA
- Tetap support light mode dan dark mode

## Current State

### Sudah Selesai

- Global design token light/dark di `resources/css/app.css`.
- Primary progress Inertia sudah memakai blue.
- Shadcn primitives awal sudah direvamp:
  - `button`
  - `card`
  - `input`
  - `badge`
  - `table`
  - `tabs`
  - `dialog`
  - `sheet`
  - `sidebar`
- App shell sudah mulai Notion-like:
  - warm canvas
  - white/dark sidebar
  - topbar slim
  - active nav primary blue
- Pilot pages sudah diubah:
  - `welcome.tsx`
  - `dashboard.tsx`
  - dashboard widgets
  - `workspaces/index.tsx`
  - `projects/index.tsx`
  - `projects/show.tsx`
  - `projects/board.tsx`
  - `projects/backlog/index.tsx`
  - `projects/settings.tsx`
- i18n runtime issue sudah diperbaiki:
  - locale JSON sekarang bundled statically
  - Vite React dedupe ditambahkan

### Masih Perlu Dikerjakan

- Banyak page masih punya hardcoded color/status/shadow.
- Banyak halaman memakai local header pattern yang berbeda-beda.
- Empty state belum reusable.
- Data display belum seragam.
- Halaman kompleks belum semua direvamp.
- Auth/onboarding/admin/settings masih perlu polish.

## Design Rules From `design.md`

### Color

| Role | Value | Usage |
|---|---|---|
| Canvas | `#f6f5f4` | Main app background light mode |
| Surface | `#ffffff` | Cards, panels, forms |
| Primary | `#0075de` | Primary action, links, active/focus |
| Primary Active | `#005bab` | Pressed/active action |
| Hairline | `#e6e6e6` | Borders/dividers |
| Ink | near-black | Primary text |
| Muted | `#615d59` | Supporting text |
| Faint | `#a39e98` | Placeholder/caption |
| Secondary/Night | `#213183` | Welcome/marketing hero only |
| Sticker palette | sky/purple/pink/orange/teal/green | Decoration/status accents only |

### Typography

- Use Inter as NotionInter substitute.
- Headings: heavy `700`, tight tracking.
- Body: regular `400`, comfortable line-height.
- Avoid decorative font families.
- Avoid heavy body text.
- Use page title pattern consistently.

### Shape

| Token | Value | Usage |
|---|---|---|
| xs | `4px` | inputs, small chips |
| sm | `5px` | rows, small menu items |
| md | `8px` | utility buttons/nav rows |
| lg | `12px` | cards |
| xl | `16px` | large panels |
| full | `9999px` | CTA pills, badges |

### Elevation

- Default cards: hairline border, no shadow.
- Raised/floating cards: soft layered shadow only.
- Dialogs/popovers: elevated shadow.
- Avoid `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl` unless replaced by tokenized soft shadow.

## Implementation Phases

## Phase 1: Reusable UI Patterns

### Objective

Create reusable primitives for repeated page structures so later page refactors are faster and consistent.

### Files To Add/Update

- `resources/js/components/page-header.tsx`
- `resources/js/components/empty-state.tsx`
- `resources/js/components/surface-section.tsx` if needed
- `resources/js/components/ui/alert.tsx`
- `resources/js/components/ui/skeleton.tsx`
- Existing page files using repeated headers/empty states

### Components

#### `PageHeader`

Purpose:

- Standardize page title, back link, description, badges, and actions.

API idea:

```tsx
<PageHeader
  title="Backlog"
  description="12 tasks not assigned to any sprint"
  backHref={...}
  backLabel="Project"
  actions={<Button>New task</Button>}
/>
```

Rules:

- Title: `text-3xl font-bold tracking-[-0.03em]`
- Description: muted, max width, relaxed line height
- Actions: primary CTA blue or outline utility
- Back link: muted text, hover foreground

#### `EmptyState`

Purpose:

- Standardize no-data states.

API idea:

```tsx
<EmptyState
  icon={Layers}
  title="Backlog is empty"
  description="Create tasks to add them to the backlog."
  action={<Button>Create task</Button>}
/>
```

Rules:

- Dashed hairline border
- Card/surface background
- Soft rounded `xl`
- Muted icon
- Optional blue CTA only

#### `SurfaceSection`

Purpose:

- Standardize grouped sections that are not full `Card`.

Rules:

- `rounded-lg border border-border bg-card`
- Optional header/body/footer slots
- No heavy shadow by default

### Acceptance Criteria

- Reusable components are used in at least:
  - Dashboard
  - Projects index
  - Workspaces index
  - Backlog
  - Project settings
- No business logic changes.
- Lint/types/build pass.

## Phase 2: Page Header + Empty State Rollout

### Objective

Replace duplicate page headers and local empty state markup across primary pages.

### Target Files

- `resources/js/pages/dashboard.tsx`
- `resources/js/pages/workspaces/index.tsx`
- `resources/js/pages/workspaces/show.tsx`
- `resources/js/pages/workspaces/settings.tsx`
- `resources/js/pages/projects/index.tsx`
- `resources/js/pages/projects/show.tsx`
- `resources/js/pages/projects/backlog/index.tsx`
- `resources/js/pages/projects/board.tsx`
- `resources/js/pages/projects/settings.tsx`
- `resources/js/pages/projects/activity/index.tsx`
- `resources/js/pages/notifications/index.tsx`
- `resources/js/pages/my-tasks.tsx`
- `resources/js/pages/tasks/search.tsx`

### Tasks

- Replace local header markup with `PageHeader`.
- Replace no-data blocks with `EmptyState`.
- Normalize max width:
  - `max-w-7xl` for normal pages
  - `max-w-[1600px]` for board/timeline-style wide pages
  - `max-w-4xl` for settings/form pages
- Ensure responsive action layout stacks on mobile.

### Acceptance Criteria

- Page headers look consistent in light/dark.
- Empty states look consistent and calm.
- Primary blue only appears on actual action/focus/link.

## Phase 3: Complex Project Pages

### Objective

Finish high-use product pages with Notion-like surface system.

### Target Files

- `resources/js/pages/projects/tasks/show.tsx`
- `resources/js/components/task-detail-drawer.tsx`
- `resources/js/components/task-create-dialog.tsx`
- `resources/js/components/task-comment.tsx`
- `resources/js/pages/projects/sprints/show.tsx`
- `resources/js/pages/projects/sprints/report.tsx`
- `resources/js/pages/projects/workload.tsx`
- `resources/js/pages/projects/releases/index.tsx`
- `resources/js/pages/projects/components/index.tsx`
- `resources/js/pages/projects/labels/show.tsx`
- `resources/js/pages/projects/epics/show.tsx`

### Tasks

- Normalize cards/panels to `bg-card border-border rounded-lg`.
- Replace heavy shadows with `shadow-soft` or `shadow-elevated`.
- Standardize metadata rows/chips.
- Keep status/priority colors small and decorative.
- Ensure task drawer opens and submits unchanged.
- Ensure sprint lifecycle buttons remain wired to existing routes.

### Acceptance Criteria

- Task detail/drawer visually matches app shell.
- Sprint/report pages use soft cards/tables.
- No route/form/props changes.
- Drag/drop and fetch logic unchanged.

## Phase 4: Automation, SLA, Approval, Reports

### Objective

Bring advanced feature pages into the same visual system.

### Target Files

- `resources/js/pages/projects/automation/index.tsx`
- `resources/js/pages/projects/settings/sla.tsx`
- `resources/js/pages/projects/settings/approvals.tsx`
- `resources/js/components/reports-tab.tsx`
- `resources/js/components/gantt-chart.tsx`
- `resources/js/components/charts/velocity-chart.tsx`
- `resources/js/components/notification-rules-tab.tsx`
- `resources/js/components/feature-guide.tsx`

### Tasks

- Standardize rule cards and settings panels.
- Replace yellow/blue toggle icon emphasis where possible with neutral + primary action.
- Keep semantic alert colors for actual status only.
- Refactor feature guide panel to match:
  - white/dark surface
  - soft border
  - calm text hierarchy
- Charts:
  - keep SVG/no new chart dependency
  - update colors to token-based primary + decorative palette
  - reduce overly bright status colors

### Acceptance Criteria

- Automation/SLA/approval pages feel like same app.
- No feature logic changes.
- Charts still render without dependency additions.

## Phase 5: Workspace, Goals, Cross-Project

### Objective

Polish workspace-level product surfaces.

### Target Files

- `resources/js/pages/workspaces/show.tsx`
- `resources/js/pages/workspaces/settings.tsx`
- `resources/js/pages/workspaces/create.tsx`
- `resources/js/pages/workspaces/goals/index.tsx`
- `resources/js/pages/workspaces/goals/show.tsx`
- `resources/js/pages/workspaces/cross-project/board.tsx`
- `resources/js/pages/workspaces/cross-project/timeline.tsx`

### Tasks

- Apply `PageHeader` and `EmptyState`.
- Normalize goal status badges.
- Update cross-project cards/lanes to use soft cards.
- Keep project/user colors as small decorative dots/avatar fills only.

### Acceptance Criteria

- Workspace-level pages match project-level pages.
- Goal/cross-project visual density remains readable.

## Phase 6: Auth, Onboarding, User Settings

### Objective

Make entry and account flows match the same design language.

### Target Files

- `resources/js/pages/auth/login.tsx`
- `resources/js/pages/auth/register.tsx`
- `resources/js/pages/auth/forgot-password.tsx`
- `resources/js/pages/auth/reset-password.tsx`
- `resources/js/pages/auth/confirm-password.tsx`
- `resources/js/pages/auth/two-factor-challenge.tsx`
- `resources/js/pages/auth/verify-email.tsx`
- `resources/js/pages/onboarding/index.tsx`
- `resources/js/components/onboarding/*`
- `resources/js/pages/settings/profile.tsx`
- `resources/js/pages/settings/security.tsx`
- `resources/js/pages/settings/notifications.tsx`
- `resources/js/pages/settings/appearance.tsx`

### Tasks

- Auth forms:
  - white/dark cards
  - compact inputs
  - blue primary CTA
  - no hardcoded green/red status blocks unless semantic
- Onboarding:
  - card-based step layout
  - calm progress/stepper
  - subtle sticker accents only
- Settings:
  - standard section cards
  - consistent success/error messages

### Acceptance Criteria

- Auth/onboarding flows visually match app.
- Passkeys/2FA logic unchanged.

## Phase 7: Admin Pages

### Objective

Update admin pages without making them visually disconnected.

### Target Files

- `resources/js/pages/admin/dashboard.tsx`
- `resources/js/pages/admin/users/index.tsx`
- `resources/js/pages/admin/workspaces/index.tsx`
- `resources/js/pages/admin/workspaces/show.tsx`
- `resources/js/layouts/admin-layout.tsx`

### Tasks

- Apply PageHeader.
- Normalize tables and admin stats.
- Keep admin badges semantic but restrained.
- Ensure admin layout inherits same canvas/surface tokens.

### Acceptance Criteria

- Admin feels like part of app, not separate default shadcn area.
- Tables are readable and dense.

## Phase 8: Hardcoded Style Cleanup

### Objective

Remove remaining style drift.

### Search Targets

- `bg-blue-`
- `text-blue-`
- `bg-green-`
- `text-green-`
- `bg-emerald-`
- `text-emerald-`
- `bg-red-`
- `text-red-`
- `bg-yellow-`
- `text-yellow-`
- `bg-amber-`
- `text-amber-`
- `shadow-md`
- `shadow-lg`
- `shadow-xl`
- `shadow-2xl`
- `rounded-[`
- inline `style={{ ... }}`

### Rules

- Keep inline style only for data-driven values:
  - progress width
  - Gantt positioning
  - project/label/epic color
  - SVG dimensions/coordinates
- Keep status colors only when semantic.
- Replace action colors with `primary`.
- Replace heavy shadows with `shadow-soft` or `shadow-elevated`.

### Acceptance Criteria

- No obvious default shadcn visual drift.
- No heavy shadow except intentional elevated overlays.
- No non-primary CTA color.

## Phase 9: Visual QA

### Objective

Verify consistency across light/dark mode and responsive breakpoints.

### Pages To Check

- Welcome
- Dashboard
- Workspaces index/show/settings
- Projects index/show
- Board
- Backlog
- Task detail drawer
- Project settings
- Automation
- SLA
- Approvals
- Sprint show/report
- Goals
- Admin users/workspaces
- Auth login/register
- Onboarding

### Checklist

- Light mode uses warm canvas, not clinical white full-page.
- Dark mode uses warm dark canvas, not pure black.
- Cards are white/dark surface with hairline.
- Primary action is blue.
- Secondary actions are white/outline/ghost.
- Tables and lists are readable.
- Empty states are consistent.
- Mobile layout stacks cleanly.
- No text contrast issues.
- No heavy shadow.
- No unexpected second accent for actions.

## Verification Commands

Run after every batch:

```bash
npm run format
npm run lint:check
npm run types:check
npm run build
php artisan test --compact
```

Run PHP formatting only if PHP changes are made:

```bash
vendor/bin/pint --dirty --format agent
```

## Risk Management

### Do Not Change

- Inertia route names or props.
- Laravel controller responses.
- Wayfinder route usage.
- Drag-and-drop behavior.
- Form submit logic.
- Fetch/router behavior.
- Auth/Fortify/passkey logic.
- Broadcast/Echo logic.
- Database/migrations.

### Allowed Changes

- Class names.
- Component composition for presentation.
- Reusable display components.
- Translation strings if visible UI copy changes.
- Tokenized CSS variables.
- Non-functional layout wrappers.

## Recommended Execution Order

1. Create `PageHeader` and `EmptyState`.
2. Roll them into dashboard/project/workspace pages.
3. Refactor complex project pages.
4. Refactor automation/SLA/approval/reports.
5. Refactor workspace/goals/cross-project.
6. Refactor auth/onboarding/settings.
7. Refactor admin.
8. Hardcoded style cleanup.
9. Final visual QA and full checks.

## Completion Definition

The revamp is complete when:

- All major pages use the same design system language.
- `design.md` tokens are reflected in global CSS and components.
- Light/dark mode both work.
- Primary blue is the only action color.
- Status/decorative colors are small and purposeful.
- No page feels like default shadcn.
- No business logic was changed.
- All verification commands pass.
