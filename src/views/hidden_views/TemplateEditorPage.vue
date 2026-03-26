<template>
  <ion-page>
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
  <ion-content :fullscreen="true">
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
                <Draggable v-model="exercises" item-key="id" @end="onDragEnd">
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
                        @ionInput="ex.set_number = Number($event.target.value)"
                      ></ion-input>
                      
                      <ion-input
                      label="Reps" label-placement="floating"
                      :clear-on-edit="true"
                        type="number"
                        v-model="ex.rep_number"
                        style="width: 60px"
                        placeholder="Reps"
                        @ionInput="ex.rep_number = Number($event.target.value)"
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
import { createTemplate, getExercises,addExerciseToTemplate ,getTemplateExercises,getTemplateById, renameTemplate,editTemplateExercises, getTemplateExercisesByTemplateId } from '@/services/gym_db'
import { ref ,onMounted} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Draggable from 'vuedraggable';

const router = useRouter();
const route = useRoute();

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
  console.log('New order:', exercises.value.map(e => e.name));
};


const cancel = () => {
  router.push({ name: 'Template' });
};


const TemplateName = ref('');




// saving changes doesnt work

const confirm = async () => {
  console.log("🔥 SAVE CLICKED");
  const templateId = Number(route.params.id)
  if (!TemplateName.value) return;

  await renameTemplate(templateId, TemplateName.value);
  console.log("✅ Template renamed");


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
  console.log("✅ Template + exercises saved");

  // reset state
  exercises.value = [];
  TemplateName.value = '';

  router.push({ name: 'Template' });

};
// get teplate name





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

  // ✅ Load existing exercises FIRST

  const data = await getTemplateExercisesByTemplateId(id);

  // Only set if empty (first load)
  if (exercises.value.length === 0) {
    exercises.value = data || [];
  }

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
          set_number: 0,
          rep_number: 0,
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