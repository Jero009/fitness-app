<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title class="title">EXERCISES</ion-title>
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
      <div class="exercise-list-container">
        <ion-select
          v-model="selectedMuscleGroup"
          placeholder="Filter by muscle group"
          interface="action-sheet"
          :interface-options="{ cssClass: 'app-action-sheet' }"
          class="muscle-group-select app-select"
        >
          <ion-select-option value="">All</ion-select-option>
          <ion-select-option v-for="mg in muscleGroups" :key="mg.id" :value="mg.name">
            {{ mg.name }}
          </ion-select-option>
        </ion-select>
        <ion-list class="exercise-list" lines="none">
          <ion-item
            class="exercise-item"
            v-for="ex in filteredExercises"
            :key="ex.id"
            lines="none"
            @click="handleExerciseClick(ex)"
          >
            <div class="exercise-content">
              <div class="exercise-main">
                <div class="exercise-name">{{ ex.name }}</div>
              </div>
            </div>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.exercise-list {
  background: transparent;
}

.exercise-list-container {
  width: 90%;
  margin: auto;
}

.exercise-item {
  margin: 10px auto;
  width: 100%;
  background-color: var(--ion-color-medium);
  border-radius: 10px;
  padding: 12px 16px;
  --padding-start: 0;
  --padding-end: 0;
  cursor: pointer;
}

.exercise-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.exercise-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.exercise-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--ion-color-light);
  font-family: 'Doto', sans-serif;
}

.muscle-group-select {
  margin: auto;
  width: 100%;
}
</style>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonRefresher,
  IonRefresherContent,
  onIonViewWillEnter
} from '@ionic/vue';
import type { RefresherCustomEvent } from '@ionic/vue';
import { ref, onMounted, computed } from 'vue';
import type { MuscleGroup } from '@/features/gym/types/models';
import {
  getExercises,
  getMuscleGroups,
  addExerciseToWorkout,
  getNextWorkoutOrderIndex,
  getLatestCompletedSetDefaultsForExercise
} from '@/shared/db/app_db';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

type exercise = {
  id: number;
  name: string;
  muscle_group: string;
  equipment: string;
};

const exercises = ref<exercise[]>([]);
const selectedMuscleGroup = ref('');
const muscleGroups = ref<MuscleGroup[]>([]);

// exercise sort
const filteredExercises = computed(() => {
  return exercises.value
    .filter((ex) => !selectedMuscleGroup.value || ex.muscle_group === selectedMuscleGroup.value)
    .sort((a, b) => a.muscle_group.localeCompare(b.muscle_group));
});

// Get exercises from db
const LoadExercises = async () => {
  const data = await getExercises();
  exercises.value = data;
};

// Exercise selection - handles both template and workout contexts
const handleExerciseClick = async (exercise: exercise) => {
  const workoutIdQuery = route.query.workoutId;

  if (workoutIdQuery) {
    const workoutId = Number(workoutIdQuery);
    // Adding exercise to an active workout
    const orderIndex = await getNextWorkoutOrderIndex(workoutId);
    const defaults = await getLatestCompletedSetDefaultsForExercise(exercise.id, workoutId);
    await addExerciseToWorkout(workoutId, exercise.id, orderIndex, 3, defaults.reps, defaults.weight);

    // Navigate back to the workout page
    router.push({
      name: 'Workout',
      params: { id: workoutId.toString() }
    });
  } else if (route.query.templateId) {
    // Template builder context
    localStorage.setItem('selectedExerciseForTemplate', JSON.stringify(exercise));
    router.push({
      name: 'TemplateEditor',
      params: { id: route.query.templateId.toString() }
    });
  } else {
    // Show exercise details if coming from Exercise tab
    router.push({
      name: 'ExerciseDetail',
      params: { id: exercise.id.toString() }
    });
  }
};

// Refresh
const handleRefresh = async (event: RefresherCustomEvent) => {
  await LoadExercises();
  event.target.complete();
};

onMounted(() => {
  LoadExercises();
  getMuscleGroups().then((data) => (muscleGroups.value = data));
});

onIonViewWillEnter(() => {
  LoadExercises();
  getMuscleGroups().then((data) => (muscleGroups.value = data));
});
</script>
