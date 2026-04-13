# GEMINI.md

This file provides foundational mandates and guidance for Gemini CLI when working in this repository.

## Commands

### Development & Build
- `npm run dev`: Start Vite development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint
- `npm run lint --fix`: Fix linting issues

### Testing
- `npm run test:unit`: Run unit tests with Vitest
- `npm run test:e2e`: Run E2E tests with Cypress

### Mobile (Android)
- `npx cap sync android`: Sync web assets to the Android project
- `npx cap open android`: Open the project in Android Studio
- `npx cap run android`: Run the app on a connected device/emulator

## Architecture & Tech Stack
- **Framework**: Vue 3 (Composition API) + Ionic Vue
- **Mobile**: Capacitor
- **Database**: SQLite via `@capacitor-community/sqlite`
- **Build Tool**: Vite
- **Styling**: Ionic components + Vanilla CSS (defined in `src/theme/variables.css` and component-level `<style>`)

## Project Structure
- `src/main.ts`: Application entry point and database initialization.
- `src/services/gym_db.ts`: Central SQLite database service. All database operations must go through this service.
- `src/views/`: Main application views.
  - `TabsPage.vue`: Root layout with tab navigation.
  - `HomePage.vue`: Main dashboard.
  - `WorkoutPage.vue`: Active workout session.
  - `HistoryPage.vue`: Past workout logs.
- `src/views/hidden_views/`: Specialized views for builders, editors, and pickers.
- `src/components/`: Reusable UI components.

## Core Mandates & Patterns

### Database Operations
- **Surgical Updates**: Always use the existing `gym_db.ts` service for database interactions. Do not implement raw SQL outside of this service.
- **Initialization**: The database is initialized in `main.ts`. Always verify the database connection state (`if (!db) return`) before performing operations.
- **Web Compatibility**: The app uses SQLite, which is natively supported but limited on the web. Check `Capacitor.getPlatform() === 'web'` when implementing native-specific features.

### Style & Conventions
- **Ionic Components**: Prefer using standard Ionic Vue components (`IonPage`, `IonContent`, `IonHeader`, etc.) for consistent mobile UI/UX.
- **CSS**: Follow the existing styling patterns in `src/theme/variables.css`. Maintain the established color palette and spacing variables.
- **TypeScript**: Strictly adhere to TypeScript types. Avoid using `any`. Ensure all database models have corresponding TypeScript interfaces.

### Workflow
- **Verification**: After modifying database logic or UI components, ensure that the app still builds correctly and run unit tests if applicable.
- **Android Sync**: If changing web assets that need to be tested on a device, always run `npx cap sync android`.
