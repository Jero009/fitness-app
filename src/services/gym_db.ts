import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import type { SQLiteDBConnection, SQLiteConnection as SQLiteConnType } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
const sqlite: SQLiteConnType = new SQLiteConnection(CapacitorSQLite);

let db: SQLiteDBConnection | null = null;

const EXPORT_TABLES = [
  'workout_template',
  'workout',
  'exercise',
  'workout_template_exercise',
  'workout_exercise',
  'workout_exercise_sets',
  'muscle_group',
  'equipment'
];

function toSqlLiteral(value: unknown) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function parseSqlStatements(sqlContent: string) {
  // Strip single-line SQL comments from backup files.
  const withoutComments = sqlContent
    .split('\n')
    .map((line) => line.replace(/--.*$/, ''))
    .join('\n');

  const statements: string[] = [];
  let current = '';
  let insideString = false;

  for (let i = 0; i < withoutComments.length; i++) {
    const char = withoutComments[i];
    const next = withoutComments[i + 1] ?? '';

    current += char;

    if (char === "'") {
      // Handle escaped quote in SQL string literal.
      if (insideString && next === "'") {
        current += next;
        i++;
        continue;
      }
      insideString = !insideString;
      continue;
    }

    if (char === ';' && !insideString) {
      const statement = current.slice(0, -1).trim();
      if (statement) statements.push(statement);
      current = '';
    }
  }

  const tail = current.trim();
  if (tail) statements.push(tail);

  return statements.filter((statement) => {
    const upper = statement.toUpperCase();
    // Avoid nested transaction errors on plugins that wrap operations.
    return upper !== 'BEGIN TRANSACTION' && upper !== 'COMMIT';
  });
}

