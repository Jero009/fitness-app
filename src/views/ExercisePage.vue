<template>
<ion-page>
  <ion-header>
    <ion-toolbar>
        <ion-title class="title">Exercises</ion-title>
      <ion-buttons slot="end">
        <ion-button  @click="openModal">
          <ion-icon :icon="add" ></ion-icon>
        </ion-button>
      </ion-buttons>
      </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding">
    <ion-modal :is-open="isOpen" >
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button @click="cancel()">Cancel</ion-button>
          </ion-buttons>
          <ion-title>Add exercise</ion-title>
          <ion-buttons slot="end">
            <ion-button :strong="true" @click="confirm()">Add</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
          <ion-input class="input"
            v-model="name"
            placeholder="Enter exercise name"
          ></ion-input>

          <ion-select v-model="muscleGroup" placeholder="Select muscle group" interface="action-sheet">
            <ion-select-option v-for="mg in muscleGroups" :key="mg.id" :value="mg.id">
              {{ mg.name }}
            </ion-select-option>
          </ion-select>


          <ion-select v-model="equipment" placeholder="Select equipment" interface="action-sheet">
            <ion-select-option v-for="eq in equipmentList" :key="eq.id" :value="eq.id">
              {{ eq.name }}
            </ion-select-option>
          </ion-select>

      </ion-content>
    </ion-modal>
         <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Exercises</ion-title>
        </ion-toolbar>
      </ion-header>
          <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
            <ion-refresher-content></ion-refresher-content>
          </ion-refresher>
              <div class="exercise-list-container">

                  <ion-select v-model="selectedMuscleGroup" placeholder="Filter by muscle group" interface="action-sheet" class="muscle-group-select">
                    <ion-select-option v-for="mg in muscleGroups" :key="mg.id" :value="mg.name">
                      {{ mg.name }}
                    </ion-select-option>
                  </ion-select>


                        <ion-item class="exercise-item" v-for="ex in filteredExercises" :key="ex.id" lines="none">
                          {{ ex.name }}
                          <ion-button slot="end" @click="renameEx(ex)">Rename</ion-button>
                        </ion-item>

            </div>
        
  </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonButton, IonIcon, IonButtons, IonModal, IonInput, onIonViewWillEnter,
   IonRefresher, IonRefresherContent, RefresherCustomEvent, alertController, IonSelect, IonSelectOption } from '@ionic/vue';
import { add} from 'ionicons/icons'
import { ref,onMounted,computed  } from 'vue';
import { addExercise, getExercises,renameExercise,getMuscleGroups, getEquipment } from '@/services/gym_db'

//creqating exercise modal
    const isOpen = ref(false);
    const name = ref('')
    const muscleGroup = ref('')
    const equipment = ref('')

const exercises = ref<exercise[]>([])
const selectedMuscleGroup = ref('');

//modal opening 

const openModal = () => {
  isOpen.value = true;
};

const cancel = () => {
  isOpen.value = false;
};


const confirm = async () => {
  if (!name.value || !muscleGroup.value || !equipment.value) return;
  await addExercise(name.value, Number(muscleGroup.value), Number(equipment.value), 60);

  await LoadExercises();

  isOpen.value = false;
  name.value = '';
  muscleGroup.value = '';
  equipment.value = '';
};


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





//rename exercise
const renameEx = async (ex: exercise) => {
  const alert = await alertController.create({
    header: 'Rename Exercise',

    inputs: [
      {
        name: 'name',
        type: 'text',
        value: ex.name, 
        placeholder: 'New name'
      }
    ],

    buttons: [
      {
        text: 'Cancel',
        role: 'cancel'
      },
      {
        text: 'Save',
        handler: async (data) => {
          if (!data.name || !data.name.trim()) return;

          await renameExercise(ex.id, data.name.trim());
          await LoadExercises();
        }
      }
    ]
  });

  await alert.present();
};



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
.exercise-item {
  margin: 10px auto ;
  width: 100%;
  background-color: var(--ion-color-medium);
  border-radius: 10px;
}
.input {
  margin:0;
  background-color: var(--ion-color-primary);
  border-radius: 10px;
  font-family: doto;
}

.muscle-group-select{
  margin:  auto ;
  width: 100%;
}

</style>