<template>
  <div class="home">
    <Header />
    <main>
      <Carousel />
      <FeatureCards />
      <NewsSection />
      <ResourceGrid />
    </main>
    <Footer />
  </div>
</template>

<script>
import Header from "@/components/home/Header.vue";
import Carousel from "@/components/home/Carousel.vue";
import FeatureCards from "@/components/home/FeatureCards.vue";
import NewsSection from "@/components/home/NewsSection.vue";
import ResourceGrid from "@/components/home/ResourceGrid.vue";
import Footer from "@/components/home/Footer.vue";

export default {
  name: "HomePage",
  components: {
    Header,
    Carousel,
    FeatureCards,
    NewsSection,
    ResourceGrid,
    Footer,
  },
};
</script>

<!-- 全局样式：重置根节点背景，确保图片能铺满 -->
<style>
/* 重置全局背景，避免遮挡 */
body,
html,
#app {
  margin: 0;
  padding: 0;
  background: none !important;
}
</style>

<style scoped>
/* 核心：背景图片配置 + 高级感优化 */
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  /* 背景图片核心属性（替换成你的图片路径） */
  background: url("@/assets/carousel/backgroud.png") no-repeat center center
    fixed;
  /* 图片自适应铺满，不拉伸变形 */
  background-size: cover;
}

/* 主内容区：置于蒙版上层，确保内容清晰 */
main {
  flex: 1;
  padding: 0;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  z-index: 1;

  > * + * {
    margin-top: clamp(2.5rem, 5vw, 4rem);
  }
}

/* 响应式适配 */
@media (max-width: 768px) {
  main {
    padding: 0 16px;

    > * + * {
      margin-top: clamp(1.5rem, 4vw, 2.5rem);
    }
  }
  /* 移动端优化背景图片显示 */
  .home {
    background-attachment: scroll; /* 取消固定，避免移动端变形 */
  }
}
</style>
