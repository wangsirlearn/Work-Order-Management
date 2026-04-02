/**
 * 路由配置
 * 功能：定义页面路由和权限守卫
 */
import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Home from '../views/Home.vue'

// 路由配置数组
const routes = [
  {
    path: '/',
    redirect: '/login'  // 默认跳转到登录页
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true }  // 需要登录才能访问
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

/**
 * 路由守卫
 * 功能：检查用户是否已登录，未登录则跳转到登录页
 */
router.beforeEach((to, from, next) => {
  // 判断目标路由是否需要登录验证
  if (to.meta.requiresAuth) {
    const userRole = sessionStorage.getItem('userRole')
    if (!userRole) {
      // 未登录，跳转到登录页
      next('/login')
    } else {
      // 已登录，允许通过
      next()
    }
  } else {
    next()
  }
})

export default router
