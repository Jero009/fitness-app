import type { RouteRecordRaw } from 'vue-router';
import TabsPage from './pages/TabsPage.vue';

export const gymRoutes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/Home'
  },
  {
    path: '/workout/:id',
    name: 'Workout',
    component: () => import('./pages/WorkoutPage.vue')
  },
  {
    path: '/exercise/:id',
    name: 'ExerciseDetail',
    component: () => import('./pages/ExerciseDetailPage.vue')
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
        component: () => import('./pages/HomePage.vue')
      },
      {
        path: 'Template',
        name: 'Template',
        component: () => import('./pages/TemplatePage.vue')
      },
      {
        path: 'Exercise',
        component: () => import('./pages/ExercisePage.vue')
      },
      {
        path: 'History',
        component: () => import('./pages/HistoryPage.vue')
      },
      {
        path: 'ExercisePicker',
        name: 'ExercisePicker',
        component: () => import('./pages/flows/ExercisePickerPage.vue')
      },
      {
        path: 'TemplateBuilder',
        name: 'TemplateBuilder',
        component: () => import('./pages/flows/TemplateBuilderPage.vue')
      },
      {
        path: 'TemplateEditor/:id',
        name: 'TemplateEditor',
        component: () => import('./pages/flows/TemplateEditorPage.vue')
      },
    ]
  }
];
