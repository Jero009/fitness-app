<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title class="title">HISTORY</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" >
      <input
        ref="importInput"
        type="file"
        accept=".sql,text/plain"
        style="display: none"
        @change="handleImportFile"
      >
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">History</ion-title>
        </ion-toolbar>
      </ion-header>
          <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
            <ion-refresher-content></ion-refresher-content>
          </ion-refresher>
      <section class="history-hero">
        <div class="hero-left">
          <span class="hero-label">WORKOUT HISTORY</span>
          <h1 class="hero-title">TRACK THE TREND</h1>
          <p class="hero-subtitle">Review past sessions, exports, and totals.</p>
        </div>
        <div class="hero-actions">
          <ion-button class="hero-action" @click="handleExport">
            <ion-icon slot="start" :icon="downloadOutline" />
            Export
          </ion-button>
          <ion-button class="hero-action ghost" @click="triggerImport">
            <ion-icon slot="start" :icon="cloudUploadOutline" />
            Import
          </ion-button>
        </div>
      </section>

      <div class="history-summary">
        <div class="summary-left">
          <span class="history-count">{{ workouts.length }}_TOTAL</span>
          <div class="quick-stats">
            <span class="quick-stat">{{ totalExercises }} EXERCISES</span>
            <span class="quick-stat">{{ totalVolume }} KG</span>
          </div>
        </div>
        <span class="history-hint">Tap a card to review exercises.</span>
      </div>

      <div v-if="workouts.length === 0" class="empty-state">
        <div class="empty-card">
          <span class="empty-kicker">NO WORKOUTS YET</span>
          <h2>Log your first session</h2>
          <p>Start a workout to see your history build up here.</p>
        </div>
      </div>

      <div v-else class="history-grid">
        <div v-for="w in workouts" :key="w.id" class="history-card">
          <div class="card-top">
            <div>
              <h3 class="workout-name">{{ w.name || 'UNTITLED' }}</h3>
              <span class="workout-date">{{ formatDate(w.time_start) }}</span>
            </div>
            <span class="meta-pill">{{ w.total_kg || 0 }} KG</span>
          </div>

          <div class="workout-stats">
            <span class="stat-chip">{{ formatDuration(w.time_start, w.time_end) }}</span>
            <span class="stat-chip">{{ w.exercises?.length || 0 }} EXERCISES</span>
          </div>

          <div class="exercise-preview">
            <div v-for="ex in w.exercises?.slice(0, 3)" :key="ex.id" class="exercise-row">
              <span class="exercise-name">{{ ex.name }}</span>
              <span class="exercise-sets">{{ ex.set_count }} x {{ ex.reps }}</span>
            </div>
            <div v-if="(w.exercises?.length || 0) > 3" class="exercise-more">
              +{{ (w.exercises?.length || 0) - 3 }} more
            </div>
          </div>

          <div class="card-actions">
            <ion-button class="card-action delete" fill="clear" @click="handleDelete(w.id)">
              Delete
            </ion-button>
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

.header-action {
  --color: #ffd200;
  font-family: 'Doto', sans-serif;
  letter-spacing: 1px;
}

.history-hero {
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

.hero-actions {
  display: flex;
  gap: 10px;
}

.hero-action {
  --background: #ffd200;
  --color: #0b0b0b;
  --background-activated: #d71921;
  --color-activated: #fff;
  font-weight: 700;
  gap: 6px;
}

.hero-action.ghost {
  --background: transparent;
  --color: #ffd200;
  --border-color: rgba(255, 210, 0, 0.4);
  --border-width: 1px;
  --border-style: solid;
}

.history-summary {
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

.history-count {
  font-family: 'Doto', sans-serif;
  color: #ffd200;
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

.history-hint {
  color: #666;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
  padding: 0 20px 30px;
}

.history-card {
  background: #1a1a1a;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
}

.card-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
}

.workout-name {
  font-family: 'Doto', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 6px 0;
}

.workout-date {
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

.workout-stats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.stat-chip {
  background: rgba(255, 255, 255, 0.08);
  color: #cfcfcf;
  font-size: 10px;
  padding: 4px 8px;
  border-radius: 999px;
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
  justify-content: flex-end;
}

.card-action {
  --color: #ffd200;
  font-family: 'Doto', sans-serif;
  letter-spacing: 1px;
}

.card-action.delete {
  --color: #d71921;
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
  .history-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-actions {
    width: 100%;
  }

  .hero-action {
    flex: 1;
  }
}
</style>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
IonRefresher, IonRefresherContent, RefresherCustomEvent, onIonViewWillEnter, IonButton, alertController, IonIcon } from '@ionic/vue';
import { getWorkouts,getWorkoutHistoryExercises, cancelWorkout, exportDatabaseToSQL, importDatabaseFromSQL } from '@/services/gym_db'
import { onMounted ,ref, computed } from 'vue';
import { cloudUploadOutline, downloadOutline } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { FilePicker } from '@capawesome/capacitor-file-picker';



const workouts = ref<any[]>([]);
const importInput = ref<HTMLInputElement | null>(null);

const totalExercises = computed(() =>
  workouts.value.reduce((sum, workout) => sum + (workout.exercises?.length || 0), 0)
);

const totalVolume = computed(() =>
  workouts.value.reduce((sum, workout) => sum + (Number(workout.total_kg) || 0), 0)
);

const LoadHistory = async () =>{
  const data = await getWorkouts();

  for (const workout of data) {
    workout.exercises = await getWorkoutHistoryExercises(workout.id);

    // workout duration is already formatted in the template
  }

  workouts.value = data;
}
//time calculation
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

const formatDate = (value: unknown) => {
  const ts = toTimestamp(value);
  return Number.isFinite(ts) ? new Date(ts).toLocaleDateString() : 'Invalid date';
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
  const seconds = totalSeconds % 60;

  return `${hours}h ${minutes}m ${seconds}s`;
};
//refresh 

 const handleRefresh = async  (event: RefresherCustomEvent) => {
   await LoadHistory()
   event.target.complete();
  };

const handleDelete = async (id: number) => {
  const alert = await alertController.create({
    header: 'Delete Workout?',
    message: 'Are you sure you want to delete this workout from your history?',
    cssClass: 'history-delete-alert',
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Delete',
        role: 'destructive',
        handler: async () => {
          await cancelWorkout(id);
          await LoadHistory();
        }
      }
    ]
  });

  await alert.present();
};

