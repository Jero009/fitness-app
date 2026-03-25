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

                <ion-item>
                  <ion-select v-model="selectedMuscleGroup" placeholder="Filter by muscle group">
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
            
        
  </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent,IonList,IonItem,IonButton,IonIcon,IonButtons,IonModal,IonInput ,onIonViewWillEnter,
   IonRefresher, IonRefresherContent, RefresherCustomEvent,alertController,IonSelect,IonSelectOption  } from '@ionic/vue';
import { add} from 'ionicons/icons'
import { ref,onMounted,computed  } from 'vue';
import { addExercise, getExercises,renameExercise,getMuscleGroups, getEquipment } from '@/services/gym_db'
import { useRouter } from 'vue-router';
const router = useRouter();






// exercise selection for template creation
const selectExercise = (exercise) => {
  // Store the selected exercise in localStorage
  localStorage.setItem('selectedExerciseForTemplate', JSON.stringify(exercise));
  // Navigate back to TemplatePage
  router.push({ name: 'Template' });
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
// get muscle group and equipment for select options
const muscleGroups = ref<any[]>([]);
const equipmentList = ref<any[]>([]);



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
    getEquipment().then(data => equipmentList.value = data);
});

onIonViewWillEnter(() => {
    LoadExercises()
    getMuscleGroups().then(data => muscleGroups.value = data);
    getEquipment().then(data => equipmentList.value = data);

});


</script>
<style>
.exercise-list {
  margin: 10px auto ;
  width: 100%;
}

</style>