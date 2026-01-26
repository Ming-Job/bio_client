// @/api/file.js
import request from './request'

// 获取最近上传的文件
export function getRecentUploadFiles(userId, limit = 10, projectId = null) {
  return request({
    url: '/api/files/recent',
    method: 'get',
    params: {
      userId,
      limit,
      projectId
    }
  })
}

// 其他文件API函数...
export function uploadFile(data) {
  return request({
    url: '/api/files/upload',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
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

// 获取文件统计信息
export function getFileStats() { 
  return request({
    url: '/api/files/stats',
    method: 'get'
  })
}