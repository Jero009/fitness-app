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
                <ion-card-title>Stats</ion-card-title>
                <ion-card-subtitle>Stats for the last workout</ion-card-subtitle>
                </ion-card-header>
                  total_kg time
                <ion-card-content>
                
                </ion-card-content>
            </ion-card>
       <div class="card-container">
            <ion-card class="card">
                <ion-card-header>
                <ion-card-title>workout name 1</ion-card-title>
                <ion-card-subtitle>last preformed</ion-card-subtitle>
                </ion-card-header>

                <ion-card-content>
                exercise list 
                </ion-card-content>
            </ion-card>
            <ion-card class="card">
                <ion-card-header>
                <ion-card-title>workout name 2</ion-card-title>
                <ion-card-subtitle>last preformed</ion-card-subtitle>
                </ion-card-header>

                <ion-card-content>
                exercise list 
                </ion-card-content>
            </ion-card>
        </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent,IonCard,IonCardHeader,IonCardSubtitle,IonCardContent,IonCardTitle  } from '@ionic/vue';

</script>
<style>
.card-container {
  height: 100vh;

  display: flex;
  justify-content: space-between; 
  align-items: flex-start;  
  padding: 10px;
}
.card{
 
  width: 48%;
  aspect-ratio: 1/1;
}
.top-card{
 margin: 10px 20px
}

</style>