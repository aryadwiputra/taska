# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Taska

Open-source project management tool: Kanban boards, sprints, epics, approvals, automation rules, SLA policies, releases, goals/OKRs, a knowledge base, and cross-project views. Laravel 13 + Inertia v3 + React 19 SPA, with two standalone Node.js gateways for realtime and WhatsApp.

## Commands

```bash
# Full dev environment: server + queue + logs + vite + both gateways
composer run dev

# All checks + tests (pint --test → php artisan test)
composer test

# Full CI gate locally: lint:check + format:check + types:check + tests
composer run ci:check

# PHP only (what CI actually runs — no lint first)
./vendor/bin/pest

# Single test
php artisan test --compact --filter=testName

# PHP formatting — REQUIRED after any PHP change
vendor/bin/pint --dirty --format agent

# Frontend checks
bun run lint && bun run format && bun run types:check

# Regenerate Wayfinder TS route helpers after route/controller changes
php artisan wayfinder:generate
```

Local dev uses **bun** (`bun.lock` is the root lockfile). CI (`.github/workflows/`) uses `npm i` + `npm run build` + `./vendor/bin/pest` directly on PHP 8.3/8.4/8.5. Don't introduce a second JS package manager at the root.

## Architecture

### Domain hierarchy

```
Workspace (top-level org; members, settings, task types, priorities, labels)
└── Project (boards, sprints, epics, components, releases, goals, automation,
             approval flows, SLA policies, saved filters, notification rules)
    └── Board → BoardColumn (Kanban; tasks grouped by column, ordered by position)
    └── Task  ← Sprint, Epic, Release
```

`Task` is the core entity: assignees + watchers (many-to-many users), labels, components, comments, attachments, relations, activity log, and approvals. Task identity is `code` (`{PROJECT_KEY}-{task_number}`).

### Backend (`app/`)

- **`Services/`** holds business logic, not controllers. Key ones: `AutomationEngine` (trigger→condition→action rules), `NotificationRuleEngine` → `NotificationService` (event routing), `TaskBulkOperationService`, `TaskActivityService`, `MentionNotificationService`/`MentionParser`, `RealtimeGatewayService`, `WhatsAppGatewayService`, `SettingService` (typed workspace/project settings), `WorkspaceRoleService`.
- **`Support/Rbac.php`** is the authorization core. Roles live in `config/permissions.php`; workspace roles are `owner|admin|manager|member|viewer`, project roles are `lead|manager|developer|qa|member|viewer`. An explicit project role *restricts* what workspace permissions allow. Policies in `app/Policies/` delegate here.
- **`Http/Middleware/SetPermissionsTeamId`** sets the Spatie team id to the current workspace and is prepended before route-model binding — RBAC checks depend on it.
- **`Http/Middleware/HandleInertiaRequests`** defines all Inertia shared props: `auth.user`, `auth.notifications.unreadCount`, `workspaces`, `currentWorkspace` (resolved from the `current_workspace_id` session key), `sidebarOpen`. Add new globally-available props here.
- **Notifications** fan out through `NotificationRuleEngine` → `NotificationService` → channel classes in `app/Notifications/Channels/` (InApp, Mail, Discord, Slack, Telegram, Webhook, WhatsApp). In-app delivery also broadcasts over the realtime gateway.
- **`Jobs/`**: `CheckSlaBreachesJob` (hourly), `ProcessGitHubWebhookJob`, `SendWhatsAppNotification`. Scheduled tasks are in `bootstrap/app.php`.
- Controllers are organized by feature; `routes/web.php` is large — most features also have a dedicated controller (e.g. `BoardTaskReorderController`, `TaskSearchController`, `CrossProjectController`). `routes/knowledge.php` and `routes/api.php` register API-style routes.

### Frontend (`resources/js/`)

