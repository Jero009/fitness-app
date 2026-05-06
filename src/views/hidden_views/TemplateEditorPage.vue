<template>
  <ion-page>
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button class="button-red" @click="cancel()">Cancel</ion-button>
            </ion-buttons>
            <ion-title>EDIT TEMPLATE</ion-title>
            <ion-buttons slot="end">
              <ion-button class="button-yellow" @click="confirm()">Save</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
  <ion-content :fullscreen="true">
          <!-- Template name -->
           <div class="template-top">
            <ion-item class="template-top">
              <ion-input
                v-model="TemplateName"
                placeholder="Template name"
                :clear-on-edit="true"
              />
            </ion-item>
              <ion-item class="template-top">
                <ion-button class="button-red" @click="goToExercisePicker">Add exercise</ion-button>
              </ion-item>
            </div>
            
                <Draggable v-model="exercises" item-key="id_exercise" @end="onDragEnd">
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
                          v-model.number="ex.set_number"
                          style="width: 60px"
                          placeholder="Sets"
                        ></ion-input>
                        
                        <ion-input
                        label="Reps" label-placement="floating"
                        :clear-on-edit="true"
                          type="number"
                          v-model.number="ex.rep_number"
                          style="width: 60px"
                          placeholder="Reps"
                        ></ion-input>
                      </ion-item>
                      <ion-item-options side="end">
                        <ion-item-option color="danger" @click="removeExercise(index)">Remove</ion-item-option>
                      </ion-item-options>
                    </ion-item-sliding>
                  </template>
                </Draggable>
        </ion-content>
  </ion-page>
</template>
<style>
.card-template{
  margin: 10px auto ;
  width: 90%;
}

.sortable-chosen {
  background: var(--ion-color-primary-medium) !important; /* Light blue */
  transition: background 0.2s;
}

.card-template{
  margin: 10px auto ;
  width: 90%;
}
.template-top {
  width: 100%;
  background-color: var(--ion-color-primary);
}

</style>
<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonButton, IonButtons, IonInput, IonItemSliding, IonItemOptions, IonItemOption, onIonViewWillEnter, toastController } from '@ionic/vue';
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Draggable from 'vuedraggable';
import { getTemplateById, getTemplateExercisesByTemplateId, renameTemplate, editTemplateExercises, addExerciseToTemplate, deleteTemplateExercise } from '@/services/gym_db';

const router = useRouter();
const route = useRoute();

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
    name: 'ExercisePicker',
    query: {
      templateId: route.params.id // ✅ THIS IS REQUIRED
    }
  });
};

const onDragEnd = () => {
};


const cancel = () => {
  router.push({ name: 'Template' });
};

const TemplateName = ref('');
const removedExerciseRowIds = ref<number[]>([]);

const removeExercise = (index: number) => {
  const exercise = exercises.value[index];
  if (!exercise) return;

  if (exercise.id > 0 && !removedExerciseRowIds.value.includes(exercise.id)) {
    removedExerciseRowIds.value.push(exercise.id);
  }

  exercises.value.splice(index, 1);
};

const validateTemplate = (): boolean => {
  // Check template name
  if (!TemplateName.value || !TemplateName.value.trim()) {
    showToast('Please enter a template name');
    return false;
  }

  // Check if exercises exist
  if (exercises.value.length === 0) {
    showToast('Please add at least one exercise');
    return false;
  }

  // Check for duplicates and validate each exercise
  const exerciseIds = new Set<number>();
  for (const ex of exercises.value) {
    // Check for duplicate exercises
    if (exerciseIds.has(ex.id_exercise)) {
      showToast(`Exercise "${ex.name}" is added multiple times. Please remove duplicates.`);
      return false;
    }
    exerciseIds.add(ex.id_exercise);

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

// saving changes doesnt work

const confirm = async () => {
  // Validate before saving
  if (!validateTemplate()) return;

  const templateId = Number(route.params.id)

  await renameTemplate(templateId, TemplateName.value.trim());

  // Delete exercises removed from the list.
  for (const rowId of removedExerciseRowIds.value) {
    await deleteTemplateExercise(rowId);
  }


  //add each selected exercise  
  for (let i = 0; i < exercises.value.length; i++) {
    const ex = exercises.value[i];

    if (ex.id === 0) {
      // 🆕 NEW → INSERT
      await addExerciseToTemplate(
        templateId,
        ex.id_exercise,
        Number(ex.set_number),
        Number(ex.rep_number),
        i
      );
    } else {
      // 🔁 EXISTING → UPDATE
      await editTemplateExercises(
        ex.id,
        Number(ex.set_number),
        Number(ex.rep_number),
        i
      );
    }
  }

  // Show success and reset state
  showToast('Template updated successfully!', 'success');
  exercises.value = [];
  removedExerciseRowIds.value = [];
  TemplateName.value = '';

  router.push({ name: 'Template' });

};
// exercises 
const exercises = ref<TemplateExercise[]>([])

type TemplateExercise = {
  id: number;
  name: string;
  id_exercise: number;
  set_number: number;
  rep_number: number;
  order_index: number;
}
// refresh
onIonViewWillEnter(async () => {
  const id = Number(route.params.id);

  // ✅ Load template name
  const template = await getTemplateById(id);
  if (template) {
    TemplateName.value = template.name;
  }

  // ✅ Load existing exercises
  const data = await getTemplateExercisesByTemplateId(id);
  exercises.value = data || [];

  // ✅ Then check if new exercise was selected
  const selectedExerciseStr = localStorage.getItem('selectedExerciseForTemplate');

  if (selectedExerciseStr) {
    try {
      const ex = JSON.parse(selectedExerciseStr);

      // ✅ prevent duplicates (use id_exercise!)
      const exists = exercises.value.some(e => e.id_exercise === ex.id);

      if (!exists) {
        exercises.value.push({
          id: 0, // 🔥 IMPORTANT (new row, not in DB yet)
          id_exercise: ex.id,
          name: ex.name,
          set_number: 3,
          rep_number: 10,
          order_index: exercises.value.length
        });
      }

    } catch (e) {
      console.error('Failed to parse selected exercise:', e);
    }

    localStorage.removeItem('selectedExerciseForTemplate');
  }
});



</script>
