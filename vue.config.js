const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,

   devServer: {
     port: 8086, // 开发服务器端口
      proxy: {
       '/api': {
         target: 'http://localhost:8080', // 目标服务器地址
         changeOrigin: true, // 是否改变源地址
         pathRewrite: {
           '^/api': '', // 重写路径
         },
       },
     }, 
  },
   
})
  