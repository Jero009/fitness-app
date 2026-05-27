# AI Agent Context

## Quick Commands
- Dev server: `npm run dev`
- Lint: `npm run lint`
- Unit tests: `npm run test:unit -- --run`
- Build: `npm run build`

## Key Entry Points
- `src/main.ts` — app bootstrap + DB init
- `src/router/index.ts` — router assembly
- `src/features/gym/routes.ts` — tab + detail routes
- `src/shared/db/app_db.ts` — local SQLite API

## Structure & Conventions
- Feature‑first: `src/features/<feature>/...`
- Shared utilities: `src/shared/...`
- Path alias: `@/` points to `src/`
- UI pages use local Vue state (no global store)

## Platform Constraints
- SQLite is unavailable on web; DB calls should tolerate empty results.
- Import/export uses Capacitor FileSystem + Share (native only).

## Common Pitfalls
- Style leakage: use scoped styles in feature flow pages.
- Rest timer state: stored in `sessionStorage`.
