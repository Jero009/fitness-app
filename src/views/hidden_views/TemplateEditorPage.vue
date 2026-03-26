<template>
  <ion-page>
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Edit  Template</ion-title>
        </ion-toolbar>
      </ion-header>
    <ion-content :fullscreen="true">

        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="cancel()">Cancel</ion-button>
            </ion-buttons>

            <ion-title>Edit Template</ion-title>

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
              :clear-on-edit="true"
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
IonCardContent, IonCardSubtitle, IonCardTitle, IonList, IonItem, IonButton, IonIcon, IonButtons, IonModal, IonInput, onIonViewWillEnter, 
onIonViewWillLeave} from '@ionic/vue';
import { add, swapVerticalOutline } from 'ionicons/icons';
import { createTemplate, getExercises,addExerciseToTemplate ,getTemplateExercises,getTemplateById, renameTemplate,editTemplateExercises } from '@/services/gym_db'
import { ref ,onMounted} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Draggable from 'vuedraggable';

const router = useRouter();
const route = useRoute();
// exercise picker 
const goToExercisePicker = () => {

  router.push({ name: 'ExercisePicker', query: { from: 'template' } });
};


const cancel = () => {
  router.push({ name: 'Template' });
};


const TemplateName = ref('');

// Always load template data for the current id
const loadTemplateData = async (id: number) => {
  TemplateName.value = '';
  selectedExercises.value = [];
  const template = await getTemplateById(id);
  if (template) TemplateName.value = template.name;
  const exercises = await getTemplateExercises(id);
  if (exercises) selectedExercises.value = exercises;
};

// Initial load


// Reload when route param changes
import { watch } from 'vue';
watch(
  () => route.params.id,
  (newId) => {
    const id = Number(newId);
    loadTemplateData(id);
  }
);




// saving changes

const confirm = async () => {
  const templateId = Number(route.params.id)
  if (!TemplateName.value) return;

  await renameTemplate(templateId, TemplateName.value);
  console.log("✅ Template renamed");
  //add each selected exercise
  for (let i = 0; i < selectedExercises.value.length; i++) {
    const ex = selectedExercises.value[i];
    console.log("Saving exercise:", ex);
    await editTemplateExercises(
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






//refresh 

onMounted(() => {
  LoadExercises();
  const id = Number(route.params.id);
  loadTemplateData(id);
  const templateId = Number(route.params.id);
});



onIonViewWillEnter(() => {
  // Check for selected exercise from ExercisePicker
  const templateId = Number(route.params.id);
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

});
onIonViewWillLeave(() => {
  // Clear selected exercise when leaving the page

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