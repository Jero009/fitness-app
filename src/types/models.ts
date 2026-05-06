/**
 * TypeScript interfaces for the Gym App database models
 * Centralized type definitions to replace scattered type declarations across views
 */

export interface MuscleGroup {
  id: number;
  name: string;
}

export interface Equipment {
  id: number;
  name: string;
}

export interface Exercise {
  id: number;
  name: string;
  muscle_group: string;
  equipment: string;
  rest_seconds: number;
}

export interface WorkoutTemplate {
  id: number;
  name: string;
  created_at: string;
}

export interface TemplateExercise {
  id: number;
  name: string;
  id_exercise: number;
  set_number: number;
  rep_number: number;
  order_index: number;
}

export interface Workout {
  id: number;
  id_workout_template?: number;
  name?: string;
  time_start: string;
  time_end?: string;
  total_kg?: number;
}

export interface WorkoutExercise {
  id: number;
  exercise_id: number;
  workout_id?: number;
  name: string;
  rest_seconds: number;
  order_index?: number;
  sets?: WorkoutExerciseSet[];
}

export interface WorkoutExerciseSet {
  id: number;
  set_number: number;
  reps: number;
  weight: number;
  completed?: boolean;
  workout_exercise_id?: number;
}

export interface LatestCompletedSet {
  set_number: number;
  reps: number;
  weight: number;
}

export interface WorkoutHistoryExercise {
  id: number;
  name: string;
  set_count: number;
  reps: number;
}

export interface WorkoutHistory {
  id: number;
  name?: string;
  time_start: string;
  time_end?: string;
  total_kg: number;
}

export interface SetDefaults {
  reps: number;
  weight: number;
}
