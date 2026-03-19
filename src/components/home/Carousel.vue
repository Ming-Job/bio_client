<template>
  <div class="carousel-container">
    <el-carousel height="420px" indicator-position="outside" :interval="6000">
      <el-carousel-item v-for="(item, index) in carouselItems" :key="index">
        <div
          class="carousel-item"
          :style="{ backgroundImage: `url(${getImageUrl(item.image)})` }"
        >
          <div class="carousel-content">
            <h2 class="glow-text">{{ item.title }}</h2>
            <p class="cyber-desc">{{ item.description }}</p>
            <el-button
              type="primary"
              size="medium"
              class="cyber-btn"
              @click="handleLearnMore(item)"
            >
              {{ item.btnText || '了解更多' }}
            </el-button>
          </div>
        </div>
      </el-carousel-item>
    </el-carousel>
  </div>
</template>

<script>
export default {
  name: "CarouselPage",
  data() {
    return {
      carouselItems: [
        {
          id: 1,
          title: "Bio-OS 云原生算力沙箱",
          description: "告别繁琐环境配置。一键分配 Python/R 隔离容器，千兆带宽静默挂载云端数据集，随时随地开启极客推演。",
          image: "ceil01.webp",
          link: "/analysis",
          btnText: "启动算力节点"
        },
        {
          id: 2,
          title: "AI 极客副驾 (Copilot)",
          description: "由硅基流动驱动。通过自然语言对话，自动生成并执行 Pandas 分析与可视化代码，让 AI 成为你的专属生信工程师。",
          image: "ceil02.webp",
          link: "/assistant",
          btnText: "唤醒副驾"
        },
        {
          id: 3,
          title: "3D 分子与组学管线矩阵",
          description: "内置 3D-Mol 空间引擎与零代码工作流。从虚拟筛选到转录组差异分析，科研成果触手可及。",
          image: "struture01.jpg",
          link: "/case",
          btnText: "进入控制台"
        },
      ],
    };
  },
  methods: {
    getImageUrl(imageName) {
      if (process.env.NODE_ENV === "development") {
        return require(`@/assets/carousel/${imageName}`);
      } else {
        return `/img/${imageName}`;
      }
    },
    handleLearnMore(item) {
      if (item.link) this.$router.push(item.link);
    },
    preloadImages() {
      this.carouselItems.forEach((item) => {
        const img = new Image();
        img.src = this.getImageUrl(item.image);
      });
    },
  },
  mounted() {
    this.preloadImages();
  },
};
</script>

<style scoped>
.carousel-container {
  max-width: 1200px;
  margin: 40px auto 40px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  background-color: #111827;
}

.carousel-item {
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* 加深遮罩，让文字更清晰 */
.carousel-item::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.4) 100%);
}

.carousel-content {
  position: relative;
  z-index: 2;
  text-align: left; /* 改为左对齐，更具大厂控制台风格 */
  width: 100%;
  padding: 0 80px;
  max-width: 1000px;
}

.glow-text {
  font-size: 2.8rem;
  margin-bottom: 20px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 1px;
  text-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
  animation: fadeInDown 0.8s ease;
}

.cyber-desc {
  font-size: 1.15rem;
  margin-bottom: 35px;
  line-height: 1.8;
  color: #e2e8f0;
  max-width: 600px;
  animation: fadeInUp 0.8s ease 0.3s both;
}

.cyber-btn {
  animation: fadeIn 0.8s ease 0.6s both;
  padding: 12px 32px;
  font-size: 1.05rem;
  font-weight: bold;
  border-radius: 8px; /* 方形圆角更具科技感 */
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
  transition: all 0.3s ease;
}

.cyber-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
}

@media (max-width: 768px) {
  .carousel-content { padding: 0 30px; text-align: center; }
  .glow-text { font-size: 2rem; }
}

@keyframes fadeInDown { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>