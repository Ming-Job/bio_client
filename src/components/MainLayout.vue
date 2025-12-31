<template>
  <div class="main-layout">
    <!-- 共用头部 -->
    <Header />
    <!-- 路由出口：渲染Home、CourseList等具体页面内容 -->
    <router-view class="content-wrapper" />
    <!-- 新增：给router-view添加class -->
    <!-- 共用底部 -->
    <Footer />
  </div>
</template>

<script>
import Header from "@/components/home/Header.vue";
import Footer from "@/components/home/Footer.vue";

export default {
  name: "MainLayout",
  components: {
    Header,
    Footer,
  },
};
</script>

<style>
body,
html,
#app {
  margin: 0;
  padding: 0;
  background: none !important;
  /* 可选：确保根节点无多余边距，避免布局干扰 */
  height: 100%;
}
</style>

<style scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: url("@/assets/carousel/backgroud.png") no-repeat center center
    fixed;
  background-size: cover;
  /* 新增：给布局容器添加内边距，避免底部内容被固定Footer遮挡 */
  padding-bottom: 60px; /* 数值等于Footer的高度，根据你的Footer调整 */
  box-sizing: border-box;
}

/* 固定Footer到视口底部 */
::v-deep footer {
  /* 若Footer有独立样式，可直接给Footer组件加class，无需::v-deep */
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 35px; /* 你的Footer高度，按需调整 */
  background-color: #2c3e50; /* 可选：给Footer加背景，避免遮挡页面内容 */
  z-index: 999; /* 确保Footer在最上层，不被其他内容遮挡 */
}

/* 响应式适配保留，无需额外修改 */
@media (max-width: 768px) {
  .main-layout {
    background-attachment: scroll;
  }
}
</style>
