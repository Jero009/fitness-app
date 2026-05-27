# Architecture

## Overview
This app is an Ionic + Vue 3 client that runs as a Capacitor application. It is currently a single‑feature product (Gym) built on a local SQLite database, with no backend API. The UI is organized as a tabbed interface and uses feature‑first folders under `src/features/`.

## Runtime Stack
- **UI:** Ionic Vue (Vue 3 + Vue Router)
- **Build:** Vite
- **Native:** Capacitor plugins
- **Persistence:** SQLite (Capacitor community plugin)

## Feature Layout
- `src/features/gym` — all gym feature pages, components, routes, services, and types.
- `src/shared` — reusable utilities shared across features.

## App Entry Points
- `src/main.ts` — creates the Vue app and initializes the local database.
- `src/router/index.ts` — wires routes (currently only the gym feature).
- `src/features/gym/routes.ts` — gym routes and tabs.

## Data Flow
UI pages call the data service layer in `src/shared/db/app_db.ts`.
The service layer talks directly to SQLite and returns plain JS/TS objects to the UI.

## Platform Notes
- SQLite is **not available on web**. On web, DB operations are no‑ops and the UI should handle empty states.
- Import/export uses SQL text and Capacitor filesystem/share APIs on native.

## State & Storage
- State is local to pages (Vue `ref`, `computed`, `watch`).
- No global state library is used.
- Some transient UI state uses `sessionStorage` (e.g., rest timer).