export async function initDB() {
  if (Capacitor.getPlatform() === 'web') {
    console.log('⚠️ SQLite not available on web');
    return null;
  }

  if (db) return db;

  try {
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

  WITH base_exercises(name, id_muscle_group, id_equipment, rest_seconds) AS (
    VALUES
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
      ('Side Plank', 6, 4, 45)
  )
  INSERT INTO exercise (name, id_muscle_group, id_equipment, rest_seconds)
  SELECT b.name, b.id_muscle_group, b.id_equipment, b.rest_seconds
  FROM base_exercises b
  WHERE NOT EXISTS (
    SELECT 1
    FROM exercise e
    WHERE lower(e.name) = lower(b.name)
  );

  INSERT INTO exercise (name, id_muscle_group, id_equipment, rest_seconds)
  SELECT 'Lat Pulldown Cable', 2, 5, 90
  WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE lower(name) = lower('Lat Pulldown Cable'));

  INSERT INTO exercise (name, id_muscle_group, id_equipment, rest_seconds)
  SELECT 'Seated Row Machine', 2, 3, 90
  WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE lower(name) = lower('Seated Row Machine'));

  INSERT INTO exercise (name, id_muscle_group, id_equipment, rest_seconds)
  SELECT 'Reverse Fly Machine', 4, 3, 60
  WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE lower(name) = lower('Reverse Fly Machine'));

  INSERT INTO exercise (name, id_muscle_group, id_equipment, rest_seconds)
  SELECT 'Pullover Machine', 2, 3, 75
  WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE lower(name) = lower('Pullover Machine'));

  INSERT INTO exercise (name, id_muscle_group, id_equipment, rest_seconds)
  SELECT 'Preacher Curl Dumbbell', 5, 2, 60
  WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE lower(name) = lower('Preacher Curl Dumbbell'));

  INSERT INTO exercise (name, id_muscle_group, id_equipment, rest_seconds)
  SELECT 'Incline Bench Press', 1, 1, 120
  WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE lower(name) = lower('Incline Bench Press'));

  INSERT INTO exercise (name, id_muscle_group, id_equipment, rest_seconds)
  SELECT 'Chest Dips', 1, 4, 90
  WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE lower(name) = lower('Chest Dips'));

  INSERT INTO exercise (name, id_muscle_group, id_equipment, rest_seconds)
  SELECT 'Lateral Raise Cable', 4, 5, 60
  WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE lower(name) = lower('Lateral Raise Cable'));

  INSERT INTO exercise (name, id_muscle_group, id_equipment, rest_seconds)
  SELECT 'Triceps Extension Cable', 5, 5, 60
  WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE lower(name) = lower('Triceps Extension Cable'));

  INSERT INTO exercise (name, id_muscle_group, id_equipment, rest_seconds)
  SELECT 'Lat Pulldown Machine', 2, 3, 90
  WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE lower(name) = lower('Lat Pulldown Machine'));

  INSERT INTO exercise (name, id_muscle_group, id_equipment, rest_seconds)
  SELECT 'Seated Row Cable', 2, 5, 90
  WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE lower(name) = lower('Seated Row Cable'));

  INSERT INTO exercise (name, id_muscle_group, id_equipment, rest_seconds)
  SELECT 'Back Extension', 2, 6, 60
  WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE lower(name) = lower('Back Extension'));

  INSERT INTO exercise (name, id_muscle_group, id_equipment, rest_seconds)
  SELECT 'Bayesian Cable Curl', 5, 5, 60
  WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE lower(name) = lower('Bayesian Cable Curl'));

  INSERT INTO exercise (name, id_muscle_group, id_equipment, rest_seconds)
  SELECT 'Reverse Curl Barbell', 5, 1, 60
  WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE lower(name) = lower('Reverse Curl Barbell'));

  INSERT INTO exercise (name, id_muscle_group, id_equipment, rest_seconds)
  SELECT 'Bench Press Dumbbell', 1, 2, 90
  WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE lower(name) = lower('Bench Press Dumbbell'));

  INSERT INTO exercise (name, id_muscle_group, id_equipment, rest_seconds)
  SELECT 'Chest Fly Machine', 1, 3, 60
  WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE lower(name) = lower('Chest Fly Machine'));

  INSERT INTO exercise (name, id_muscle_group, id_equipment, rest_seconds)
  SELECT 'Shoulder Press Machine', 4, 3, 90
  WHERE NOT EXISTS (SELECT 1 FROM exercise WHERE lower(name) = lower('Shoulder Press Machine'));

  WITH canonical AS (
    SELECT lower(name) AS normalized_name, MIN(id) AS keep_id
    FROM exercise
    GROUP BY lower(name)
  ),
  duplicates AS (
    SELECT e.id AS duplicate_id, c.keep_id
    FROM exercise e
    JOIN canonical c ON lower(e.name) = c.normalized_name
    WHERE e.id <> c.keep_id
  )
  UPDATE workout_template_exercise
  SET id_exercise = (
    SELECT d.keep_id
    FROM duplicates d
    WHERE d.duplicate_id = workout_template_exercise.id_exercise
  )
  WHERE id_exercise IN (SELECT duplicate_id FROM duplicates);

  WITH canonical AS (
    SELECT lower(name) AS normalized_name, MIN(id) AS keep_id
    FROM exercise
    GROUP BY lower(name)
  ),
  duplicates AS (
    SELECT e.id AS duplicate_id, c.keep_id
    FROM exercise e
    JOIN canonical c ON lower(e.name) = c.normalized_name
    WHERE e.id <> c.keep_id
  )
  UPDATE workout_exercise
  SET exercise_id = (
    SELECT d.keep_id
    FROM duplicates d
    WHERE d.duplicate_id = workout_exercise.exercise_id
  )
  WHERE exercise_id IN (SELECT duplicate_id FROM duplicates);

  DELETE FROM exercise
  WHERE id NOT IN (
    SELECT MIN(id)
    FROM exercise
    GROUP BY lower(name)
  );

  DELETE FROM workout_template_exercise
  WHERE id IN (
    SELECT dup.id
    FROM workout_template_exercise dup
    JOIN workout_template_exercise keep
      ON dup.id_workout_template = keep.id_workout_template
     AND dup.id_exercise = keep.id_exercise
     AND dup.id > keep.id
  );

  INSERT INTO workout_template (name)
  SELECT 'PULL A'
  WHERE NOT EXISTS (SELECT 1 FROM workout_template WHERE lower(name) = lower('PULL A'));

  INSERT INTO workout_template (name)
  SELECT 'PUSH A'
  WHERE NOT EXISTS (SELECT 1 FROM workout_template WHERE lower(name) = lower('PUSH A'));

  INSERT INTO workout_template (name)
  SELECT 'PULL B'
  WHERE NOT EXISTS (SELECT 1 FROM workout_template WHERE lower(name) = lower('PULL B'));

  INSERT INTO workout_template (name)
  SELECT 'PUSH B'
  WHERE NOT EXISTS (SELECT 1 FROM workout_template WHERE lower(name) = lower('PUSH B'));

  INSERT INTO workout_template_exercise (id_workout_template, id_exercise, set_number, rep_number, order_index)
  SELECT wt.id, e.id, 3, 10, 1
  FROM workout_template wt, exercise e
  WHERE lower(wt.name) = lower('PULL A') AND lower(e.name) = lower('Pull-Up')
    AND NOT EXISTS (
      SELECT 1 FROM workout_template_exercise wte
      WHERE wte.id_workout_template = wt.id AND wte.id_exercise = e.id
    );

  INSERT INTO workout_template_exercise (id_workout_template, id_exercise, set_number, rep_number, order_index)
  SELECT wt.id, e.id, 3, 10, 2
  FROM workout_template wt, exercise e
  WHERE lower(wt.name) = lower('PULL A') AND lower(e.name) = lower('Lat Pulldown Cable')
    AND NOT EXISTS (SELECT 1 FROM workout_template_exercise wte WHERE wte.id_workout_template = wt.id AND wte.id_exercise = e.id);

  INSERT INTO workout_template_exercise (id_workout_template, id_exercise, set_number, rep_number, order_index)
  SELECT wt.id, e.id, 3, 10, 3
  FROM workout_template wt, exercise e
  WHERE lower(wt.name) = lower('PULL A') AND lower(e.name) = lower('Seated Row Machine')
    AND NOT EXISTS (SELECT 1 FROM workout_template_exercise wte WHERE wte.id_workout_template = wt.id AND wte.id_exercise = e.id);

  INSERT INTO workout_template_exercise (id_workout_template, id_exercise, set_number, rep_number, order_index)
  SELECT wt.id, e.id, 3, 12, 4
  FROM workout_template wt, exercise e
  WHERE lower(wt.name) = lower('PULL A') AND lower(e.name) = lower('Reverse Fly Machine')
    AND NOT EXISTS (SELECT 1 FROM workout_template_exercise wte WHERE wte.id_workout_template = wt.id AND wte.id_exercise = e.id);

  INSERT INTO workout_template_exercise (id_workout_template, id_exercise, set_number, rep_number, order_index)
  SELECT wt.id, e.id, 3, 12, 5
  FROM workout_template wt, exercise e
  WHERE lower(wt.name) = lower('PULL A') AND lower(e.name) = lower('Pullover Machine')
    AND NOT EXISTS (SELECT 1 FROM workout_template_exercise wte WHERE wte.id_workout_template = wt.id AND wte.id_exercise = e.id);

  INSERT INTO workout_template_exercise (id_workout_template, id_exercise, set_number, rep_number, order_index)
  SELECT wt.id, e.id, 3, 12, 6
  FROM workout_template wt, exercise e
  WHERE lower(wt.name) = lower('PULL A') AND lower(e.name) = lower('Preacher Curl Dumbbell')
    AND NOT EXISTS (SELECT 1 FROM workout_template_exercise wte WHERE wte.id_workout_template = wt.id AND wte.id_exercise = e.id);

  INSERT INTO workout_template_exercise (id_workout_template, id_exercise, set_number, rep_number, order_index)
  SELECT wt.id, e.id, 3, 8, 1
  FROM workout_template wt, exercise e
  WHERE lower(wt.name) = lower('PUSH A') AND lower(e.name) = lower('Incline Bench Press')
    AND NOT EXISTS (SELECT 1 FROM workout_template_exercise wte WHERE wte.id_workout_template = wt.id AND wte.id_exercise = e.id);

  INSERT INTO workout_template_exercise (id_workout_template, id_exercise, set_number, rep_number, order_index)
  SELECT wt.id, e.id, 3, 10, 2
  FROM workout_template wt, exercise e
  WHERE lower(wt.name) = lower('PUSH A') AND lower(e.name) = lower('Overhead Press')
    AND NOT EXISTS (SELECT 1 FROM workout_template_exercise wte WHERE wte.id_workout_template = wt.id AND wte.id_exercise = e.id);

  INSERT INTO workout_template_exercise (id_workout_template, id_exercise, set_number, rep_number, order_index)
  SELECT wt.id, e.id, 3, 10, 3
  FROM workout_template wt, exercise e
  WHERE lower(wt.name) = lower('PUSH A') AND lower(e.name) = lower('Chest Dips')
    AND NOT EXISTS (SELECT 1 FROM workout_template_exercise wte WHERE wte.id_workout_template = wt.id AND wte.id_exercise = e.id);

  INSERT INTO workout_template_exercise (id_workout_template, id_exercise, set_number, rep_number, order_index)
  SELECT wt.id, e.id, 3, 12, 4
  FROM workout_template wt, exercise e
  WHERE lower(wt.name) = lower('PUSH A') AND lower(e.name) = lower('Cable Crossover')
    AND NOT EXISTS (SELECT 1 FROM workout_template_exercise wte WHERE wte.id_workout_template = wt.id AND wte.id_exercise = e.id);

  INSERT INTO workout_template_exercise (id_workout_template, id_exercise, set_number, rep_number, order_index)
  SELECT wt.id, e.id, 3, 12, 5
  FROM workout_template wt, exercise e
  WHERE lower(wt.name) = lower('PUSH A') AND lower(e.name) = lower('Lateral Raise Cable')
    AND NOT EXISTS (SELECT 1 FROM workout_template_exercise wte WHERE wte.id_workout_template = wt.id AND wte.id_exercise = e.id);

  INSERT INTO workout_template_exercise (id_workout_template, id_exercise, set_number, rep_number, order_index)
  SELECT wt.id, e.id, 3, 12, 6
  FROM workout_template wt, exercise e
  WHERE lower(wt.name) = lower('PUSH A') AND lower(e.name) = lower('Triceps Extension Cable')
    AND NOT EXISTS (SELECT 1 FROM workout_template_exercise wte WHERE wte.id_workout_template = wt.id AND wte.id_exercise = e.id);

  INSERT INTO workout_template_exercise (id_workout_template, id_exercise, set_number, rep_number, order_index)
  SELECT wt.id, e.id, 3, 10, 1
  FROM workout_template wt, exercise e
  WHERE lower(wt.name) = lower('PULL B') AND lower(e.name) = lower('Lat Pulldown Machine')
    AND NOT EXISTS (SELECT 1 FROM workout_template_exercise wte WHERE wte.id_workout_template = wt.id AND wte.id_exercise = e.id);

  INSERT INTO workout_template_exercise (id_workout_template, id_exercise, set_number, rep_number, order_index)
  SELECT wt.id, e.id, 3, 10, 2
  FROM workout_template wt, exercise e
  WHERE lower(wt.name) = lower('PULL B') AND lower(e.name) = lower('Seated Row Cable')
    AND NOT EXISTS (SELECT 1 FROM workout_template_exercise wte WHERE wte.id_workout_template = wt.id AND wte.id_exercise = e.id);

  INSERT INTO workout_template_exercise (id_workout_template, id_exercise, set_number, rep_number, order_index)
  SELECT wt.id, e.id, 3, 12, 3
  FROM workout_template wt, exercise e
  WHERE lower(wt.name) = lower('PULL B') AND lower(e.name) = lower('Back Extension')
    AND NOT EXISTS (SELECT 1 FROM workout_template_exercise wte WHERE wte.id_workout_template = wt.id AND wte.id_exercise = e.id);

  INSERT INTO workout_template_exercise (id_workout_template, id_exercise, set_number, rep_number, order_index)
  SELECT wt.id, e.id, 3, 12, 4
  FROM workout_template wt, exercise e
  WHERE lower(wt.name) = lower('PULL B') AND lower(e.name) = lower('Bayesian Cable Curl')
    AND NOT EXISTS (SELECT 1 FROM workout_template_exercise wte WHERE wte.id_workout_template = wt.id AND wte.id_exercise = e.id);

  INSERT INTO workout_template_exercise (id_workout_template, id_exercise, set_number, rep_number, order_index)
  SELECT wt.id, e.id, 3, 12, 5
  FROM workout_template wt, exercise e
  WHERE lower(wt.name) = lower('PULL B') AND lower(e.name) = lower('Reverse Curl Barbell')
    AND NOT EXISTS (SELECT 1 FROM workout_template_exercise wte WHERE wte.id_workout_template = wt.id AND wte.id_exercise = e.id);

  INSERT INTO workout_template_exercise (id_workout_template, id_exercise, set_number, rep_number, order_index)
  SELECT wt.id, e.id, 3, 10, 1
  FROM workout_template wt, exercise e
  WHERE lower(wt.name) = lower('PUSH B') AND lower(e.name) = lower('Bench Press Dumbbell')
    AND NOT EXISTS (SELECT 1 FROM workout_template_exercise wte WHERE wte.id_workout_template = wt.id AND wte.id_exercise = e.id);

  INSERT INTO workout_template_exercise (id_workout_template, id_exercise, set_number, rep_number, order_index)
  SELECT wt.id, e.id, 3, 12, 2
  FROM workout_template wt, exercise e
  WHERE lower(wt.name) = lower('PUSH B') AND lower(e.name) = lower('Chest Fly Machine')
    AND NOT EXISTS (SELECT 1 FROM workout_template_exercise wte WHERE wte.id_workout_template = wt.id AND wte.id_exercise = e.id);

  INSERT INTO workout_template_exercise (id_workout_template, id_exercise, set_number, rep_number, order_index)
  SELECT wt.id, e.id, 3, 10, 3
  FROM workout_template wt, exercise e
  WHERE lower(wt.name) = lower('PUSH B') AND lower(e.name) = lower('Shoulder Press Machine')
    AND NOT EXISTS (SELECT 1 FROM workout_template_exercise wte WHERE wte.id_workout_template = wt.id AND wte.id_exercise = e.id);

  INSERT INTO workout_template_exercise (id_workout_template, id_exercise, set_number, rep_number, order_index)
  SELECT wt.id, e.id, 2, 12, 4
  FROM workout_template wt, exercise e
  WHERE lower(wt.name) = lower('PUSH B') AND lower(e.name) = lower('Triceps Extension Cable')
    AND NOT EXISTS (SELECT 1 FROM workout_template_exercise wte WHERE wte.id_workout_template = wt.id AND wte.id_exercise = e.id);

  `);

    console.log("✅ Tables created");

    return db;
  } catch (error) {
    console.error('initDB failed:', error);
    db = null;
    return null;
  }
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
    await db.execute('BEGIN TRANSACTION;');

    const result = await db.run(
      `INSERT INTO workout (id_workout_template) VALUES (?)`,
      [templateId]
    );
    const workoutId = result.changes?.lastId;

    if (!workoutId) {
      await db.execute('ROLLBACK;');
      return;
    }

    const templateExercises = await getTemplateExercises(templateId);

    for (const ex of templateExercises) {
      const resultWE = await db.run(
        `INSERT INTO workout_exercise (workout_id, exercise_id, order_index) VALUES (?, ?, ?)`,
        [workoutId, ex.id_exercise, ex.order_index]
      );
      const workoutExerciseId = resultWE.changes?.lastId;

      if (!workoutExerciseId) continue;

      for (let i = 0; i < ex.set_number; i++) {
        await db.run(
          'INSERT INTO workout_exercise_sets (workout_exercise_id,set_number,reps,weight) values(?, ?, ?, ?)',
          [workoutExerciseId, i + 1, ex.rep_number, 0]
        );
      }
    }

    await db.execute('COMMIT;');
    return workoutId;
  } catch (error) {
    await db.execute('ROLLBACK;').catch(() => {});
    console.error('Error starting workout from template:', error);
    throw error;
  }
}

export async function getWorkoutExercises(workoutId: number) {
  if (!db) return [];

  const result = await db.query(`
    SELECT 
      we.id,
      we.exercise_id,
      e.name,
      e.rest_seconds
    FROM workout_exercise we
    JOIN exercise e ON e.id = we.exercise_id
    WHERE we.workout_id = ?
    ORDER BY we.order_index
  `, [workoutId]);

  return result.values || [];
}

export async function getLatestCompletedSetsForExercise(exerciseId: number, excludeWorkoutId?: number) {
  if (!db) return [];

  const latestWorkoutResult = await db.query(
    `SELECT w.id
     FROM workout w
     JOIN workout_exercise we ON we.workout_id = w.id
     WHERE we.exercise_id = ?
       AND w.time_end IS NOT NULL
       AND (? IS NULL OR w.id <> ?)
     ORDER BY w.time_end DESC
     LIMIT 1;`,
    [exerciseId, excludeWorkoutId ?? null, excludeWorkoutId ?? null]
  );

  const latestWorkoutId = latestWorkoutResult.values?.[0]?.id;
  if (!latestWorkoutId) return [];

  const result = await db.query(
    `SELECT wes.set_number, wes.reps, wes.weight
     FROM workout_exercise_sets wes
     JOIN workout_exercise we ON we.id = wes.workout_exercise_id
     WHERE we.workout_id = ?
       AND we.exercise_id = ?
     ORDER BY wes.set_number ASC;`,
    [latestWorkoutId, exerciseId]
  );

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

export async function deleteWorkoutSet(setId: number) {
  if (!db) return;

  const result = await db.run(
    'DELETE FROM workout_exercise_sets WHERE id = ?',
    [setId]
  );

  return result;
}

export async function updateWorkoutSetNumber(setId: number, newSetNumber: number) {
  if (!db) return;

  const result = await db.run(
    'UPDATE workout_exercise_sets SET set_number = ? WHERE id = ?',
    [newSetNumber, setId]
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

export async function endWorkout(id: number) {
  if (!db) return;
  const time_end = new Date().toISOString();
  const result = await db.run(
    'UPDATE workout SET time_end = ? WHERE id = ?',
    [time_end, id]
  )
  await saveWorkoutTotalKg(id);

  return result;
}

export async function cancelWorkout(id: number) {
  if (!db) return;
  return await db.run(
    'DELETE FROM workout WHERE id = ?',
    [id]
  );
}

export async function deleteWorkoutExercise(workoutExerciseId: number) {
  if (!db) return;
  return await db.run(
    'DELETE FROM workout_exercise WHERE id = ?',
    [workoutExerciseId]
  );
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
        we.id,
        e.name,
        SUM(CASE WHEN wes.completed = 1 THEN 1 ELSE 0 END) as set_count,
        MAX(wes.reps) as reps
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
    JOIN workout_exercise we ON we.id = wes.workout_exercise_id
    WHERE we.workout_id = ? AND wes.completed = 1;
  `, [workoutId]);
  const totalKg = totalKgResult.values?.[0]?.total_kg || 0;

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
  const result = await db.query(
    'SELECT * FROM workout WHERE time_end IS NOT NULL ORDER BY time_end DESC LIMIT 1'
  );
  return result.values?.[0] || null;

}

