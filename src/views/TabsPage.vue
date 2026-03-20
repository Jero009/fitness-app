<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="Home" href="/tabs/Home" >
          <ion-icon aria-hidden="true" :icon="home" />
          <ion-label>Home</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="Workout" href="/tabs/Workout" >
          <ion-icon aria-hidden="true" :icon="barbellOutline" />
          <ion-label>Workout</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="Template" href="/tabs/Template" >
          <ion-icon aria-hidden="true" :icon="add" />
          <ion-label>Template</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="Exercise" href="/tabs/Exercise" >
          <ion-icon aria-hidden="true" :icon="body" />
          <ion-label>Exercise</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="History" href="/tabs/History" >
          <ion-icon aria-hidden="true" :icon="time" />
          <ion-label>History</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import {  home, barbellOutline, add, time,body } from 'ionicons/icons';
</script>
<style>

</style>
