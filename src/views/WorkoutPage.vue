<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title slot="start" class="title">Workout</ion-title>
        <div class="timer">{{ formatTime() }}</div>
        <ion-buttons  slot="end">
          <ion-button @click="saveWorkout">stop</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Workout</ion-title>
        </ion-toolbar>
      </ion-header>



      <ion-card class="exercise-card"  v-for="ex in workoutExercises" :key="ex.id">
        <ion-card-header>
          <div class="exercise-header">
            <ion-card-title>{{ ex.name }}</ion-card-title>
            <div class="rest-settings" @click="editRestTime(ex)">
              <ion-icon :icon="timerOutline"></ion-icon>
              <span>{{ ex.rest_seconds }}s</span>
            </div>
          </div>
        </ion-card-header>
        <ion-card-content>
          <div class="set" v-for="set in ex.sets" :key="set.id">
            <ion-checkbox slot="start" v-model="set.completed" @ionChange="() => handleSetChange(ex, set)" class="checkbox"></ion-checkbox>
            <div class="input-container">
              <ion-input fill="outline" type="number" placeholder="kg" v-model.number="set.weight" @ionBlur="saveSet(set)" class="input-small"></ion-input>
              <span class="unit">Kg</span>
            </div>
            <div class="input-container">
              <ion-input fill="outline" type="number" placeholder="reps" v-model.number="set.reps" @ionBlur="saveSet(set)" class="input-small"></ion-input>
              <span class="unit">reps</span>
            </div>
          </div>

          <!-- Add Set Button -->
          <ion-button expand="block" fill="outline" @click="addNewSet(ex)" class="add-set-btn">
            <ion-icon slot="start" :icon="addOutline"></ion-icon>
            Add Set
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Add Exercise Button -->
      <div class="add-exercise-container">
        <ion-button expand="block" @click="addNewExercise" class="add-exercise-btn">
          <ion-icon slot="start" :icon="addCircleOutline"></ion-icon>
          Add Exercise
        </ion-button>
      </div>

      <div class="cancel-container">
        <ion-button expand="block" fill="outline" @click="handleCancelWorkout">Cancel Workout</ion-button>
      </div>

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
            <ion-button fill="solid" color="danger" @click="skipRestTimer" class="skip-btn">
              Skip
            </ion-button>
          </div>
        </div>
        <div class="rest-progress-bar" :style="{ width: restProgress + '%' }"></div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent,IonButtons,IonButton,IonCard,IonCardHeader,IonCardContent,IonCheckbox,IonInput,IonCardTitle,onIonViewWillEnter,onIonViewDidEnter, alertController, IonIcon } from '@ionic/vue';
import { ref, onUnmounted, shallowRef, computed } from 'vue';
import { useRouter,useRoute } from 'vue-router';
import { addCircleOutline, addOutline, timerOutline } from 'ionicons/icons';

import { getWorkoutExercises,getWorkoutSets,updateWorkoutSet,getWorkoutById,endWorkout,cancelWorkout, addSetToWorkoutExercise, getNextSetNumber } from '@/services/gym_db';

const router = useRouter();
// id from route
const route = useRoute();
const workoutId = Number(route.params.id);
console.log("Workout ID:", workoutId);

// exercise data 

const workoutExercises = shallowRef<any[]>([]);


const loadWorkout = async () => {
  const workout = await getWorkoutById(workoutId);
  startTime.value = workout?.time_start ? workout.time_start.replace(' ', 'T') + 'Z' : null;

  const data = await getWorkoutExercises(workoutId);

  for (const ex of data) {
      const sets = await getWorkoutSets(ex.id);

      ex.sets = sets.map((s: any) => ({
      ...s,
      completed: !!s.completed
    }));
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

const handleSetChange = async (exercise: any, set: any) => {
  await saveSet(set);
  if (set.completed) {
    startRestTimer(exercise.rest_seconds);
  } else {
    // If user unchecks, maybe they want to stop the timer? 
    // Usually not necessary, but we could stop it if it was the last action.
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
  await endWorkout(workoutId, Date.now());
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
    // Reload the entire workout to ensure reactivity
    await loadWorkout();
  }
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

const startRestTimer = (seconds: number) => {
  if (restInterval) clearInterval(restInterval);
  
  restTimer.value.total = seconds;
  restTimer.value.remaining = seconds;
  restTimer.value.isActive = true;

  restInterval = setInterval(() => {
    if (restTimer.value.remaining > 0) {
      restTimer.value.remaining--;
    } else {
      stopRestTimer();
    }
  }, 1000);
};

const stopRestTimer = () => {
  if (restInterval) clearInterval(restInterval);
  restInterval = null;
  restTimer.value.isActive = false;
};

const skipRestTimer = () => {
  stopRestTimer();
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
  border-radius: 12px;
  padding: 0 16px;
}
/* exercise cards */
.exercise-card{
  width: 100%;
  margin: 20px auto ;
}
.exercise-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.rest-settings {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--ion-color-step-200);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  color: var(--ion-color-primary);
  cursor: pointer;
}
.set{
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  margin-bottom: 5px;
  background-color: var(--ion-color-medium);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.input-small {
  width: 100px; /* small input boxes for kg/reps */
  height: 30px;
  --padding-start: 5px;
  --padding-end: 5px;
  text-align: center;
  --placeholder-color: #ddd;
  --placeholder-opacity: 0.8;
}
.input-container {
  display: flex;
  align-items: center;
  gap: 5px;
}.unit {
  font-size: 0.9rem;
  color: #888;
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
  --border-radius: 10px;
  font-weight: 700;
}

.add-set-btn {
  margin-top: 10px;
  --border-radius: 8px;
}

/* Rest Timer Overlay */
.rest-timer-overlay {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--ion-color-dark);
  color: white;
  padding: 16px;
  z-index: 1000;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.3);
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
  bottom: 0;
  left: 0;
  height: 4px;
  background: var(--ion-color-primary);
  transition: width 1s linear;
}

</style>