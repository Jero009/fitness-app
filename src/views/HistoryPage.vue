<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title class="title">History</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">History</ion-title>
        </ion-toolbar>
      </ion-header>
          <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
            <ion-refresher-content></ion-refresher-content>
          </ion-refresher>
          <div v-for="w in workouts" :key="w.id">
            <ion-card class="card-template">
                <ion-card-header>
                  <ion-card-title>{{ w.name || 0 }}</ion-card-title>
                  <ion-card-subtitle>{{ formatDuration(w.time_start, w.time_end) }}</ion-card-subtitle>
                  <ion-card-subtitle>{{ w.total_kg }} kg</ion-card-subtitle>
                </ion-card-header>
                <ion-card-content>
                  <ion-list >
                      <ion-item v-for="ex in w.exercises" :key="ex.id">
                        <span>{{ ex.name }} </span> <span> {{ ex.set_count }} x {{ ex.reps }} </span>
                      </ion-item>
                  </ion-list>
                </ion-card-content>
            </ion-card>
          </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent,IonCard,IonCardHeader,IonCardContent,IonCardSubtitle,IonCardTitle,IonList,IonItem, 
IonRefresher, IonRefresherContent, RefresherCustomEvent, onIonViewWillEnter } from '@ionic/vue';
import { getWorkouts,getWorkoutHistoryExercises } from '@/services/gym_db'
import { onMounted ,ref} from 'vue';



const workouts = ref<any[]>([]);

const LoadHistory = async () =>{
  const data = await getWorkouts();

  for (const workout of data) {
    workout.exercises = await getWorkoutHistoryExercises(workout.id);

    // workout duration is already formatted in the template
  }

  workouts.value = data;
}
//time calculation
const formatDuration = (start: string, end: any) => {
  if (!start || !end) return '0h 0m 0s';

  // parse start (string)
  const s = new Date(start.replace(' ', 'T') + 'Z').getTime();

  // parse end (can be string, number, or stringified number)
  let e: number;
  if (typeof end === 'number') {
    e = end;
  } else if (!isNaN(Number(end))) {
    e = Number(end);
  } else {
    e = new Date(end.replace(' ', 'T') + 'Z').getTime();
  }

  if (isNaN(s) || isNaN(e)) return 'Invalid time';

  const diff = Math.max(0, e - s);
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}h ${minutes}m ${seconds}s`;
};
//refresh 

 const handleRefresh = async  (event: RefresherCustomEvent) => {
   await LoadHistory()
   event.target.complete();
  };


  onMounted(() => {
    LoadHistory()
  });

  onIonViewWillEnter(() => {
    LoadHistory()

});

</script>
