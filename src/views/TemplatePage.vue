<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title class="title">TEMPLATE</ion-title>
      <ion-buttons slot="end">
        <ion-button class="button-red" @click="goToTemplateBuilder">
          <ion-icon :icon="add"></ion-icon>
        </ion-button>
      </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" class="template-content">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Template</ion-title>
        </ion-toolbar>
      </ion-header>
      <!-- templates -->
          <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
            <ion-refresher-content></ion-refresher-content>
          </ion-refresher>
              <div class="template-shell">
                <ion-card class="card-template" v-for="template in templates" :key="template.id">
                    <ion-card-header class="card-header">
                        <div class="card-header__copy">
                          <ion-card-title class="card-title">{{ template.name }}</ion-card-title>
                          <ion-card-subtitle class="card-subtitle">{{ template.created_at }}</ion-card-subtitle>
                        </div>
                        <div class="card-header__actions">
                          <ion-button class="button-red" @click="deleteTemp(template.id)">Delete</ion-button>
                          <ion-button class="button-yellow" @click="editTemp(template.id)">Edit</ion-button>
                        </div>
                    </ion-card-header>
                    <ion-card-content>

                      <ion-list class="template-exercise-list" lines="none">
                        <ion-item
                          class="template-exercise-item"
                          v-for="ex in template.exercises"
                          :key="ex.id"
                          lines="none"
                        > 
                          <div class="template-exercise-item__content">
                            <div class="template-exercise-item__name">{{ ex.name }}</div>
                            <div class="template-exercise-item__meta">{{ ex.set_number }} sets {{ ex.rep_number }} reps</div>
                          </div>
                        </ion-item>
                      </ion-list>
                    </ion-card-content>
                </ion-card>
              </div>
    </ion-content>
  </ion-page>
</template>
<style>
.template-content {
  --padding-top: 16px;
  --padding-bottom: 24px;
  scrollbar-gutter: stable;
}

.template-shell {
  padding: 16px;
  display: grid;
  gap: 18px;
  max-width: 760px;
  margin: 0 auto;
  width: min(100%, 760px);
  justify-items: stretch;
}

.card-template{
  margin: 0;
  width: 100%;
  min-height: 180px;
  border-radius: var(--ion-border-radius, 10px);
  background: var(--ion-card-background);
  color: var(--ion-card-color);
  box-shadow: none;
}

.card-header{
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 18px 12px;
}

.card-header__copy {
  display: grid;
  gap: 6px;
}

.card-header__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.card-title{
  font-size: 1.4rem;
  color:var(--ion-color-light);
  font-weight: bold;
  margin: 0;
}

.card-subtitle{
  font-size: 0.9em;
  color: rgba(255, 255, 255, 0.58);
  margin: 0;
}

.card-template ion-card-content {
  padding: 0 18px 18px;
  display: grid;
  justify-items: center;
}

.template-exercise-list {
  display: grid;
  gap: 8px;
  background: transparent;
  padding: 0;
  width: 100%;
}

.template-exercise-item {
  --background: transparent;
  --inner-border-width: 0;
  --padding-start: 0;
  --padding-end: 0;
  margin-top: 0;
  border: none;
  width: min(100%, 96%);
  justify-self: center;
}

.template-exercise-item__content {
  width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.035);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.template-exercise-item__name {
  color: var(--ion-color-light);
  font-weight: 600;
  text-align: left;
  flex: 1;
}

.template-exercise-item__meta {
  color: rgba(255, 255, 255, 0.84);
  font-size: 0.9rem;
  white-space: nowrap;
  text-align: right;
  flex-shrink: 0;
}

@media (max-width: 700px) {
  .card-header {
    flex-direction: column;
  }

  .card-header__actions {
    justify-content: flex-start;
  }
}
</style>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardContent, IonCardSubtitle, IonCardTitle, IonList, IonItem, IonButton, IonIcon, IonButtons, IonRefresher, IonRefresherContent, onIonViewWillEnter, alertController } from '@ionic/vue';
import type { RefresherCustomEvent } from '@ionic/vue';
import { add } from 'ionicons/icons';
import { ref, onMounted } from 'vue';
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
  const template = templates.value.find(t => t.id === id);
  const templateName = template?.name || 'this template';

  const alert = await alertController.create({
    header: 'Delete Template?',
    message: `Are you sure you want to delete "${templateName}"? This action cannot be undone.`,
    cssClass: 'app-confirm-alert',
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel'
      },
      {
        text: 'Delete',
        role: 'destructive',
        handler: async () => {
          await deleteTemplate(id);
          await loadTemplates();
        }
      }
    ]
  });

  await alert.present();
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





