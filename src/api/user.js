import request from './request'

// 用户登录
export function login(data) {
  return request({
    url: '/api/user/login',
    method: 'post',
    data
  })
}

// 用户注册
export function register(data) {
  return request({
    url: '/api/user/register',
    method: 'post',
    data
  })
}

// 验证身份（忘记密码第一步）
export function verifyIdentity(data) {
  return request({
    url: '/api/user/verify-identity',
    method: 'post',
    data
  })
}

// 忘记密码（通过用户名和邮箱重置密码）
export function forgetPassword(data) {
  return request({
    url: '/api/user/forget-password',
    method: 'post',
    data
  })
}

// 检查用户名是否存在
export function checkUsernameExists(username) {
  return request({
    url: `/api/user/check-username/${username}`,
    method: 'get'
  })
}

// 修改密码
export function changePassword(data) {
  return request({
    url: '/api/user/change-password',
    method: 'post',
    params: data
  })
}

// 重置密码（通过用户ID）
export function resetPassword(data) {
  return request({
    url: '/api/user/reset-password',
    method: 'post',
    data
  })
}

// 获取用户列表
export function getUserList() {
  return request({
    url: '/api/user/list',
    method: 'get'
  })
}

// 根据ID获取用户
export function getUserById(id) {
  return request({
    url: `/api/user/${id}`,
    method: 'get'
  })
}

// 根据id删除用户
export function deleteUser(id) {
  return request({
    url: `/api/user/${id}`,
    method: 'delete'
  })
}

// 分页查询用户
export function getUserPage(params) {
  return request({
    url: '/api/user/page',
    method: 'get',
    params
  })
}

// 更新用户状态（启用/禁用）根据ID
export function updateUserStatus(data) {
  return request({
    url: '/api/user/update-status',
    method: 'post',
    data
  })
}

// 修改用户信息
export function updateUser(data){
  return request({
    url: '/api/user/update',
    method: 'put',
    data
  })
}

// 添加用户
export function addUser(data) {
  return request({
    url: '/api/user/save',
    method: 'post',
    data
  })
}


// 批量更新用户状态
export function batchUpdateUserStatus(data) {
  return request({
    url: '/api/user/batch-update-status',
    method: 'post',
    params: {  // 关键修改：使用 params 而不是 data
      ids: data.ids.join(','),  // 将数组转换为逗号分隔的字符串
      status: data.status
    }
  });
}

// 批量删除用户 - 修改为使用 params
export function batchDeleteUsers(data) {
  return request({
    url: '/api/user/batch-delete',
    method: 'post',
    params: {  // 改为 params
      ids: Array.isArray(data.ids) ? data.ids.join(',') : data.ids
    }
  });
}

// =================== 管理员仪表盘统计数据接口 ===================

// 1. 获取仪表盘四大指标 (修改 url)
export function getUserStatistics() {
  return request({
    // 🌟 原来可能是 /api/user/statistics，现在改成我们新的聚合接口
    url: '/api/statistics/overview', 
    method: 'get'
  })
}

// 2. 获取用户增长图表数据 (修改 url)
export function getUserGrowthChart(period = '30d') {
  return request({
    // 🌟 这个保持不变，因为我们后端的路径就叫这个
    url: '/api/statistics/user-growth/chart',
    method: 'get',
    params: { period }
  })
}

// 获取课程难度分布饼图数据
export function getCourseDistribution() {
  return request({
    url: '/api/statistics/course-distribution', // 🌟 指向新的课程分布接口
    method: 'get'
  })
}
// ===================================================================

// 根据ID查找用户名
export function getUsername(id){
  return request({
    url: `/api/user/get-username/${id}`,
    method: 'get'
  })
}

// 更新用户头像
export function updateUserAvatar(data) {
  return request({
    url: "/api/user/avatar/update",
    method: 'post',
    data
  })
}

// 更新用户信息（昵称、邮箱等）
export function updateUserInfo(data) {
  return request({
    url: "/api/user/info/update",
    method: 'post',
    data
  })
}




