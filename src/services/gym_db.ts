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

  // @ts-expect-error - SQLite connection type mismatch
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
    id_muscle_group INTEGER,
    id_equipment INTEGER,
    rest_seconds INTEGER,
    FOREIGN KEY (id_muscle_group) REFERENCES muscle_group(id),
    FOREIGN KEY (id_equipment) REFERENCES equipment(id)
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

  CREATE TABLE IF NOT EXISTS muscle_group (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
  );
  
  INSERT OR IGNORE INTO muscle_group (name) VALUES
    ('chest'),
    ('back'),
    ('legs'),
    ('shoulders'),
    ('arms'),
    ('core');

  INSERT OR IGNORE INTO equipment (name) VALUES
    ('barbell'),
    ('dumbbell'),
    ('machine'),
    ('bodyweight'),
    ('cables'),
    ('other');

  INSERT OR IGNORE INTO exercise (name, id_muscle_group, id_equipment, rest_seconds) VALUES
  ('Bench Press', 1, 1, 120),
  ('Chest Fly', 1, 5, 60),
  ('Push-Up', 1, 4, 60),
  ('Incline Dumbbell Press', 1, 2, 90),
  ('Chest Press Machine', 1, 3, 90),
  ('Cable Fly', 1, 5, 60),
  ('Incline Barbell Bench Press', 1, 1, 120),
  ('Decline Hammer Strength Press', 1, 3, 90),
  ('Cable Crossover', 1, 5, 60),
  ('Deadlift', 2, 1, 180),
  ('Lat Pulldown', 2, 3, 90),
  ('Dumbbell Row', 2, 2, 90),
  ('Pull-Up', 2, 4, 120),
  ('Bent Over Row', 2, 1, 90),
  ('Seated Cable Row', 2, 5, 90),
  ('T-Bar Row', 2, 1, 120),
  ('Single Arm Lat Pulldown', 2, 5, 60),
  ('Chin-Up', 2, 4, 120),
  ('Hyperextension', 2, 6, 60),
  ('Back Squat', 3, 1, 180),
  ('Leg Press', 3, 3, 120),
  ('Walking Lunge', 3, 2, 90),
  ('Romanian Deadlift', 3, 1, 120),
  ('Leg Extension', 3, 3, 60),
  ('Goblet Squat', 3, 2, 90),
  ('Bulgarian Split Squat', 3, 2, 90),
  ('Leg Curl Machine', 3, 3, 60),
  ('Hack Squat', 3, 3, 120),
  ('Stiff Legged Deadlift', 3, 1, 120),
  ('Calf Raise', 3, 3, 45),
  ('Overhead Press', 4, 1, 120),
  ('Lateral Raise', 4, 2, 60),
  ('Face Pull', 4, 5, 60),
  ('Arnold Press', 4, 2, 90),
  ('Upright Row', 4, 1, 60),
  ('Front Raise', 4, 2, 60),
  ('Reverse Fly', 4, 2, 60),
  ('Dumbbell Shrugs', 4, 2, 60),
  ('Military Press', 4, 1, 120),
  ('Cable Lateral Raise', 4, 5, 60),
  ('Bicep Curl', 5, 2, 60),
  ('Tricep Pushdown', 5, 5, 60),
  ('Dips', 5, 4, 90),
  ('Hammer Curl', 5, 2, 60),
  ('Skull Crusher', 5, 1, 90),
  ('Preacher Curl', 5, 3, 60),
  ('Concentration Curl', 5, 2, 60),
  ('Close Grip Bench Press', 5, 1, 90),
  ('EZ Bar Curl', 5, 1, 60),
  ('Overhead Dumbbell Extension', 5, 2, 60),
  ('Plank', 6, 4, 60),
  ('Cable Crunch', 6, 5, 60),
  ('Russian Twist', 6, 6, 45),
  ('Leg Raise', 6, 4, 60),
  ('Hanging Knee Raise', 6, 4, 60),
  ('Woodchopper', 6, 5, 60),
  ('Ab Wheel Rollout', 6, 6, 60),
  ('Dead Bug', 6, 4, 45),
  ('Mountain Climbers', 6, 4, 30),
  ('Side Plank', 6, 4, 45);

  `);

    console.log("✅ Tables created");


  return db;
}
// get muscle groups and equpment

export async function getMuscleGroups() {
  if (!db) return [];
  const result = await db.query('SELECT * FROM muscle_group;');
  return result.values || [];
}

export async function getEquipment() {
  if (!db) return [];
  const result = await db.query('SELECT * FROM equipment;');
  return result.values || [];
}



// template functions


export async function createTemplate(name: string) {
  if (!db) return;

  try {
    const result = await db.run(`
      INSERT INTO workout_template (name) VALUES (?);
    `, [name]);

    return result.changes?.lastId;
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
}

export async function addExerciseToTemplate(
  templateId: number,
  exerciseId: number,
  setNumber: number,
  repNumber: number,
  orderIndex: number
) {
  if (!db) return;

  try {
    const result = await db.run(
      `INSERT INTO workout_template_exercise
       (id_workout_template, id_exercise, set_number, rep_number, order_index)
       VALUES (?, ?, ?, ?, ?);`,
      [templateId, exerciseId, setNumber, repNumber, orderIndex]
    );

    return result;
  } catch (error) {
    console.error('Error adding exercise to template:', error);
    throw error;
  }
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
export async function addExercise(name: string, muscleGroupId: number, equipmentId: number, restSeconds: number) {
  if (!db) return;

  try {
    const result = await db.run(
      `INSERT INTO exercise (name, id_muscle_group, id_equipment, rest_seconds)
      VALUES (?, ?, ?, ?);`,
      [name, muscleGroupId, equipmentId, restSeconds]
    );

    return result;
  } catch (error) {
    console.error('Error adding exercise:', error);
    throw error;
  }
}

//rename
export async function renameExercise(id: number, newName: string) {
  if (!db) return;

  try {
    const result = await db.run(
      `UPDATE exercise SET name = ? WHERE id = ?`,
      [newName, id]
    );

    return result;
  } catch (error) {
    console.error('Error renaming exercise:', error);
    throw error;
  }
}

export async function getExercises() {
  if (!db) return [];

    const result = await db.query(`
    SELECT 
      e.id,
      e.name,
      mg.name AS muscle_group,
      eq.name AS equipment,
      e.rest_seconds
    FROM exercise e
    LEFT JOIN muscle_group mg ON e.id_muscle_group = mg.id
    LEFT JOIN equipment eq ON e.id_equipment = eq.id
  `);
  return result.values || [];
}


export async function deleteTemplate(id: number) {
  if (!db) return;

  try {
    const result = await db.run(
      `DELETE FROM workout_template WHERE id = ? ;`,
      [id]
    );

    return result;
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
}
// workout functions

export async function startWorkoutFromTemplate(templateId: number) {
  if (!db) return;

  try {
    const result = await db.run(
      `INSERT INTO workout (id_workout_template) VALUES (?)`,
      [templateId]
    );
    const workoutId = result.changes?.lastId;

    const templateExercises = await getTemplateExercises(templateId);

    for (const ex of templateExercises) {
      if (!db) continue;
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
  } catch (error) {
    console.error('Error starting workout from template:', error);
    throw error;
  }
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
  await saveWorkoutTotalKg(id);

  return result;
}
export async function getWorkouts() {
  if (!db) return [];

  const result = await db.query(`
    SELECT 
      w.id,
      wt.name,
      w.time_start,
      w.time_end,
      w.total_kg
    FROM workout w
    LEFT JOIN workout_template wt 
      ON wt.id = w.id_workout_template
    ORDER BY w.time_start DESC
  `);

  return result.values || [];
}

export async function getWorkoutHistoryExercises(workoutId: number) {
  if (!db) return [];

  const result = await db.query(`
      SELECT 
        e.name,
        SUM(CASE WHEN wes.completed = 1 THEN 1 ELSE 0 END) as set_count,
        wes.reps
      FROM workout_exercise we
      JOIN exercise e ON e.id = we.exercise_id
      LEFT JOIN workout_exercise_sets wes 
        ON wes.workout_exercise_id = we.id
      WHERE we.workout_id = ?  
      GROUP BY we.id
  `, [workoutId]);

  return result.values || [];
}

export async function saveWorkoutTotalKg(workoutId: number,) {
  if (!db) return;
  const totalKgResult = await db.query(`
    SELECT sum(reps * weight) as total_kg 
    FROM workout_exercise_sets wes
    JOIN workout_exercise we ON we.id = wes.workout_exercise_id AND wes.completed = 1
    WHERE we.workout_id = ?;
  `, [workoutId]);
  const totalKg = totalKgResult.values?.[0].total_kg || 0;

  const result = await db.run(
    'UPDATE workout SET total_kg = ? WHERE id = ?',
    [totalKg, workoutId]
  );
  return result;
}

// In your gym_db.ts
export async function hasActiveWorkout() {
  if (!db) return false;
  const result = await db.query('SELECT id FROM workout WHERE time_end IS NULL LIMIT 1');
  return result.values && result.values.length > 0;
}

export async function getActiveWorkout() {
  if (!db) return null;
  const result = await db.query('SELECT * FROM workout WHERE time_end IS NULL LIMIT 1');
  return result.values?.[0] || null;
}

export async function getLatestWorkout() {
  if (!db) return null;
  const result = await db.query('SELECT * FROM workout ORDER BY time_start DESC LIMIT 1');
  return result.values?.[0] || null;
  
}

export async function getWorkoutsByTemplate() {
  if (!db) return [];

  const result = await db.query(`
    SELECT 
      w.id,
      wt.name,
      w.time_start,
      w.time_end,
      w.total_kg
    FROM workout w
    LEFT JOIN workout_template wt 
      ON wt.id = w.id_workout_template
    GROUP BY wt.id
    ORDER BY w.time_start DESC
  `);

  return result.values || [];
}


export async function getWorkoutsByName(id:number) {
  if (!db) return [];

  const result = await db.query(`
    SELECT 
      w.id,
      wt.name,
      w.time_start,
      w.time_end,
      w.total_kg
    FROM workout w
    LEFT JOIN workout_template wt 
      ON wt.id = w.id_workout_template
    WHERE wt.id = ?
    ORDER BY w.time_start DESC
  `, [id]);
  return result.values || [];
}

// edit template
export async function renameTemplate(id: number, newName: string) {
  if (!db) return;
  const result = await db.run(
    `UPDATE workout_template SET name = ? WHERE id = ?`,
    [newName, id]
  );
  return result;
}

export async function editTemplateExercises(
  rowId: number,
  setNumber: number,
  repNumber: number,
  orderIndex: number
) {
  if (!db) return;

  const result = await db.run(
    `UPDATE workout_template_exercise 
     SET set_number = ?, rep_number = ?, order_index = ?
     WHERE id = ?`,
    [setNumber, repNumber, orderIndex, rowId]
  );

  console.log("Rows affected:", result.changes);

  return result;
}


export async function getTemplateById(templateId: number) {
  if (!db) return;
  const result = await db.query('SELECT * FROM workout_template WHERE id = ?', [templateId]);
  return result.values?.[0] || null;
}

export async function getTemplateExercisesByTemplateId(templateId: number) {
  if (!db) return;
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
  `, [templateId]);
  return result.values || [];
}
