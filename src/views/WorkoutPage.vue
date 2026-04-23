<template>
  <ion-page>
    <ion-content :fullscreen="true" class="workout-content">
      <div class="workout-background"></div>

      <div class="workout-layout">
        <section class="top-hero">
          <div class="hero-head">
            <div>
              <h1 class="hero-title">Workout Control</h1>
              <p class="hero-subtitle">Live session · {{ formatTime() }}</p>
            </div>
            <ion-button fill="clear" class="hero-stop-btn" @click="saveWorkout">Stop</ion-button>
          </div>

          <div class="hero-icon-circle">
            <ion-icon :icon="barbellOutline"></ion-icon>
          </div>

          <div class="hero-metrics">
            <div class="metric-chip">
              <span class="chip-label">Exercises</span>
              <span class="chip-value">{{ workoutExercises.length }}</span>
            </div>
            <div class="metric-chip">
              <span class="chip-label">Sets Done</span>
              <span class="chip-value">{{ completedSetsCount }}/{{ totalSetsCount }}</span>
            </div>
          </div>
        </section>

        <section class="workout-main-card">
          <div class="main-card-header">
            <h2>Current Workout</h2>
            <ion-button fill="solid" size="small" class="primary-add-btn" @click="addNewExercise">
              <ion-icon slot="start" :icon="addCircleOutline"></ion-icon>
              Add
            </ion-button>
          </div>

          <div v-if="workoutExercises.length === 0" class="empty-state">
            Add your first exercise to start logging sets.
          </div>

          <div v-for="ex in workoutExercises" :key="ex.id" class="exercise-block">
            <div class="exercise-header">
              <div>
                <h3>{{ ex.name }}</h3>
                <p v-if="ex.previous_set_count > 0" class="last-workout-summary">
                  Last workout: {{ ex.previous_set_count }} set{{ ex.previous_set_count === 1 ? '' : 's' }}
                </p>
              </div>
              <div class="exercise-actions">
                <div class="rest-settings" @click="editRestTime(ex)">
                  <ion-icon :icon="timerOutline"></ion-icon>
                  <span>{{ ex.rest_seconds }}s</span>
                </div>
                <div class="exercise-move-controls">
                  <ion-button
                    fill="clear"
                    size="small"
                    class="move-btn"
                    :disabled="isFirstExercise(ex.id)"
                    @click="moveExercise(ex.id, -1)"
                  >
                    <ion-icon :icon="arrowUpOutline"></ion-icon>
                  </ion-button>
                  <ion-button
                    fill="clear"
                    size="small"
                    class="move-btn"
                    :disabled="isLastExercise(ex.id)"
                    @click="moveExercise(ex.id, 1)"
                  >
                    <ion-icon :icon="arrowDownOutline"></ion-icon>
                  </ion-button>
                </div>
              </div>
            </div>

            <ion-item-sliding class="set-sliding" v-for="set in ex.sets" :key="set.id">
              <ion-item lines="none" class="set">
                <ion-checkbox slot="start" v-model="set.completed" @ionChange="(ev) => handleSetChange(ex, set, ev)" class="checkbox"></ion-checkbox>
                <div class="input-container metric-field">
                  <ion-input fill="outline" type="number" :placeholder="getWeightPlaceholder(ex, set)" v-model.number="set.weight" @ionBlur="saveSet(set)" class="input-small"></ion-input>
                  <span class="unit">Kg</span>
                </div>
                <div class="input-container metric-field">
                  <ion-input fill="outline" type="number" :placeholder="getRepsPlaceholder(ex, set)" v-model.number="set.reps" @ionBlur="saveSet(set)" class="input-small"></ion-input>
                  <span class="unit">reps</span>
                </div>
                <div v-if="hasPreviousSetData(set)" class="last-set-values">
                  Last: {{ formatPreviousSet(set) }}
                </div>
              </ion-item>
              <ion-item-options side="end">
                <ion-item-option color="danger" @click="handleRemoveSet(ex.id, set.id)">
                  Remove
                </ion-item-option>
              </ion-item-options>
            </ion-item-sliding>

            <ion-button expand="block" fill="outline" @click="addNewSet(ex)" class="add-set-btn">
              <ion-icon class="add-set-icon" :icon="addOutline"></ion-icon>
              Add Set
            </ion-button>
          </div>
        </section>

        <section class="bottom-square-grid">
          <button class="square-tile" type="button" @click="addNewExercise">
            <ion-icon :icon="addCircleOutline"></ion-icon>
            <span>Add Exercise</span>
          </button>
          <button class="square-tile" type="button" @click="handleCancelWorkout">
            <ion-icon :icon="closeCircleOutline"></ion-icon>
            <span>Cancel Workout</span>
          </button>
          <div class="square-tile stat-tile">
            <ion-icon :icon="checkmarkDoneOutline"></ion-icon>
            <span>Completed</span>
            <strong>{{ completedSetsCount }}</strong>
          </div>
          <div class="square-tile stat-tile">
            <ion-icon :icon="statsChartOutline"></ion-icon>
            <span>Volume</span>
            <strong>{{ totalVolumeKg }} kg</strong>
          </div>
        </section>
      </div>
    </ion-content>

    <!-- Rest Timer Overlay -->
    <div v-if="restTimer.isActive" class="rest-timer-overlay">
      <div class="rest-timer-content">
        <div class="rest-timer-info">
          <span class="rest-label">Resting</span>
          <span class="rest-time">{{ formatRestTime(restTimer.remaining) }}</span>
        </div>
        <div class="rest-timer-controls">
          <ion-button fill="clear" color="light" @click="adjustRestTimer(-15)">
            -15s
          </ion-button>
          <ion-button fill="clear" color="light" @click="adjustRestTimer(15)">
            +15s
          </ion-button>
          <ion-button fill="solid" color="danger" @click.stop="onSkipRestTimer" class="skip-btn">
            Skip
          </ion-button>
        </div>
      </div>
      <div class="rest-progress-bar" :style="{ width: restProgress + '%' }"></div>
    </div>
  </ion-page>
