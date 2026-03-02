import request from '@/api/request' // 引入你封装好的 request 实例获取 baseURL

/**
 * 统一处理图片真实完整的 URL
 * @param {String} url 数据库中存储的相对路径
 * @returns {String} 完整的 http 图片地址
 */
export function getImageUrl(url) {
  // 1. 空值处理，返回空字符串触发 Element-UI 的 error 占位图
  if (!url) {
    return ''
  }
  
  // 2. 如果已经是完整的网络图片链接（比如外部图床），直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // 3. 动态获取你 request.js 中配置的 baseURL
  const baseUrl = request.defaults.baseURL || 'http://localhost:8080'
  
  // 4. 拼接逻辑
  // 注意：根据你的 WebConfig，你的文件放在 /uploads 目录下
  if (url.startsWith('/')) {
    return baseUrl + '/uploads' + url
  } else {
    return baseUrl + '/uploads/' + url
  }
}