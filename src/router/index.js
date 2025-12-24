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
const AccountSetting = () => import('@/components/user/AccountSetting.vue')

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
      // 公共路由
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
        name: 'AccountSetting',
        component: AccountSetting,
        meta: {
          title: '账号设置',
          roles: ['admin', 'teacher', 'student']
        }
      },
      
      // 管理员路由
      {
        path: 'admin/dashboard',
        name: 'AdminDashboard',
        component: AdminDashboard,
        meta: {
          title: '管理员仪表盘',
          roles: ['admin']
        }
      },
      {
        path: 'admin/users',
        name: 'UserManagement',
        component: UserManagement,
        meta: {
          title: '用户管理',
          roles: ['admin']
        }
      },
      {
        path: 'admin/courses',
        name: 'CourseManagement',
        component: CourseManagement,
        meta: {
          title: '课程管理',
          roles: ['admin']
        }
      },
      {
        path: 'admin/datasets',
        name: 'DatasetManagement',
        component: DatasetManagement,
        meta: {
          title: '数据集管理',
          roles: ['admin']
        }
      },
      
      // 教师路由
      {
        path: 'teacher/dashboard',
        name: 'TeacherDashboard',
        component: TeacherDashboard,
        meta: {
          title: '教师仪表盘',
          roles: ['teacher']
        }
      },
      {
        path: 'teacher/courses',
        name: 'TeachingCourses',
        component: TeachingCourses,
        meta: {
          title: '授课管理',
          roles: ['teacher']
        }
      },
      {
        path: 'teacher/students',
        name: 'StudentManagement',
        component: StudentManagement,
        meta: {
          title: '学生管理',
          roles: ['teacher']
        }
      },
      {
        path: 'teacher/tasks',
        name: 'TasksManagement',
        component: TasksManagement,
        meta: {
          title: '作业管理',
          roles: ['teacher']
        }
      },
      
      // 学生路由
      {
        path: 'student/dashboard',
        name: 'StudentDashboard',
        component: StudentDashboard,
        meta: {
          title: '学生仪表盘',
          roles: ['student']
        }
      },
      {
        path: 'student/learning-center',
        name: 'LearningCenter',
        component: LearningCenter,
        meta: {
          title: '学习中心',
          roles: ['student']
        }
      },
      {
        path: 'student/courses',
        name: 'StudentCourses',
        component: MyCourses,
        meta: {
          title: '我的课程',
          roles: ['student']
        }
      },
      
      // 默认重定向
      {
        path: '',
        redirect: () => {
          const userRole = store.getters.userRole || localStorage.getItem('userRole')
          console.log('当前用户角色:', userRole)
          switch (userRole) {
            case 'admin': return '/back/admin/dashboard'
            case 'teacher': return '/back/teacher/dashboard'
            case 'student': return '/back/student/dashboard'
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