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
            <ion-item>
              <ion-select
                placeholder="Add exercise"
                @ionChange="addSelectedExercise($event)"
              >
                <ion-select-option
                  v-for="ex in exercises"
                  :key="ex.id"
                  :value="ex"
                >
                  {{ ex.name }}
                </ion-select-option>
              </ion-select>
            </ion-item>
            <ion-list>
              <ion-item v-for="(ex, index) in selectedExercises" :key="ex.id">
                
                <div style="flex: 1;">
                  {{ ex.name }}
                </div>

                <!-- sets -->
                <ion-input
                  type="number"
                  v-model="ex.sets"
                  style="width: 60px"
                ></ion-input>

                <!-- reps -->
                <ion-input
                  type="number"
                  v-model="ex.reps"
                  style="width: 60px"
                ></ion-input>

              </ion-item>
            </ion-list>
        </ion-content>
      </ion-modal>

      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Template</ion-title>
        </ion-toolbar>
      </ion-header>
            <ion-card class="card-template" v-for="template in templates" :key="template.id">
                <ion-card-header>
                <ion-card-title>{{ template.name }}</ion-card-title>
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
IonCardContent,IonCardSubtitle,IonCardTitle,IonList,IonItem,IonButton,IonIcon,IonButtons,IonModal,IonInput,onIonViewWillEnter,IonSelect,IonSelectOption } from '@ionic/vue';
import { add} from 'ionicons/icons';
import { createTemplate, getExercises,addExerciseToTemplate,getTemplates } from '@/services/gym_db'
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

  // 🔥 add each selected exercise
  for (let i = 0; i < selectedExercises.value.length; i++) {
    const ex = selectedExercises.value[i];

    await addExerciseToTemplate(
      templateId,
      ex.id,
      ex.sets,
      ex.reps,
      i // order index
    );
  }

  console.log("✅ Template + exercises saved");

  // reset state
  selectedExercises.value = [];
  TemplateName.value = '';
  isOpen.value = false;
};
// displaying templates
const templates = ref<Template[]>([]);

type Template = {
  id: number;
  name: string;
  created_at: string;
};

const loadTemplates = async () => {
  const data = await getTemplates();
  templates.value = data;
};



// exercises 
const exercises = ref<exercise[]>([])

const selectedExercises = ref<SelectedExercise[]>([]);

type SelectedExercise = {
  id: number;
  name: string;
  reps: number;
  sets: number;
}

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

const addSelectedExercise = (event: any) => {
  const ex = event.detail.value;

  if (selectedExercises.value.some(e => e.id === ex.id)) return;

  selectedExercises.value.push({
    id: ex.id,
    name: ex.name,
    sets: 3,
    reps: 10
  });
};









onMounted(() => {
    LoadExercises()
    loadTemplates();
});

onIonViewWillEnter(() => {
    LoadExercises()
    loadTemplates()

});
</script>





<style>
.card-template{
  margin: 10px auto ;
  width: 90%;
}

</style>