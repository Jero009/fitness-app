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

                <div class="weekly-goal-panel">
                  <div class="weekly-goal-panel__header">
                    <div>
                      <span class="weekly-goal-panel__label">This week</span>
                      <strong>{{ weeklyCompletedWorkouts }} workout{{ weeklyCompletedWorkouts === 1 ? '' : 's' }}</strong>
                    </div>
                    <div class="weekly-goal-panel__selector">
                      <span>Goal</span>
                      <ion-select
                        v-model="weeklyWorkoutGoal"
                        interface="action-sheet"
                        :interface-options="{ cssClass: 'app-action-sheet' }"
                        class="app-select weekly-goal-select"
                      >
                        <ion-select-option v-for="goal in weeklyGoalOptions" :key="goal" :value="goal">
                          {{ goal }} / week
                        </ion-select-option>
                      </ion-select>
                    </div>
                  </div>

                  <div class="weekly-goal-panel__meta">
                    <span>{{ weeklyGoalProgress }}% reached</span>
                    <span>{{ weeklyCompletedWorkouts }} of {{ weeklyWorkoutGoal }}</span>
                  </div>

                  <div class="weekly-goal-dots" :aria-label="`Weekly goal progress: ${weeklyCompletedWorkouts} of ${weeklyWorkoutGoal}`">
                    <span
                      v-for="dot in weeklyGoalDots"
                      :key="dot"
                      class="weekly-goal-dot"
                      :class="{ 'weekly-goal-dot--filled': dot <= weeklyCompletedWorkouts }"
                    ></span>
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
                  <span>Workout</span>
                  <strong>{{ formatWorkoutTimer() }}</strong>
                </div>

                <div v-if="activeRestTimer.isActive" class="active-card__timer active-card__timer--rest">
                  <span>Rest</span>
                  <strong>{{ formatRestTime(activeRestTimer.remaining) }}</strong>
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
            <ion-select placeholder="Select template" interface="action-sheet" :interface-options="{ cssClass: 'app-action-sheet' }" v-model="selectedTemplateId" class="app-select">
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
import { getTemplates, startWorkoutFromTemplate, getActiveWorkout, getLatestWorkout, getWorkouts, getWorkoutsByName } from '@/services/gym_db';
import { ref, onMounted, onUnmounted,computed,watch } from 'vue';
import { barbellSharp } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import {Chart,LineController,LineElement,PointElement,LinearScale,CategoryScale} from 'chart.js';
import type { WorkoutTemplate, Workout, WorkoutHistory } from '@/types/models';
import { formatDuration, formatTime, normalizeDateInput, formatWorkoutDate, toTimestamp } from '@/utils/timeFormat';


const activeWorkout = ref(false);
const activeRestTimer = ref({
  isActive: false,
  remaining: 0,
  total: 0
});
let activeRestInterval: ReturnType<typeof setInterval> | null = null;

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
const templates = ref<WorkoutTemplate[]>([]);

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

const latestWorkout = ref<Workout | null>(null);

const loadLatestWorkout = async () => {
  const workout = await getLatestWorkout();
  latestWorkout.value = workout || null;
};

const WEEKLY_GOAL_STORAGE_KEY = 'homeWeeklyGoal';
const weeklyGoalOptions = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12];
const weeklyWorkoutGoal = ref(4);
const weeklyCompletedWorkouts = ref(0);

const getStartOfWeek = () => {
  const start = new Date();
  const currentDay = start.getDay();
  const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
};

const loadWeeklyGoal = () => {
  const savedGoal = Number(localStorage.getItem(WEEKLY_GOAL_STORAGE_KEY));
  weeklyWorkoutGoal.value = Number.isFinite(savedGoal) && savedGoal > 0 ? savedGoal : 4;
};

const loadWeeklyWorkoutCount = async () => {
  const workoutsCompleted = await getWorkouts();
  const weekStart = getStartOfWeek().getTime();

  weeklyCompletedWorkouts.value = (workoutsCompleted || []).filter((workout: any) => {
    const completedAt = new Date(String(workout.time_end).replace(' ', 'T')).getTime();
    return Number.isFinite(completedAt) && completedAt >= weekStart;
  }).length;
};

watch(weeklyWorkoutGoal, (goal) => {
  localStorage.setItem(WEEKLY_GOAL_STORAGE_KEY, String(goal));
});

const weeklyGoalProgress = computed(() => {
  if (!weeklyWorkoutGoal.value) return 0;
  return Math.min(100, Math.round((weeklyCompletedWorkouts.value / weeklyWorkoutGoal.value) * 100));
});

