// /src/api/request.js
import axios from 'axios'
import { Message } from 'element-ui'
import router from '@/router'
import Cookies from 'js-cookie'

// 创建axios实例 - 直接设置基础URL
const service = axios.create({
  baseURL: 'http://localhost:8080', // 直接写死你的后端地址
  timeout: 10000 // 请求超时时间
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 在请求发送之前做一些处理
    const token = Cookies.get('token')
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token
    }
    
    // 添加自定义请求头
    config.headers['Content-Type'] = 'application/json;charset=UTF-8'
    
    return config
  },
  error => {
    console.error('请求发送失败:', error)
    Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    return response.data // 直接返回数据
  },
  error => {
    console.error('响应错误:', error)
    
    // 处理网络错误
    if (!error.response) {
      Message({
        message: '网络连接失败，请检查网络设置',
        type: 'error',
        duration: 5 * 1000
      })
      return Promise.reject(error)
    }
    
    const { status, data } = error.response
    
    // 根据HTTP状态码处理
    let errorMessage = '请求失败'
    if (data && data.message) {
      errorMessage = data.message
    }
    
    switch (status) {
      case 400:
        Message({
          message: errorMessage,
          type: 'error'
        })
        break
      case 401:
        Message({
          message: '登录已过期，请重新登录',
          type: 'warning'
        })
        Cookies.remove('token')
        router.push('/login')
        break
      case 403:
        Message({
          message: '没有权限访问此资源',
          type: 'error'
        })
        break
      case 404:
        Message({
          message: '请求的资源不存在',
          type: 'error'
        })
        break
      case 500:
        Message({
          message: '服务器内部错误',
          type: 'error'
        })
        break
      default:
        Message({
          message: errorMessage,
          type: 'error'
        })
    }
    
    return Promise.reject(error)
  }
)

export default service