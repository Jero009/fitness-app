<template>
<ion-page>
  <ion-header>
    <ion-toolbar>
        <ion-title class="title">EXERCISES</ion-title>
      <ion-buttons slot="end">
        <ion-button class="header-create" @click="openModal">
          <ion-icon :icon="add" ></ion-icon>
          New
        </ion-button>
      </ion-buttons>
      </ion-toolbar>
  </ion-header>
  <ion-content>
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
      <ion-content class="ion-padding">
          <ion-input class="input"
            v-model="name"
            placeholder="&nbsp;Enter exercise name"
          ></ion-input>

          <ion-select v-model="muscleGroup" placeholder="&nbsp;Select muscle group" interface="action-sheet">
            <ion-select-option v-for="mg in muscleGroups" :key="mg.id" :value="mg.id">
              {{ mg.name }}
            </ion-select-option>
          </ion-select>


          <ion-select v-model="equipment" placeholder="&nbsp;Select equipment" interface="action-sheet">
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
      <section class="exercise-hero">
        <div class="hero-left">
          <span class="hero-label">EXERCISE LIBRARY</span>
          <h1 class="hero-title">CURATE YOUR EXERCISE</h1>
          <p class="hero-subtitle">Filter by muscle group and keep names consistent.</p>
        </div>
        <ion-button class="hero-create" @click="openModal">
          <ion-icon :icon="add" ></ion-icon>
          Add
        </ion-button>
      </section>

      <div class="exercise-summary">
        <div class="summary-left">
          <span class="exercise-count">{{ exercises.length }}_TOTAL</span>
          <span class="exercise-count">{{ filteredExercises.length }}_VISIBLE</span>
        </div>
        <span class="exercise-hint">Tap Rename to keep your list tidy.</span>
      </div>

      <div class="exercise-controls">
        <ion-select v-model="selectedMuscleGroup" placeholder="Filter by muscle group" interface="action-sheet" class="muscle-group-select">
          <ion-select-option value="">&nbsp;All</ion-select-option>
          <ion-select-option v-for="mg in muscleGroups" :key="mg.id" :value="mg.name">
            {{ mg.name }}
          </ion-select-option>
        </ion-select>
      </div>

      <div class="exercise-grid">
        <div class="exercise-card" v-for="ex in filteredExercises" :key="ex.id">
          <div class="exercise-main">
            <span class="exercise-name">{{ ex.name }}</span>
            <span class="exercise-meta">{{ ex.muscle_group }}</span>
          </div>
          <ion-button class="rename-btn" fill="clear" @click="renameEx(ex)">Rename</ion-button>
        </div>
      </div>
        
  </ion-content>
  </ion-page>
</template>
<style scoped>


.title {
  font-family: 'Doto', sans-serif;
  letter-spacing: 3px;
}

.header-create {
  --background: #ffd200;
  --color: #0b0b0b;
  --background-activated: #d71921;
  --color-activated: #fff;
  font-weight: 700;
  gap: 6px;
}

.exercise-hero {
  margin: 20px;
  padding: 18px;
  border-radius: 10px;
  background: rgba(26, 26, 26, 0.9) ;
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

.hero-create {
  --background: #ffd200;
  --color: #0b0b0b;
  --background-activated: #d71921;
  --color-activated: #fff;
  font-weight: 700;
  gap: 6px;
}

.exercise-summary {
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

.exercise-count {
  font-family: 'Doto', sans-serif;
  color: #ffd200;
}

.exercise-hint {
  color: #666;
}

.exercise-controls {
  margin: 0 20px 14px;
}

.muscle-group-select{
  width: 100%;
  --placeholder-color: rgba(255, 210, 0, 0.65);
  --color: #ffd200;
}

.exercise-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
  padding: 0 20px 30px;
}

.exercise-card {
  background: #1a1a1a;
  border-radius: 10px;
  padding: 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
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

.rename-btn {
  --color: #ffd200;
  font-family: 'Doto', sans-serif;
  letter-spacing: 1px;
}

.input {
  margin:0;
  background-color: var(--ion-color-primary);
  color:var(--ion-color-light);
  border-radius: 3px;
  font-family: doto;
}

@media (max-width: 600px) {
  .exercise-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .exercise-card {
    flex-direction: column;
    align-items: flex-start;
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
