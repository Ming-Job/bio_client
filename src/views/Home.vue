<template>
  <main>
    <Carousel />
    <FeatureCards />
    <NewsSection />
    <ResourceGrid />
  </main>
</template>

<script>
import Carousel from "@/components/home/Carousel.vue";
import FeatureCards from "@/components/home/FeatureCards.vue";
import NewsSection from "@/components/home/NewsSection.vue";
import ResourceGrid from "@/components/home/ResourceGrid.vue";

export default {
  name: "HomePage",
  components: {
    Carousel,
    FeatureCards,
    NewsSection,
    ResourceGrid,
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
/* 保留原main的样式，无需再保留.home和全局样式 */
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

/* 响应式适配保留 */
@media (max-width: 768px) {
  main {
    padding: 0 16px;

    > * + * {
      margin-top: clamp(1.5rem, 4vw, 2.5rem);
    }
  }
}
</style>
