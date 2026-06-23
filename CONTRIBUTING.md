# Contributing to Qeerja

Thank you for considering contributing to Qeerja.

## Branch Convention

- `develop` — default branch, integration for active work
- `feature/*` — new features (e.g., `feature/dark-mode`)
- `fix/*` — bug fixes (e.g., `fix/board-drop-zone`)
- `release/*` — release preparation

All branches should be created from `develop` and merged back via pull request.

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `chore`, `perf`, `ci`.

Examples:

```
feat(board): add swimlane grouping by assignee
fix(auth): handle expired 2FA session gracefully
refactor(tasks): extract comment logic into hook
test(sprint): add burndown chart calculation tests
```

## Pull Request Process

1. Create a branch from `develop` following the naming convention.
2. Make your changes and commit following the commit convention.
3. Ensure all checks pass locally:
   ```bash
   composer run ci:check
   ```
4. Push your branch and open a PR against `develop`.
5. Ensure the CI (lint + tests) passes on GitHub.
6. Request a review from a maintainer.

## Coding Standards

- **PHP**: Follow Laravel conventions. Run Pint before committing: `vendor/bin/pint --dirty`.
- **JavaScript/TypeScript**: Run `npm run lint` and `npm run format` before committing.
- **TypeScript**: Run `npm run types:check` — strict mode is enabled.
- **Tests**: Write tests for new functionality using Pest syntax.
- **WhatsApp Gateway**: Code lives in `whatsapp-gateway/`. Run `npm run format` and `npm run lint:check` inside that directory before committing.

## Internationalization

- All user-facing strings must use `t()` from `react-i18next`.
- Add EN keys to `resources/js/i18n/locales/en/translation.json`.
- Add ID keys to `resources/js/i18n/locales/id/translation.json`.

## Questions?

Open a [Discussion](https://github.com/aryadwiputra/qeerja/discussions) on GitHub.
