// vue.config.js
const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8086,
    open: true, // 自动打开浏览器
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        pathRewrite: {
          '^/api': '/api'
        },
        // 解决跨域
        onProxyReq: (proxyReq, req, res) => {
          // 移除origin头，避免CORS问题
          proxyReq.removeHeader('origin')
        }
      }
    },
    // 允许所有host访问
    allowedHosts: 'all'
  }
})