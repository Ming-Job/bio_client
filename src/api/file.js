// @/api/file.js
import request from './request'


export function getRecentUploadFiles(userId, projectId) {
  return request({
    url: '/api/files/recent', // 🌟 回归正统接口！这个接口里有 projectMapper 查项目名的逻辑
    method: 'get',
    params: { 
      userId: userId,         // 🌟 你的 FileController 里用的是 @RequestParam，所以必须放 Params 里
      projectId: projectId 
    }
  })
}

// 上传单个文件
export function uploadSingleFile(data, onProgress) {
  return request({
    url: '/api/files/upload', // 替换为你后端实际的单文件上传接口路径！
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    // 将 axios 的进度事件回调抛给组件
    onUploadProgress: progressEvent => {
      if (onProgress) {
        onProgress(progressEvent);
      }
    }
  })
}

// 批量上传文件
export function uploadFiles(data) {
  return request({
    url: '/api/files/batch-upload',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}


// 获取文件列表
export function getFileList(params) {
  return request({
    url: '/api/files/list',
    method: 'get',
    params
  })
}

// 🌟 新增：获取全量数据舱文件
export function getAllFileList(params) {
  return request({
    url: '/api/files/all', // 指向我们后端刚写好的新接口
    method: 'get',
    params
  })
}

// 获取文件统计信息
export function getFileStats() { 
  return request({
    url: '/api/files/stats',
    method: 'get'
  })
}

// 根据文件ID删除文件（需传入 userId）
export function deleteFile(fileId, userId) {
  return request({
    url: `/api/files/${fileId}`,
    method: 'delete',
    params: { userId }  // 添加 userId 作为查询参数
  })
}


// 获取文件预览内容 (截取头部)
export function previewFile(fileId, userId) {
  return request({
    url: `/api/files/preview/${fileId}`,
    method: 'get',
    params: { userId } // userId 作为参数传给后端校验权限
  })
}
