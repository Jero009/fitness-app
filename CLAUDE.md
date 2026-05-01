# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server (http://localhost:5173)
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run test:unit  # Run unit tests with Vitest
npm run test:e2e   # Run E2E tests with Cypress
```

## Architecture

- **Framework**: Vue 3 + Ionic Vue + Capacitor (mobile-first fitness tracking app)
- **Database**: SQLite via `@capacitor-community/sqlite` (native only, disabled on web)
- **Build**: Vite with Vue plugin
- **Path alias**: `@/` resolves to `./src/`

## Project Structure

```
src/
  main.ts          # App entry: initializes Vue, router, and SQLite DB
  router/
    index.ts       # Vue Router with tab-based navigation
  services/
    gym_db.ts      # SQLite database layer (all CRUD operations)
  views/
    TabsPage.vue   # Main tab layout (Home, Template, Exercise, History)
    HomePage.vue   # Dashboard / active workout
    WorkoutPage.vue # Active workout logging interface
    TemplatePage.vue # Workout template management
    ExercisePage.vue # Exercise CRUD
    HistoryPage.vue  # Past workouts
    hidden_views/  # ExercisePicker, TemplateBuilder, TemplateEditor
```

## Database Schema

SQLite database (`workout_db`) with tables: `workout_template`, `workout`, `exercise`, `workout_template_exercise`, `workout_exercise`, `workout_exercise_sets`, `muscle_group`, `equipment`. Foreign keys enabled. Seed data populates 6 muscle groups and 6 equipment types.

## Key Patterns

- DB connection initialized in `main.ts` after router ready, exported from `gym_db.ts`
- All DB functions check `if (!db) return` before executing
- Web platform detection: SQLite disabled on web (`Capacitor.getPlatform() === 'web'`)
- Tab-based routing with hidden views for complex flows (picker, builder, editor)

## Android Build

```bash
npx cap sync android   # Sync web assets to native project
npx cap open android   # Open in Android Studio
```

Requires Android Studio and SDK configured.
## checking 
Codex will check the code when you are done