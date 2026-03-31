<template>
  <div class="feature-cards">
    <div class="container">
      <div class="section-header-center">
        <h2 class="section-title">平台核心模块</h2>
      </div>
      <div class="cards-grid">
        <el-card
          v-for="(feature, index) in features"
          :key="index"
          class="feature-card"
          shadow="hover"
        >
          <div
            class="card-icon"
            :style="{
              backgroundColor: feature.color + '20',
              color: feature.color,
            }"
          >
            <i :class="feature.icon"></i>
          </div>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
          <el-button
            type="text"
            class="learn-more"
            :style="{ color: feature.color }"
            @click="$router.push(feature.link)"
          >
            进入模块 <i class="el-icon-right"></i>
          </el-button>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "FeatureCards",
  data() {
    return {
      features: [
        {
          title: "课程中心",
          description:
            "提供从生物学基础到生信进阶的系统性理论课程，为实操分析打下扎实基础。",
          icon: "el-icon-reading",
          color: "#3b82f6",
          link: "/course",
        },
        {
          title: "分析工作台",
          description:
            "提供 AI 辅助代码生成与在线 Python 执行环境，直接在网页端处理数据并输出图表。",
          icon: "el-icon-monitor",
          color: "#10b981",
          link: "/analysis",
        },
        {
          title: "案例广场",
          description:
            "精选生信标准分析案例，结合理论背景与真实参数，支持一键提取到工作台运行。",
          icon: "el-icon-discover",
          color: "#8b5cf6",
          link: "/case",
        },
        {
          title: "我的项目",
          description:
            "专属的课题管理空间。分类管理原始数据与分析产出文件，支持一键切入分析台。",
          icon: "el-icon-folder-opened",
          color: "#f59e0b",
          link: "/project",
        },
      ],
    };
  },
};
</script>

<style scoped>
.feature-cards {
  padding: 60px 20px;
  background-color: #ffffff;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-header-center {
  text-align: center;
  margin-bottom: 50px;
}

.section-title {
  font-size: 2.2rem;
  color: #111827;
  margin: 0 0 10px 0;
  font-weight: 700;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
}

.feature-card {
  text-align: left;
  padding: 20px 10px;
  transition: all 0.3s ease;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
  border-color: #e5e7eb;
}

.card-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  font-size: 28px;
}

.feature-card h3 {
  margin: 0 0 12px 0;
  color: #1f2937;
  font-size: 1.2rem;
  font-weight: 600;
}

.feature-card p {
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 20px;
  font-size: 0.95rem;
  flex-grow: 1; /* 让按钮沉底对齐 */
}

.learn-more {
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0;
  align-self: flex-start;
}
</style>
