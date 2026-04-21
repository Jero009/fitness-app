<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button class="header-action" @click="cancel()">Cancel</ion-button>
        </ion-buttons>
        <ion-title class="title">EDIT TEMPLATE</ion-title>
        <ion-buttons slot="end">
          <ion-button class="header-save" @click="confirm()">Save</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <section class="editor-hero">
        <div class="hero-left">
          <span class="hero-label">TEMPLATE EDITOR</span>
          <h1 class="hero-title">REFINE THE FLOW</h1>
          <p class="hero-subtitle">Rename, reorder, and tune reps in one pass.</p>
        </div>
        <ion-button class="hero-action" @click="goToExercisePicker">
          Add Exercise
        </ion-button>
      </section>

      <div class="editor-summary">
        <span class="summary-count">{{ exercises.length }} EXERCISES</span>
        <span class="summary-hint">Drag to reorder. Save when ready.</span>
      </div>

      <div class="editor-form">
        <ion-item class="input-card">
          <ion-input
            v-model="TemplateName"
            placeholder="Template name"
            :clear-on-edit="true"
            class="template-input"
          />
        </ion-item>
        <ion-button class="add-exercise" expand="block" @click="goToExercisePicker">
          Add exercise
        </ion-button>
      </div>

      <div class="exercise-list">
        <Draggable v-model="exercises" item-key="id_exercise" @end="onDragEnd">
          <template #item="{ element: ex, index }">
            <ion-item-sliding class="exercise-row">
              <ion-item class="exercise-card">
                <div class="exercise-main">
                  <span class="exercise-name">{{ ex.name }}</span>
                  <span class="exercise-index">#{{ index + 1 }}</span>
                </div>
                <div class="exercise-inputs">
                  <div class="mini-field">
                    <span class="mini-label">Sets</span>
                    <ion-input
                      :clear-on-edit="true"
                      type="number"
                      v-model.number="ex.set_number"
                      class="mini-input"
                      placeholder="0"
                    ></ion-input>
                  </div>
                  <div class="mini-field">
                    <span class="mini-label">Reps</span>
                    <ion-input
                      :clear-on-edit="true"
                      type="number"
                      v-model.number="ex.rep_number"
                      class="mini-input"
                      placeholder="0"
                    ></ion-input>
                  </div>
                </div>
              </ion-item>
              <ion-item-options side="end">
                <ion-item-option color="danger" @click="removeExercise(index)">Remove</ion-item-option>
              </ion-item-options>
            </ion-item-sliding>
          </template>
        </Draggable>
      </div>
    </ion-content>
  </ion-page>
</template>
<style scoped>


.title {
  font-family: 'Doto', sans-serif;
  letter-spacing: 3px;
}

.header-action {
  --color: #ffd200;
  font-family: 'Doto', sans-serif;
  letter-spacing: 1px;
}

.header-save {
  --background: #ffd200;
  --color: #0b0b0b;
  --background-activated: #d71921;
  --color-activated: #fff;
  font-weight: 700;
}

.editor-hero {
  margin: 20px;
  padding: 18px;
  border-radius: 10px;
  background: linear-gradient(140deg, rgba(255, 210, 0, 0.15), rgba(26, 26, 26, 0.9) 55%);
  border: 1px solid rgba(255, 210, 0, 0.18);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
}

.hero-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hero-label {
  font-family: 'Doto', sans-serif;
  font-size: 11px;
  letter-spacing: 2px;
  color: rgba(255, 210, 0, 0.7);
}

.hero-title {
  font-family: 'Doto', sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  margin: 0;
}

.hero-subtitle {
  margin: 0;
  color: #8a8a8a;
  font-size: 12px;
}

.hero-action {
  --background: #ffd200;
  --color: #0b0b0b;
  --background-activated: #d71921;
  --color-activated: #fff;
  font-weight: 700;
}

.editor-summary {
  margin: 0 20px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #666;
  font-size: 11px;
  letter-spacing: 1px;
}

.summary-count {
  font-family: 'Doto', sans-serif;
  color: #ffd200;
}

.summary-hint {
  color: #666;
}

.editor-form {
  margin: 0 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-card {
  --background: #151515;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
}

.template-input {
  color: #fff;
  font-family: 'Doto', sans-serif;
}

.add-exercise {
  --background: rgba(255, 210, 0, 0.12);
  --color: #ffd200;
  --background-activated: #ffd200;
  --color-activated: #0b0b0b;
  border: 1px solid rgba(255, 210, 0, 0.35);
  font-weight: 700;
}

.exercise-list {
  padding: 0 20px 30px;
}

.exercise-row {
  margin-bottom: 12px;
}

.exercise-card {
  --background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
}

.exercise-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.exercise-name {
  font-family: 'Doto', sans-serif;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
}

.exercise-index {
  color: #666;
  font-size: 11px;
  letter-spacing: 1px;
}

.exercise-inputs {
  display: flex;
  gap: 8px;
}

.mini-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}

.mini-label {
  font-family: 'Doto', sans-serif;
  font-size: 10px;
  letter-spacing: 1px;
  color: #666;
}

.mini-input {
  width: 70px;
  --background: rgba(255, 255, 255, 0.03);
  --border-color: rgba(255, 255, 255, 0.12);
  --border-radius: 8px;
  text-align: center;
  font-weight: 600;
  color: #fff;
}

.sortable-chosen {
  background: rgba(255, 210, 0, 0.08) !important;
}

@media (max-width: 600px) {
  .editor-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .exercise-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .exercise-inputs {
    width: 100%;
  }
}
</style>
<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonButton, IonButtons, IonInput, IonItemSliding, IonItemOptions, IonItemOption, onIonViewWillEnter } from '@ionic/vue';
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Draggable from 'vuedraggable';
import { getTemplateById, getTemplateExercisesByTemplateId, renameTemplate, editTemplateExercises, addExerciseToTemplate, deleteTemplateExercise } from '@/services/gym_db';

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
const removedExerciseRowIds = ref<number[]>([]);

const removeExercise = (index: number) => {
  const exercise = exercises.value[index];
  if (!exercise) return;

  if (exercise.id > 0 && !removedExerciseRowIds.value.includes(exercise.id)) {
    removedExerciseRowIds.value.push(exercise.id);
  }

  exercises.value.splice(index, 1);
};

// saving changes doesnt work

const confirm = async () => {
  console.log("🔥 SAVE CLICKED");
  const templateId = Number(route.params.id)
  if (!TemplateName.value) return;

  await renameTemplate(templateId, TemplateName.value);
  console.log("✅ Template renamed");

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
  console.log("✅ Template + exercises saved");

  // reset state
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
