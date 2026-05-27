# Database Schema (SQLite)

The database is created and migrated in `src/shared/db/app_db.ts` by `initDB()`. Foreign keys are enabled and enforced.

## Tables

### workout_template
- `id` (PK)
- `name`
- `created_at`

### workout
- `id` (PK)
- `id_workout_template` → `workout_template.id` (nullable, SET NULL)
- `name`
- `time_start`
- `time_end`
- `total_kg`

### exercise
- `id` (PK)
- `name`
- `id_muscle_group` → `muscle_group.id`
- `id_equipment` → `equipment.id`
- `rest_seconds`

### workout_template_exercise
- `id` (PK)
- `id_workout_template` → `workout_template.id` (CASCADE)
- `id_exercise` → `exercise.id` (CASCADE)
- `set_number`
- `rep_number`
- `order_index`
- `created_at`

### workout_exercise
- `id` (PK)
- `workout_id` → `workout.id` (CASCADE)
- `exercise_id` → `exercise.id` (CASCADE)
- `order_index`

### workout_exercise_sets
- `id` (PK)
- `workout_exercise_id` → `workout_exercise.id` (CASCADE)
- `set_number`
- `reps`
- `weight`
- `created_at`
- `completed`

### muscle_group
- `id` (PK)
- `name` (UNIQUE)

### equipment
- `id` (PK)
- `name` (UNIQUE)

### exercise_pr
- `id` (PK)
- `exercise_id` → `exercise.id` (UNIQUE, CASCADE)
- `pr_weight`
- `pr_reps`
- `one_rep_max`
- `date_achieved`
- `workout_id` → `workout.id` (nullable, SET NULL)

## Seed Data
`initDB()` inserts base muscle groups, equipment, and a curated exercise list if missing.

## Import/Export
The app can export SQL backups and re‑import them using `exportDatabaseToSQL()` and `importDatabaseFromSQL()` in `app_db.ts`.
