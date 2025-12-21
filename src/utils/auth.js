import Cookies from 'js-cookie'

// Token key
const TokenKey = 'token'
const UserKey = 'user_info'
const RememberMeKey = 'remembered_username'

// ========== Token 相关操作 ==========
// 获取token
export function getToken() {
  return Cookies.get(TokenKey)
}

// 设置token
export function setToken(token) {
  return Cookies.set(TokenKey, token, { expires: 7 }) // 7天过期
}

// 移除token
export function removeToken() {
  return Cookies.remove(TokenKey)
}

// ========== 用户信息相关操作 ==========
// 获取用户信息
export function getUserInfo() {
  // 使用 localStorage 存储用户信息，避免 Cookie 大小限制
  const userStr = localStorage.getItem(UserKey)
  if (userStr) {
    try {
      return JSON.parse(userStr)
    } catch (e) {
      console.error('解析用户信息失败:', e)
      clearAuth() // 解析失败时清理所有认证信息
      return null
    }
  }
  return null
}

// 设置用户信息
export function setUserInfo(userInfo) {
  // 存储到 localStorage，永不过期（直到用户清除或退出登录）
  localStorage.setItem(UserKey, JSON.stringify(userInfo))
}

// 移除用户信息
export function removeUserInfo() {
  localStorage.removeItem(UserKey)
}

// ========== 记住我功能 ==========
// 获取记住的用户名
export function getRememberedUsername() {
  return localStorage.getItem(RememberMeKey)
}

// 设置记住的用户名
export function setRememberedUsername(username) {
  localStorage.setItem(RememberMeKey, username)
}

// 清除记住的用户名
export function removeRememberedUsername() {
  localStorage.removeItem(RememberMeKey)
}

// ========== 认证状态管理 ==========
// 清除所有认证信息
export function clearAuth() {
  removeToken()
  removeUserInfo()
  // 注意：不清除记住的用户名，以便用户下次登录时还能看到
}

// 检查是否已登录（推荐使用这个）
export function isLoggedIn() {
  const token = getToken()
  const userInfo = getUserInfo()
  
  // 同时检查 token 和用户信息都存在
  return !!(token && userInfo)
}

// 获取用户角色
export function getUserRole() {
  const userInfo = getUserInfo()
  return userInfo ? userInfo.role : null
}

// 获取用户ID
export function getUserId() {
  const userInfo = getUserInfo()
  return userInfo ? userInfo.id : null
}

// 获取用户名
export function getUsername() {
  const userInfo = getUserInfo()
  return userInfo ? userInfo.username : null
}

// 检查是否有权限
export function hasPermission(requiredRole) {
  if (!requiredRole) return true
  
  const userRole = getUserRole()
  if (!userRole) return false
  
  // 权限等级：admin > teacher > student
  const roleLevel = {
    admin: 3,
    teacher: 2,
    student: 1
  }
  
  const requiredLevel = roleLevel[requiredRole]
  const userLevel = roleLevel[userRole]
  
  // 确保角色等级存在
  if (!requiredLevel || !userLevel) return false
  
  return userLevel >= requiredLevel
}

// 检查是否为特定角色
export function isRole(role) {
  const userRole = getUserRole()
  return userRole === role
}

// 检查是否为管理员
export function isAdmin() {
  return isRole('admin')
}

// 检查是否为教师
export function isTeacher() {
  return isRole('teacher')
}

// 检查是否为学生
export function isStudent() {
  return isRole('student')
}

// ========== 数据准备函数 ==========
// 准备登录数据
export function prepareLoginData(username, password) {
  return {
    username: username.trim(),
    password: password // 发送原始密码，后端负责加密验证
  }
}

// 准备注册数据
export function prepareRegisterData(formData) {
  const data = {
    username: formData.username.trim(),
    password: formData.password,
    confirmPassword: formData.confirmPassword,
    role: formData.role,
    email: formData.email ? formData.email.trim() : '',
    phone: formData.phone ? formData.phone.trim() : ''
  }
  
  // 可选：添加其他字段
  if (formData.nickname) {
    data.nickname = formData.nickname.trim()
  }
  
  return data
}

// ========== 头像URL处理 ==========
// 获取完整头像URL
export function getAvatarUrl(avatarPath) {
  if (!avatarPath) return ''
  
  // 如果已经是完整URL，直接返回
  if (avatarPath.startsWith('http')) {
    return avatarPath
  }
  
  // 根据环境变量获取基础URL
  const baseUrl = process.env.VUE_APP_API_URL || 'http://localhost:8080'
  
  // 处理相对路径
  if (avatarPath.startsWith('/')) {
    return baseUrl + avatarPath
  }
  
  // 如果没有/开头，添加/
  return baseUrl + '/' + avatarPath
}

// ========== 登录状态检查 ==========
// 全面检查登录状态
export function checkAuthStatus() {
  const token = getToken()
  const userInfo = getUserInfo()
  
  return {
    hasToken: !!token,
    hasUserInfo: !!userInfo,
    isAuthenticated: !!(token && userInfo),
    userInfo: userInfo || {}
  }
}

// 验证并获取用户信息（用于刷新页面时）
export function validateAndGetUserInfo() {
  const token = getToken()
  if (!token) {
    clearAuth()
    return null
  }
  
  const userInfo = getUserInfo()
  if (!userInfo) {
    // 有token但没有用户信息，可能需要重新获取
    return null
  }
  
  return userInfo
}