import request from './request'

/**
 * 1. 获取分析流程模板大厅
 */
export function getPipelines() {
  return request({
    url: '/api/analysis/pipelines/list',
    method: 'get'
  })
}

/**
 * 2. 轮询获取大盘统计和任务真实进度
 * 🌟 核心修改：增加 projectId 参数
 */
export function getDashboard(userId, projectId) {
  return request({
    url: '/api/analysis/dashboard',
    method: 'get',
    params: { projectId: projectId }, // 会变成 /dashboard?projectId=1
    headers: { 'userId': userId } 
  })
}

/**
 * 获取云端数据舱最近挂载的文件
 */
export function getRecentFiles(userId, projectId) {
  return request({
    url: '/api/files/recent',  // 🌟 核心修复：把中间的 /analysis 删掉，认准正统接口！
    method: 'get',
    params: { 
      userId: userId,          // 🌟 顺手把 params 补全，和之前 file.js 里一样
      projectId: projectId 
    }
  })
}
/**
 * 4. 提交(发射)新的生信分析任务
 * @param {Object} data - 包含 pipelineCode, fileIds, params 的 DTO
 */
export function submitAnalysisTask(data, userId) {
  return request({
    url: '/api/analysis/tasks/submit',
    method: 'post',
    data: data,
    headers: { 'userId': userId }
  })
}

/**
 * 5. 获取分析任务详情（调度中心用）
 * @param {Number} taskId - 任务ID
 * @param {Number} userId - 当前用户ID
 */
export function getTaskDetails(taskId, userId) {
  return request({
    url: `/api/analysis/tasks/${taskId}/details`,
    method: 'get',
    headers: { 'userId': userId }
  })
}

/**
 * 6. 获取分析任务分页列表（调度中心用）
 * @param {Object} params - 包含 page, size, status 等查询参数
 * @param {Number} userId - 当前用户ID
 */
export function getTaskPage(params, userId) {
  return request({
    url: '/api/analysis/tasks/page',
    method: 'get',
    params: params, 
    headers: {
      'userId': userId 
    }
  });
}


// 新增流程
export function createPipeline(data) {
  return request({ url: '/api/pipelines', method: 'post', data })
}
// 更新流程
export function updatePipeline(data) {
  return request({ url: '/api/pipelines', method: 'put', data })
}
// 删除流程
export function deletePipeline(id) {
  return request({ url: `/api/pipelines/${id}`, method: 'delete' })
}