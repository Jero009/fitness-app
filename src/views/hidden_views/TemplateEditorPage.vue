<template>
  <ion-page>
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Template</ion-title>
        </ion-toolbar>
      </ion-header>
    <ion-content :fullscreen="true">

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

          <!-- Template name -->
          <ion-item>
            <ion-input
              v-model="TemplateName"
              placeholder="Template name"
            />
          </ion-item>

          <!-- Exercise list -->
            <ion-item>
              <ion-button @click="goToExercisePicker">Add exercise</ion-button>
            </ion-item>
                <Draggable v-model="selectedExercises" item-key="id">
                  <template #item="{ element: ex, index }">
                    <ion-item class="exercise-item">
                      <div style="flex: 1;">
                        {{ ex.name }}
                      </div>
                      <ion-input
                      label="Sets"  label-placement="floating" 
                      :clear-on-edit="true"
                        type="number"
                        v-model="ex.set_number"
                        style="width: 60px"
                        placeholder="Sets"
                      ></ion-input>
                      
                      <ion-input
                      label="Reps" label-placement="floating"
                      :clear-on-edit="true"
                        type="number"
                        v-model="ex.rep_number"
                        style="width: 60px"
                        placeholder="Reps"
                      ></ion-input>
                    </ion-item>
                  </template>
                </Draggable>
        </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
IonCardContent, IonCardSubtitle, IonCardTitle, IonList, IonItem, IonButton, IonIcon, IonButtons, IonModal, IonInput, onIonViewWillEnter, IonSelect, IonSelectOption, 
IonRefresher, IonRefresherContent, RefresherCustomEvent } from '@ionic/vue';
import { add, swapVerticalOutline } from 'ionicons/icons';
import { createTemplate, getExercises,addExerciseToTemplate,getTemplates ,getTemplateExercises, deleteTemplate } from '@/services/gym_db'
import { ref ,onMounted} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Draggable from 'vuedraggable';

const router = useRouter();
const route = useRoute();
// exercise picker 
const goToExercisePicker = () => {

  router.push({ name: 'ExercisePicker', query: { from: 'template' } });
};

//get template id

const workoutId = Number(route.params.id);
console.log("Workout ID:", workoutId);

//modal

//create template
const TemplateName = ref('');
const selectedTemplateId = ref<number | null>(null);


const cancel = () => {
  router.push({ name: 'Template' });
};


const confirm = async () => {
  if (!TemplateName.value) return;

  const templateId = await createTemplate(TemplateName.value);

  if (!templateId) {
    console.error("❌ No ID returned");
    return;
  }

  //add each selected exercise
  for (let i = 0; i < selectedExercises.value.length; i++) {
    const ex = selectedExercises.value[i];

    await addExerciseToTemplate(
      templateId,
      ex.id,
      ex.set_number,
      ex.rep_number,
      i // order index
    );
  }

  console.log("✅ Template + exercises saved");

  // reset state
  selectedExercises.value = [];
  TemplateName.value = '';

  router.push({ name: 'Template' });

};
// displaying templates
const templates = ref<Template[]>([]);

type Template = {
  id: number;
  name: string;
  created_at: string;
  exercises?: TemplateExercise[];
};

const loadTemplates = async () => {
  const data = await getTemplates();

  if (!data) {
    templates.value = [];
    return;
  }

  for (let template of data) {
    const exercises = await getTemplateExercises(template.id);
    template.exercises = exercises || [];
  }

  templates.value = data;
};


type TemplateExercise = {
  id: number;
  name: string;
  set_number: number;
  rep_number: number;
};



// exercises 
const exercises = ref<exercise[]>([])

const selectedExercises = ref<SelectedExercise[]>([]);

type SelectedExercise = {
  id: number;
  name: string;
  rep_number: number;
  set_number: number;
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
    set_number: ex.set_number,
    rep_number: ex.rep_number 
  });
};




//refresh 

const handleRefresh = async (event: RefresherCustomEvent) => {
  await LoadExercises();
  await loadTemplates();
  event.target.complete();
};


onMounted(() => {
    LoadExercises()
    loadTemplates();
});

onIonViewWillEnter(() => {
  // Check for selected exercise from ExercisePicker
  const selectedExerciseStr = localStorage.getItem('selectedExerciseForTemplate');
  if (selectedExerciseStr) {
    try {
      const ex = JSON.parse(selectedExerciseStr);
      // Prevent duplicates
      if (!selectedExercises.value.some(e => e.id === ex.id)) {
        selectedExercises.value.push({
          id: ex.id,
          name: ex.name,
          set_number: ex.set_number || 0,
          rep_number: ex.rep_number || 0
        });
      }
    } catch (e) {
      console.error('Failed to parse selected exercise:', e);
    }
    localStorage.removeItem('selectedExerciseForTemplate');
  }

  LoadExercises();
  loadTemplates();
});
</script>





<style>
.card-template{
  margin: 10px auto ;
  width: 90%;
}

.sortable-chosen {
  background: var(--ion-color-primary-medium) !important; /* Light blue */
  transition: background 0.2s;
}

</style>