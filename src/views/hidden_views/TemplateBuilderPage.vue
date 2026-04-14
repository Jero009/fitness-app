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
                  <template #item="{ element: ex }">
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
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonButton, IonButtons, IonInput, onIonViewWillEnter } from '@ionic/vue';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Draggable from 'vuedraggable';
import { createTemplate, getExercises, addExerciseToTemplate } from '@/services/gym_db';

const router = useRouter();

// exercise picker 
const goToExercisePicker = () => {
  router.push({
    name: 'ExercisePicker'
  });
};


//modal

//create template
const TemplateName = ref('');


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





onMounted(() => {
    LoadExercises()
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
          set_number: 3,
          rep_number: 10
        });
      }
    } catch (e) {
      console.error('Failed to parse selected exercise:', e);
    }
    localStorage.removeItem('selectedExerciseForTemplate');
  }

  LoadExercises();

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