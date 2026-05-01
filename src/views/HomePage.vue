<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="toolbar-flex">
        <ion-title class="title">HOME</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Home</ion-title>
        </ion-toolbar>
      </ion-header>
          <div class="top-card-container">
            <ion-card class="top-card" v-if="!activeWorkout">
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
          </div>
          <div class="card-card-container">
            <div class="card-container">
              <ion-card
                class="card"
                :class="{ 'card-disabled': activeWorkout }"
                v-for="template in templates"
                :key="template.id"
                :aria-disabled="activeWorkout"
                @click="startWorkout(template.id)"
              >
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
                <ion-select placeholder="Select template" interface="action-sheet" v-model="selectedTemplateId"><!--this doesnt triger-->
                  <ion-select-option v-for="t in templates" :key="t.id" :value="t.id">
                    {{ t.name }}
                  </ion-select-option>
                </ion-select>
                <canvas ref="chartRef" ></canvas>
              </ion-card>
            </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardSubtitle, IonCardContent, IonCardTitle, onIonViewWillEnter, IonIcon, IonSelect, IonSelectOption } from '@ionic/vue';
import { getTemplates, startWorkoutFromTemplate, getActiveWorkout, getLatestWorkout, getWorkoutsByName } from '@/services/gym_db';
import { ref, onMounted, onUnmounted,computed,watch } from 'vue';
import { barbellSharp } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import {Chart,LineController,LineElement,PointElement,LinearScale,CategoryScale} from 'chart.js';


const activeWorkout = ref(false);

// routing
const router = useRouter();

const startWorkout = async (templateId: number) => {
  if (activeWorkout.value) {
    return;
  }

  const workoutId = await startWorkoutFromTemplate(templateId);

  if (!workoutId) {
    console.error('Failed to start workout');
    return;
  }

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
  latestWorkout.value = workout || null;
};

const toTimestamp = (value: unknown): number => {
  if (value === null || value === undefined) return NaN;

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : NaN;
  }

  const raw = String(value).trim();
  if (!raw) return NaN;

  const numeric = Number(raw);
  if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
    return numeric;
  }

  const normalized = raw.includes(' ') ? raw.replace(' ', 'T') : raw;
  const hasTimezone = /(?:Z|[-+]\d{2}:?\d{2})$/i.test(normalized);
  const candidate = hasTimezone ? normalized : `${normalized}Z`;

  return new Date(candidate).getTime();
};

const normalizeDateInput = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const normalized = raw.includes(' ') ? raw.replace(' ', 'T') : raw;
  const hasTimezone = /(?:Z|[-+]\d{2}:?\d{2})$/i.test(normalized);
  return hasTimezone ? normalized : `${normalized}Z`;
};

const formatDuration = (start: string, end: any) => {
  if (!start || !end) return '0h 0m 0s';

  const s = toTimestamp(start);
  const e = toTimestamp(end);

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
    startTime.value = normalizeDateInput(workout.time_start);
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
const selectedTemplateId = ref<number | undefined>(undefined);

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

// Watch for template selection and update chart data
watch(selectedTemplateId, async (templateId) => {
  if (templateId === undefined || templateId === null) {
    workouts.value = [];
    renderChart();
    return;
  }
  const numId = Number(templateId);
  const data = await getWorkoutsByName(numId);
  workouts.value = data || [];
  renderChart();
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
.card-card-container {
  width: 100%;
}
.card-container {
  width: 100%;

  margin: auto;
  display: flex;
  flex-wrap: wrap;

  justify-content: center;
}
.card {
  max-width: 44%;
  aspect-ratio: 1/1;
  text-align: center;

}

.card-disabled {
  opacity: 0.5;
  pointer-events: none;
}
.card-title {
  font-size: 3em;
  font-weight: bold;
}
.card-active-workout{
  height: 20vh;
  width: 90%;
  margin: auto;
 background-color: var(--ion-color-accent-yellow);
 color: var(--ion-color-primary);
}
.top-card{
  height: 20vh;
  width: 90%;
  margin: auto;
 
}
.top-card-container{
  width: 100%;
  height: 20vh;
  margin: 5px 0;
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
}
.chart-card {
  width: 90%;
  margin: auto;
  padding: 10px;
  border-radius: 10px;
}
</style>