- **`app.tsx`** is the Inertia entry. Layout resolution is a `layout:` switch: `welcome` → none, `admin/*` → AdminLayout, `auth/*` → AuthLayout, `onboarding/*` → OnboardingLayout, `settings/*` → AppLayout + SettingsLayout, default → AppLayout. Providers wrap the app here: ErrorBoundary, SocketProvider, TooltipProvider, I18nextProvider, Toaster.
- **Wayfinder** generates typed helpers into `resources/js/actions/**` and `resources/js/routes/**` (plus `wayfinder/` runtime). Import from `@/actions/` / `@/routes/` instead of hardcoding URLs. These dirs are ESLint-ignored and must be regenerated, not edited.
- **`@/` aliases to `resources/js/*`** (`tsconfig.json` + `vite.config.ts`).
- UI is shadcn/ui + Radix + Lucide; tables use TanStack Table; drag-and-drop uses `@dnd-kit`; rich text/task embeds use TipTap. Tailwind v4 via `@tailwindcss/vite` — there is **no `tailwind.config.js`**.
- **i18n**: `resources/js/i18n/locales/{en,id}/translation.json`. Locale comes from `auth.user.locale` and is switched in `app.tsx`. Add strings to both locale files.
- `DESIGN.md` is the design system (colors, type scale, spacing, layout, status/priority colors). Consult it before building UI.

### Gateways

`realtime-gateway/` (Socket.IO, port 3002) and `whatsapp-gateway/` (whatsapp-web.js, port 3001) are standalone Node apps, each with its own `.env` (copy from its `.env.example`) and its own dependencies. Laravel talks to realtime via `RealtimeGatewayService::broadcast()` (bearer token, `POST /broadcast`); browsers authenticate the socket through Sanctum at `POST /api/socket/auth`. Both start automatically with `composer run dev`.

### Data & deployment

- SQLite in dev (`database/database.sqlite`), MySQL in production. Queue driver is `database`.
- `docs/architecture.md` has C4/ER/flow diagrams worth reading before large changes; `docs/github-integration.md` covers the GitHub flow.
- `deploy/` holds the production setup (PM2 `ecosystem.config.cjs`, `nginx.conf`, `supervisor-queue.conf`, `DEPLOY.md`).

## Testing

- **Pest v4** (`test()`, `it()`, `expect()`). Create with `php artisan make:test --pest SomeFeatureTest` (no `Feature/` prefix).
- **`RefreshDatabase` is applied globally to the `Feature` suite** via `tests/Pest.php` — do not add it per-file.
- `tests/Pest.php` provides helpers: `createWorkspaceMember($user, $role)`, `createProjectForWorkspace($workspace, $user, $role)` (creates a default board + Todo/Done columns), and `createTaskForProject($project, $reporter)`. Reuse these instead of hand-building fixtures.
- Use model factories; check for custom states before manual setup. `skipUnlessFortifyHas()` exists on `TestCase` for Fortify-gated features.
- `config/inertia.php` sets `ensure_pages_exist => true`, so Inertia assertions verify the page component exists on disk.

## Conventions

- Create files with `php artisan make:*` and `--no-interaction`; add factories/seeders alongside new models.
- Follow `CONTRIBUTING.md`: branches off `develop` (`feature/*`, `fix/*`, `release/*`); Conventional Commits (`feat(scope): ...`).
- Prefer named routes + `route()` server-side and Wayfinder helpers client-side.
- Check sibling files and existing components before creating new ones.
- Use Laravel Boost MCP tools (`search-docs`, `database-query`, `database-schema`, `browser-logs`, `get-absolute-url`) over ad-hoc shell equivalents.
- Only create documentation files when explicitly requested.

===

=== foundation rules ===

# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to ensure the best experience when building Laravel applications.

## Foundational Context

This application is a Laravel application and its main Laravel ecosystems package & versions are below. You are an expert with them all. Ensure you abide by these specific packages & versions.

- php - 8.3
- inertiajs/inertia-laravel (INERTIA_LARAVEL) - v3
- laravel/fortify (FORTIFY) - v1
- laravel/framework (LARAVEL) - v13
- laravel/prompts (PROMPTS) - v0
- laravel/sanctum (SANCTUM) - v4
- laravel/socialite (SOCIALITE) - v5
- laravel/wayfinder (WAYFINDER) - v0
- laravel/boost (BOOST) - v2
- laravel/mcp (MCP) - v0
- laravel/pail (PAIL) - v1
- laravel/pint (PINT) - v1
- laravel/sail (SAIL) - v1
- pestphp/pest (PEST) - v4
- phpunit/phpunit (PHPUNIT) - v12
- @inertiajs/react (INERTIA_REACT) - v3
- react (REACT) - v19
- tailwindcss (TAILWINDCSS) - v4
- @laravel/vite-plugin-wayfinder (WAYFINDER_VITE) - v0
- eslint (ESLINT) - v9
- prettier (PRETTIER) - v3

