import Vue from 'vue'
import VueRouter from 'vue-router'


Vue.use(VueRouter)

// 路由懒加载
const Login = () => import('@/views/login/LoginPage.vue')
const Register = () => import('@/views/login/RegisterPage.vue')
const HomePage = () => import('@/views/Home.vue')

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'LoginPage',
    component: Login,
    meta: {
      title: '登录 - 生物信息教育平台',
      requiresAuth: false // 不需要登录
    }
  },
  {
    path: '/register',
    name: 'RegisterPage',
    component: Register,
    meta: {
      title: '注册 - 生物信息教育平台',
      requiresAuth: false
    }
  },
  {
    path: '/home',
    name: 'HomePage',
    component: HomePage,
    meta: {
      title: '首页 - 生物信息教育平台',
      requiresAuth: true, // 需要登录
      breadcrumb: '首页'
    },
  },


  {
    path: '/admin',
    name: "AdminLayout",
    component: () => import('@/views/admin/AdminLayout.vue'),
    children: [
      {
        path: '',
        redirect: 'dashboard'
      },
      {
        path: 'dashboard',
        name: 'DashboardPage',
        component: () => import('@/views/admin/DashboardPage.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: () => import('@/views/admin/UserManagement.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'courses',
        name: 'CourseManagement',
        component: () => import('@/views/admin/CourseManagement.vue'),
        meta: { title: '课程管理' }
      },
      {
        path: 'datasets',
        name: 'DatasetManagement',
        component: () => import('@/views/admin/DatasetManagement.vue'),
        meta: { title: '数据集管理' }
      }
    ]
  },  

  {
    path: '/404',
    name: '404',
    component: () => import('@/views/error/404Page.vue'),
    meta: {
      title: '页面不存在',
      requiresAuth: false
    }
  },
  {
    path: '*',
    redirect: '/404'
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { x: 0, y: 0 }
    }
  }
})


export default router