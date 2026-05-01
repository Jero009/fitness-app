import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/Home'
  },
  {
    path: '/workout/:id',
    name: 'Workout',
    component: () => import('@/views/WorkoutPage.vue')
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
        path: 'Template',
        name: 'Template',
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
        name: 'ExercisePicker',
        component: () => import('@/views/hidden_views/ExercisePickerPage.vue')
      },
      {
        path: 'TemplateBuilder',
        name: 'TemplateBuilder',
        component: () => import('@/views/hidden_views/TemplateBuilderPage.vue')
      },
      {
        path: 'TemplateEditor/:id',
        name: 'TemplateEditor',
        component: () => import('@/views/hidden_views/TemplateEditorPage.vue')
      },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
