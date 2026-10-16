# AGENTS.md

## Stack

- **PHP 8.3+**, Laravel 13, Pest 4, Pint 1
- **React 19**, Inertia v3, Tailwind CSS v4 (via `@tailwindcss/vite`), TypeScript strict
- **Fortify v1** for auth (registration, 2FA, passkeys, email verification)
- **SQLite** is the default database (`database/database.sqlite`)
- **Database** driver for queue, cache, and session (default in `.env.example`)

## Architecture

```
resources/js/pages/          # Inertia page components
resources/js/layouts/        # app-layout, auth-layout, settings/layout
resources/js/components/     # shadcn-style UI (Radix UI + cva + tailwind-merge)
resources/js/actions/        # Wayfinder auto-generated → ESLint-ignored
resources/js/routes/         # Wayfinder auto-generated → ESLint-ignored
resources/js/wayfinder/      # Wayfinder runtime
app/Actions/Fortify/        # Fortify action classes
app/Http/Controllers/        # Controller classes
```

**Layout matching** (`resources/js/app.tsx`): `welcome` → no layout, `admin/*` → AdminLayout, `auth/*` → AuthLayout, `onboarding/*` → OnboardingLayout, `settings/*` → [AppLayout, SettingsLayout] (nested), default → AppLayout.

**SSR is enabled** (`config/inertia.php`). Build SSR bundle with `npm run build:ssr`.

## Commands

```bash
# Full dev environment (server + queue + logs + vite + gateways)
composer run dev

# Run all checks and tests (lint → format → types → tests)
composer run ci:check

# Run tests (runs pint --test first, then php artisan test)
composer test

# PHP formatting (REQUIRED after PHP changes)
vendor/bin/pint --dirty --format agent

# Single test
php artisan test --compact --filter=testName

# Frontend checks
npm run lint           # ESLint --fix
npm run lint:check     # ESLint check only
npm run format         # Prettier --write
npm run format:check   # Prettier --check
npm run types:check    # tsc --noEmit

# TypeScript route generation
php artisan wayfinder:generate
```

**`composer test` runs lint before tests.** CI uses `./vendor/bin/pest` directly — does NOT run lint first.

## Testing

- Use **Pest v4** syntax: `test()`, `it()`, `expect()`
- Create tests: `php artisan make:test --pest SomeFeatureTest` (no `Feature/` prefix)
- **`RefreshDatabase` is auto-applied globally** to Feature tests via `tests/Pest.php` — don't re-add it manually
- Use model **factories** in tests; check for custom states before manual setup
- Faker: follow existing convention — `$this->faker` or `fake()`
- `skipUnlessFortifyHas()` helper available on TestCase for Fortify-gated features
- `config/inertia.php` has `'ensure_pages_exist' => true` — Inertia assertions verify page components exist on disk
- Global test helpers in `tests/Pest.php`: 
  - `createWorkspaceMember(User $user, string $role = 'owner')`
  - `createProjectForWorkspace(Workspace $workspace, User $user, string $role = 'lead')`
  - `createTaskForProject(Project $project, User $reporter)`

## Key Gotchas

- **Tailwind v4** uses `@tailwindcss/vite` plugin, not PostCSS. No `tailwind.config.js`.
- **React Compiler** enabled via `babel-plugin-react-compiler` in `vite.config.ts`.
- **Wayfinder** generates `resources/js/actions/**` and `resources/js/routes/**` — use `@/actions/` and `@/routes/` imports instead of hardcoded URLs. Rerun `php artisan wayfinder:generate` after route/controller changes.
- ESLint **ignores** `resources/js/actions/**`, `resources/js/routes/**`, `resources/js/wayfinder/**`, `resources/js/components/ui/*`
- **`@/` alias** resolves to `resources/js/*` (see `tsconfig.json`)
- **`pnpm-workspace.yaml` exists** but `package-lock.json` is the lockfile — use **npm** (CI) or **bun** (local dev via `composer run dev`) — not pnpm
- App initialization (`resources/js/app.tsx`) auto-wraps all pages with SSR, i18n, SocketProvider, TooltipProvider — no manual wiring needed
- **`opencode.json`** is at the repo root, not `opencode/`. Contains MCP server config (`laravel-boost`).
- CI runs PHP 8.3/8.4/8.5 matrix on branches: develop, main, master, workos
- Frontend changes not showing: run `npm run build` or `composer run dev`
- Vite manifest errors: `npm run build` to regenerate
- Queue, cache, and session use **database** driver by default (see `.env.example`)

## Conventions

- Use `php artisan make:` commands with `--no-interaction` for all file creation
- Create factories and seeders alongside new models
- Check sibling files for existing patterns before creating new components
- Prefer named routes with `route()` helper over hardcoded URLs
- Use `search-docs` tool for version-specific Laravel/Inertia/Pest docs before code changes
- Only create documentation files if explicitly requested

## Gateways

Taska uses standalone Node.js gateways (separate from the main app):

- **realtime-gateway/** — Socket.IO for real-time board updates
- **whatsapp-gateway/** — WhatsApp notifications via whatsapp-web.js

Each gateway:
1. Requires `bun install` in its directory (already done via main `bun install` + individual gateway installs)
2. Needs environment variables set in its `.env` file:
   - `GATEWAY_PORT` (3002 for realtime, 3001 for whatsapp)
   - `LARAVEL_URL` (typically http://localhost:8000)
   - `LARAVEL_API_TOKEN` (matches token in Laravel `.env`)
3. Are started automatically by `composer run dev` (via `node --watch` commands)
4. Can be started manually with `npm start` in each gateway directory

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read these installed skill files directly (use these paths even if a same-named global skill exists):
- Core filter, always on: `antislop`: `.agents/skills/antislop/SKILL.md`
- UI / visual: `antislop-ui`: `.agents/skills/antislop-ui/SKILL.md`
Before starting, follow the core's "Two Usage Modes" section in strict order: explicit session instruction first, then global preference, then ask. A session instruction always wins. For a resolved mode, say `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once before presenting findings or making edits, using the actual mode and source. Acknowledging the user's request without naming the source does not replace this notice.
Only an explicit choice of antislop during or after selects a session mode. A request to review, audit, or avoid file edits does not select a mode; read the global preference in that case. Another skill's mode does not select antislop's mode.
If the mode is unresolved, ask during/after and end the response; wait for the answer before any UI review, planning, or concept. For read-only tasks, put the active-mode notice only at the start of the final answer, never in progress messages. For editing tasks, announce before the first edit and omit it from the final answer.
To update antislop later: `npx antislop-ai --update`, or run `npx antislop-ai` and pick Overwrite them.
<!-- antislop:end -->