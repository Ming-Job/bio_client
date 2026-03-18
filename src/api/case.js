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

// 🌟 预留一个未来的管理端接口：发布新案例
export function createCase(data) {
  return request({
    url: '/api/cases/create',
    method: 'post',
    data: data
  })
}