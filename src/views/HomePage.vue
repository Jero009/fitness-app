<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="toolbar-flex">
        <ion-title class="title">HOME</ion-title>
      </ion-toolbar>
    </ion-header>
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Home</ion-title>
        </ion-toolbar>
      </ion-header>
    <ion-content :fullscreen="true" class="home-content">
      <div class="home-shell">
        <section class="hero-wrap">
          <div class="top-cards">
            <ion-card v-if="!activeWorkout" class="summary-card">
              <div class="card-topline">
                <p class="section-kicker">Last workout</p>
              </div>

              <div class="summary-card__body">

                <div class="card-metrics">
                  <div class="card-metric">
                    <span>Time</span>
                    <strong>{{ formatDuration(latestWorkout?.time_start, latestWorkout?.time_end) }}</strong>
                  </div>
                  <div class="card-metric">
                    <span>Total load</span>
                    <strong>{{ `${latestWorkout?.total_kg || 0} kg` }}</strong>
                  </div>
                  <div class="card-metric card-metric-wide">
                    <span>Completed</span>
                    <strong>{{ formatWorkoutDate(latestWorkout?.time_end) }}</strong>
                  </div>
                </div>
              </div>
            </ion-card>

            <ion-card v-else class="active-card" @click="backToWorkout()">
              <div class="card-topline">
                <p class="section-kicker">Active workout</p>
              </div>

              <div class="active-card__body">
                <div class="active-card__timer">
                  <span>Timer</span>
                  <strong>{{ formatTime() }}</strong>
                </div>
              </div>
            </ion-card>
          </div>
        </section>

        <section class="workout-section">

          <div class="workout-grid">
            <ion-card
              class="workout-tile"
              :class="{ 'workout-tile-disabled': activeWorkout }"
              v-for="template in templates"
              :key="template.id"
              :aria-disabled="activeWorkout"
              @click="startWorkout(template.id)"
            >
              <div class="workout-tile__icon">
                <ion-icon :icon="barbellSharp"></ion-icon>
              </div>
              <div class="workout-tile__copy">
                <span>Workout</span>
                <strong>{{ template.name }}</strong>
                <small>{{ template.created_at }}</small>
              </div>
            </ion-card>
          </div>
        </section>

        <ion-card class="graph-card">
          <div class="graph-card__header">
            <div>
              <p class="section-kicker">Progress</p>
              <h3>Load trend</h3>
            </div>
            <ion-select placeholder="Select template" interface="action-sheet" v-model="selectedTemplateId">
              <ion-select-option v-for="t in templates" :key="t.id" :value="t.id">
                {{ t.name }}
              </ion-select-option>
            </ion-select>
          </div>
          <div class="chart-frame">
            <canvas ref="chartRef"></canvas>
          </div>
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

  if (data.length && !data.some(template => template.id === selectedTemplateId.value)) {
    selectedTemplateId.value = data[0].id;
  }
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

const formatWorkoutDate = (value: unknown) => {
  const normalized = normalizeDateInput(value);

  if (!normalized) return 'No session yet';

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return 'No session yet';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date);
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
      animation: false,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#b9b9b9',
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.06)',
          },
        },
        y: {
          ticks: {
            color: '#b9b9b9',
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.06)',
          },
        },
      }
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
ion-content.home-content {
  --padding-top: 16px;
  --padding-bottom: 24px;
}

.home-shell {
  padding: 16px;
  display: grid;
  gap: 18px;
}

.hero-wrap,
.workout-section {
  display: grid;
  gap: 12px;
}

.top-cards {
  display: grid;
  gap: 12px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 12px;
  margin-bottom: 12px;
}

.section-heading h3,
.hero-copy h2,
.graph-card__header h3 {
  margin: 0;
}


.summary-card,
.graph-card,
.workout-tile {
  border-radius: 10px;
  background: var(--ion-color-primary);
}

.summary-card,
.active-card {
  margin: 0;
  padding: 18px;
  width: 100%;
  min-height: 190px;
}


.active-card {
  background: var(--ion-color-accent-yellow);
}

.card-topline,
.graph-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}


.summary-card__body,
.active-card__body {
  display: grid;
  gap: 18px;
  margin-top: 18px;
}


.card-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.card-metric,
.active-card__timer {
  border-radius: 10px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.05);
}

.card-metric span,
.active-card__timer span,
.workout-tile__copy span {
  display: block;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.8rem;
}

.card-metric strong,
.active-card__timer strong {
  display: block;
  font-size: 1rem;
}

.card-metric-wide {
  grid-column: 1 / -1;
}

.workout-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.workout-section {
  margin-top: 4px;
}

.workout-tile {
  margin: 0;
  aspect-ratio: 1 / 1;
  padding: 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.workout-tile-disabled {
  opacity: 0.52;
  pointer-events: none;
}

.workout-tile__icon {
  width: 54px;
  height: 54px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background:var(--ion-color-primary);
}

.workout-tile__icon ion-icon {
  font-size: 1.6rem;
  color: var(--ion-color-light);
}

.workout-tile__copy strong {
  display: block;
  font-size: 1rem;
  line-height: 1.2;
}

.workout-tile__copy small {
  display: block;
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.44);
}

.graph-card {
  margin: 0;
  padding: 18px;
}

.graph-card__header ion-select {
  min-width: 132px;
}

.chart-frame {
  margin-top: 16px;
  height: 240px;
}

.chart-frame canvas {
  width: 100% !important;
  height: 100% !important;
}

@media (min-width: 700px) {
  .home-shell {
    max-width: 760px;
    margin: 0 auto;
    padding: 20px;
  }

  .summary-card,
  .active-card {
    padding: 24px;
  }

  .top-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: stretch;
  }

  .summary-card__body,
  .active-card__body {
    grid-template-columns: 1.1fr 0.9fr;
    align-items: end;
  }

  .workout-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>