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
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Template</ion-title>
        </ion-toolbar>
      </ion-header>
      <!-- templates -->
          <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
            <ion-refresher-content></ion-refresher-content>
          </ion-refresher>
              <ion-card class="card-template" v-for="template in templates" :key="template.id">
                  <ion-card-header class="card-header">
                      <ion-card-title class="card-title">{{ template.name }}</ion-card-title>
                      <ion-card-subtitle class="card-subtitle">{{ template.created_at }}</ion-card-subtitle>
                  </ion-card-header>
                      <ion-item class="card-item">
                      <ion-button class="button-red" @click="deleteTemp(template.id)">Delete</ion-button>
                      <ion-button class="button-yellow" @click="editTemp(template.id)">Edit</ion-button>
                    </ion-item>
                  <ion-card-content>

                    <ion-list>
                      <ion-item
                        v-for="ex in template.exercises"
                        :key="ex.id"
                      > 
                        <div style="flex: 1;">
                          {{ ex.name}}
                        </div>

                        <span>{{ ex.set_number }} x {{ ex.rep_number}}</span>
                    
                      </ion-item>
                    </ion-list>
                  </ion-card-content>
              </ion-card>
    </ion-content>
  </ion-page>
</template>
<style>
.card-template{
  margin: 10px auto ;
  width: 90%;
}
.card-title{
  font-size: 2em;
  color:var(--ion-color-light);
  font-weight: bold;
  text-align: center;
}
.card-subtitle{
  font-size: 0.9em;
  color:var(--ion-color-light);
  text-align: center;
}

.card-header{
  background-color: var(--ion-color-medium);
}
</style>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardContent, IonCardSubtitle, IonCardTitle, IonList, IonItem, IonButton, IonIcon, IonButtons, IonRefresher, IonRefresherContent, onIonViewWillEnter } from '@ionic/vue';
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





