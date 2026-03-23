<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title class="title">History</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">History</ion-title>
        </ion-toolbar>
      </ion-header>
          <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
            <ion-refresher-content></ion-refresher-content>
            <ion-card class="card-template">
                <ion-card-header>
                <ion-card-title>workout name 2</ion-card-title>
                <ion-card-subtitle>preformed</ion-card-subtitle>
                <ion-card-subtitle>duration weight</ion-card-subtitle>
                </ion-card-header>

                <ion-card-content>
                <ion-list>
                    <ion-item><span>exercise 1</span> <span>set: 3</span></ion-item>
                    <ion-item><span>exercise 2</span> <span>set: 3</span></ion-item>
                    <ion-item><span>exercise 3</span> <span>set: 3</span></ion-item>
                </ion-list>
                </ion-card-content>
            </ion-card>
            
          </ion-refresher>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent,IonCard,IonCardHeader,IonCardContent,IonCardSubtitle,IonCardTitle,IonList,IonItem, 
IonRefresher, IonRefresherContent, RefresherCustomEvent } from '@ionic/vue';


//refresh 

 const handleRefresh = (event: RefresherCustomEvent) => {
    setTimeout(() => {
      // Any calls to load data go here
      event.target.complete();
    }, 200);
  };



</script>
