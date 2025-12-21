// store/modules/user.js
const state = {
  isLoggedIn: false,
  userInfo: null
}

const mutations = {
  SET_USER_INFO(state, userInfo) {
    state.isLoggedIn = true
    state.userInfo = userInfo || {}
    // 同时保存到localStorage
    if (userInfo) {
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
    }
  },
  CLEAR_USER_INFO(state) {
    state.isLoggedIn = false
    state.userInfo = null
    localStorage.removeItem('userInfo')
  },
  // 更新用户信息（部分更新）
  UPDATE_USER_INFO(state, userInfo) {
    if (state.userInfo) {
      state.userInfo = { ...state.userInfo, ...userInfo }
      localStorage.setItem('userInfo', JSON.stringify(state.userInfo))
    }
  }
}

const actions = {
  // 检查登录状态
  checkLoginStatus({ commit }) {
    try {
      const userInfo = localStorage.getItem('userInfo')
      if (userInfo) {
        const parsedInfo = JSON.parse(userInfo)
        commit('SET_USER_INFO', parsedInfo)
      }
    } catch (error) {
      console.error('检查登录状态失败:', error)
    }
  },
  
  // 设置用户信息
  setUserInfo({ commit }, userInfo) {
    commit('SET_USER_INFO', userInfo)
  },
  
  // 更新用户信息
  updateUserInfo({ commit }, userInfo) {
    commit('UPDATE_USER_INFO', userInfo)
  },
  
  // 退出登录
  logout({ commit }) {
    // 清除本地存储
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    // 清除Vuex状态
    commit('CLEAR_USER_INFO')
  }
}

const getters = {
  // 获取用户角色
  userRole: state => state.userInfo?.role || '',
  // 获取用户名
  userName: state => state.userInfo?.username || '',
  // 获取头像
  userAvatar: state => state.userInfo?.avatar || ''
}

export default {
  namespaced: true, // 必须设置命名空间
  state,
  mutations,
  actions,
  getters
}