</template>
<style>
.workout-content {
  --background: #050505;
}

.workout-background {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 50% 2%, rgba(230, 230, 230, 0.15), rgba(10, 10, 10, 0) 33%),
    radial-gradient(circle at 14% 30%, rgba(255, 255, 255, 0.07), rgba(10, 10, 10, 0) 30%),
    linear-gradient(180deg, #070707 0%, #060606 55%, #090909 100%);
}

.workout-layout {
  position: relative;
  z-index: 1;
  max-width: 880px;
  margin: 0 auto;
  padding: calc(env(safe-area-inset-top, 0px) + 10px) 16px 26px;
}

.top-hero {
  margin-bottom: 16px;
}

.hero-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
}

.hero-title {
  margin: 0;
  font-size: 1.95rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #f6f6f6;
}

.hero-subtitle {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.66);
  font-size: 0.95rem;
}

.hero-stop-btn {
  --color: #ff5656;
  --background: rgba(255, 86, 86, 0.12);
  --border-radius: 999px;
  font-weight: 700;
}

.hero-icon-circle {
  margin: 0 auto;
  width: 118px;
  height: 118px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: radial-gradient(circle at 28% 20%, #2a2a2a 0%, #161616 55%, #101010 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.5);
}

.hero-icon-circle ion-icon {
  font-size: 2.8rem;
  color: #f4f4f4;
}

.hero-metrics {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.metric-chip {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #f2f2f2;
}

.chip-label {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.66);
}

.chip-value {
  font-size: 0.92rem;
  font-weight: 700;
}

.workout-main-card {
  border-radius: 22px;
  background: linear-gradient(160deg, rgba(32, 32, 32, 0.92) 0%, rgba(20, 20, 20, 0.96) 70%);
  border: 1px solid rgba(255, 255, 255, 0.09);
  padding: 14px;
}

.main-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.main-card-header h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #f5f5f5;
}

.primary-add-btn {
  --background: #ececec;
  --color: #101010;
  --border-radius: 999px;
  font-weight: 700;
}

.empty-state {
  color: rgba(255, 255, 255, 0.68);
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed rgba(255, 255, 255, 0.18);
  border-radius: 14px;
  padding: 14px;
  margin: 6px 0;
}

.exercise-block {
  margin-top: 12px;
  padding: 12px;
  border-radius: 14px;
  background: rgba(7, 7, 7, 0.34);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.exercise-header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: flex-start;
  color: #f5f5f5;
  margin-bottom: 8px;
}

.exercise-header h3 {
  margin: 0;
  font-size: 1.05rem;
}

.exercise-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.exercise-move-controls {
  display: flex;
  align-items: center;
  gap: 2px;
}

