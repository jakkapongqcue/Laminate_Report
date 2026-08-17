import { createRouter, createWebHistory } from 'vue-router'
import Index from '../views/Index.vue'
import Setting from '../views/Setting.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Index
  },
  {
    path: '/setting',
    name: 'setting',
    component: Setting
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
