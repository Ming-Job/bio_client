import request from './request'

// ==================== 普通学员 & 课程展示接口 ====================

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
    url: '/api/courses/user/my', 
    method: 'get',
    params: { userId }
  })
}


// ==================== 学习进度相关接口 ====================

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


// ==================== AI 助手 & 推荐接口 ====================

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

// 🌟 新增：管理员上传课程封面图
export function uploadCourseCover(data) {
  return request({
    url: '/api/courses/cover/upload', 
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'multipart/form-data' // 明确告诉后端这是文件上传
    }
  })
}

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


// ==================== 课时/章节管理专属接口 ====================

// 获取某门课程的所有课时列表 (按 sortOrder 排序)
export function getCourseLessons(courseId) {
  return request({
    url: `/api/admin/course-lessons/list`,
    method: 'get',
    params: { courseId }
  })
}

// 新增课时
export function addCourseLesson(data) {
  return request({
    url: '/api/admin/course-lessons',
    method: 'post',
    data
  })
}

// 修改课时
export function updateCourseLesson(id, data) {
  return request({
    url: `/api/admin/course-lessons/${id}`,
    method: 'put',
    data
  })
}

// 删除课时
export function deleteCourseLesson(id) {
  return request({
    url: `/api/admin/course-lessons/${id}`,
    method: 'delete'
  })
}

// 🌟 视频上传 (支持进度条回调)
export function uploadCourseVideo(data, onProgress) {
  return request({
    url: '/api/courses/video/upload', // 对应刚刚后端的接口
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: onProgress // 绑定进度事件
  })
}

// 🌟 文档/PPT上传 (支持进度条回调)
export function uploadCourseDocument(data, onProgress) {
  return request({
    url: '/api/courses/document/upload', // 一会儿后端要加这个接口
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: onProgress 
  })
}