.move-btn {
  --color: rgba(255, 255, 255, 0.84);
  --padding-start: 6px;
  --padding-end: 6px;
  min-height: 30px;
}

.last-workout-summary {
  margin: 6px 0 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}

.rest-settings {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.08);
  padding: 5px 8px;
  border-radius: 8px;
  font-size: 0.8rem;
  color: #f0f0f0;
  cursor: pointer;
}

.set {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  margin-bottom: 5px;
  --background: transparent;
  --inner-border-width: 0;
  --inner-padding-end: 0;
  --padding-start: 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.last-set-values {
  width: 100%;
  margin-top: 8px;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.62);
}

.set-sliding {
  margin-bottom: 5px;
  --background: transparent;
  background: transparent;
}
.input-small {
  width: 100%;
  height: 50px;
  --padding-start: 0;
  --padding-end: 0;
  --background: rgba(255, 255, 255, 0.06);
  --border-color: rgba(255, 255, 255, 0.12);
  --border-radius: 8px;
  text-align: center;
  --placeholder-color: rgba(255, 255, 255, 0.9);
  --placeholder-opacity: 0.8;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--ion-color-light);
}
.input-container {
  display: flex;
  align-items: center;
  gap: 5px;
}

.metric-field {
  position: relative;
  flex: 1;
  max-width: 148px;
}

.metric-field .unit {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
  pointer-events: none;
}

.checkbox {
  --size: 26px;
  --checkmark-width: 4px;
  --border-color: #f0f0f0;
  --border-color-checked: #f0f0f0;
  --checkbox-background: transparent;
  --checkbox-background-checked: #f0f0f0;
  --checkmark-color: #111;
  --border-radius: 6px;
}

.add-set-btn {
  background: transparent;
  margin-top: 10px;
  --border-radius: 10px;
  --border-color: rgba(255, 255, 255, 0.16);
  color: #f0f0f0;
}

.add-set-icon {
  color: #f0f0f0;
}

.bottom-square-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.square-tile {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 22px;
  min-height: 120px;
  background: linear-gradient(160deg, rgba(30, 30, 30, 0.9) 0%, rgba(18, 18, 18, 0.96) 100%);
  color: #f4f4f4;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px;
  text-align: left;
}

.square-tile ion-icon {
  font-size: 1.6rem;
  color: #f0f0f0;
}

.square-tile span {
  font-size: 0.95rem;
}

.square-tile strong {
  font-size: 1.2rem;
  line-height: 1;
}

.square-tile:active {
  transform: scale(0.99);
}

.stat-tile {
  cursor: default;
}

/* Rest Timer Overlay */
.rest-timer-overlay {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 56px);
  left: 0;
  right: 0;
  background: rgba(20, 20, 20, 0.98);
  color: white;
  padding: 16px;
  z-index: 9999;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.45);
}

.rest-timer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rest-timer-info {
  display: flex;
  flex-direction: column;
}

.rest-label {
  font-size: 0.8rem;
  opacity: 0.7;
}

.rest-time {
  font-size: 1.8rem;
  font-weight: bold;
  font-family: 'Doto', sans-serif;
}

.rest-timer-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.skip-btn {
  --border-radius: 8px;
  font-weight: bold;
}

.rest-progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 4px;
  background: var(--ion-color-primary);
  transition: width 1s linear;
}

@media (max-width: 430px) {
  .hero-title {
    font-size: 1.65rem;
  }

  .hero-icon-circle {
    width: 102px;
    height: 102px;
  }

  .metric-field {
    max-width: 135px;
  }
}

</style>
<script setup lang="ts">
import { IonPage, IonContent, IonButton, IonCheckbox, IonInput, onIonViewWillEnter, onIonViewDidEnter, alertController, IonIcon, IonItemSliding, IonItemOptions, IonItemOption, IonItem } from '@ionic/vue';
import { ref, onUnmounted, computed } from 'vue';
import { useRouter,useRoute } from 'vue-router';
import { addCircleOutline, addOutline, arrowDownOutline, arrowUpOutline, barbellOutline, checkmarkDoneOutline, closeCircleOutline, statsChartOutline, timerOutline } from 'ionicons/icons';

import { getWorkoutExercises,getWorkoutSets,updateWorkoutSet,getWorkoutById,endWorkout,cancelWorkout, addSetToWorkoutExercise, getNextSetNumber, deleteWorkoutSet, deleteWorkoutExercise, getLatestCompletedSetsForExercise, updateWorkoutExerciseOrder } from '@/services/gym_db';

