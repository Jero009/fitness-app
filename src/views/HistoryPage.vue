<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title class="title">HISTORY</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" @click="handleExport">
            <ion-icon slot="start" :icon="downloadOutline" />
            Export
          </ion-button>
          <ion-button fill="clear" @click="triggerImport">
            <ion-icon slot="start" :icon="cloudUploadOutline" />
            Import
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" class="home-content">
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
          <div class="home-shell">
            <div v-for="w in workouts" :key="w.id">
              <ion-card class="card-template">
                <ion-card-header>
                  <div class="card-header-flex">
                    <div>
                      <ion-card-title>{{ w.name || 0 }}</ion-card-title>
                      <ion-card-subtitle>{{ formatDuration(w.time_start, w.time_end) }}</ion-card-subtitle>
                      <ion-card-subtitle>{{ w.total_kg }} kg</ion-card-subtitle>
                    </div>
                    <ion-button class="button-red" fill="clear" @click="handleDelete(w.id)">Delete</ion-button>
                  </div>
                </ion-card-header>
                <ion-card-content>
                  <ion-list >
                      <ion-item class="exercise-row" v-for="ex in w.exercises" :key="ex.id">
                        <div class="exercise-copy">
                          <div class="exercise-copy__name">{{ ex.name }}</div>
                          <div class="exercise-copy__stats">{{ ex.set_count }} sets &nbsp; {{ ex.reps }} reps</div>
                        </div>
                      </ion-item>
                  </ion-list>
                </ion-card-content>
              </ion-card>
            </div>
          </div>
    </ion-content>
  </ion-page>
</template>
<style scoped>
ion-content.home-content {
  --padding-top: 16px;
  --padding-bottom: 24px;
}

.home-shell {
  padding: 16px;
  display: grid;
  gap: 18px;
  max-width: 760px;
  margin: 0 auto;
  width: min(100%, 760px);
  justify-items: stretch;
}

.home-shell > div {
  width: 100%;
}

.card-template {
  border-radius: var(--ion-border-radius, 10px);
  background: var(--ion-card-background);
  color: var(--ion-card-color);
  margin: 0;
  padding: 18px;
  min-height: 120px;
  width: 100%;
  box-shadow: none;
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.card-template ion-card-title {
  margin: 0;
  color: var(--ion-color-light);
  font-weight: 600;
}

.card-template ion-card-subtitle {
  color: rgba(255, 255, 255, 0.58);
  margin-top: 6px;
  display: block;
}



.card-template ion-card-content {
  background: transparent;
  padding: 0;
}

.card-template ion-list {
  background: transparent;
  padding: 0;
}

.card-template ion-list ion-item {
  background: transparent;
  margin-top: 8px;
  padding: 0;
}

.card-template ion-list ion-item.exercise-row {
  --background: rgba(255, 255, 255, 0.035);
  --border-radius: 8px;
  --inner-border-width: 0px;
  --box-shadow: none;
  border: none;
  box-shadow: none;
  padding: 8px 12px;
  width: 100%;
}

.card-template ion-list ion-item .exercise-copy {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  color: var(--ion-color-light);
  width: 100%;
}

.exercise-copy__name {
  flex: 1;
  text-align: left;
}

.exercise-copy__stats {
  flex-shrink: 0;
  text-align: right;
  color: rgba(255, 255, 255, 0.84);
}

@media (min-width: 700px) {
  .home-shell {
    max-width: 760px;
    margin: 0 auto;
    padding: 20px;
  }

  .card-template {
    padding: 24px;
  }
}
</style>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent,IonCard,IonCardHeader,IonCardContent,IonCardSubtitle,IonCardTitle,IonList,IonItem, 
IonRefresher, IonRefresherContent, RefresherCustomEvent, onIonViewWillEnter, IonButton, alertController, toastController, IonButtons, IonIcon } from '@ionic/vue';
import { getWorkouts,getWorkoutHistoryExercises, cancelWorkout, exportDatabaseToSQL, importDatabaseFromSQL } from '@/services/gym_db'
import { onMounted ,ref} from 'vue';
import type { WorkoutHistory, WorkoutHistoryExercise } from '@/types/models';
import { cloudUploadOutline, downloadOutline } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { FilePicker } from '@capawesome/capacitor-file-picker';



const workouts = ref<(WorkoutHistory & { exercises: WorkoutHistoryExercise[] })[]>([]);
const importInput = ref<HTMLInputElement | null>(null);

// Toast helper
const showToast = async (message: string, color: string = 'danger', duration: number = 2000) => {
  const toast = await toastController.create({
    message,
    duration,
    position: 'top',
    color,
  });
  await toast.present();
};

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
    showToast('Database not initialized yet', 'warning');
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

    showToast(`Backup ready: ${backup.fileName}`, 'success', 3000);
  } catch (error) {
    console.error('Export failed:', error);
    showToast('Export failed. Please try again.', 'danger');
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
          try {
            const result = await importDatabaseFromSQL(sqlContent);

            if (result.success) {
              showToast('Import successful!', 'success', 3000);
              await LoadHistory();
            } else {
              showToast(`Import failed: ${result.message}`, 'danger');
            }
          } catch (error) {
            console.error('Import error:', error);
            showToast('Import failed. Please try again.', 'danger');
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
