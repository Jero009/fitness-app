<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/Exercise"></ion-back-button>
        </ion-buttons>
        <ion-title class="title">{{ exerciseName }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">{{ exerciseName }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="exercise-detail-container ion-padding">
        <!-- PR Section -->
        <div v-if="currentPR" class="pr-section">
          <ion-card class="pr-card">
            <div class="card-topline">
              <p class="section-kicker">Personal Records</p>
            </div>
            <div class="pr-grid">
              <div class="pr-stat">
                <span class="pr-label">Max Weight</span>
                <strong class="pr-value">{{ currentPR.pr_weight }} kg</strong>
                <small class="pr-detail">{{ currentPR.pr_reps }} reps</small>
              </div>
              <div class="pr-stat">
                <span class="pr-label">1 Rep Max</span>
                <strong class="pr-value">{{ currentPR.one_rep_max }} kg</strong>
                <small class="pr-detail">Estimated</small>
              </div>
              <div class="pr-stat">
                <span class="pr-label">Achieved</span>
                <strong class="pr-value">{{ formatPRDate(currentPR.date_achieved) }}</strong>
                <small class="pr-detail">&nbsp;</small>
              </div>
            </div>
          </ion-card>
        </div>

        <!-- No PR Message -->
        <div v-else class="no-pr-message">
          <ion-card>
            <div class="card-topline">
              <p class="section-kicker">No Records Yet</p>
            </div>
            <p>Start tracking your workouts to see your personal records here!</p>
          </ion-card>
        </div>

        <!-- Graph Section -->
        <div v-if="historyData.length > 0" class="graph-section">
          <ion-card class="graph-card">
            <div class="graph-card__header">
              <span>Progress Over Time (Last {{ timeFrame }} Days)</span>
              <ion-select 
                v-model="timeFrame" 
                interface="action-sheet"
                :interface-options="{ cssClass: 'app-action-sheet' }"
                class="app-select time-select"
              >
                <ion-select-option value="30">30 Days</ion-select-option>
                <ion-select-option value="60">60 Days</ion-select-option>
                <ion-select-option value="90">90 Days</ion-select-option>
              </ion-select>
            </div>
            <div class="chart-frame">
              <canvas ref="chartRef"></canvas>
            </div>
          </ion-card>
        </div>

        <!-- No History Message -->
        <div v-else class="no-history-message">
          <ion-card>
            <p>No workout history available for this exercise yet.</p>
          </ion-card>
        </div>

        <!-- Stats Section -->
        <div v-if="historyData.length > 0" class="stats-section">
          <ion-card class="stats-card">
            <div class="card-topline">
              <p class="section-kicker">Statistics</p>
            </div>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">Total Workouts</span>
                <strong class="stat-value">{{ totalWorkouts }}</strong>
              </div>
              <div class="stat-item">
                <span class="stat-label">Avg Weight</span>
                <strong class="stat-value">{{ avgWeight }} kg</strong>
              </div>
              <div class="stat-item">
                <span class="stat-label">Max Volume</span>
                <strong class="stat-value">{{ maxVolume }}</strong>
              </div>
            </div>
          </ion-card>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonButtons,
  IonBackButton,
  IonSelect,
  IonSelectOption,
  onIonViewWillEnter
} from '@ionic/vue';
import { useRoute } from 'vue-router';
import { ref, computed, onMounted, watch } from 'vue';
import { getExerciseStats } from '@/shared/db/app_db';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler } from 'chart.js';
import type { ExercisePR } from '@/features/gym/types/models';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler);

const route = useRoute();
const chartRef = ref<HTMLCanvasElement>();
let chartInstance: Chart | null = null;

const exerciseId = computed(() => Number(route.params.id));
const exerciseName = ref('');
const currentPR = ref<ExercisePR | null>(null);
const historyData = ref<any[]>([]);
const timeFrame = ref(90);

const totalWorkouts = computed(() => historyData.value.length);
const avgWeight = computed(() => {
  if (historyData.value.length === 0) return 0;
  const sum = historyData.value.reduce((acc, item) => acc + Number(item.weight), 0);
  return Math.round((sum / historyData.value.length) * 10) / 10;
});
const maxVolume = computed(() => {
  if (historyData.value.length === 0) return 0;
  return Math.max(...historyData.value.map((item) => item.volume || 0));
});

const formatPRDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const loadExerciseData = async () => {
  try {
    const stats = await getExerciseStats(exerciseId.value);
    if (stats) {
      exerciseName.value = stats.exercise_name;
      currentPR.value = stats.pr;
      historyData.value = stats.history;
      updateChart();
    }
  } catch (error) {
    console.error('Error loading exercise data:', error);
  }
};

const updateChart = () => {
  if (!chartRef.value || historyData.value.length === 0) return;

  const ctx = chartRef.value.getContext('2d');
  if (!ctx) return;

  // Destroy previous chart if it exists
  if (chartInstance) {
    chartInstance.destroy();
  }

  const labels = historyData.value.map((item) => {
    const date = new Date(item.date);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const weightData = historyData.value.map((item) => Number(item.weight));
  const volumeData = historyData.value.map((item) => (item.volume ? Math.round(item.volume / 100) : 0)); // Normalize for visibility

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Max Weight (kg)',
          data: weightData,
          borderColor: '#FFD700',
          backgroundColor: 'rgba(255, 215, 0, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#FFD700',
          pointBorderColor: '#ffffff',
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: 'y'
        },
        {
          label: 'Total Volume (×100)',
          data: volumeData,
          borderColor: '#ff5252',
          backgroundColor: 'rgba(255, 82, 82, 0.05)',
          fill: false,
          tension: 0.4,
          pointBackgroundColor: '#ff5252',
          pointBorderColor: '#ffffff',
          pointRadius: 3,
          pointHoverRadius: 5,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          labels: {
            color: '#ffffff',
            font: { family: "'Doto', sans-serif" }
          }
        }
      },
      scales: {
        y: {
          type: 'linear',
          position: 'left',
          ticks: { color: '#ffffff' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          title: { display: true, text: 'Weight (kg)', color: '#ffffff' }
        },
        y1: {
          type: 'linear',
          position: 'right',
          ticks: { color: '#ff5252' },
          grid: { display: false },
          title: { display: true, text: 'Volume', color: '#ff5252' }
        },
        x: {
          ticks: { color: '#ffffff' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        }
      }
    }
  });
};

watch(timeFrame, async () => {
  await loadExerciseData();
});

onIonViewWillEnter(() => {
  loadExerciseData();
});

onMounted(() => {
  loadExerciseData();
});
</script>

<style scoped>
.exercise-detail-container {
  background: var(--ion-color-dark);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pr-section,
.no-pr-message {
  width: 100%;
}

.pr-card {
  background: var(--ion-color-primary);
  color: var(--ion-color-light);
  border-radius: 14px;
  overflow: hidden;
}

.pr-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 16px;
}

.pr-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  text-align: center;
}

.pr-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-family: 'Doto', sans-serif;
  text-transform: uppercase;
}

.pr-value {
  font-size: 20px;
  font-weight: bold;
  color: var(--ion-color-accent-yellow);
  font-family: 'Doto', sans-serif;
}

.pr-detail {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.card-topline {
  padding: 12px 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.section-kicker {
  font-size: 12px;
  color: var(--ion-color-accent-yellow);
  font-weight: 600;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: 'Doto', sans-serif;
}

.graph-section {
  width: 100%;
}

.graph-card {
  background: var(--ion-color-primary);
  color: var(--ion-color-light);
  border-radius: 14px;
  padding: 16px;
}

.graph-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}

.graph-card__header span {
  font-size: 14px;
  font-weight: 600;
  font-family: 'Doto', sans-serif;
}

.time-select {
  max-width: 120px;
  --padding-start: 8px !important;
  --padding-end: 8px !important;
  min-height: auto !important;
  font-size: 12px;
}

.chart-frame {
  position: relative;
  height: 300px;
  width: 100%;
  margin-bottom: 16px;
}

.stats-section {
  width: 100%;
}

.stats-card {
  background: var(--ion-color-primary);
  color: var(--ion-color-light);
  border-radius: 14px;
  overflow: hidden;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-family: 'Doto', sans-serif;
  text-transform: uppercase;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: var(--ion-color-light);
  font-family: 'Doto', sans-serif;
}

.no-history-message,
.no-pr-message {
  text-align: center;
  padding: 20px;
}

.no-pr-message ion-card,
.no-history-message ion-card {
  background: var(--ion-color-primary);
  color: var(--ion-color-light);
}
</style>
