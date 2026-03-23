


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
        <ion-item>
          <ion-input
            v-model="name"
            placeholder="Enter exercise name"
          ></ion-input>
        </ion-item>
        <ion-item>
            <ion-input
            v-model="muscleGroup"
            placeholder="Enter muscle group "
          ></ion-input>

        </ion-item>
        <ion-item>
            <ion-input
            v-model="equipment"
            placeholder="Enter equipment "
          ></ion-input>
        </ion-item>
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
                <ion-list class="exercise-list" lines="full"  >
                    <ion-item class="exercise-item"  v-for="ex in exercises" :key="ex.id">
                        {{ ex.name }}
                      <ion-button slot="end"  @click="deleteEx(ex.id)">Delete</ion-button>
                    </ion-item>
                </ion-list>
            
        
  </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent,IonList,IonItem,IonButton,IonIcon,IonButtons,IonModal,IonInput ,onIonViewWillEnter,
   IonRefresher, IonRefresherContent, RefresherCustomEvent } from '@ionic/vue';
import { add} from 'ionicons/icons'
import { ref,onMounted } from 'vue';
import { addExercise, getExercises, deleteExercise} from '@/services/gym_db'

//creqating exercise modal
    const isOpen = ref(false);
    const name = ref('')
    const muscleGroup = ref('')
    const equipment = ref('')

    const exercises = ref<exercise[]>([])
//modal opening 

const openModal = () => {
  isOpen.value = true;
};

const cancel = () => {
  isOpen.value = false;
};


const confirm = async () => {
  if (!name.value) return;
  
  await addExercise(name.value, muscleGroup.value, equipment.value, 60);

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




//delete exercise
const deleteEx = async (id: number) => {
  await deleteExercise(id);
  await LoadExercises();
};




//refresh 

 const handleRefresh = (event: RefresherCustomEvent) => {
    setTimeout(() => {
      // Any calls to load data go here
      event.target.complete();
    }, 200);
  };



onMounted(() => {
    LoadExercises()
});

onIonViewWillEnter(() => {
    LoadExercises()

});


</script>
<style>
.exercise-list {
  margin: 10px auto ;
  width: 90%;
}

</style>