import { createRouter, createWebHistory } from 'vue-router'
import DietCalculator from '@/views/DietCalculator.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/diet-calculator',
    },
    {
      path: '/diet-calculator',
      name: 'diet-calculator',
      component: DietCalculator,
    },
  ],
})

export default router
