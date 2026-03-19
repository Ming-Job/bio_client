import request from './request'

// 1. 分页获取课程列表
export function getCoursePage(params) {
  return request({
    url: '/api/courses/page', // 对接后端的 /page 路径
    method: 'get',
    params
  })
}

// 获取课程详情
export function getCourseDetail(id) {
  return request({
    url: `/api/courses/${id}`, // 对接后端的 @GetMapping("/{id}")
    method: 'get'
  })
}

// 获取报名状态
export function checkEnrollmentStatus(courseId, userId) {
  return request({
    url: `/api/courses/${courseId}/enrollment-status`,
    method: 'get',
    params: { userId }
  })
}

// 加入课程
export function enrollCourse(courseId, userId) {
  return request({
    url: `/api/courses/${courseId}/enroll`,
    method: 'post',
    params: { userId } // 根据你后端的接收方式，如果改成了 @RequestBody 就放 data 里
  })
}

// 记录进度
export function recordLessonProgress(userId, lessonId, watchSeconds, isCompleted) {
  return request({
    url: '/api/progress/record',
    method: 'post',
    params: { userId, lessonId, watchSeconds, isCompleted }
  })
}

// 获取已完成的课时ID列表
export function getCompletedLessons(courseId, userId) {
  return request({
    url: `/api/progress/completed/${courseId}`,
    method: 'get',
    params: { userId }
  })
}

// 获取用户最近学习的课程
export function getRecentCourses(userId) {
  return request({
    url: '/api/courses/recent',
    method: 'get',
    params: { userId }
  })
}

// 获取我的学习列表 (包含进度、最近学习时间等)
export function getMyCourses(userId) {
  return request({
    url: '/api/courses/user/my', // 我们马上要在后端实现这个接口
    method: 'get',
    params: { userId }
  })
}

// ai助手 课程页面
export function sendAiMessage(messages) {
  return request({
    url: '/api/ai/chat',
    method: 'post',
    data: messages, // 注意这里用 data 传 JSON 数组
    timeout: 120000,
  })
}

// AI 自然语言选课推荐
export function recommendCoursesByAi(query) {
  return request({
    url: '/api/ai/recommend-courses',
    method: 'post',
    data: { query }
  })
}



// ==================== 管理员专属接口 ====================

// 管理员：获取分页课程列表
export function getAdminCourseList(params) {
  return request({
    url: '/api/admin/courses',
    method: 'get',
    params
  })
}

// 管理员：新增课程
export function addCourse(data) {
  return request({
    url: '/api/admin/courses',
    method: 'post',
    data
  })
}

// 管理员：更新课程
export function updateCourse(id, data) {
  return request({
    url: `/api/admin/courses/${id}`,
    method: 'put',
    data
  })
}

// 管理员：删除课程
export function deleteCourse(id) {
  return request({
    url: `/api/admin/courses/${id}`,
    method: 'delete'
  })
}

// 管理员：更改课程状态
export function updateCourseStatus(id, status) {
  return request({
    url: `/api/admin/courses/${id}/status`,
    method: 'patch',
    params: { status }
  })
}