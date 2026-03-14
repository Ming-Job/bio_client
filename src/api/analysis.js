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
 * @param {Number} userId - 当前用户ID (如果 request 拦截器里统一加了，这里就可以不传)
 */
export function getDashboard(userId) {
  return request({
    url: '/api/analysis/dashboard',
    method: 'get',
    headers: { 'userId': userId } // 传给后端的身份凭证
  })
}

/**
 * 3. 获取云端数据舱最近挂载的文件
 */
export function getRecentFiles(userId) {
  return request({
    url: '/api/analysis/files/recent',
    method: 'get',
    headers: { 'userId': userId }
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