const router = useRouter();
// id from route
const route = useRoute();
const workoutId = Number(route.params.id);
console.log("Workout ID:", workoutId);

// exercise data 

const workoutExercises = ref<any[]>([]);

const totalSetsCount = computed(() => {
  return workoutExercises.value.reduce((count, exercise) => count + (exercise.sets?.length || 0), 0);
});

const completedSetsCount = computed(() => {
  return workoutExercises.value.reduce((count, exercise) => {
    const completed = (exercise.sets || []).filter((set: any) => !!set.completed).length;
    return count + completed;
  }, 0);
});

const totalVolumeKg = computed(() => {
  return workoutExercises.value.reduce((total, exercise) => {
    const exerciseVolume = (exercise.sets || []).reduce((sum: number, set: any) => {
      const reps = Number(set.reps) || 0;
      const weight = Number(set.weight) || 0;
      return sum + (reps * weight);
    }, 0);
    return total + exerciseVolume;
  }, 0);
});

const normalizeDateInput = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const normalized = raw.includes(' ') ? raw.replace(' ', 'T') : raw;
  const hasTimezone = /(?:Z|[-+]\d{2}:?\d{2})$/i.test(normalized);
  return hasTimezone ? normalized : `${normalized}Z`;
};


const loadWorkout = async () => {
  const workout = await getWorkoutById(workoutId);
  startTime.value = normalizeDateInput(workout?.time_start);

  const data = await getWorkoutExercises(workoutId);

  for (const ex of data) {
      const sets = await getWorkoutSets(ex.id);
      const previousSets = await getLatestCompletedSetsForExercise(ex.exercise_id, workoutId);
      const previousSetByNumber = new Map<number, any>(
        previousSets.map((row: any) => [Number(row.set_number), row])
      );

      ex.sets = sets.map((s: any) => ({
        ...s,
        completed: !!s.completed,
        previous_weight: Number(previousSetByNumber.get(Number(s.set_number))?.weight) || 0,
        previous_reps: Number(previousSetByNumber.get(Number(s.set_number))?.reps) || 0
      }));

      ex.previous_set_count = previousSets.length;
  }

  workoutExercises.value = data;

  console.log(workoutExercises.value);
};

// saving

const saveSet = async (set: any) => {
  await updateWorkoutSet(
  set.id,
  set.reps,
  set.weight,
  set.completed
);
};

const handleSetChange = async (exercise: any, set: any, event?: CustomEvent) => {
  const checked = (event as any)?.detail?.checked;
  const isChecked = typeof checked === 'boolean' ? checked : !!set.completed;
  set.completed = isChecked;

  if (isChecked) {
    startRestTimer(Number(exercise.rest_seconds) || 60);
  } else {
    stopRestTimer();
    sessionStorage.removeItem('restTimer');
  }

  try {
    await saveSet(set);
  } catch (error) {
    console.error('Failed to save set state:', error);
  }
};

const editRestTime = async (exercise: any) => {
  const alert = await alertController.create({
    header: 'Set Rest Time',
    inputs: [
      {
        name: 'restSeconds',
        type: 'number',
        placeholder: 'Seconds',
        value: exercise.rest_seconds
      }
    ],
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Save',
        handler: (data) => {
          exercise.rest_seconds = parseInt(data.restSeconds) || 60;
        }
      }
    ]
  });
  await alert.present();
};

const saveWorkout = async ()=>{
  await endWorkout(workoutId);
  console.log("Workout saved!");

  router.push('/tabs/Home');
};

const handleCancelWorkout = async () => {
  const alert = await alertController.create({
    header: 'Cancel Workout?',
    message: 'Are you sure you want to cancel? This workout will not be saved.',
    buttons: [
      { text: 'No', role: 'cancel' },
      {
        text: 'Yes, Cancel',
        role: 'confirm',
        handler: async () => {
          await cancelWorkout(workoutId);
          console.log("Workout cancelled and deleted from DB");
          if (interval) clearInterval(interval);
          interval = null;
          router.push('/tabs/Home');
        }
      }
    ]
  });

  await alert.present();
};