const weeklyGoalDots = computed(() => {
  return Array.from({ length: weeklyWorkoutGoal.value }, (_, index) => index + 1);
});

const formatRestTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

const clearActiveRestTimer = (removeStorage = false) => {
  if (activeRestInterval) {
    clearInterval(activeRestInterval);
    activeRestInterval = null;
  }

  activeRestTimer.value.isActive = false;
  activeRestTimer.value.remaining = 0;
  activeRestTimer.value.total = 0;

  if (removeStorage) {
    sessionStorage.removeItem('restTimer');
  }
};

const restoreActiveRestTimer = () => {
  const savedTimer = sessionStorage.getItem('restTimer');

  if (!savedTimer) {
    clearActiveRestTimer();
    return;
  }

  try {
    const parsedTimer = JSON.parse(savedTimer);
    const total = Math.max(1, Number(parsedTimer.total) || Number(parsedTimer.remaining) || 0);
    const endTime = Number(parsedTimer.endTime);

    if (!Number.isFinite(endTime)) {
      clearActiveRestTimer(true);
      return;
    }

    if (activeRestInterval) {
      clearInterval(activeRestInterval);
      activeRestInterval = null;
    }

    activeRestTimer.value.isActive = true;
    activeRestTimer.value.total = total;

    const syncRestTimer = () => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      activeRestTimer.value.remaining = remaining;

      if (remaining <= 0) {
        clearActiveRestTimer(true);
      }
    };

    syncRestTimer();

    if (activeRestTimer.value.isActive) {
      activeRestInterval = setInterval(syncRestTimer, 1000);
    }
  } catch {
    clearActiveRestTimer(true);
  }
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
    restoreActiveRestTimer();
  } else {
    startTime.value = null;
    seconds.value = 0;
    activeWorkout.value = false;
    clearActiveRestTimer(true);
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

const formatWorkoutTimer = () => {
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

const chartRef = ref<HTMLCanvasElement | null>(null);
let chart: Chart | null = null;

const workouts = ref<WorkoutHistory[]>([]);
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

// draw chart with debouncing
let renderChartTimeout: ReturnType<typeof setTimeout> | null = null;

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
          min: 0,
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

// Debounced chart rendering to prevent excessive redraws
const debouncedRenderChart = () => {
  if (renderChartTimeout) {
    clearTimeout(renderChartTimeout);
  }
  renderChartTimeout = setTimeout(() => {
    renderChart();
    renderChartTimeout = null;
  }, 300);
};

// Watch for template selection and update chart data
watch(selectedTemplateId, async (templateId) => {
  if (templateId === undefined || templateId === null) {
    workouts.value = [];
    debouncedRenderChart();
    return;
  }
  const numId = Number(templateId);
  const data = await getWorkoutsByName(numId);
  workouts.value = data || [];
  debouncedRenderChart();
});

// Load all templates and latest workout on mount
onMounted(async () => {
  await loadActiveWorkout();
  await loadTemplates();
  await loadLatestWorkout();
  loadWeeklyGoal();
  await loadWeeklyWorkoutCount();
  renderChart();
});

onIonViewWillEnter(async () => {
  await loadActiveWorkout();
  await loadTemplates();
  await loadLatestWorkout();
  loadWeeklyGoal();
  await loadWeeklyWorkoutCount();
  renderChart();
});



onUnmounted(() => {
  clearTimer();
  clearActiveRestTimer();
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

.summary-card__body {
  align-items: start;
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

.active-card__timer--rest {
  background: rgba(255, 255, 255, 0.12);
}

.weekly-goal-panel {
  border-radius: 12px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.05);
  display: grid;
  gap: 12px;
}

.weekly-goal-panel__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.weekly-goal-panel__label,
.weekly-goal-panel__selector span,
.weekly-goal-panel__meta {
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.8rem;
}

.weekly-goal-panel__header strong {
  display: block;
  margin-top: 6px;
  color: var(--ion-color-light);
  font-size: 1rem;
}

.weekly-goal-panel__selector {
  display: grid;
  gap: 6px;
  justify-items: end;
}

.weekly-goal-select {
  min-width: 138px;
}

.weekly-goal-panel__meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.weekly-goal-dots {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.weekly-goal-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);


}

.weekly-goal-dot--filled {
  background: var(--ion-color-accent-red);
  transform: scale(1.08);
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

  .active-card__body {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-card__body {
    grid-template-columns: 1fr;
  }

  .weekly-goal-panel__header {
    align-items: center;
  }

  .workout-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>