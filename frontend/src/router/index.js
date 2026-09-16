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
      meta: { title: 'Laminate Checking Report' },
    },
    {
      path: '/printing',
      name: 'printing',
      component: HomeView,
      props: { processType: 'Printing' },
      meta: { title: 'Printing Checking Report' },
    },
    {
      path: '/blownfilm',
      name: 'blownfilm',
      component: HomeView,
      props: { processType: 'BlownFilm' },
      meta: { title: 'BlownFilm Checking Report' },
    },
    {
      path: '/setting',
      name: 'setting',
      component: () => import('../views/Setting.vue'),
      meta: { title: 'Setting' },
    },
  ],
})

const APP_NAME = 'Machine Report'

router.afterEach((to) => {
  const pageTitle = to.meta?.title
  document.title = pageTitle ? `${pageTitle} | ${APP_NAME}` : APP_NAME
})

export default router
