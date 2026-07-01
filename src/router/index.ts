import { createRouter, createWebHashHistory } from 'vue-router'
import DietCalculator from '@/views/DietCalculator.vue'

const router = createRouter({
  history: createWebHashHistory(),
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
