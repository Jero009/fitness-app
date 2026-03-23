<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
 
        <ion-title slot="start" class="title">Workout</ion-title>


        <div class="timer">00:12:34</div>

        <ion-buttons  slot="end">
          <ion-button >Start</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Workout</ion-title>
        </ion-toolbar>
      </ion-header>
            <ion-card class="exercise-card">
                <ion-card-header >
                <ion-card-title>Exercise name</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <div class="set">
                    <ion-checkbox slot="start" v-model="set1.completed" class="checkbox"></ion-checkbox>
                    <div class="input-container"><ion-input fill="outline" type="number" placeholder="kg" v-model.number="set1.weight" class="input-small"></ion-input><span class="unit">Kg</span></div>
                    <div class="input-container"><ion-input fill="outline" type="number" placeholder="reps" v-model.number="set1.reps" class="input-small"></ion-input><span class="unit">reps</span></div>
                  </div>
                </ion-card-content>

            </ion-card>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent,IonButtons,IonButton,IonCard,IonCardHeader,IonCardContent,IonCheckbox,IonInput,IonCardTitle } from '@ionic/vue';
import ExploreContainer from '@/components/ExploreContainer.vue';
import { ref } from 'vue';
import { useRoute } from 'vue-router';


const set1 = ref({ completed: false, weight: null, reps: null });




const route = useRoute();

const workoutId = Number(route.params.id);
console.log("Workout ID:", workoutId);

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
  --color-activated: #000000;                       
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