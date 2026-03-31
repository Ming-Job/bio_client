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
              {{ item.btnText || "进入模块" }}
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
          title: "生物信息科教一体化平台",
          description:
            "打破理论与实践的壁垒。在这里，你可以观看生信理论课程，并无缝跳转至在线工作台进行代码级实操演练。",
          image: "ceil01.webp",
          link: "/course",
          btnText: "进入课程中心",
        },
        {
          id: 2,
          title: "交互式分析工作台",
          description:
            "免去复杂的本地环境配置。系统内置 Python 运行环境，支持 AI 辅助生成代码，实现在线数据处理与可视化图表渲染。",
          image: "ceil02.webp",
          link: "/analysis",
          btnText: "打开工作台",
        },
        {
          id: 3,
          title: "真实科研案例复现",
          description:
            "收录转录组差异分析、大分子三维结构等经典教学案例。提供详尽的步骤解析，支持一键载入参数进行实战复现。",
          image: "struture01.jpg",
          link: "/case",
          btnText: "浏览案例广场",
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

.carousel-item::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(15, 23, 42, 0.9) 0%,
    rgba(15, 23, 42, 0.4) 100%
  );
}

.carousel-content {
  position: relative;
  z-index: 2;
  text-align: left;
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
  border-radius: 8px;
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
  .carousel-content {
    padding: 0 30px;
    text-align: center;
  }
  .glow-text {
    font-size: 2rem;
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
