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
                <ion-card-title >Stats for the last workout</ion-card-title>

                <ion-card-subtitle>{{ latestWorkout?.time_end}}</ion-card-subtitle>
                </ion-card-header>
                <ion-card-content>
                <span>Total weight lifted: {{ latestWorkout?.total_kg || 0 }} kg</span>
                <span>{{ formatDuration(latestWorkout?.time_start, latestWorkout?.time_end) }}</span>
                </ion-card-content>
            </ion-card>

            <ion-card class="card-active-workout" v-if="activeWorkout"  @click="backToWorkout()">
                <ion-card-header >
                <ion-card-title class="active-workout-title">active workout</ion-card-title>
                <ion-card-subtitle>Click to continue</ion-card-subtitle>
                <ion-card-content class="active-workout-content">
                  <div class="timer-active">{{ formatTime() }}</div>
                </ion-card-content>
                </ion-card-header>
            </ion-card>
            <div class="card-container">
              <ion-card class="card" v-for="template in templates" :key="template.id" :disabled="activeWorkout" @click="startWorkout(template.id)">
                  <ion-card-header>
                      <ion-card-title class="card-title">{{ template.name }}</ion-card-title>
                      <ion-card-subtitle>{{ template.created_at }}</ion-card-subtitle>
                  </ion-card-header>
                  <ion-card-content>
                    <ion-icon :icon="barbellSharp"></ion-icon>
                  </ion-card-content>
              </ion-card>
            </div>
              <ion-card class="chart-card">
                <ion-select v-model="selectedTemplateId" placeholder="Select template" interface="action-sheet">
                  <ion-select-option v-for="t in templates" :key="t.id" :value="t.id">
                    {{ t.name }}
                  </ion-select-option>
                </ion-select>
                <canvas ref="chartRef" ></canvas>
              </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardSubtitle, IonCardContent, IonCardTitle, onIonViewWillEnter, IonIcon, IonButton } from '@ionic/vue';
import { getTemplates, startWorkoutFromTemplate, hasActiveWorkout, getActiveWorkout, getWorkoutById,getLatestWorkout,getWorkoutsByTemplate,getWorkoutsByName } from '@/services/gym_db';
import { ref, onMounted, onUnmounted,computed,watch } from 'vue';
import { barbellSharp } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import {Chart,LineController,LineElement,PointElement,LinearScale,CategoryScale} from 'chart.js';


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
//latest workout 

const latestWorkout = ref<any>(null);

const loadLatestWorkout = async () => {
  const workout = await getLatestWorkout();
  if (workout) {
    latestWorkout.value = workout;
  }
};

const formatDuration = (start: string, end: any) => {
  if (!start || !end) return '0h 0m 0s';

  // parse start (string)
  const s = new Date(start.replace(' ', 'T')).getTime();

  // parse end (can be string, number, or stringified number)
  let e: number;
  if (typeof end === 'number') {
    e = end;
  } else if (!isNaN(Number(end))) {
    e = Number(end);
  } else {
    e = new Date(end.replace(' ', 'T')).getTime();
  }

  if (isNaN(s) || isNaN(e)) return 'Invalid time';

  const diff = Math.max(0, e - s);
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);


  return `${hours}h ${minutes}m`;
};




// Timer logic (refactored)
const startTime = ref<string | null>(null);
const seconds = ref(0);
let interval: ReturnType<typeof setInterval> | null = null;

const loadActiveWorkout = async () => {
  const workout = await getActiveWorkout();
  if (workout && workout.time_start) {
    startTime.value = workout.time_start.replace(' ', 'T');
    startTimer();
    activeWorkout.value = true;
  } else {
    startTime.value = null;
    seconds.value = 0;
    activeWorkout.value = false;
    clearTimer();
  }
};


const startTimer = () => {
  if (!startTime.value || interval) return;
  interval = setInterval(() => {
    const start = new Date(startTime.value!).getTime();
    const now = Date.now();
    seconds.value = Math.max(0, Math.floor((now - start) / 1000));
  }, 1000);
};

const clearTimer = () => {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
};

const formatTime = () => {
  const hrs = Math.floor(seconds.value / 3600);
  const mins = Math.floor((seconds.value % 3600) / 60);
  const secs = seconds.value % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// chart 

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale
);

const chartRef = ref<any>(null);
let chart: any = null;

const workouts = ref<any[]>([]);
const selectedTemplateId = ref<number|null>(null);

// prepare data
const chartData = computed(() => {
  return workouts.value
    .map(w => ({
      date: new Date(w.time_start.replace(' ', 'T')).toLocaleDateString(),
      kg: w.total_kg || 0
    }))
    .reverse(); // oldest → newest
});

// draw chart
const renderChart = () => {
  if (!chartRef.value) return;

  if (chart) {
    chart.destroy(); // prevent duplicates
  }

  chart = new Chart(chartRef.value, {
    type: 'line',
    data: {
      labels: chartData.value.map(d => d.date),
      datasets: [
        {
          label: 'Total KG',
          data: chartData.value.map(d => d.kg),
          borderWidth: 2,
          tension: 0.3,


          borderColor: '#D71921',
          pointRadius: 4,
          pointBackgroundColor: '#D71921',
        }
      ]
    },
    options: {
      responsive: true,
      animation: false 
    }
  });
};



// Watch for template selection and update chart data (only one watcher)
watch(selectedTemplateId, async (templateId) => {
  console.log('Template selected:', templateId, typeof templateId);
  if (templateId != null && templateId !== '') {

    const numId = Number(templateId);

    console.log('Fetching workouts for templateId:', numId);

    const data = await getWorkoutsByName(numId);

    console.log('Fetched workouts:', data);
    workouts.value = data || [];
  } else {
    workouts.value = [];
  }
  setTimeout(() => {
    renderChart();
  }, 0);
});

// Load all templates and latest workout on mount
onMounted(async () => {
  await loadActiveWorkout();
  await loadTemplates();
  await loadLatestWorkout();
  renderChart();
});

onIonViewWillEnter(async () => {
  await loadActiveWorkout();
  await loadTemplates();
  await loadLatestWorkout();
  renderChart();
});



onUnmounted(() => {
  clearTimer();
  if (chart) chart.destroy();
});



</script>
<style>
.card-container {
  display: flex;
  flex-wrap: wrap;
  column-gap: 8px; /* horizontal space between cards */
  justify-content: center;

}

.card {
  flex: 0 1 calc(45% - 8px); /* 50% minus half the column-gap */
  max-width: calc(45% - 8px);
  aspect-ratio: 1/1;
  box-sizing: border-box;
  text-align: center;
}
.card-title {
  font-size: 3em;
  font-weight: bold;
}


.card-active-workout{
 margin: 10px 20px;
 background-color: var(--ion-color-accent-yellow);
 color: var(--ion-color-primary);
}
.top-card{
  margin: 10px 20px;
 
}
.active-workout-title{
  color: var(--ion-color-dark);
}
.timer-active {
  font-family: 'Doto', sans-serif;
  pointer-events: none; 
  color: var(--ion-color-dark)
}
.active-workout-content{
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
.chart-card {
  width: 90%;
  margin: auto;
  padding: 10px;
  border-radius: 10px;
  background-color: var(--ion-color-dark);
}
</style>