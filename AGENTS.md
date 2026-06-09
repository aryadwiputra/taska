# AGENTS.md

## Stack & versions

- **PHP 8.3**, Laravel 13, Pest 4, Pint 1
- **React 19**, Inertia v3, Tailwind CSS v4 (via `@tailwindcss/vite`), TypeScript strict
- **Fortify v1** for auth (registration, 2FA, passkeys, email verification)
- **SQLite** is the default database (`database/database.sqlite`)
- Font: Instrument Sans loaded via Bunny CDN in Vite config

## Architecture

```
resources/js/pages/          # Inertia page components (not Pages/)
resources/js/layouts/        # app-layout, auth-layout, settings/layout
resources/js/components/     # shadcn-style UI (Radix UI + cva + tailwind-merge)
resources/js/actions/        # Wayfinder auto-generated → ESLint-ignored
resources/js/routes/         # Wayfinder auto-generated → ESLint-ignored
resources/js/wayfinder/      # Wayfinder runtime
app/Actions/Fortify/         # Fortify action classes
app/Http/Controllers/        # Controller classes
```

**Layout matching** (`resources/js/app.tsx:14`): `welcome` → no layout, `auth/*` → AuthLayout, `settings/*` → [AppLayout + SettingsLayout], default → AppLayout.

**SSR is enabled** (`config/inertia.php:18`). Build SSR bundle with `npm run build:ssr`.

## Commands

```bash
# Full dev environment (server + queue + logs + vite)
composer run dev

# Run all checks and tests (lint→format→types→tests)
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
- Create tests: `php artisan make:test --pest SomeFeatureTest` (no `Feature/` prefix in name)
- **`RefreshDatabase` is NOT auto-applied.** Must add `->use(RefreshDatabase::class)` per test or per file
- Use model **factories** in tests; check for custom states before manual setup
- Faker: follow existing convention — `$this->faker` or `fake()`
- `skipUnlessFortifyHas()` helper available on TestCase for features gated behind Fortify config
- `config/inertia.php` has `'ensure_pages_exist' => true` — Inertia assertions verify page components exist on disk

## Key gotchas

- **Tailwind v4** uses `@tailwindcss/vite` plugin, not PostCSS. No `tailwind.config.js`.
- **React Compiler** enabled via `babel-plugin-react-compiler` in `vite.config.ts`.
- **Wayfinder** generates `resources/js/actions/**` and `resources/js/routes/**` — use `@/actions/` and `@/routes/` imports instead of hardcoded URLs. Rerun `php artisan wayfinder:generate` after route/controller changes.
- ESLint **ignores** `resources/js/actions/**`, `resources/js/routes/**`, `resources/js/wayfinder/**`, `resources/js/components/ui/*` — don't lint generated shadcn files.
- **`@/` alias** resolves to `resources/js/*` (see `tsconfig.json:112`).
- **pnpm-workspace.yaml** exists but `package-lock.json` is the lockfile — use **npm**, not pnpm.
- **PHP 8.3+**: Use constructor property promotion, typed properties, enum TitleCase keys.
- CI runs PHP 8.3/8.4/8.5 matrix; branches: develop, main, master, workos.
- If a frontend change doesn't appear, the user may need to run `npm run build` or `composer run dev`.
- Vite manifest errors: `npm run build` or `npm run dev` to regenerate.

## Conventions

- Use `php artisan make:` commands with `--no-interaction` for all file creation
- Create factories and seeders alongside new models
- Check sibling files for existing patterns before creating new components
- Prefer named routes with `route()` helper over hardcoded URLs
- Use `search-docs` tool for version-specific Laravel/Inertia/Pest docs before code changes
- Do not create verification scripts or tinker when tests cover that functionality
- Only create documentation files if explicitly requested
