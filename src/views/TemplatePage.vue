<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title class="title">Template</ion-title>

      <ion-buttons slot="end">
        <ion-button @click="openModal">
          <ion-icon :icon="add"></ion-icon>
        </ion-button>
      </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-modal :is-open="isOpen">
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="cancel()">Cancel</ion-button>
            </ion-buttons>

            <ion-title>Create Template</ion-title>

            <ion-buttons slot="end">
              <ion-button @click="confirm()">Save</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">

          <!-- Template name -->
          <ion-item>
            <ion-input
              v-model="TemplateName"
              placeholder="Template name"
            />
          </ion-item>

          <!-- Exercise list -->
          <ion-list>
            <ion-item
              v-for="ex in exercises"
              :key="ex.id"
              @click="toggleExercise(ex)"
              button
            >
              {{ ex.name }}
            </ion-item>
          </ion-list>

        </ion-content>
      </ion-modal>

      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Template</ion-title>
        </ion-toolbar>
      </ion-header>
            <ion-card class="card-template">
                <ion-card-header>
                <ion-card-title>workout name 2</ion-card-title>
                <ion-card-subtitle>last preformed</ion-card-subtitle>
                </ion-card-header>

                <ion-card-content>
                <ion-list>
                    <ion-item><span>exercise 1</span> <span>set: 3</span></ion-item>
                    <ion-item><span>exercise 2</span> <span>set: 3</span></ion-item>
                    <ion-item><span>exercise 3</span> <span>set: 3</span></ion-item>
                </ion-list>
                </ion-card-content>
            </ion-card>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent,IonCard,IonCardHeader,
IonCardContent,IonCardSubtitle,IonCardTitle,IonList,IonItem,IonButton,IonIcon,IonButtons,IonModal,IonInput,onIonViewWillEnter } from '@ionic/vue';
import { add} from 'ionicons/icons';
import { createTemplate, getExercises,addExerciseToTemplate} from '@/services/gym_db'
import { ref ,onMounted} from 'vue';

//modal
const isOpen = ref(false);

//create template
const TemplateName = ref('');
const selectedTemplateId = ref<number | null>(null);


const openModal = () => {
  isOpen.value = true;
};

const cancel = () => {
  isOpen.value = false;
};


const confirm = async () => {
  if (!TemplateName.value) return;

  const templateId = await createTemplate(TemplateName.value);

  if (!templateId) {
    console.error("❌ No ID returned");
    return;
  }

  // 🔥 add selected exercises AFTER template is created
  for (let i = 0; i < selectedExercises.value.length; i++) {
    await addExerciseToTemplate(
      templateId,
      selectedExercises.value[i],
      3,
      10,
      i // order
    );
  }

  console.log("✅ Template + exercises saved");

  // reset state
  selectedExercises.value = [];
  TemplateName.value = '';
  isOpen.value = false;
};

// exercises 
const exercises = ref<exercise[]>([])
const selectedExercises = ref<number[]>([]);


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


const toggleExercise = (ex: exercise) => {
  const index = selectedExercises.value.indexOf(ex.id);

  if (index > -1) {
    selectedExercises.value.splice(index, 1);
  } else {
    selectedExercises.value.push(ex.id);
  }
};










onMounted(() => {
    LoadExercises()
});

onIonViewWillEnter(() => {
    LoadExercises()

});
</script>





<style>
.card-template{
  margin: 10px auto ;
  width: 90%;
}

</style>