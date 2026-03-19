import request from './request' // 确保路径指向你封装好的 axios 实例

/**
 * 1. 获取生信案例矩阵列表
 */
export function getCaseList() {
  return request({
    url: '/api/cases/list',
    method: 'get'
  })
}

/**
 * 2. 获取案例图文详情
 * @param {Number|String} id 案例的数据库主键 ID
 */
export function getCaseDetail(id) {
  return request({
    url: `/api/cases/${id}`,
    method: 'get'
  })
}

// ==================== 管理员案例管理 API ====================

export function getAdminCasePage(params) {
  return request({
    url: '/api/admin/cases',
    method: 'get',
    params
  })
}

export function addCase(data) {
  return request({
    url: '/api/admin/cases',
    method: 'post',
    data
  })
}

export function updateCase(id, data) {
  return request({
    url: `/api/admin/cases/${id}`,
    method: 'put',
    data
  })
}

export function deleteCase(id) {
  return request({
    url: `/api/admin/cases/${id}`,
    method: 'delete'
  })
}

