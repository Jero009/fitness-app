<template>
  <ion-page>
      <ion-header>
    <ion-toolbar>
        <ion-title class="title">HOME</ion-title>
      </ion-toolbar>
  </ion-header>
    <ion-content :fullscreen="true">
      
      <!-- DEFAULT ACTIVE WORKOUT CARD -->
      <div v-if="activeWorkout" class="active-session-card" @click="backToWorkout()">
        <div class="session-header">
          <span class="session-label">A C T I V E  S E S S I O N</span>
          <button class="resume-btn">
             ▶ RESUME
          </button>
        </div>
        
        <h1 class="session-title">SESSION_IN_PROGRESS</h1>
        
        <div class="session-divider"></div>
        
        <div class="session-stats">
          <div class="stat-group">
            <span class="stat-label">ELAPSED</span>
            <span class="stat-value">{{ formatTime() }}</span>
          </div>
          <div class="stat-group text-right">
            <span class="stat-label">VOLUME</span>
            <span class="stat-value">--- KG</span>
          </div>
        </div>
      </div>

      <!-- IF NOT ACTIVE BUT HAVE LATEST WORKOUT -->
      <div v-else-if="latestWorkout" class="active-session-card finished-card" @click="handleQuickStart">
        <div class="session-header">
          <span class="session-label">L A S T  S E S S I O N</span>
        </div>
        
        <h1 class="session-title">STATS</h1>
        
        <div class="session-divider"></div>
        
        <div class="session-stats">
          <div class="stat-group">
            <span class="stat-label">TIME</span>
            <span class="stat-value">{{ formatDuration(latestWorkout?.time_start, latestWorkout?.time_end) }}</span>
          </div>
          <div class="stat-group text-right">
            <span class="stat-label">VOLUME</span>
            <span class="stat-value">{{ latestWorkout?.total_kg || 0 }}KG</span>
          </div>
        </div>
      </div>

      <!-- TEMPLATES SECTION -->
      <div class="templates-section">
        <div class="templates-header">
          <h2 class="templates-title">T E M P L A T E S</h2>
          <span class="templates-count">{{ templates.length }}_TOTAL</span>
        </div>
        
        <div class="templates-grid">
          <!-- Template Cards -->
          <div v-for="template in templates" :key="template.id" class="template-card" @click="startWorkout(template.id)">
            <h3 class="template-name">{{ template.name.toUpperCase() }}</h3>
            <p class="template-desc">{{ template.created_at.split(' ')[0] }}</p>
            
            <div class="template-footer">
              <ion-icon :icon="barbellSharp" class="template-icon"></ion-icon>
              <span class="template-exercises">X EXERCISES</span>
            </div>
          </div>
          
          <!-- Create New Card -->
          <div class="create-new-card" @click="router.push('/tabs/TemplateBuilder')">
             <div class="create-content">
               <span class="plus-icon">+</span>
               <span class="create-text">CREATE NEW</span>
             </div>
          </div>
        </div>
      </div>

      <div class="chart-container">
        <ion-select placeholder="Select template" interface="action-sheet" v-model="selectedTemplateId" class="chart-select">
          <ion-select-option v-for="t in templates" :key="t.id" :value="t.id">
            {{ t.name }}
          </ion-select-option>
        </ion-select>
        <canvas ref="chartRef" class="chart-canvas"></canvas>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, onIonViewWillEnter, IonIcon, IonSelect, IonSelectOption } from '@ionic/vue';
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
    await backToWorkout();
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
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;

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
    startTime.value = workout.time_start.replace(' ', 'T') + 'Z';
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
    .map(w => {
      const ts = toTimestamp(w.time_start);
      const label = Number.isFinite(ts) ? new Date(ts).toLocaleDateString() : 'Invalid date';
      return {
        date: label,
        kg: w.total_kg || 0
      };
    })
    .reverse(); // oldest -> newest
});

const canQuickStart = computed(() => templates.value.length > 0);

