# UI Structure

## Navigation
The app uses Ionic tabs with Vue Router.

**Tabs (main):**
- **Home** — `src/features/gym/pages/HomePage.vue`
- **Template** — `src/features/gym/pages/TemplatePage.vue`
- **Exercise** — `src/features/gym/pages/ExercisePage.vue`
- **History** — `src/features/gym/pages/HistoryPage.vue`

**Detail/Flow pages:**
- Workout — `src/features/gym/pages/WorkoutPage.vue`
- Exercise Detail — `src/features/gym/pages/ExerciseDetailPage.vue`
- Exercise Picker — `src/features/gym/pages/flows/ExercisePickerPage.vue`
- Template Builder — `src/features/gym/pages/flows/TemplateBuilderPage.vue`
- Template Editor — `src/features/gym/pages/flows/TemplateEditorPage.vue`

Routes are defined in `src/features/gym/routes.ts` and wired in `src/router/index.ts`.

## Components
- `TimerDial` — `src/features/gym/components/TimerDial.vue` (rest timer UI)

## Theme & Styling
- Global theme tokens live in `src/theme/variables.css`.
- Custom font **Doto** is loaded from `src/components/assets/fonts/`.

