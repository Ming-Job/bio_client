<template>
  <div class="carousel-container">
    <el-carousel height="400px" indicator-position="outside" :interval="5000">
      <el-carousel-item v-for="(item, index) in carouselItems" :key="index">
        <div
          class="carousel-item"
          :style="{ backgroundImage: `url(${getImageUrl(item.image)})` }"
        >
          <div class="carousel-content">
            <h2>{{ item.title }}</h2>
            <p>{{ item.description }}</p>
            <el-button
              type="primary"
              size="medium"
              @click="handleLearnMore(item)"
            >
              了解更多
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
          title: "探索生命奥秘",
          description: "从微观细胞到宏观生态系统，全方位了解生命科学",
          image: "ceil01.webp",
          link: "/category/biodiversity",
        },
        {
          id: 2,
          title: "基因科技前沿",
          description: "CRISPR基因编辑、合成生物学等最新研究成果",
          image: "ceil02.webp",
          link: "/category/gene-tech",
        },
        {
          id: 3,
          title: "生态保护行动",
          description: "保护生物多样性，共建和谐生态环境",
          image: "struture01.jpg",
          link: "/category/ecology",
        },
      ],
    };
  },
  methods: {
    // 获取图片路径的正确方法
    getImageUrl(imageName) {
      // 在 Vue 中处理静态资源路径
      if (process.env.NODE_ENV === "development") {
        // 开发环境
        return require(`@/assets/carousel/${imageName}`);
      } else {
        // 生产环境
        return `/img/${imageName}`;
      }
    },

    handleLearnMore(item) {
      // 根据 item 的 link 属性进行路由跳转
      if (item.link) {
        this.$router.push(item.link);
      }
    },
    preloadImages() {
      this.carouselItems.forEach((item) => {
        const img = new Image();
        img.src = this.getImageUrl(item.image);
      });
    },
  },
  mounted() {
    // 组件挂载后可以预加载图片
    this.preloadImages();
  },
};
</script>

<style scoped>
.carousel-container {
  max-width: 1200px;
  margin: 40px auto 40px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  background-color: #f5f5f5;
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
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.3));
}

.carousel-content {
  position: relative;
  z-index: 2;
  text-align: center;
  color: white;
  padding: 40px;
  max-width: 800px;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
}

.carousel-content h2 {
  font-size: 2.5rem;
  margin-bottom: 20px;
  font-weight: bold;
  animation: fadeInDown 0.8s ease;
}

.carousel-content p {
  font-size: 1.2rem;
  margin-bottom: 30px;
  line-height: 1.6;
  opacity: 0.9;
  animation: fadeInUp 0.8s ease 0.3s both;
}

.carousel-content .el-button {
  animation: fadeIn 0.8s ease 0.6s both;
  padding: 12px 36px;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 25px;
  background-color: #4caf50;
  border-color: #4caf50;
  transition: all 0.3s ease;
}

.carousel-content .el-button:hover {
  background-color: #3d8b40;
  border-color: #3d8b40;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .carousel-container {
    margin: 0 10px 30px;
    height: 300px;
  }

  .carousel-content {
    padding: 20px;
  }

  .carousel-content h2 {
    font-size: 1.8rem;
  }

  .carousel-content p {
    font-size: 1rem;
  }

  .carousel-content .el-button {
    padding: 10px 24px;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .carousel-container {
    height: 250px;
  }

  .carousel-content h2 {
    font-size: 1.5rem;
    margin-bottom: 15px;
  }

  .carousel-content p {
    font-size: 0.9rem;
    margin-bottom: 20px;
  }
}

/* 动画效果 */
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

/* 增强轮播指示器样式 */
.el-carousel__indicators {
  bottom: -40px;
}

.el-carousel__indicator {
  padding: 8px;
}

.el-carousel__button {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #ccc;
  transition: all 0.3s ease;
}

.el-carousel__indicator.is-active .el-carousel__button {
  background-color: #4caf50;
  width: 30px;
  border-radius: 15px;
}

/* 添加悬停效果 */
.el-carousel__arrow:hover {
  background-color: rgba(76, 175, 80, 0.8);
}
</style>
