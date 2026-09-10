import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(document.querySelector('base')?.getAttribute('href') || '/'),
  routes: [
    {
      path: '/',
      redirect: '/laminate',
    },
    {
      path: '/laminate',
      name: 'laminate',
      component: HomeView,
      props: { processType: 'Laminate' },
    },
    {
      path: '/printing',
      name: 'printing',
      component: HomeView,
      props: { processType: 'Printing' },
    },
    {
      path: '/blownfilm',
      name: 'blownfilm',
      component: HomeView,
      props: { processType: 'BlownFilm' },
    },
    {
      path: '/setting',
      name: 'setting',
      component: () => import('../views/Setting.vue'),
    },
  ],
})

export default router
