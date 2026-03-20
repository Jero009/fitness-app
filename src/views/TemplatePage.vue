<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title class="title">Template</ion-title>

      <ion-buttons slot="end">
        <ion-button >
          <ion-icon :icon="add"></ion-icon>
        </ion-button>
      </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Template</ion-title>
        </ion-toolbar>
      </ion-header>
            <ion-card class="card-template">
                <ion-card-header>
                <ion-card-title>workout name 2</ion-card-title>
                <ion-card-subtitle>last preformed</ion-card-subtitle>
                </ion-card-header>

                <ion-card-content>
                <ion-list>
                    <ion-item><span>exercise 1</span> <span>set: 3</span></ion-item>
                    <ion-item><span>exercise 2</span> <span>set: 3</span></ion-item>
                    <ion-item><span>exercise 3</span> <span>set: 3</span></ion-item>
                </ion-list>
                </ion-card-content>
            </ion-card>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent,IonCard,IonCardHeader,IonCardContent,IonCardSubtitle,IonCardTitle,IonList,IonItem,IonButton,IonIcon,IonButtons } from '@ionic/vue';
import { add} from 'ionicons/icons';
</script>
<style>
.card-template{
  margin: 10px auto ;
  width: 90%;
}

</style>