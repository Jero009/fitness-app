<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="toolbar-flex">
        <ion-title class="title">Home</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Home</ion-title>
        </ion-toolbar>
      </ion-header>

            <ion-card class="top-card">
                <ion-card-header >
                <ion-card-title>Stats</ion-card-title>
                <ion-card-subtitle>Stats for the last workout</ion-card-subtitle>
                </ion-card-header>
                  total_kg time
                <ion-card-content>
                
                </ion-card-content>
            </ion-card>

            <ion-card class="card-active-workout" v-if="activeWorkout"  @click="backToWorkout()">
                <ion-card-header >
                <ion-card-title>active workout</ion-card-title>
                </ion-card-header>
            </ion-card>
       <div class="card-container">
              <ion-card class="card" v-for="template in templates" :key="template.id">
                  <ion-card-header>
                      <ion-card-title>{{ template.name }}</ion-card-title>
                      <ion-card-subtitle>{{ template.created_at }}</ion-card-subtitle>
                  </ion-card-header>
                  <ion-card-content>
                    <ion-icon :icon="barbellSharp"></ion-icon>
                  </ion-card-content>
                  <ion-button :disabled="activeWorkout" @click="startWorkout(template.id)">
                    Start
                  </ion-button>
              </ion-card>
        </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent,IonCard,IonCardHeader,IonCardSubtitle,IonCardContent,IonCardTitle,onIonViewWillEnter,IonIcon,IonButton} from '@ionic/vue';
import { getTemplates,startWorkoutFromTemplate,hasActiveWorkout,getActiveWorkout } from '@/services/gym_db'
import { ref ,onMounted } from 'vue';
import { barbellSharp } from 'ionicons/icons';
import { useRouter } from 'vue-router';


const activeWorkout = ref(false);

// routing
const router = useRouter();

const startWorkout = async (templateId: number) => {
  const workoutId = await startWorkoutFromTemplate(templateId);

  router.push(`/workout/${workoutId}`);
};
// active workout id
const backToWorkout = async () => {
  const workout = await getActiveWorkout();

  if (workout) {
    router.push(`/workout/${workout.id}`);
  }
};

// displaying templates
const templates = ref<Template[]>([]);

type Template = {
  id: number;
  name: string;
  created_at: string;
};

const loadTemplates = async () => {
  const data = await getTemplates();

  if (!data) {
    templates.value = [];
    return;
  }
  templates.value = data;
};



onMounted(async () => {
  activeWorkout.value = await hasActiveWorkout();
  console.log("Active workout:", activeWorkout.value);
  loadTemplates()
});

onIonViewWillEnter(async () => {
  activeWorkout.value = await hasActiveWorkout();
  console.log("Active workout:", activeWorkout.value);
  loadTemplates();
});











</script>
<style>


.card-container {
  height: 100vh;

  display: flex;
  justify-content: space-between; 
  align-items: flex-start;  
  padding: 10px;
}
.card{
 
  width: 48%;
  aspect-ratio: 1/1;
}
.card-active-workout{
 margin: 10px 20px;
 background-color: var(--ion-color-accent-yellow);
 color: var(--ion-color-dark);
}
.top-card{
  margin: 10px 20px;
  background-color: var(--ion-color-accent-red);
}
</style>