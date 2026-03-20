


<template>
  <ion-header>
    <ion-toolbar>
        <ion-title class="title">Exercises</ion-title>
      <ion-buttons slot="end">
        <ion-button  id="open-modal" expand="block" >
          <ion-icon :icon="add" ></ion-icon>
        </ion-button>
      </ion-buttons>
      </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding">
    <ion-modal ref="modal" trigger="open-modal" >
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
                <ion-list class="exercise-list" lines="full"   v-for="ex in exercises" :key="ex.id">
                    <ion-item class="exercise-item">{{ ex.name }}</ion-item>
                </ion-list>
  </ion-content>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent,IonCard,IonCardHeader,IonCardContent,IonCardSubtitle,IonCardTitle,IonList,IonItem,IonButton,IonIcon,IonButtons,IonModal,IonInput } from '@ionic/vue';
import { add} from 'ionicons/icons'
import { ref,onMounted } from 'vue';
import { addExercise } from '@/services/gym_db'
import { getExercises } from '@/services/gym_db'

//creqating exercise modal
    const modal = ref();
    const name = ref('')
    const muscleGroup = ref('')
    const equipment = ref('')

const confirm  = async() => {
    await addExercise(name.value, muscleGroup.value, equipment.value,  60);

  console.log("✅ Exercise saved");

  name.value = ''
  muscleGroup.value = ''
  equipment.value = ''

  modal.value.$el.dismiss(null, 'confirm');
};  

const cancel = () => modal.value.$el.dismiss(null, 'cancel');

// get exercises from db

type exercise = {
  id: number;
  name: string;
  muscle_group: string;
  equipment: string;
}
const exercises = ref<exercise[]>([])

const LoadExercises = async () =>{
  const data = await getExercises();
  exercises.value = data;
  
};
onMounted(() => {
    LoadExercises()
})


</script>
<style>
.exercise-list {
  margin: 10px auto ;
  width: 90%;
}

</style>