<template>
<ion-page>
  <ion-header>
    <ion-toolbar>
        <ion-title class="title">EXERCISES</ion-title>
      <ion-buttons slot="end">
        <ion-button class="button-red" @click="openModal">
          <ion-icon :icon="add" ></ion-icon>
        </ion-button>
      </ion-buttons>
      </ion-toolbar>
  </ion-header>
  <ion-content class="exercise-content">
    <ion-modal :is-open="isOpen" css-class="exercise-modal">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button class="button-red" @click="cancel()">Cancel</ion-button>
          </ion-buttons>
          <ion-title>Add exercise</ion-title>
          <ion-buttons slot="end">
            <ion-button class="button-red" :strong="true" @click="confirm()">Add</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="exercise-modal-content">
          <div class="modal-form">
            <ion-input
              class="input"
              v-model="name"
              placeholder="Enter exercise name"
            ></ion-input>

            <ion-select v-model="muscleGroup" placeholder="Select muscle group" interface="action-sheet" :interface-options="{ cssClass: 'app-action-sheet' }" class="app-select">
              <ion-select-option v-for="mg in muscleGroups" :key="mg.id" :value="mg.id">
                {{ mg.name }}
              </ion-select-option>
            </ion-select>

            <ion-select v-model="equipment" placeholder="Select equipment" interface="action-sheet" :interface-options="{ cssClass: 'app-action-sheet' }" class="app-select">
              <ion-select-option v-for="eq in equipmentList" :key="eq.id" :value="eq.id">
                {{ eq.name }}
              </ion-select-option>
            </ion-select>
          </div>

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
              <div class="exercise-shell">
                <section class="exercise-hero">
                  <ion-button class="add-exercise-button button-red" @click="openModal">
                    <ion-icon :icon="add"></ion-icon>
                    Add exercise
                  </ion-button>
                </section>

                <div class="exercise-panel">
                  <ion-select v-model="selectedMuscleGroup" placeholder="Filter by muscle group" interface="action-sheet" :interface-options="{ cssClass: 'app-action-sheet' }" class="muscle-group-select app-select">
                    <ion-select-option value="">All</ion-select-option>
                    <ion-select-option v-for="mg in muscleGroups" :key="mg.id" :value="mg.name">
                      {{ mg.name }}
                    </ion-select-option>
                  </ion-select>

                  <ion-list class="exercise-list" lines="none">
                    <ion-item class="exercise-item" v-for="ex in filteredExercises" :key="ex.id" lines="none">
                      <div class="exercise-item__content">
                        <div class="exercise-item__name">{{ ex.name }}</div>
                        <div class="exercise-item__meta">
                          <span>{{ ex.muscle_group }}</span>
                          <span>{{ ex.equipment }}</span>
                        </div>
                      </div>
                      <ion-button class="button-yellow exercise-item__action" slot="end" @click="renameEx(ex)">Rename</ion-button>
                    </ion-item>
                  </ion-list>
                </div>
            </div>
        
  </ion-content>
  </ion-page>
</template>
<style>
.exercise-content {
  --padding-top: 16px;
  --padding-bottom: 24px;
}

.exercise-shell {
  padding: 16px;
  display: grid;
  gap: 18px;
  max-width: 760px;
  margin: 0 auto;
  width: min(100%, 760px);
}

.exercise-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.exercise-hero__copy h2 {
  margin: 4px 0 6px;
  color: var(--ion-color-light);
  font-size: 1.4rem;
}

.exercise-hero__text,
.section-kicker {
  margin: 0;
  color: rgba(255, 255, 255, 0.62);
}

.section-kicker {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.72rem;
}

.add-exercise-button {
  margin: 0;
  min-width: 140px;
}

.exercise-panel {
  display: grid;
  gap: 14px;
}

.exercise-list {
  background: transparent;
  padding: 0;
}

.muscle-group-select {
  width: 100%;
}

.exercise-item {
  margin: 10px 0 0;
  width: 100%;
  --border-radius: 14px;
  --inner-border-width: 0;
  --padding-start: 14px;
  --padding-end: 10px;
  --min-height: 76px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
}

.exercise-item__content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 12px 0;
}

.exercise-item__name {
  color: var(--ion-color-light);
  font-size: 1rem;
  font-weight: 600;
}

.exercise-item__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.exercise-item__meta span {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.84);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
}

.exercise-item__action {
  margin-left: 12px;
}

.modal-form {
  display: grid;
  gap: 12px;
  padding: 16px;
}

.input {
  margin: 0;
  background-color: var(--ion-color-primary);
  color: var(--ion-color-light);
  border-radius: 10px;
  font-family: Doto;
}

.modal-form ion-select {
  --background: var(--ion-color-primary);
  --color: var(--ion-color-light);
  --border-radius: 10px;
  font-family: Doto;
}

@media (max-width: 700px) {
  .exercise-hero {
    flex-direction: column;
    align-items: stretch;
  }

  .add-exercise-button {
    width: 100%;
  }
}


</style>
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
    cssClass: 'rename-exercise-alert',

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