// Add a new exercise to an active workout
export async function addExerciseToWorkout(
  workoutId: number,
  exerciseId: number,
  orderIndex: number,
  setNumber: number,
  repNumber: number,
  weight: number = 0
) {
  if (!db) return;

  try {
    await db.execute('BEGIN TRANSACTION;');

    // Insert the exercise into workout_exercise
    const resultWE = await db.run(
      `INSERT INTO workout_exercise (workout_id, exercise_id, order_index) VALUES (?, ?, ?)`,
      [workoutId, exerciseId, orderIndex]
    );
    const workoutExerciseId = resultWE.changes?.lastId;

    if (!workoutExerciseId) {
      await db.execute('ROLLBACK;');
      return;
    }

    // Insert the initial set(s) into workout_exercise_sets
    for (let i = 0; i < setNumber; i++) {
      await db.run(
        'INSERT INTO workout_exercise_sets (workout_exercise_id, set_number, reps, weight) VALUES (?, ?, ?, ?)',
        [workoutExerciseId, i + 1, repNumber, weight]
      );
    }

    await db.execute('COMMIT;');
    return workoutExerciseId;
  } catch (error) {
    await db.execute('ROLLBACK;').catch(() => {});
    console.error('Error adding exercise to workout:', error);
    throw error;
  }
}

