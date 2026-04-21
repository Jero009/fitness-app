<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button class="header-action" @click="cancel()">Cancel</ion-button>
        </ion-buttons>
        <ion-title class="title">CREATE TEMPLATE</ion-title>
        <ion-buttons slot="end">
          <ion-button class="header-save" @click="confirm()">Save</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" >
      <section class="builder-hero">
        <div class="hero-left">
          <span class="hero-label">TEMPLATE BUILDER</span>
          <h1 class="hero-title">DESIGN YOUR SESSION</h1>
          <p class="hero-subtitle">Set a name, add exercises, then drag to reorder.</p>
        </div>
        <ion-button class="hero-action" @click="goToExercisePicker">
          Add Exercise
        </ion-button>
      </section>

      <div class="builder-summary">
        <span class="summary-count">{{ selectedExercises.length }} EXERCISES</span>
        <span class="summary-hint">Tap Save when you are ready.</span>
      </div>

      <div class="builder-form">
        <ion-item class="input-card">
          <ion-input
            v-model="TemplateName"
            placeholder="Template name"
            class="template-input"
          />
        </ion-item>
        <ion-button class="add-exercise" expand="block" @click="goToExercisePicker">
          Add exercise
        </ion-button>
      </div>

      <div class="exercise-list">
        <Draggable v-model="selectedExercises" item-key="id">
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
                      v-model="ex.set_number"
                      class="mini-input"
                      placeholder="0"
                    ></ion-input>
                  </div>
                  <div class="mini-field">
                    <span class="mini-label">Reps</span>
                    <ion-input
                      :clear-on-edit="true"
                      type="number"
                      v-model="ex.rep_number"
                      class="mini-input"
                      placeholder="0"
                    ></ion-input>
                  </div>
                </div>
              </ion-item>
              <ion-item-options side="end">
                <ion-item-option color="danger" @click="removeSelectedExercise(index)">Remove</ion-item-option>
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

.builder-hero {
  margin: 20px;
  padding: 18px;
  border-radius: 10px;
  background:rgba(26, 26, 26, 0.9);
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

.builder-summary {
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

.builder-form {
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
  .builder-hero {
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





