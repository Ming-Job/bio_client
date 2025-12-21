import Vue from 'vue'
import Vuex from 'vuex'
import { getToken, getUserInfo, clearAuth } from '@/utils/auth'
import user from './modules/user' // 导入user模块

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    user // 注册模块
  },
  
  state: {
    token: getToken(),
    userInfo: getUserInfo(),
    sidebar: {
      opened: true
    }
  },
  mutations: {
    SET_TOKEN: (state, token) => {
      state.token = token
    },
    SET_USER_INFO: (state, userInfo) => {
      state.userInfo = userInfo
    },
    SET_SIDEBAR_OPENED: (state, opened) => {
      state.sidebar.opened = opened
    }
  },
  actions: {
    // 登录
    login({ commit }, userInfo) {
      return new Promise((resolve) => {
        // 设置token和用户信息
        if (userInfo.token) {
          commit('SET_TOKEN', userInfo.token)
        }
        if (userInfo.user) {
          commit('SET_USER_INFO', userInfo.user)
        }
        resolve()
      })
    },
    
    // 退出登录
    logout({ commit }) {
      return new Promise((resolve) => {
        // 清除Vuex中的状态
        commit('SET_TOKEN', '')
        commit('SET_USER_INFO', null)
        
        // 清除本地存储的认证信息
        clearAuth()
        
        resolve()
      })
    }
  },
  getters: {
    token: state => state.token,
    userInfo: state => state.userInfo,
    userName: state => state.userInfo ? state.userInfo.username : '',
    userRole: state => state.userInfo ? state.userInfo.role : '',
    sidebarOpened: state => state.sidebar.opened
  }
})