// Add a new set to an existing workout exercise
export async function addSetToWorkoutExercise(
  workoutExerciseId: number,
  setNumber: number,
  repNumber: number,
  weight: number = 0
) {
  if (!db) return;

  try {
    const result = await db.run(
      'INSERT INTO workout_exercise_sets (workout_exercise_id, set_number, reps, weight) VALUES (?, ?, ?, ?)',
      [workoutExerciseId, setNumber, repNumber, weight]
    );
    return result.changes?.lastId;
  } catch (error) {
    console.error('Error adding set to workout exercise:', error);
    throw error;
  }
}

// Get the next order index for a workout
export async function getNextWorkoutOrderIndex(workoutId: number) {
  if (!db) return 0;

  const result = await db.query(
    'SELECT MAX(order_index) as max_order FROM workout_exercise WHERE workout_id = ?',
    [workoutId]
  );
  const maxOrder = result.values?.[0]?.max_order ?? 0;
  return maxOrder + 1;
}

// Get the next set number for a workout exercise
export async function getNextSetNumber(workoutExerciseId: number) {
  if (!db) return 1;

  const result = await db.query(
    'SELECT MAX(set_number) as max_set FROM workout_exercise_sets WHERE workout_exercise_id = ?',
    [workoutExerciseId]
  );
  const maxSet = result.values?.[0]?.max_set ?? 0;
  return maxSet + 1;
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
    JOIN (
      SELECT id_workout_template, MAX(time_start) AS latest_start
      FROM workout
      WHERE time_end IS NOT NULL
      GROUP BY id_workout_template
    ) latest
      ON latest.id_workout_template = w.id_workout_template
      AND latest.latest_start = w.time_start
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

export async function deleteTemplateExercise(rowId: number) {
  if (!db) return;

  const result = await db.run(
    `DELETE FROM workout_template_exercise WHERE id = ?`,
    [rowId]
  );

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

export async function exportDatabaseToSQL() {
  if (!db) return null;

  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const lines: string[] = [
    '-- Fitness App SQL data-only backup',
    '-- Generated by exportDatabaseToSQL() (no schema)',
    'PRAGMA foreign_keys = OFF;',
    'BEGIN TRANSACTION;',
    ''
  ];

  for (const table of EXPORT_TABLES) {
    // Data-only backup: clear current table data and reinsert rows.
    lines.push(`DELETE FROM "${table}";`);

    const columnResult = await db.query(`PRAGMA table_info("${table}");`);
    const columns = (columnResult.values || []).map((column: any) => String(column.name));
    if (columns.length === 0) {
      lines.push('');
      continue;
    }

    const rowsResult = await db.query(`SELECT * FROM "${table}";`);
    const rows = rowsResult.values || [];
    const quotedColumns = columns.map((column) => `"${column}"`).join(', ');

    for (const row of rows) {
      const values = columns
        .map((column) => toSqlLiteral((row as Record<string, unknown>)[column]))
        .join(', ');
      lines.push(`INSERT INTO "${table}" (${quotedColumns}) VALUES (${values});`);
    }

    lines.push('');
  }

  lines.push('COMMIT;');
  lines.push('PRAGMA foreign_keys = ON;');

  return {
    fileName: `fitness-app-backup-${now}.sql`,
    sql: lines.join('\n')
  };
}

export async function importDatabaseFromSQL(sqlContent: string) {
  if (!db) {
    return { success: false, message: 'Database is not initialized.' };
  }

  const normalizedContent = sqlContent?.trim();
  if (!normalizedContent) {
    return { success: false, message: 'The SQL file is empty.' };
  }

  const statements = parseSqlStatements(normalizedContent);
  if (statements.length === 0) {
    return { success: false, message: 'No valid SQL statements found in file.' };
  }

  try {
    await db.execute('PRAGMA foreign_keys = OFF;');
    await db.execute('BEGIN TRANSACTION;');

    for (const statement of statements) {
      await db.execute(`${statement};`);
    }

    await db.execute('COMMIT;');
    await db.execute('PRAGMA foreign_keys = ON;');
    return { success: true, message: 'Data imported successfully.' };
  } catch (error) {
    await db.execute('ROLLBACK;').catch(() => undefined);
    await db.execute('PRAGMA foreign_keys = ON;').catch(() => undefined);
    console.error('Error importing SQL:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Failed to import SQL data: ${errorMessage}` };
  }
}