## Skills Activation

This project has domain-specific skills available in `**/skills/**`. You MUST activate the relevant skill whenever you work in that domain—don't wait until you're stuck.

## Conventions

- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.

## Application Structure & Architecture

- Stick to existing directory structure; don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling

- If the user doesn't see a frontend change reflected in the UI, it could mean they need to run `npm run build`, `npm run dev`, or `composer run dev`. Ask them.

## Documentation Files

- You must only create documentation files if explicitly requested by the user.

## Replies

- Be concise in your explanations - focus on what's important rather than explaining obvious details.

=== boost rules ===

# Laravel Boost

## Tools

- Laravel Boost is an MCP server with tools designed specifically for this application. Prefer Boost tools over manual alternatives like shell commands or file reads.
- Use `database-query` to run read-only queries against the database instead of writing raw SQL in tinker.
- Use `database-schema` to inspect table structure before writing migrations or models.
- Use `get-absolute-url` to resolve the correct scheme, domain, and port for project URLs. Always use this before sharing a URL with the user.
- Use `browser-logs` to read browser logs, errors, and exceptions. Only recent logs are useful, ignore old entries.

## Searching Documentation (IMPORTANT)

- Always use `search-docs` before making code changes. Do not skip this step. It returns version-specific docs based on installed packages automatically.
- Pass a `packages` array to scope results when you know which packages are relevant.
- Use multiple broad, topic-based queries: `['rate limiting', 'routing rate limiting', 'routing']`. Expect the most relevant results first.
- Do not add package names to queries because package info is already shared. Use `test resource table`, not `filament 4 test resource table`.

### Search Syntax

1. Use words for auto-stemmed AND logic: `rate limit` matches both "rate" AND "limit".
2. Use `"quoted phrases"` for exact position matching: `"infinite scroll"` requires adjacent words in order.
3. Combine words and phrases for mixed queries: `middleware "rate limit"`.
4. Use multiple queries for OR logic: `queries=["authentication", "middleware"]`.

## Artisan

- Run Artisan commands directly via the command line (e.g., `php artisan route:list`). Use `php artisan list` to discover available commands and `php artisan [command] --help` to check parameters.
- Inspect routes with `php artisan route:list`. Filter with: `--method=GET`, `--name=users`, `--path=api`, `--except-vendor`, `--only-vendor`.
- Read configuration values using dot notation: `php artisan config:show app.name`, `php artisan config:show database.default`. Or read config files directly from the `config/` directory.

## Tinker

- Execute PHP in app context for debugging and testing code. Do not create models without user approval, prefer tests with factories instead. Prefer existing Artisan commands over custom tinker code.
- Always use single quotes to prevent shell expansion: `php artisan tinker --execute 'Your::code();'`
  - Double quotes for PHP strings inside: `php artisan tinker --execute 'User::where("active", true)->count();'`

=== php rules ===

# PHP

- Always use curly braces for control structures, even for single-line bodies.
- Use PHP 8 constructor property promotion: `public function __construct(public GitHub $github) { }`. Do not leave empty zero-parameter `__construct()` methods unless the constructor is private.
- Use explicit return type declarations and type hints for all method parameters: `function isAccessible(User $user, ?string $path = null): bool`
- Use TitleCase for Enum keys: `FavoritePerson`, `BestLake`, `Monthly`.
- Prefer PHPDoc blocks over inline comments. Only add inline comments for exceptionally complex logic.
- Use array shape type definitions in PHPDoc blocks.

=== deployments rules ===

# Deployment