const handleRemoveSet = async (workoutExerciseId: number, setId: number) => {
  const alert = await alertController.create({
    header: 'Remove Set?',
    message: 'This will remove only this set from the exercise.',
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Remove',
        role: 'destructive',
        handler: async () => {
          await deleteWorkoutSet(Number(setId));

          const currentExercise = workoutExercises.value.find(
            (ex) => Number(ex.id) === Number(workoutExerciseId)
          );
          if (!currentExercise) return;

          const updatedSets = (currentExercise.sets || [])
            .filter((set: any) => Number(set.id) !== Number(setId))
            .map((set: any, index: number) => ({
              ...set,
              set_number: index + 1
            }));

          if (updatedSets.length === 0) {
            await deleteWorkoutExercise(Number(workoutExerciseId));
            workoutExercises.value = workoutExercises.value.filter(
              (ex) => Number(ex.id) !== Number(workoutExerciseId)
            );
            await persistExerciseOrder();
            return;
          }

          workoutExercises.value = workoutExercises.value.map((ex) => {
            if (Number(ex.id) !== Number(workoutExerciseId)) return ex;
            return {
              ...ex,
              sets: updatedSets
            };
          });
        }
      }
    ]
  });

  await alert.present();
};

const persistExerciseOrder = async () => {
  for (let i = 0; i < workoutExercises.value.length; i++) {
    const exercise = workoutExercises.value[i];
    await updateWorkoutExerciseOrder(Number(exercise.id), i + 1);
  }
};

const moveExercise = async (workoutExerciseId: number, direction: number) => {
  const currentIndex = workoutExercises.value.findIndex(
    (ex) => Number(ex.id) === Number(workoutExerciseId)
  );
  if (currentIndex < 0) return;

  const targetIndex = currentIndex + direction;
  if (targetIndex < 0 || targetIndex >= workoutExercises.value.length) return;

  const reordered = [...workoutExercises.value];
  const [movedExercise] = reordered.splice(currentIndex, 1);
  reordered.splice(targetIndex, 0, movedExercise);
  workoutExercises.value = reordered;

  try {
    await persistExerciseOrder();
  } catch (error) {
    console.error('Failed to reorder exercises:', error);
    await loadWorkout();
  }
};

const isFirstExercise = (workoutExerciseId: number) => {
  const index = workoutExercises.value.findIndex(
    (ex) => Number(ex.id) === Number(workoutExerciseId)
  );
  return index <= 0;
};

const isLastExercise = (workoutExerciseId: number) => {
  const index = workoutExercises.value.findIndex(
    (ex) => Number(ex.id) === Number(workoutExerciseId)
  );
  return index === workoutExercises.value.length - 1;
};

// Add new exercise to workout
const addNewExercise = async () => {
  router.push({
    name: 'ExercisePicker',
    query: { workoutId: workoutId.toString() }
  });
};

// Add new set to existing exercise
const addNewSet = async (exercise: any) => {
  const nextSetNum = await getNextSetNumber(exercise.id);
  const defaultReps = exercise.sets && exercise.sets.length > 0 ? exercise.sets[0].reps : 10;

  const newSetId = await addSetToWorkoutExercise(
    exercise.id,
    nextSetNum,
    defaultReps,
    0
  );

  if (newSetId) {
    // Add the new set directly to the exercise's sets array
    const ex = workoutExercises.value.find(e => e.id === exercise.id);
    if (ex) {
      ex.sets.push({
        id: newSetId,
        set_number: nextSetNum,
        reps: defaultReps,
        weight: 0,
        completed: 0,
        previous_weight: 0,
        previous_reps: 0
      });
    }
  }
};

const getWeightPlaceholder = (exercise: any, currentSet: any) => {
  const previousWorkoutWeight = Number(currentSet?.previous_weight);
  if (previousWorkoutWeight > 0) {
    return String(previousWorkoutWeight);
  }

  const sets = exercise?.sets || [];
  const currentIndex = sets.findIndex((set: any) => Number(set.id) === Number(currentSet.id));

  if (currentIndex > 0) {
    for (let i = currentIndex - 1; i >= 0; i--) {
      const candidateWeight = Number(sets[i]?.weight);
      if (candidateWeight > 0) {
        return String(candidateWeight);
      }
    }
  }

  return 'kg';
};

