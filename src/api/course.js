import request from './request'

// 获取课程列表（可传 params 做分页或过滤）
export function getCourses(params) {
  return request({
    url: '/api/courses',
    method: 'get',
    params
  })
}

// 根据课程ID获取课程详情
export function getCourseById(id) {
  return request({
    url: `/api/courses/${id}`,
    method: 'get'
  })
}
