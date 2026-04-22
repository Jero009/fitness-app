<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title class="title">TEMPLATES</ion-title>
        <ion-buttons slot="end">
          <ion-button class="header-create" @click="goToTemplateBuilder">
            <ion-icon :icon="add"></ion-icon>
            New
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" >
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <section class="templates-hero">
        <div class="hero-left">
          <span class="hero-label">TEMPLATE LIBRARY</span>
          <h1 class="hero-title">BUILD YOUR SPLIT</h1>
          <p class="hero-subtitle">Create reusable routines and launch workouts fast.</p>
        </div>
        <ion-button class="hero-create" @click="goToTemplateBuilder">
          <ion-icon :icon="add"></ion-icon>
          Create
        </ion-button>
      </section>

      <div class="template-summary">
        <div class="summary-left">
          <span class="templates-count">{{ templates.length }}_TOTAL</span>
          <div class="quick-stats">
            <span class="quick-stat">{{ totalExercises }} EXERCISES</span>
            <span class="quick-stat">{{ totalSets }} SETS</span>
          </div>
        </div>
        <span class="templates-hint">Tap a card to edit, or use quick actions.</span>
      </div>

      <div v-if="templates.length === 0" class="empty-state">
        <div class="empty-card">
          <span class="empty-kicker">NO TEMPLATES YET</span>
          <h2>Start with a split</h2>
          <p>Build your first template to speed up every workout.</p>
          <ion-button class="hero-create" @click="goToTemplateBuilder">
            <ion-icon :icon="add"></ion-icon>
            Create Template
          </ion-button>
        </div>
      </div>

      <div v-else class="templates-grid">
        <div
          v-for="template in templates"
          :key="template.id"
          class="template-card"
          @click="editTemp(template.id)"
        >
          <div class="card-top">
            <div>
              <h3 class="template-name">{{ template.name }}</h3>
              <span class="template-date">{{ template.created_at.split(' ')[0] }}</span>
            </div>
            <span class="meta-pill">{{ template.exercises?.length || 0 }} EXERCISES</span>
          </div>

          <div class="exercise-preview">
            <div
              v-for="ex in template.exercises?.slice(0, 3)"
              :key="ex.id"
              class="exercise-row"
            >
              <span class="exercise-name">{{ ex.name }}</span>
              <span class="exercise-sets">{{ ex.set_number }} x {{ ex.rep_number }}</span>
            </div>
            <div v-if="(template.exercises?.length || 0) > 3" class="exercise-more">
              +{{ (template.exercises?.length || 0) - 3 }} more
            </div>
          </div>

          <div class="card-actions">
            <ion-button class="card-action edit" fill="clear" @click.stop="editTemp(template.id)">
              Edit
            </ion-button>
            <ion-button class="card-action delete" fill="clear" @click.stop="deleteTemp(template.id)">
              Delete
            </ion-button>
          </div>
        </div>

        <div class="template-card create-card" @click="goToTemplateBuilder">
          <div class="create-content">
            <span class="plus-icon">+</span>
            <span class="create-text">CREATE NEW</span>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>
<style scoped>

.title {
  font-family: 'Doto', sans-serif;
  letter-spacing: 3px;
}

.header-create {
  --background: #ffd200;
  --color: #0b0b0b;
  --background-activated: #d71921;
  --color-activated: #fff;
  font-weight: 700;
  gap: 6px;
}

.templates-hero {
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

.hero-create {
  --background: #ffd200;
  --color: #0b0b0b;
  --background-activated: #d71921;
  --color-activated: #fff;
  font-weight: 700;
  gap: 6px;
}

.template-summary {
  margin: 0 20px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #666;
  font-size: 11px;
  letter-spacing: 1px;
}

.summary-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.quick-stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.quick-stat {
  background: rgba(255, 210, 0, 0.08);
  color: #ffd200;
  font-family: 'Doto', sans-serif;
  font-size: 10px;
  letter-spacing: 1px;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 210, 0, 0.2);
}

.templates-count {
  font-family: 'Doto', sans-serif;
  color: #ffd200;
}

.templates-hint {
  color: #666;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  padding: 0 20px 30px;
}

.template-card {
  background: #1a1a1a;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.template-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 210, 0, 0.35);
}

.card-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
}

.template-name {
  font-family: 'Doto', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 6px 0;
}

.template-date {
  font-size: 11px;
  color: #666;
  letter-spacing: 1px;
}

.meta-pill {
  background: rgba(255, 210, 0, 0.1);
  color: #ffd200;
  font-size: 10px;
  padding: 4px 8px;
  border-radius: 999px;
  font-family: 'Doto', sans-serif;
  letter-spacing: 1px;
}

.exercise-preview {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.exercise-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #cfcfcf;
}

.exercise-name {
  max-width: 65%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.exercise-sets {
  color: #ffd200;
  font-family: 'Doto', sans-serif;
  letter-spacing: 1px;
}

.exercise-more {
  font-size: 11px;
  color: #666;
}

.card-actions {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.card-action {
  --color: #ffd200;
  font-family: 'Doto', sans-serif;
  letter-spacing: 1px;
}

.card-action.delete {
  --color: #d71921;
}

.create-card {
  border: 1px dashed rgba(255, 210, 0, 0.4);
  background: rgba(255, 210, 0, 0.06);
  align-items: center;
  justify-content: center;
  min-height: 220px;
}

.create-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #ffd200;
}

.plus-icon {
  font-size: 34px;
  font-weight: 300;
}

.create-text {
  font-family: 'Doto', sans-serif;
  letter-spacing: 2px;
  font-size: 11px;
  font-weight: 700;
}

.empty-state {
  padding: 0 20px 30px;
}

.empty-card {
  background: #151515;
  border: 1px solid rgba(255, 210, 0, 0.2);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  color: #fff;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
}

.empty-card h2 {
  margin: 8px 0;
  font-family: 'Doto', sans-serif;
  font-size: 20px;
}

.empty-card p {
  margin: 0 0 16px;
  color: #8a8a8a;
  font-size: 13px;
}

.empty-kicker {
  font-family: 'Doto', sans-serif;
  font-size: 11px;
  letter-spacing: 2px;
  color: rgba(255, 210, 0, 0.8);
}

@media (max-width: 600px) {
  .templates-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .card-actions {
    flex-direction: row;
    align-items: center;
  }
}
</style>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonButtons, IonRefresher, IonRefresherContent, onIonViewWillEnter } from '@ionic/vue';
import type { RefresherCustomEvent } from '@ionic/vue';
import { add } from 'ionicons/icons';
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { getTemplates, getTemplateExercises, deleteTemplate, getExercises } from '@/services/gym_db';

const router = useRouter();


const goToTemplateBuilder = () => {

  router.push({ name: 'TemplateBuilder' });
};

const editTemp = (id: number) => {
  router.push({ name: 'TemplateEditor', params: { id } });
};


// displaying templates
const templates = ref<Template[]>([]);

const totalExercises = computed(() =>
  templates.value.reduce((sum, template) => sum + (template.exercises?.length || 0), 0)
);

const totalSets = computed(() =>
  templates.value.reduce((sum, template) => {
    const templateSets = (template.exercises || []).reduce(
      (templateSum, exercise) => templateSum + (Number(exercise.set_number) || 0),
      0
    );
    return sum + templateSets;
  }, 0)
);

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

  for (const template of data) {
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


// delete template and template exercise
const deleteTemp = async (id: number) => {
  await deleteTemplate(id);
  await loadTemplates();
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

  LoadExercises();
  loadTemplates();
});
</script>





