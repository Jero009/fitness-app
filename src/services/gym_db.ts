import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import type { SQLiteDBConnection, SQLiteConnection as SQLiteConnType } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

const sqlite: SQLiteConnType = new SQLiteConnection(CapacitorSQLite);

let db: SQLiteDBConnection | null = null;

export async function initDB() {
  if (Capacitor.getPlatform() === 'web') {
    console.log('⚠️ SQLite not available on web');
    return null;
  }

  if (db) return db;

  // @ts-ignore
  db = await sqlite.createConnection('workout_db', false, 'no-encryption', 1);

  await db.open();

  // ✅ enable foreign keys
  await db.execute(`PRAGMA foreign_keys = ON;`);

  await db.execute(`
  CREATE TABLE IF NOT EXISTS workout_template (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS workout (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_workout_template INTEGER,
    time_start TEXT DEFAULT CURRENT_TIMESTAMP,
    time_end TEXT,
    total_kg INTEGER,
    FOREIGN KEY (id_workout_template)
      REFERENCES workout_template(id)
      ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS exercise (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    muscle_group TEXT,
    equipment TEXT,
    rest_seconds INTEGER
  );

  CREATE TABLE IF NOT EXISTS workout_template_exercise (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_workout_template INTEGER,
    id_exercise INTEGER,
    set_number INTEGER,
    default_reps INTEGER,
    order_index INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_workout_template)
      REFERENCES workout_template(id)
      ON DELETE CASCADE,
    FOREIGN KEY (id_exercise)
      REFERENCES exercise(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workout_exercise (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_id INTEGER,
    exercise_id INTEGER,
    order_index INTEGER,
    FOREIGN KEY (workout_id)
      REFERENCES workout(id)
      ON DELETE CASCADE,
    FOREIGN KEY (exercise_id)
      REFERENCES exercise(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workout_exercise_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_exercise_id INTEGER,
    set_number INTEGER,
    reps INTEGER,
    weight INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    completed INTEGER DEFAULT 0,
    FOREIGN KEY (workout_exercise_id)
      REFERENCES workout_exercise(id)
      ON DELETE CASCADE
  );
  `);

    console.log("✅ Tables created");


  return db;
}







export async function createTemplate(name: string) {
  if (!db) return;

  const result = await db.run(`
    INSERT INTO workout_template (name) VALUES (?);
  `, [name]);


  return result.changes?.lastId ;

}

export async function addExerciseToTemplate(
  templateId: number,
  exerciseId: number,
  setNumber: number,
  defaultReps: number,
  orderIndex: number
) {
  if (!db) return;

  const result = await db.run(
    `INSERT INTO workout_template_exercise 
     (id_workout_template, id_exercise, set_number, default_reps, order_index)
     VALUES (?, ?, ?, ?, ?);`,
    [templateId, exerciseId, setNumber, defaultReps, orderIndex]
  );

  return result;
}


export async function addExercise(name: string, muscleGroup: string, equipment: string, restSeconds: number) {
  if (!db) return;

  const result = await db.run(
    `INSERT INTO exercise (name, muscle_group, equipment, rest_seconds) 
    VALUES (?, ?, ?, ?);`,
    [name, muscleGroup, equipment, restSeconds]
  );

  return result;
}

export async function deleteExercise(id: number) {
  if (!db) return;

  const result = await db.run(
    `DELETE FROM exercise WHERE id = ?`,
    [id]
  );

  return result;
}

export async function getExercises() {
  if (!db) return [];

  const result = await db.query('SELECT * FROM exercise;');
  return result.values || [];
}

