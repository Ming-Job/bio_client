// src/api/project.js
import request from './request'; // 你的 axios 封装实例

/**
 * 获取当前用户的所有科研项目列表 (包含统计信息)
 */
export function getUserProjects(userId) {
  return request({
    url: `/api/projects/user/${userId}`,
    method: 'get'
  });
}


/**
 * 创建新的科研项目
 */
export function createProject(data) {
  return request({
    url: '/api/projects',
    method: 'post',
    data: data
  });
}

/**
 * 更新项目信息
 */
export function updateProject(projectId, data) {
  return request({
    url: `/api/projects/${projectId}`,
    method: 'put',
    data: data
  });
}

/**
 * 逻辑删除/物理删除项目
 */
export function deleteProject(projectId) {
  return request({
    url: `/api/projects/${projectId}`,
    method: 'delete'
  });
}

/**
 * 项目归档/取消归档
 */
export function toggleArchiveProject(projectId, isArchived) {
  return request({
    url: `/api/projects/${projectId}/archive`,
    method: 'put',
    params: { isArchived }
  });
}