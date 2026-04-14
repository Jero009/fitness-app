<template>
<ion-page>
  <ion-header>
    <ion-toolbar>
        <ion-title class="title">Exercises</ion-title>
      </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Exercises</ion-title>
        </ion-toolbar>
      </ion-header>
          <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
            <ion-refresher-content></ion-refresher-content>
          </ion-refresher>
            <div class="card-template">
                <ion-item>
                  <ion-select v-model="selectedMuscleGroup" placeholder="Filter by muscle group" interface="action-sheet">
                    <ion-select-option value="">All</ion-select-option>
                    <ion-select-option v-for="mg in muscleGroups" :key="mg.id" :value="mg.name">
                      {{ mg.name }}
                    </ion-select-option>
                  </ion-select>
                </ion-item>

                      <ion-list class="exercise-list" lines="full">
                        <ion-item class="exercise-item" v-for="ex in filteredExercises" :key="ex.id" @click="selectExercise(ex)">
                          {{ ex.name }}
                        </ion-item>
                      </ion-list>
            </div>
        
  </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonSelect, IonSelectOption, IonRefresher, IonRefresherContent, onIonViewWillEnter } from '@ionic/vue';
import type { RefresherCustomEvent } from '@ionic/vue';
import { ref, onMounted, computed } from 'vue';
import { getExercises, getMuscleGroups, addExerciseToWorkout, getNextWorkoutOrderIndex } from '@/services/gym_db';
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();

const route = useRoute();

// exercise selection - handles both template and workout contexts
const selectExercise = async (exercise: exercise) => {
  const workoutId = Number(route.query.workoutId);

  if (!isNaN(workoutId)) {
    // Adding exercise to an active workout
    const orderIndex = await getNextWorkoutOrderIndex(workoutId);
    await addExerciseToWorkout(workoutId, exercise.id, orderIndex, 3, 10, 0);

    // Navigate back to the workout page
    router.push({
      name: 'Workout',
      params: { id: workoutId.toString() }
    });
  } else {
    // Original template behavior
    localStorage.setItem('selectedExerciseForTemplate', JSON.stringify(exercise));

    const templateId = Number(route.query.templateId);

    if (!isNaN(templateId)) {
      router.push({
        name: 'TemplateEditor',
        params: { id: templateId }
      });
    } else {
      router.push({ name: 'TemplateBuilder' });
    }
  }
};


const exercises = ref<exercise[]>([])
const selectedMuscleGroup = ref('');


// get exercises from db

type exercise = {
  id: number;
  name: string;
  muscle_group: string;
  equipment: string;
}


const LoadExercises = async () =>{
  const data = await getExercises();
  exercises.value = data;
  
};
// get muscle group for select options
const muscleGroups = ref<any[]>([]);



//exercise sort


const filteredExercises = computed(() => {
  return exercises.value
    .filter(ex => !selectedMuscleGroup.value || ex.muscle_group === selectedMuscleGroup.value)
    .sort((a, b) => a.muscle_group.localeCompare(b.muscle_group));
});

//refresh 

const handleRefresh = async (event: RefresherCustomEvent) => {
  await LoadExercises();
  event.target.complete();
};


onMounted(() => {
    LoadExercises()
    getMuscleGroups().then(data => muscleGroups.value = data);
});

onIonViewWillEnter(() => {
    LoadExercises()
    getMuscleGroups().then(data => muscleGroups.value = data);
});

</script>
<style>
.exercise-list {
  margin: 10px auto ;
  width: 100%;
}

</style>