const getRepsPlaceholder = (exercise: any, currentSet: any) => {
  const previousWorkoutReps = Number(currentSet?.previous_reps);
  if (previousWorkoutReps > 0) {
    return String(previousWorkoutReps);
  }

  const sets = exercise?.sets || [];
  const currentIndex = sets.findIndex((set: any) => Number(set.id) === Number(currentSet.id));

  if (currentIndex > 0) {
    for (let i = currentIndex - 1; i >= 0; i--) {
      const candidateReps = Number(sets[i]?.reps);
      if (candidateReps > 0) {
        return String(candidateReps);
      }
    }
  }

  return 'reps';
};

const hasPreviousSetData = (set: any) => {
  const previousWeight = Number(set?.previous_weight);
  const previousReps = Number(set?.previous_reps);
  return previousWeight > 0 || previousReps > 0;
};

const formatPreviousSet = (set: any) => {
  const previousWeight = Number(set?.previous_weight);
  const previousReps = Number(set?.previous_reps);
  const weightLabel = previousWeight > 0 ? `${previousWeight} kg` : '-';
  const repsLabel = previousReps > 0 ? `${previousReps} reps` : '-';
  return `${weightLabel} x ${repsLabel}`;
};

//timer 
const startTime = ref<string | null>(null);
const seconds = ref(0);
let interval: any = null;

const startTimer = () => {
  if (!startTime.value || interval) return;
  interval = setInterval(() => {
    const start = new Date(startTime.value!).getTime();
    const now = Date.now();
    seconds.value = Math.max(0, Math.floor((now - start) / 1000));
  }, 1000);
};
const formatTime = () => {
  const hrs = Math.floor(seconds.value / 3600);
  const mins = Math.floor((seconds.value % 3600) / 60);
  const secs = seconds.value % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// Rest Timer
const restTimer = ref({
  isActive: false,
  remaining: 0,
  total: 0
});
let restInterval: any = null;
let audioContext: AudioContext | null = null;

const playBeep = () => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.warn('Audio playback failed:', e);
  }
};

const saveTimerState = () => {
  if (restTimer.value.isActive) {
    sessionStorage.setItem('restTimer', JSON.stringify({
      remaining: restTimer.value.remaining,
      total: restTimer.value.total,
      endTime: Date.now() + (restTimer.value.remaining * 1000)
    }));
  }
};

const restoreTimerState = () => {
  const saved = sessionStorage.getItem('restTimer');
  if (!saved) return;

  try {
    const { endTime } = JSON.parse(saved);
    const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    if (remaining > 0) {
      startRestTimer(remaining);
    } else {
      sessionStorage.removeItem('restTimer');
    }
  } catch {
    sessionStorage.removeItem('restTimer');
  }
};

const startRestTimer = (seconds: number) => {
  if (restInterval) clearInterval(restInterval);

  restTimer.value.total = seconds;
  restTimer.value.remaining = seconds;
  restTimer.value.isActive = true;
  sessionStorage.removeItem('restTimer');

  restInterval = setInterval(() => {
    if (restTimer.value.remaining > 0) {
      restTimer.value.remaining--;
      saveTimerState();
    } else {
      playBeep();
      stopRestTimer();
      sessionStorage.removeItem('restTimer');
    }
  }, 1000);
};

const stopRestTimer = () => {
  if (restInterval) clearInterval(restInterval);
  restInterval = null;
  restTimer.value.isActive = false;
};

const onSkipRestTimer = (event: Event) => {
  event.preventDefault();
  event.stopPropagation();

  // Force immediate UI close before interval cleanup.
  restTimer.value.remaining = 0;
  restTimer.value.total = 0;
  restTimer.value.isActive = false;

  stopRestTimer();
  sessionStorage.removeItem('restTimer');
};

const adjustRestTimer = (seconds: number) => {
  restTimer.value.remaining = Math.max(0, restTimer.value.remaining + seconds);
  // Also adjust total if we want the progress bar to reflect the new time relative to something
  // But usually adjusting remaining is enough.
};

const formatRestTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

const restProgress = computed(() => {
  if (restTimer.value.total === 0) return 0;
  return (restTimer.value.remaining / restTimer.value.total) * 100;
});


onIonViewWillEnter(async () => {
  await loadWorkout();
  startTimer();
  restoreTimerState();
});

onIonViewDidEnter(async () => {
  // Reload workout data when returning from ExercisePicker
  await loadWorkout();
});

onUnmounted(() => {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  if (restInterval) {
    clearInterval(restInterval);
    restInterval = null;
  }
});

</script>