const handleQuickStart = async () => {
  if (!canQuickStart.value) return;
  await startWorkout(templates.value[0].id);
};

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
          borderColor: '#ffd200',
          pointRadius: 4,
          pointHoverRadius: 5,
          pointBackgroundColor: '#0b0b0b',
          pointBorderColor: '#ffd200',
          pointBorderWidth: 2,
          fill: true,
          backgroundColor: 'rgba(255, 210, 0, 0.08)',
        }
      ]
    },
    options: {
      responsive: true,
      animation: false,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: '#ffd200',
            font: {
              family: 'Doto, sans-serif',
              size: 10,
              weight: '600'
            }
          }
        },
        tooltip: {
          backgroundColor: '#111',
          borderColor: 'rgba(255, 210, 0, 0.35)',
          borderWidth: 1,
          titleColor: '#ffd200',
          bodyColor: '#fff',
          titleFont: {
            family: 'Doto, sans-serif',
            size: 11,
            weight: '700'
          },
          bodyFont: {
            family: 'Doto, sans-serif',
            size: 11,
            weight: '600'
          },
          callbacks: {
            label: (context) => ` ${context.parsed.y} kg`
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.06)',
            drawBorder: false
          },
          ticks: {
            color: '#666',
            font: {
              family: 'Doto, sans-serif',
              size: 10,
              weight: '500'
            }
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.08)',
            drawBorder: false
          },
          ticks: {
            color: '#666',
            font: {
              family: 'Doto, sans-serif',
              size: 10,
              weight: '500'
            },
            callback: (value) => `${value}kg`
          }
        }
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
<style scoped>

/* ACTIVE SESSION CARD */
.active-session-card {
  background-color: #ffd200;
  /* background-image: radial-gradient(#111 1px, transparent 1px);
  background-size: 8px 8px; */
  color: #0b0b0b;
  margin: 20px;
  padding: 20px;
  border-radius: 6px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
}

.finished-card {
  background-color: #1b1b1b;
  color: #fff;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.session-label {
  font-family: 'Doto', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 2px;
}

.resume-btn {
  background: transparent;
  border: 1px solid rgba(0,0,0,0.2);
  border-radius: 4px;
  padding: 6px 12px;
  font-family: 'Doto', sans-serif;
  font-weight: 700;
  font-size: 11px;
  color: #0b0b0b;
  cursor: pointer;
}

.session-title {
  font-family: 'Doto', sans-serif;
  font-size: 24px;
  font-weight: 800;
  margin: 0 0 16px 0;
}

.session-divider {
  height: 1px;
  background: rgba(0,0,0,0.1);
  margin-bottom: 16px;
}
.finished-card .session-divider { background: rgba(255,255,255,0.1); }

.session-stats {
  display: flex;
  justify-content: space-between;
}

.stat-group {
  display: flex;
  flex-direction: column;
}

.text-right {
  text-align: right;
}

.stat-label {
  font-family: 'Doto', sans-serif;
  font-size: 10px;
  font-weight: 500;
  opacity: 0.7;
  margin-bottom: 4px;
  letter-spacing: 1px;
}

.stat-value {
  font-family: 'Doto', sans-serif;
  font-size: 18px;
  font-weight: 700;
}

/* TEMPLATES SECTION */
.templates-section {
  padding: 0 20px;
}

.templates-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.templates-title {
  font-family: 'Doto', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 4px;
  margin: 0;
}

.templates-count {
  font-family: 'Doto', sans-serif;
  font-size: 11px;
  color: #666;
}

.templates-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding-bottom: 30px;
}

/* TEMPLATE CARD */
.template-card {
  background-color: #1a1a1a;
  border-radius: 6px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: 160px;
  justify-content: space-between;
}

.template-name {
  font-family: 'Doto', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 4px 0;
}

.template-desc {
  font-family: 'Doto', sans-serif;
  font-size: 11px;
  color: #666;
  margin: 0;
  letter-spacing: 1px;
}

.template-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.template-icon {
  font-size: 20px;
  color: #444;
}

.template-exercises {
  font-family: 'Doto', sans-serif;
  font-size: 10px;
  color: #444;
}

/* CREATE NEW CARD */
.create-new-card {
  border: 1px dashed #333;
  border-radius: 6px;
  height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.create-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #444;
}

.plus-icon {
  font-size: 28px;
  font-weight: 300;
  margin-bottom: 8px;
}

.create-text {
  font-family: 'Doto', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
}

/* CHART CONTAINER */
.chart-container {
  margin: 20px;
  padding: 16px 16px 12px;
  background: linear-gradient(160deg, rgba(255, 210, 0, 0.08), rgba(26, 26, 26, 0.85) 55%);
  border: 1px solid rgba(255, 210, 0, 0.18);
  border-radius: 8px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
}

.chart-select {
  margin-bottom: 15px;
  width: 100%;
  --placeholder-color: rgba(255, 210, 0, 0.65);
  --color: #ffd200;
}

.chart-canvas {
  width: 100%;
  max-height: 250px;
  height: 220px;
}
</style>