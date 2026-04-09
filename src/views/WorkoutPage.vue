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
                <ion-card-header >
                <ion-card-title>{{ ex.name }}</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <div class="set" v-for="set in ex.sets" :key="set.id">
                    <ion-checkbox slot="start" v-model="set.completed" @ionChange="() => saveSet(set)" class="checkbox"></ion-checkbox>
                    <div class="input-container"><ion-input fill="outline" type="number" placeholder="kg" v-model.number="set.weight" @ionBlur="saveSet(set)" class="input-small"></ion-input><span class="unit">Kg</span></div>
                    <div class="input-container"><ion-input fill="outline" type="number" placeholder="reps" v-model.number="set.reps" @ionBlur="saveSet(set)" class="input-small"></ion-input><span class="unit">reps</span></div>
                  </div>
                </ion-card-content>
            </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent,IonButtons,IonButton,IonCard,IonCardHeader,IonCardContent,IonCheckbox,IonInput,IonCardTitle,onIonViewWillEnter,onUnmounted } from '@ionic/vue';
import { ref } from 'vue';
import { useRouter,useRoute } from 'vue-router';

import { getWorkoutExercises,getWorkoutSets,updateWorkoutSet,getWorkoutById,endWorkout,saveWorkoutTotalKg } from '@/services/gym_db';

const router = useRouter();
// id from route
const route = useRoute();
const workoutId = Number(route.params.id);
console.log("Workout ID:", workoutId);

// exercise data 

const workoutExercises = ref<any[]>([]);


const loadWorkout = async () => {
  const workout = await getWorkoutById(workoutId);
  startTime.value = workout?.time_start.replace(' ', 'T') + 'Z';

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


const saveWorkout = async ()=>{
  await endWorkout(workoutId, Date.now());
  console.log("Workout saved!");

  router.push('/tabs/Home');
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




onIonViewWillEnter(async () => {
  await loadWorkout();
  startTimer();
});

onUnmounted(() => {
  if (interval) {
    clearInterval(interval);
    interval = null;
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
  --color: #ffffff;                                 
  --color-activated: #000100;                       
  border-radius: 12px;
  padding: 0 16px;
}
/* exercise cards */
.exercise-card{
  width: 100%;
  margin: 20px auto ;
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

</style>