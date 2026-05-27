import { createRouter, createWebHistory } from '@ionic/vue-router';
import { gymRoutes } from '@/features/gym/routes';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: gymRoutes
})

export default router