const handleExport = async () => {
  const backup = await exportDatabaseToSQL();

  if (!backup) {
    const alert = await alertController.create({
      header: 'Export Failed',
      message: 'Database is not initialized yet.',
      buttons: ['OK']
    });
    await alert.present();
    return;
  }

  try {
    if (Capacitor.getPlatform() === 'web') {
      const blob = new Blob([backup.sql], { type: 'application/sql' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = backup.fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } else {
      const writeResult = await Filesystem.writeFile({
        path: backup.fileName,
        data: backup.sql,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
        recursive: true
      });

      await Share.share({
        title: 'SQL Backup',
        text: 'Workout backup file',
        url: writeResult.uri,
        dialogTitle: 'Share SQL Backup'
      });
    }

    const successAlert = await alertController.create({
      header: 'Export Complete',
      message: `Backup file ready: ${backup.fileName}`,
      buttons: ['OK']
    });
    await successAlert.present();
  } catch (error) {
    console.error('Export failed:', error);
    const alert = await alertController.create({
      header: 'Export Failed',
      message: 'Could not export backup file. Please try again.',
      buttons: ['OK']
    });
    await alert.present();
  }
};

const triggerImport = () => {
  if (Capacitor.getPlatform() === 'web') {
    importInput.value?.click();
    return;
  }

  void pickNativeImportFile();
};

const parseBase64Text = (base64Data: string) => {
  try {
    return decodeURIComponent(
      atob(base64Data)
        .split('')
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    );
  } catch {
    return atob(base64Data);
  }
};

const runImportWithConfirm = async (sqlContent: string) => {
  const confirmAlert = await alertController.create({
    header: 'Import SQL Backup?',
    message: 'Importing will replace your current data with the file content.',
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel'
      },
      {
        text: 'Import',
        handler: async () => {
          const result = await importDatabaseFromSQL(sqlContent);

          const resultAlert = await alertController.create({
            header: result.success ? 'Import Complete' : 'Import Failed',
            message: result.message,
            buttons: ['OK']
          });

          await resultAlert.present();

          if (result.success) {
            await LoadHistory();
          }
        }
      }
    ]
  });

  await confirmAlert.present();
};

const pickNativeImportFile = async () => {
  try {
    const result = await FilePicker.pickFiles({
      types: ['application/sql', 'text/plain', 'text/x-sql'],
      readData: true
    });

    const pickedFile = result.files?.[0];
    const data = pickedFile?.data;

    if (!data) {
      const alert = await alertController.create({
        header: 'Import Failed',
        message: 'Could not read file content from selected file.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const sqlContent = parseBase64Text(data);
    await runImportWithConfirm(sqlContent);
  } catch (error) {
    // User cancellation is expected and should not show an error dialog.
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    const isCancel = message.includes('cancel');

    if (isCancel) return;

    const alert = await alertController.create({
      header: 'Import Failed',
      message: 'Unable to open file picker. Please try again.',
      buttons: ['OK']
    });
    await alert.present();
  }
};

const handleImportFile = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  const sqlContent = await file.text();
  await runImportWithConfirm(sqlContent);
  target.value = '';
};


  onMounted(() => {
    LoadHistory()
  });

  onIonViewWillEnter(() => {
    LoadHistory()

});

</script>
