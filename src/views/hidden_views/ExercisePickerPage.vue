<template>
<ion-page>
  <ion-header>
    <ion-toolbar>
        <ion-title class="title">EXERCISES</ion-title>
      </ion-toolbar>
  </ion-header>
  <ion-content class="exercise-picker-content">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <section class="picker-hero">
        <div class="hero-left">
          <span class="hero-label">EXERCISE PICKER</span>
          <h1 class="hero-title">CHOOSE THE MOVE</h1>
          <p class="hero-subtitle">Filter by muscle group and tap to add.</p>
        </div>
      </section>

      <div class="picker-summary">
        <div class="summary-left">
          <span class="summary-count">{{ exercises.length }}_TOTAL</span>
          <span class="summary-count">{{ filteredExercises.length }}_VISIBLE</span>
        </div>
        <span class="summary-hint">Tap a card to add it.</span>
      </div>

      <div class="picker-controls">
        <ion-select v-model="selectedMuscleGroup" placeholder="Filter by muscle group" interface="action-sheet" class="muscle-group-select">
          <ion-select-option value="">&nbsp;All</ion-select-option>
          <ion-select-option v-for="mg in muscleGroups" :key="mg.id" :value="mg.name">
            {{ mg.name }}
          </ion-select-option>
        </ion-select>
      </div>

      <div class="exercise-grid">
        <div class="exercise-card" v-for="ex in filteredExercises" :key="ex.id" @click="selectExercise(ex)">
          <div class="exercise-main">
            <span class="exercise-name">{{ ex.name }}</span>
            <span class="exercise-meta">{{ ex.muscle_group }}</span>
          </div>
        </div>
      </div>
        
  </ion-content>
  </ion-page>
</template>
<style scoped>
.exercise-picker-content {
  --background: #0b0b0b;
}

.title {
  font-family: 'Doto', sans-serif;
  letter-spacing: 3px;
}

.picker-hero {
  margin: 20px;
  padding: 18px;
  border-radius: 10px;
  background: linear-gradient(140deg, rgba(255, 210, 0, 0.15), rgba(26, 26, 26, 0.9) 55%);
  border: 1px solid rgba(255, 210, 0, 0.18);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
}

.hero-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hero-label {
  font-family: 'Doto', sans-serif;
  font-size: 11px;
  letter-spacing: 2px;
  color: rgba(255, 210, 0, 0.7);
}

.hero-title {
  font-family: 'Doto', sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  margin: 0;
}

.hero-subtitle {
  margin: 0;
  color: #8a8a8a;
  font-size: 12px;
}

.picker-summary {
  margin: 0 20px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #666;
  font-size: 11px;
  letter-spacing: 1px;
}

.summary-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-count {
  font-family: 'Doto', sans-serif;
  color: #ffd200;
}

.summary-hint {
  color: #666;
}

.picker-controls {
  margin: 0 20px 14px;
}

.muscle-group-select{
  width: 100%;
  --placeholder-color: rgba(255, 210, 0, 0.65);
  --color: #ffd200;
}

.exercise-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  padding: 0 20px 30px;
}

.exercise-card {
  background: #1a1a1a;
  border-radius: 10px;
  padding: 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.exercise-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 210, 0, 0.35);
}

.exercise-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.exercise-name {
  font-family: 'Doto', sans-serif;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
}

.exercise-meta {
  color: #666;
  font-size: 11px;
  letter-spacing: 1px;
}

@media (max-width: 600px) {
  .picker-hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
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
  const workoutIdQuery = route.query.workoutId;

  if (workoutIdQuery) {
    const workoutId = Number(workoutIdQuery);
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

    const templateIdQuery = route.query.templateId;

    if (templateIdQuery) {
      router.push({
        name: 'TemplateEditor',
        params: { id: templateIdQuery.toString() }
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
