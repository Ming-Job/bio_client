import Vue from 'vue'
import App from './App.vue'
// 引入 Element UI 组件库
import ElementUI from 'element-ui'
// 引入 Element UI 样式
import 'element-ui/lib/theme-chalk/index.css'
// 引入路由和状态管理
import router from './router'
import store from './store'
Vue.use(ElementUI)



new Vue({
  router,
  store,
  render: h => h(App),
  created() {
    // 应用启动时检查登录状态
    this.$store.dispatch('user/checkLoginStatus');
  }
}).$mount('#app')