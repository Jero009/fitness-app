# Local Data API

There is no server API. All data access lives in:
`src/shared/db/app_db.ts`

## Templates
- `createTemplate(name)`
- `getTemplates()`
- `getTemplateExercises(templateId)`
- `getTemplateById(id)`
- `getTemplateExercisesByTemplateId(id)`
- `renameTemplate(id, name)`
- `editTemplateExercises(rowId, sets, reps, orderIndex)`
- `addExerciseToTemplate(templateId, exerciseId, sets, reps, orderIndex)`
- `deleteTemplate(id)`
- `deleteTemplateExercise(rowId)`

## Exercises
- `getExercises()`
- `addExercise(name, muscleGroupId, equipmentId, restSeconds)`
- `renameExercise(id, newName)`
- `updateExerciseRestSeconds(id, restSeconds)`
- `getMuscleGroups()`
- `getEquipment()`

## Workouts
- `startWorkoutFromTemplate(templateId)`
- `getWorkoutById(id)`
- `getActiveWorkout()`
- `getWorkouts()`
- `getWorkoutExercises(workoutId)`
- `getWorkoutSets(workoutExerciseId)`
- `addSetToWorkoutExercise(workoutExerciseId, setNumber, reps, weight)`
- `updateWorkoutSet(id, reps, weight, completed)`
- `updateWorkoutExerciseOrder(workoutExerciseId, orderIndex)`
- `deleteWorkoutSet(id)`
- `deleteWorkoutExercise(id)`
- `endWorkout(workoutId)`
- `cancelWorkout(workoutId)`

## History & PRs
- `getWorkoutHistoryExercises(workoutId)`
- `getLatestWorkout()`
- `getWorkoutsByName(templateId)`
- `getExercisePR(exerciseId)`
- `getExerciseStats(exerciseId)`

## Import / Export
- `exportDatabaseToSQL()`
- `importDatabaseFromSQL(sqlContent)`
