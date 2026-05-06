<template>
  <ion-page>
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">CREATE TEMPLATE</ion-title>
        </ion-toolbar>
      </ion-header>
    <ion-content :fullscreen="true">

        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button class="button-red" @click="cancel()">Cancel</ion-button>
            </ion-buttons>

            <ion-title>Create Template</ion-title>

            <ion-buttons slot="end">
              <ion-button class="button-yellow" @click="confirm()">Save</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

          <!-- Template name -->

              <ion-item class="template-top">
                <ion-input
                  v-model="TemplateName"
                  placeholder="Template name"
                />
              </ion-item >
                <ion-item class="template-top">
                  <ion-button class="button-red" @click="goToExercisePicker">Add exercise</ion-button>
                </ion-item>

                <Draggable v-model="selectedExercises" item-key="id">
                  <template #item="{ element: ex, index }">
                    <ion-item-sliding>
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
                      <ion-item-options side="end">
                        <ion-item-option color="danger" @click="removeSelectedExercise(index)">Remove</ion-item-option>
                      </ion-item-options>
                    </ion-item-sliding>
                  </template>
                </Draggable>
        </ion-content>
  </ion-page>
</template>
<style>
.exercise-item {
  margin: 10px auto ;
  width: 100%;
  background-color: var(--ion-color-medium);
  border-radius: 10px;
}

.card-template{
  margin: 10px auto ;
  width: 90%;
}

.sortable-chosen {
  background: var(--ion-color-primary-medium) !important; /* Light blue */
  transition: background 0.2s;
}
.template-top {
  background-color: var(--ion-color-medium) !important;
}

</style>
<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonButton, IonButtons, IonInput, IonItemSliding, IonItemOptions, IonItemOption, onIonViewWillEnter, toastController } from '@ionic/vue';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Draggable from 'vuedraggable';
import { createTemplate, getExercises, addExerciseToTemplate } from '@/services/gym_db';

const router = useRouter();

// Toast helper
const showToast = async (message: string, color: string = 'danger') => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    position: 'top',
    color,
  });
  await toast.present();
};

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

const validateTemplate = (): boolean => {
  // Check template name
  if (!TemplateName.value || !TemplateName.value.trim()) {
    showToast('Please enter a template name');
    return false;
  }

  // Check if exercises were added
  if (selectedExercises.value.length === 0) {
    showToast('Please add at least one exercise');
    return false;
  }

  // Check for duplicates and validate each exercise
  const exerciseIds = new Set<number>();
  for (const ex of selectedExercises.value) {
    // Check for duplicate exercises
    if (exerciseIds.has(ex.id)) {
      showToast(`Exercise "${ex.name}" is added multiple times. Please remove duplicates.`);
      return false;
    }
    exerciseIds.add(ex.id);

    // Check sets > 0
    const sets = Number(ex.set_number);
    if (isNaN(sets) || sets <= 0) {
      showToast(`"${ex.name}": Sets must be greater than 0`);
      return false;
    }

    // Check reps > 0
    const reps = Number(ex.rep_number);
    if (isNaN(reps) || reps <= 0) {
      showToast(`"${ex.name}": Reps must be greater than 0`);
      return false;
    }
  }

  return true;
};

const confirm = async () => {
  // Validate before creating template
  if (!validateTemplate()) return;

  const templateId = await createTemplate(TemplateName.value.trim());

  if (!templateId) {
    showToast('Failed to create template');
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

  // Show success and reset state
  showToast('Template created successfully!', 'success');
  selectedExercises.value = [];
  TemplateName.value = '';

  router.push({ name: 'Template' });

};




// exercises 
const exercises = ref<exercise[]>([])

const selectedExercises = ref<SelectedExercise[]>([]);

const removeSelectedExercise = (index: number) => {
  selectedExercises.value.splice(index, 1);
};

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
});
</script>





