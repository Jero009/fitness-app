<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title class="title">History</ion-title>
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
    <ion-content :fullscreen="true">
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
          <div v-for="w in workouts" :key="w.id">
            <ion-card class="card-template">
                <ion-card-header>
                  <div class="card-header-flex">
                    <div>
                      <ion-card-title>{{ w.name || 0 }}</ion-card-title>
                      <ion-card-subtitle>{{ formatDuration(w.time_start, w.time_end) }}</ion-card-subtitle>
                      <ion-card-subtitle>{{ w.total_kg }} kg</ion-card-subtitle>
                    </div>
                    <ion-button color="danger" fill="clear" @click="handleDelete(w.id)">Delete</ion-button>
                  </div>
                </ion-card-header>
                <ion-card-content>
                  <ion-list >
                      <ion-item v-for="ex in w.exercises" :key="ex.id">
                        <span>{{ ex.name }} </span> <span> {{ ex.set_count }} x {{ ex.reps }} </span>
                      </ion-item>
                  </ion-list>
                </ion-card-content>
            </ion-card>
          </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent,IonCard,IonCardHeader,IonCardContent,IonCardSubtitle,IonCardTitle,IonList,IonItem, 
IonRefresher, IonRefresherContent, RefresherCustomEvent, onIonViewWillEnter, IonButton, alertController, IonButtons, IonIcon } from '@ionic/vue';
import { getWorkouts,getWorkoutHistoryExercises, cancelWorkout, exportDatabaseToSQL, importDatabaseFromSQL } from '@/services/gym_db'
import { onMounted ,ref} from 'vue';
import { cloudUploadOutline, downloadOutline } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { FilePicker } from '@capawesome/capacitor-file-picker';



const workouts = ref<any[]>([]);
const importInput = ref<HTMLInputElement | null>(null);

const LoadHistory = async () =>{
  const data = await getWorkouts();

  for (const workout of data) {
    workout.exercises = await getWorkoutHistoryExercises(workout.id);

    // workout duration is already formatted in the template
  }

  workouts.value = data;
}
//time calculation
const formatDuration = (start: string, end: any) => {
  if (!start || !end) return '0h 0m 0s';

  // parse start (string)
  const s = new Date(start.replace(' ', 'T') + 'Z').getTime();

  // parse end (can be string, number, or stringified number)
  let e: number;
  if (typeof end === 'number') {
    e = end;
  } else if (!isNaN(Number(end))) {
    e = Number(end);
  } else {
    e = new Date(end.replace(' ', 'T') + 'Z').getTime();
  }

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

<style scoped>
.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
</style>
