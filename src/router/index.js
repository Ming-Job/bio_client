import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '@/store' // 假设您有 Vuex store

Vue.use(VueRouter)

// 路由懒加载
const Login = () => import('@/views/login/LoginPage.vue')
const Register = () => import('@/views/login/RegisterPage.vue')
const HomePage = () => import('@/views/Home.vue')
const BackLayout = () => import('@/views/BackLayout.vue')
const NotFound = () => import('@/views/error/404Page.vue')

// 管理员模块
const AdminDashboard = () => import('@/views/admin/AdminDashboard.vue')
const UserManagement = () => import('@/views/admin/UserManagement.vue')
const CourseManagement = () => import('@/views/admin/CourseManagement.vue')
const DatasetManagement = () => import('@/views/admin/DatasetManagement.vue')

// 教师模块
const TeacherDashboard = () => import('@/views/teacher/TeacherDashboard.vue')
const TeachingCourses = () => import('@/views/teacher/TeachingCourses.vue')
const StudentManagement = () => import('@/views/teacher/StudentManagement.vue')
const TasksManagement = () => import('@/views/teacher/TasksManagement.vue')

// 学生模块
const StudentDashboard = () => import('@/views/student/StudentDashboard.vue')
const LearningCenter = () => import('@/views/student/LearningCenter.vue')
const MyCourses = () => import('@/views/student/MyCourses.vue')

// 公共模块
const UserProfile = () => import('@/components/user/UserProfile.vue')
const AccountSettings = () => import('@/components/user/AccountSetting.vue')

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
      requiresAuth: false
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
      requiresAuth: true,
      breadcrumb: '首页'
    }
  },

  {
    path: '/back',
    name: 'BackLayout',
    component: BackLayout,
    meta: {
      requiresAuth: true
    },
    children: [
      // 公共路由（所有登录用户可访问）
      {
        path: 'profile',
        name: 'UserProfile',
        component: UserProfile,
        meta: {
          title: '个人中心',
          roles: ['admin', 'teacher', 'student']
        }
      },
      {
        path: 'account',
        name: 'AccountSettings',
        component: AccountSettings,
        meta: {
          title: '账号设置',
          roles: ['admin', 'teacher', 'student']
        }
      },
      
      // 管理员路由
      {
        path: 'admin',
        meta: { roles: ['admin'] },
        children: [
          {
            path: 'dashboard',
            name: 'AdminDashboard',
            component: AdminDashboard,
            meta: {
              title: '管理员仪表盘'
            }
          },
          {
            path: 'users',
            name: 'UserManagement',
            component: UserManagement,
            meta: {
              title: '用户管理'
            }
          },
          {
            path: 'courses',
            name: 'CourseManagement',
            component: CourseManagement,
            meta: {
              title: '课程管理'
            }
          },
          {
            path: 'datasets',
            name: 'DatasetManagement',
            component: DatasetManagement,
            meta: {
              title: '数据集管理'
            }
          }
        ]
      },
      
      // 教师路由
      {
        path: 'teacher',
        meta: { roles: ['teacher'] },
        children: [
          {
            path: 'dashboard',
            name: 'TeacherDashboard',
            component: TeacherDashboard,
            meta: {
              title: '教师仪表盘'
            }
          },
          {
            path: 'courses',
            name: 'TeachingCourses',
            component: TeachingCourses,
            meta: {
              title: '授课管理'
            }
          },
          {
            path: 'students',
            name: 'StudentManagement',
            component: StudentManagement,
            meta: {
              title: '学生管理'
            }
          },
          {
            path: 'tasks',
            name: 'TasksManagement',
            component: TasksManagement,
            meta: {
              title: '作业管理'
            }
          }
        ]
      },
      
      // 学生路由
      {
        path: 'student',
        meta: { roles: ['student'] },
        children: [
          {
            path: 'dashboard',
            name: 'StudentDashboard',
            component: StudentDashboard,
            meta: {
              title: '学生仪表盘'
            }
          },
          {
            path: 'learning-center',
            name: 'LearningCenter',
            component: LearningCenter,
            meta: {
              title: '学习中心'
            }
          },
          {
            path: 'courses',
            name: 'StudentCourses',
            component: MyCourses,
            meta: {
              title: '我的课程'
            }
          }
        ]
      },
      
      // 默认重定向到用户类型的仪表盘
      {
        path: '',
        redirect: () => {
          // 这里可以根据用户角色动态重定向
          const userRole = store.getters.userRole // 假设从 Vuex 获取用户角色
          switch (userRole) {
            case 'admin': return '/app/admin/dashboard'
            case 'teacher': return '/app/teacher/dashboard'
            case 'student': return '/app/student/dashboard'
            default: return '/login'
          }
        }
      }
    ]
  },
  {
    path: '/404',
    name: 'NotFound',
    component: NotFound,
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
  scrollBehavior(savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { x: 0, y: 0 }
    }
  }
})

// // 路由守卫
// router.beforeEach((to, next) => {
//   // 设置页面标题
//   if (to.meta.title) {
//     document.title = to.meta.title
//   }
  
//   // 检查是否需要认证
//   if (to.matched.some(record => record.meta.requiresAuth)) {
//     const isAuthenticated = store.getters.isAuthenticated // 假设从 Vuex 获取登录状态
    
//     if (!isAuthenticated) {
//       // 未登录，跳转到登录页
//       next({
//         path: '/login',
//         query: { redirect: to.fullPath }
//       })
//     } else {
//       // 已登录，检查角色权限
//       const userRole = store.getters.userRole
//       const routeRoles = to.meta.roles
      
//       if (routeRoles && routeRoles.length && !routeRoles.includes(userRole)) {
//         // 角色无权限，跳转到无权限页面或首页
//         next('/home')
//       } else {
//         next()
//       }
//     }
//   } else {
//     // 不需要认证的路由
//     next()
//   }
// })

// 导出路由实例
export default router