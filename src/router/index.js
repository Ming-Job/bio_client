import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '@/store' // 假设您有 Vuex store

Vue.use(VueRouter)


const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location) {
  return originalPush.call(this, location).catch(err => err) // 错误被捕获，不会显示警告
}

// 对于 replace 方法也做同样处理
const originalReplace = VueRouter.prototype.replace
VueRouter.prototype.replace = function replace(location) {
  return originalReplace.call(this, location).catch(err => err)
}

// 路由懒加载
const Login = () => import('@/views/login/LoginPage.vue')
const Register = () => import('@/views/login/RegisterPage.vue')
const NotFound = () => import('@/views/error/404Page.vue')


const BackLayout = () => import('@/views/BackLayout.vue')

// 管理员模块
const AdminDashboard = () => import('@/views/admin/AdminDashboard.vue')
const UserManagement = () => import('@/views/admin/UserManagement.vue')
const CourseManagement = () => import('@/views/admin/CourseManagement.vue')
const DatasetManagement = () => import('@/views/admin/DatasetManagement.vue')

// 普通用户模块
const UserDashboard = () => import('@/views/user/UserDashboard.vue')
const LearningCenter = () => import('@/views/user/LearningCenter.vue')
const UserCourses = () => import('@/views/user/UserCourses.vue')

// 公共模块
const UserProfile = () => import('@/components/user/UserProfile.vue')
const AccountSetting = () => import('@/components/user/AccountSetting.vue')


const HomePage = () => import('@/views/Home.vue')
const MainLayout = () => import('@/components/MainLayout.vue')
const AnalysisPage = () => import('@/views/analysis/AnalysisPage.vue');
const TeachingCase = () => import('@/views/case/TeachingCase.vue');

const routes = [
  {
    path: '/',
    redirect: '/analysis'
  },

  // 登录
  {
    path: '/login',
    name: 'LoginPage',
    component: Login,
    meta: {
      title: '登录 - 生物信息教育平台',
      requiresAuth: false
    }
  },

  // 注册
  {
    path: '/register',
    name: 'RegisterPage',
    component: Register,
    meta: {
      title: '注册 - 生物信息教育平台',
      requiresAuth: false
    }
  },


  // 前台
  {
      // 父路由：使用MainLayout布局
      path: "/",
      name: "MainLayout",
      component: MainLayout,
      // 子路由：所有需要保留Header/Footer的页面都放在children中
      children: [
        {
          // 首页：子路由path为空，对应父路由的默认页面
          path: "home",
          name: "HomePage",
          component: HomePage
        },
        {
          // 分析中心页面 
          path: "analysis",
          name: "AnalysisPage",
          component: AnalysisPage,
          meta: { title: "分析页面" },
        },
        
          // 新建分析页面
        {
          path: '/analysis/new',
          name: 'NewAnalysis',
          component: () => import('@/components/analysis/NewAnalysis.vue'), // 假设你放在了这里
          meta: { title: '启动新分析' }
        },

        // 注册任务调度中心路由
        {
          path: '/analysis/tasks', // 浏览器地址栏的 URL 路径
          name: 'TaskCenter',
          // 路由懒加载（推荐写法），性能更好
          component: () => import('@/views/analysis/TaskCenter.vue'), 
          meta: { 
            title: '任务调度中心 - Bio-OS',
          }
        },
        // 分析流库页面
        {
          path: '/analysis/pipelines',
          name: 'PipelineLibrary',
          component: () => import('@/views/analysis/PipelineLibrary.vue'),
          meta: { title: '分析流库' }
        },
        // 云端数据舱页面
        {
          path: '/analysis/data',
          name: 'DataCabin',
          component: () => import('@/views/analysis/DataCabin.vue'),
          meta: { title: '云端数据舱' }
        },

        {
          path: "assistant",  // 独立的路由，不是analysis的子路由
          name: "AnalysisAssistant",
          component: () => import('@/components/analysis/AnalysisAssistant.vue'),
          meta: { title: "AI 助手" }
        },



        {
          // 课程中心页面
          path: "course",
          name: "CoursePage",
          component: () => import('@/views/course/CoursePage.vue'),
          meta: { title: "课程中心" }
        },
        // 课程详情页的路由配置
        {
          path: '/course/detail/:id',   // 这里的 :id 是必须的，用来接收传过来的 course.id
          name: 'CourseDetail',         // 如果用方案一，这个 name 必须对应上
          component: () => import('@/views/course/CourseDetail.vue'), // 指向我们刚刚写的详情页组件
          meta: { title: '课程详情' }
        },
        // 继续学习 页面
        {
          path: '/course/learn/:id',
          name: 'CourseLearn',
          component: () => import('@/views/course/CourseLearn.vue'),
          meta: { title: '沉浸式学习' }
        },
        // 我的学习页面
        {
          path: '/my-course',
          name: 'MyCourse',
          component: () => import('@/views/course/MyCourse.vue'),
          meta: { title: '我的学习' }
        },

        {
          // 文件上传页面
          path: "file-uploader",
          name: "FileUploader",
          component: () => import('@/components/analysis/FileUploader.vue'),
          meta: { title: "文件上传" } 
        },





        {
          path: "teaching-case",
          name: "TeachingCase",
          component: TeachingCase,
          meta: { title: "教学案例" }
        }
      ]
    },
  // 后台
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
          roles: ['admin', 'user']
        }
      },
      {
        path: 'account',
        name: 'AccountSetting',
        component: AccountSetting,
        meta: {
          title: '账号设置',
          roles: ['admin', 'user']
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
      
      // 普通用户路由
      {
        path: 'user/dashboard',
        name: 'UserDashboard',
        component: UserDashboard,
        meta: {
          title: '用户仪表盘',
          roles: ['user']
        }
      },
      {
        path: 'user/learning-center',
        name: 'LearningCenter',
        component: LearningCenter,
        meta: {
          title: '学习中心',
          roles: ['user']
        }
      },
      {
        path: 'user/courses',
        name: 'UserCourses',
        component: UserCourses,
        meta: {
          title: '我的课程',
          roles: ['user']
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
            case 'user': return '/back/user/dashboard'
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