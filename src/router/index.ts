import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/Home'
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/Home'
      },
      {
        path: 'Home',
        component: () => import('@/views/HomePage.vue')
      },
      {
        path: '/workout/:id',
        component: () => import('@/views/WorkoutPage.vue')
      },
      {
        path: 'Template',
        component: () => import('@/views/TemplatePage.vue')
      },
      {
        path: 'Exercise',
        component: () => import('@/views/ExercisePage.vue')
      },
      {
        path: 'History',
        component: () => import('@/views/HistoryPage.vue')
      },
      {
        path: 'ExercisePicker',
        component: () => import('@/views/ExercisePickerPage.vue')
      },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
