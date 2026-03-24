import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import type { SQLiteDBConnection, SQLiteConnection as SQLiteConnType } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { ref } from 'vue';
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
    rep_number INTEGER,
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




// template functions


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
  repNumber: number,
  orderIndex: number
) {
  if (!db) return;

  const result = await db.run(
    `INSERT INTO workout_template_exercise 
     (id_workout_template, id_exercise, set_number, rep_number, order_index)
     VALUES (?, ?, ?, ?, ?);`,
    [templateId, exerciseId, setNumber, repNumber, orderIndex]
  );

  return result;
}
export async function getTemplates() {
  if (!db) return [];
  const result = await db.query('SELECT * FROM workout_template;');
  return result.values || [];

}
export async function getTemplateExercises(templateId: number) {
  if (!db) return [];

  const result = await db.query(`
    SELECT 
      wte.id,
      e.name,
      wte.id_exercise,
      wte.set_number,
      wte.rep_number,
      wte.order_index
    FROM workout_template_exercise wte
    JOIN exercise e ON e.id = wte.id_exercise
    WHERE wte.id_workout_template = ?
    ORDER BY wte.order_index ASC;
  `, [templateId]);

  return result.values || [];
}
// exercise functions
export async function addExercise(name: string, muscleGroup: string, equipment: string, restSeconds: number) {
  if (!db) return;

  const result = await db.run(
    `INSERT INTO exercise (name, muscle_group, equipment, rest_seconds) 
    VALUES (?, ?, ?, ?);`,
    [name, muscleGroup, equipment, restSeconds]
  );

  return result;
}

//rename
export async function renameExercise(id: number, newName: string) {
  if (!db) return;

  const result = await db.run(
    `UPDATE exercise SET name = ? WHERE id = ?`,
    [newName, id]
  );

  return result;
}

export async function getExercises() {
  if (!db) return [];

  const result = await db.query('SELECT * FROM exercise;');
  return result.values || [];
}


export async function deleteTemplate(id: number) {
  if (!db) return;

  const result = await db.run(
    `DELETE FROM workout_template WHERE id = ? ;`,
    [id]
  );


  return result;
}
// workout functions

export async function startWorkoutFromTemplate(templateId: number) {
  if (!db) return;

  const result = await db.run(
    `INSERT INTO workout (id_workout_template) VALUES (?)`,
    [templateId]
  );
  const workoutId = result.changes?.lastId;

  const templateExercises = await getTemplateExercises(templateId);

  for (const ex of templateExercises) {
    const resultWE = await db.run(
      `INSERT INTO workout_exercise (workout_id, exercise_id, order_index) VALUES (?, ?, ?)`,
      [workoutId, ex.id_exercise, ex.order_index]
    );
    const workoutExerciseId = resultWE.changes?.lastId;

    for (let i = 0; i < ex.set_number; i++) {
      await db.run(
        'INSERT INTO workout_exercise_sets (workout_exercise_id,set_number,reps,weight) values(?, ?, ?, ?)',
        [workoutExerciseId, i + 1, ex.rep_number, 0]
      );
    }
  }
  return workoutId;
}

export async function getWorkoutExercises(workoutId: number) {
  if (!db) return [];

  const result = await db.query(`
    SELECT 
      we.id,
      e.name
    FROM workout_exercise we
    JOIN exercise e ON e.id = we.exercise_id
    WHERE we.workout_id = ?
    ORDER BY we.order_index
  `, [workoutId]);

  return result.values || [];
}

export async function getWorkoutSets(workoutExerciseId: number) {
  if (!db) return [];

  const result = await db.query(`
    select id, set_number, reps,weight,completed from workout_exercise_sets
    where workout_exercise_id = ?
    order by set_number
  `, [workoutExerciseId]);

  return result.values || [];
}

// saving workout

export async function updateWorkoutSet(id: number, reps: number, weight: number, completed: boolean) {
  if (!db) return;

  const result = await db.run(
    'UPDATE workout_exercise_sets SET reps = ?, weight = ?, completed = ? WHERE id = ?',
    [reps, weight, completed ? 1 : 0, id]
  );  
  return result;
  
}

export async function getWorkoutById(id: number) {
  if (!db) return null;

  const result = await db.query(
    'SELECT * FROM workout WHERE id = ?;'
    , [id]
  );

  return result.values?.[0] || null;
}

export async function endWorkout(id: number, time_end: number) {
  if (!db) return;
  const result = await db.run(
    'UPDATE workout SET time_end = ? WHERE id = ?',
    [time_end, id]
  )
  return result;
}