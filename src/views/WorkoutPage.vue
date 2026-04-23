<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title slot="start" class="title">Workout</ion-title>
        <div class="timer">{{ formatTime() }}</div>
        <ion-buttons  slot="end">
          <ion-button @click="isReorderMode = !isReorderMode" :color="isReorderMode ? 'warning' : ''">
            <ion-icon :icon="reorderThreeOutline"></ion-icon>
          </ion-button>
          <ion-button class="button-red" @click="saveWorkout">stop</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Workout</ion-title>
        </ion-toolbar>
      </ion-header>

      <Draggable 
        v-model="workoutExercises" 
        item-key="id" 
        handle=".reorder-handle"
        @end="onReorderEnd"
      >
        <template #item="{ element: ex }">
          <div class="exercise-sliding-item">
            <ion-card class="exercise-card">
                <ion-card-header>
                  <div class="exercise-header">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <div class="reorder-handle" v-if="isReorderMode">
                        <ion-icon :icon="reorderThreeOutline" style="font-size: 1.5rem;"></ion-icon>
                      </div>
                      <ion-card-title>{{ ex.name }}</ion-card-title>
                    </div>
                    <div class="rest-settings" @click="editRestTime(ex)">
                      <ion-icon :icon="timerOutline"></ion-icon>
                      <span>{{ ex.rest_seconds }}s</span>
                    </div>
                  </div>
                </ion-card-header>
                <ion-card-content>
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
                    </ion-item>
                    <ion-item-options side="end">
                      <ion-item-option color="danger" @click="handleRemoveSet(ex.id, set.id)">
                        Remove
                      </ion-item-option>
                    </ion-item-options>
                  </ion-item-sliding>

                  <!-- Add Set Button -->
                  <ion-button  expand="block" fill="outline" @click="addNewSet(ex)" class="add-set-btn">
                    <ion-icon class="add-set-icon" :icon="addOutline"></ion-icon>
                    Add Set
                  </ion-button>
                </ion-card-content>
            </ion-card>
          </div>
        </template>
      </Draggable>

      <!-- Add Exercise Button -->
      <div class="add-exercise-container">
        <ion-button expand="block" @click="addNewExercise" class="add-exercise-btn">
          <ion-icon slot="start" :icon="addCircleOutline"></ion-icon>
          Add Exercise
        </ion-button>
      </div>

      <div class="cancel-container">
        <ion-button class="button-red" expand="block" fill="outline" @click="handleCancelWorkout">Cancel Workout</ion-button>
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
/*top bar*/
.timer {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'Doto', sans-serif;
  pointer-events: none; 
}
.title {
  margin-left: 10px;
}
.btn-quickstart {
  --background: var(--ion-color-accent-red);        
  --background-activated: var(--ion-color-accent-yellow); 
  --color: var(--ion-color-light);                                 
  --color-activated: var(--ion-color-dark);                       
  border-radius: 3px;
  padding: 0 16px;
}
/* exercise cards */
.exercise-card{
  width: 100%;
  margin: 20px auto ;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: none;
}

.exercise-sliding-item {
  margin: 0 8px;
  background-color: transparent;
}

.exercise-slide-host {
  --background: transparent;
  --padding-start: 0;
  --inner-padding-end: 0;
  --inner-border-width: 0;
}
.exercise-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color:var(--ion-color-light)
}
.rest-settings {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.06);
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 0.8rem;
  color: var(--ion-color-primary);
  cursor: pointer;
}
.set{
  width: 100%;
  padding: 14px;
  border-radius: 3px;
  margin-bottom: 5px;
  --background: transparent;
  --inner-border-width: 0;
  --inner-padding-end: 0;
  --padding-start: 0;
  border: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.set-sliding {
  margin-bottom: 5px;
  --background: transparent;
  background: transparent;
}
.input-small {
  width: 100%;
  height: 54px;
  --padding-start: 0;
  --padding-end: 0;
  --background: rgba(255, 255, 255, 0.03);
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
  max-width: 160px;
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
  --size: 28px;
  --checkmark-width: 4px;
  --border-color: var(--ion-color-accent-red);
  --border-color-checked: var(--ion-color-accent-red);
  --checkbox-background: transparent;
  --checkbox-background-checked: var(--ion-color-accent-red);
  --border-radius: 6px;
}

.cancel-container {
  padding: 16px;
  margin-top: 20px;
  margin-bottom: 20px;
}

.add-exercise-container {
  color: var(--ion-color-accent-yellow);
  padding: 16px;
  padding-top: 8px;
}

.add-exercise-btn {
  --background: var(--ion-color-accent-yellow) !important;
  --background-activated: var(--ion-color-accent-red) !important;
  --color: var(--ion-color-dark) !important;
  --color-activated: var(--ion-color-light) !important;
  --border-radius: 3px;
  font-weight: 700;
}

.add-set-btn {
  background: var(--ion-color-primary);
  margin-top: 10px;
  --border-radius: 3px;
  color: var(--ion-color-accent-yellow);
}

.add-set-icon {
  color: var(--ion-color-accent-yellow);
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

.reorder-handle {
  cursor: grab;
  color: var(--ion-color-medium);
  display: flex;
  align-items: center;
}

.reorder-handle:active {
  cursor: grabbing;
}

</style>
<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent,IonButtons,IonButton,IonCard,IonCardHeader,IonCardContent,IonCheckbox,IonInput,IonCardTitle,onIonViewWillEnter,onIonViewDidEnter, alertController, IonIcon, IonItemSliding, IonItemOptions, IonItemOption, IonItem } from '@ionic/vue';
import { ref, onUnmounted, computed } from 'vue';
import { useRouter,useRoute } from 'vue-router';
import { addCircleOutline, addOutline, timerOutline, reorderThreeOutline } from 'ionicons/icons';
import Draggable from 'vuedraggable';

import { getWorkoutExercises,getWorkoutSets,updateWorkoutSet,getWorkoutById,endWorkout,cancelWorkout, addSetToWorkoutExercise, getNextSetNumber, deleteWorkoutSet, deleteWorkoutExercise, getLatestCompletedSetsForExercise, updateWorkoutExerciseOrder } from '@/services/gym_db';

const router = useRouter();
// id from route
const route = useRoute();
const workoutId = Number(route.params.id);
console.log("Workout ID:", workoutId);

// exercise data 

const workoutExercises = ref<any[]>([]);
const isReorderMode = ref(false);

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
  }

  workoutExercises.value = data;

  console.log(workoutExercises.value);
};

const onReorderEnd = async () => {
  console.log('Reorder ended. Updating DB...');
  for (let i = 0; i < workoutExercises.value.length; i++) {
    await updateWorkoutExerciseOrder(workoutExercises.value[i].id, i);
  }
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