- Laravel can be deployed using [Laravel Cloud](https://cloud.laravel.com/), which is the fastest way to deploy and scale production Laravel applications.

=== tests rules ===

# Test Enforcement

- Every change must be programmatically tested. Write a new test or update an existing test, then run the affected tests to make sure they pass.
- Run the minimum number of tests needed to ensure code quality and speed. Use `php artisan test --compact` with a specific filename or filter.

=== inertia-laravel/core rules ===

# Inertia

- Inertia creates fully client-side rendered SPAs without modern SPA complexity, leveraging existing server-side patterns.
- Components live in `resources/js/pages` (unless specified in `vite.config.js`). Use `Inertia::render()` for server-side routing instead of Blade views.
- ALWAYS use `search-docs` tool for version-specific Inertia documentation and updated code examples.
- IMPORTANT: Activate `inertia-react-development` when working with Inertia client-side patterns.

# Inertia v3

- Use all Inertia features from v1, v2, and v3. Check the documentation before making changes to ensure the correct approach.
- New v3 features: standalone HTTP requests (`useHttp` hook), optimistic updates with automatic rollback, layout props (`useLayoutProps` hook), instant visits, simplified SSR via `@inertiajs/vite` plugin, custom exception handling for error pages.
- Carried over from v2: deferred props, infinite scroll, merging props, polling, prefetching, once props, flash data.
- When using deferred props, add an empty state with a pulsing or animated skeleton.
- Axios has been removed. Use the built-in XHR client with interceptors, or install Axios separately if needed.
- `Inertia::lazy()` / `LazyProp` has been removed. Use `Inertia::optional()` instead.
- Prop types (`Inertia::optional()`, `Inertia::defer()`, `Inertia::merge()`) work inside nested arrays with dot-notation paths.
- SSR works automatically in Vite dev mode with `@inertiajs/vite` - no separate Node.js server needed during development.
- Event renames: `invalid` is now `httpException`, `exception` is now `networkError`.
- `router.cancel()` replaced by `router.cancelAll()`.
- The `future` configuration namespace has been removed - all v2 future options are now always enabled.

=== laravel/core rules ===

# Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using `php artisan list` and check their parameters with `php artisan [command] --help`.
- If you're creating a generic PHP class, use `php artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

### Model Creation

- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `php artisan make:model --help` to check the available options.

## APIs & Eloquent Resources

- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

## URL Generation

- When generating links to other pages, prefer named routes and the `route()` function.

## Testing

- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

## Vite Error

- If you receive an "Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest" error, you can run `npm run build` or ask the user to run `npm run dev` or `composer run dev`.

=== wayfinder/core rules ===

# Laravel Wayfinder

Use Wayfinder to generate TypeScript functions for Laravel routes. Import from `@/actions/` (controllers) or `@/routes/` (named routes).

=== pint/core rules ===

# Laravel Pint Code Formatter

- If you have modified any PHP files, you must run `vendor/bin/pint --dirty --format agent` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test --format agent`, simply run `vendor/bin/pint --format agent` to fix any formatting issues.

=== pest/core rules ===

## Pest

- This project uses Pest for testing. Create tests: `php artisan make:test --pest {name}`.
- The `{name}` argument should not include the test suite directory. Use `php artisan make:test --pest SomeFeatureTest` instead of `php artisan make:test --pest Feature/SomeFeatureTest`.
- Run tests: `php artisan test --compact` or filter: `php artisan test --compact --filter=testName`.
- Do NOT delete tests without approval.

=== inertia-react/core rules ===

# Inertia + React

- IMPORTANT: Activate `inertia-react-development` when working with Inertia React client-side patterns.

</laravel-boost-guidelines>

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read these installed skill files directly (use these paths even if a same-named global skill exists):
- Core filter, always on: `antislop`: `.claude/skills/antislop/SKILL.md`
- UI / visual: `antislop-ui`: `.claude/skills/antislop-ui/SKILL.md`
Before starting, follow the core's "Two Usage Modes" section in strict order: explicit session instruction first, then global preference, then ask. A session instruction always wins. For a resolved mode, say `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once before presenting findings or making edits, using the actual mode and source. Acknowledging the user's request without naming the source does not replace this notice.
Only an explicit choice of antislop during or after selects a session mode. A request to review, audit, or avoid file edits does not select a mode; read the global preference in that case. Another skill's mode does not select antislop's mode.
If the mode is unresolved, ask during/after and end the response; wait for the answer before any UI review, planning, or concept. For read-only tasks, put the active-mode notice only at the start of the final answer, never in progress messages. For editing tasks, announce before the first edit and omit it from the final answer.
To update antislop later: `npx antislop-ai --update`, or run `npx antislop-ai` and pick Overwrite them.
<!-- antislop:end -->
