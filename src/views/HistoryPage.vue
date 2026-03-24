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
                  <ion-card-subtitle>{{ w.time_end - w.time_start }} seconds</ion-card-subtitle>
                  <ion-card-subtitle>{{ w.total_kg }} kg</ion-card-subtitle>
                </ion-card-header>
                <ion-card-content>
                  <ion-list >
                      <ion-item v-for="ex in w.exercises" :key="ex.name">
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
  }

  workouts.value = data;

}
//refresh 

 const handleRefresh = async  (event: RefresherCustomEvent) => {
   await getWorkouts()
   await LoadHistory()
   event.target.complete();
  };


  onMounted(() => {
    getWorkouts()
    LoadHistory()
  });

  onIonViewWillEnter(() => {
    getWorkouts()
    LoadHistory()

});

</script>
