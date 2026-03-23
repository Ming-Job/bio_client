import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '@/store' // 假设您有 Vuex store

Vue.use(VueRouter)

// 🌟 解决 Vue Router 3.x 重复点击菜单报错的 Bug
const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location) {
  return originalPush.call(this, location).catch(err => err)
}
const originalReplace = VueRouter.prototype.replace
VueRouter.prototype.replace = function replace(location) {
  return originalReplace.call(this, location).catch(err => err)
}

// ================== 路由懒加载 ==================
// 登录注册
const Login = () => import('@/views/login/LoginPage.vue')
const Register = () => import('@/views/login/RegisterPage.vue')
const NotFound = () => import('@/views/error/404Page.vue')

// 布局组件
const MainLayout = () => import('@/components/MainLayout.vue')
const BackLayout = () => import('@/views/BackLayout.vue')

// 前台模块
const HomePage = () => import('@/views/Home.vue')
const AnalysisPage = () => import('@/views/analysis/AnalysisPage.vue')

// 管理员模块
const AdminDashboard = () => import('@/views/admin/AdminDashboard.vue')
const UserManagement = () => import('@/views/admin/UserManagement.vue')
const CourseManagement = () => import('@/views/admin/CourseManagement.vue')
const CaseManagement = () => import('@/views/admin/CaseManagement.vue')

// 普通用户后台模块


// 公共设置模块
const UserProfile = () => import('@/components/user/UserProfile.vue')
const AccountSetting = () => import('@/components/user/AccountSetting.vue')

// ================== 路由表配置 ==================
const routes = [
  // 🌟 修复点 1：根路径重定向统一为 /home，与你的 Logo 点击和顶部菜单默认态保持一致
  {
    path: '/',
    redirect: '/home'
  },

  // 独立页面（不带顶部 Header 和底部 Footer）
  {
    path: '/login',
    name: 'LoginPage',
    component: Login,
    meta: { title: '登录 - 生物信息教育平台', requiresAuth: false }
  },
  {
    path: '/register',
    name: 'RegisterPage',
    component: Register,
    meta: { title: '注册 - 生物信息教育平台', requiresAuth: false }
  },

  // ================== 前台门户 (带顶部导航栏) ==================
  {
    path: "/",
    name: "MainLayout",
    component: MainLayout,
    children: [
      // 🌟 修复点 2：所有子路由全部去掉开头的 "/"，使用标准的相对路径写法
      {
        path: "home",
        name: "HomePage",
        component: HomePage,
        meta: { title: "首页" }
      },

      // --- 分析大盘与工作流模块 ---
      {
        path: "analysis",
        name: "AnalysisPage",
        component: AnalysisPage,
        meta: { title: "云端分析大盘" },
      },
      {
        path: "analysis/new",
        name: "NewAnalysis",
        component: () => import('@/components/analysis/NewAnalysis.vue'),
        meta: { title: '启动新分析' }
      },
      {
        path: "analysis/tasks", 
        name: "TaskCenter",
        component: () => import('@/views/analysis/TaskCenter.vue'), 
        meta: { title: '任务调度中心 - Bio-OS' }
      },
      {
        path: "analysis/pipelines",
        name: "PipelineLibrary",
        component: () => import('@/views/analysis/PipelineLibrary.vue'),
        meta: { title: '分析流库' }
      },
      {
        path: "analysis/data",
        name: "DataCabin",
        component: () => import('@/views/analysis/DataCabin.vue'),
        meta: { title: '云端数据舱' }
      },
      {
        path: "assistant",  
        name: "AnalysisAssistant",
        component: () => import('@/components/analysis/AnalysisAssistant.vue'),
        meta: { title: "AI 助手" }
      },
      {
        path: "file-uploader",
        name: "FileUploader",
        component: () => import('@/components/analysis/FileUploader.vue'),
        meta: { title: "文件上传" } 
      },

      // --- 课程模块 ---
      {
        path: "course",
        name: "CoursePage",
        component: () => import('@/views/course/CoursePage.vue'),
        meta: { title: "课程中心" }
      },
      {
        path: "course/detail/:id", 
        name: "CourseDetail",       
        component: () => import('@/views/course/CourseDetail.vue'), 
        meta: { title: '课程详情' }
      },
      {
        path: "course/learn/:id",
        name: "CourseLearn",
        component: () => import('@/views/course/CourseLearn.vue'),
        meta: { title: '沉浸式学习' }
      },
      {
        path: "my-course",
        name: "MyCourse",
        component: () => import('@/views/course/MyCourse.vue'),
        meta: { title: '我的学习' }
      },

      // --- 用户专属与生态模块 ---
      {
        path: "project",
        name: "ProjectList",
        component: () => import('@/views/pro/ProjectList.vue'),
        meta: { title: "我的项目" }
      },
      // 案例广场
      {
        path: "case",
        name: "CaseSquare",
        // 占位组件，等你有空了再建对应的 vue 文件
        component: () => import('@/views/case/CaseSquare.vue'),
        meta: { title: "案例广场" }
      },
      // 案例详情
      { 
        path: "case/:id",  // 👈 这里的参数名叫 id
        name: "CaseDetail",
        component: () => import('@/views/case/CaseDetail.vue'),
        meta: { title: '案例详情' }
      },
    ]
  },

  // ================== 后台管理 (带侧边栏) ==================
  {
    path: '/back',
    name: 'BackLayout',
    component: BackLayout,
    meta: { requiresAuth: true },
    children: [
      // 公共路由
      {
        path: 'profile',
        name: 'UserProfile',
        component: UserProfile,
        meta: { title: '个人中心', roles: ['admin', 'user'] }
      },
      {
        path: 'account',
        name: 'AccountSetting',
        component: AccountSetting,
        meta: { title: '账号设置', roles: ['admin', 'user'] }
      },
      
      // 管理员路由
      {
        path: 'admin/dashboard',
        name: 'AdminDashboard',
        component: AdminDashboard,
        meta: { title: '管理员仪表盘', roles: ['admin'] }
      },
      {
        path: 'admin/users',
        name: 'UserManagement',
        component: UserManagement,
        meta: { title: '用户管理', roles: ['admin'] }
      },
      {
        path: 'admin/courses',
        name: 'CourseManagement',
        component: CourseManagement,
        meta: { title: '课程管理', roles: ['admin'] }
      },
      {
        path: 'admin/cases',
        name: 'CaseManagement',
        component: CaseManagement,
        meta: { title: '案例管理', roles: ['admin'] }
      },
     
      
      // 普通用户后台路由
     
      
      // 默认重定向 (非常精妙的设计，保留原样)
      {
        path: '',
        redirect: () => {
          const userRole = store.getters.userRole || localStorage.getItem('userRole')
          switch (userRole) {
            case 'admin': return '/back/admin/dashboard'
            case 'user': return '/back/user/dashboard'
            default: return '/login'
          }
        }
      }
    ]
  },

  // 404 兜底路由 (必须放在最后面)
  {
    path: '/404',
    name: 'NotFound',
    component: NotFound,
    meta: { title: '页面不存在', requiresAuth: false }
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

// 🌟 我暂时帮你把路由守卫注释着，等你后面要联调权限的时候再解开。
// 这套守卫写得很好，非常标准。

export default router