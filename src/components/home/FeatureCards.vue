<template>
  <div class="feature-cards">
    <div class="container">
      <div class="section-header-center">
        <h2 class="section-title">核心引擎矩阵</h2>
        <p class="section-subtitle">Bio-OS Engine Matrix</p>
      </div>
      <div class="cards-grid">
        <el-card
          v-for="(feature, index) in features"
          :key="index"
          class="feature-card"
          shadow="hover"
        >
          <div class="card-icon" :style="{ backgroundColor: feature.color + '20', color: feature.color }">
            <i :class="feature.icon"></i>
          </div>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
          <el-button type="text" class="learn-more" :style="{ color: feature.color }"> 
            调用此引擎 <i class="el-icon-right"></i>
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
          title: "AI 代码沙箱环境",
          description: "内置 pandas, scipy 等生信常用库，支持 Python/R 脚本云端安全执行与动态可视化渲染。",
          icon: "el-icon-cpu",
          color: "#3b82f6", 
        },
        {
          title: "多组学空间 Workspace",
          description: "项目级的数据隔离体系，实时监控云存储余量与算力任务调度状态，科研资产井井有条。",
          icon: "el-icon-folder-opened",
          color: "#10b981", 
        },
        {
          title: "生信案例矩阵库",
          description: "提供从转录组、16S到虚拟药物筛选的黄金数据集与标准分析协议，一键克隆复现。",
          icon: "el-icon-connection",
          color: "#8b5cf6", 
        },
        {
          title: "3D 空间结构引擎",
          description: "原生支持 PDB 等分子格式，提供配体-受体对接结果的 360 度沉浸式预览与交互。",
          icon: "el-icon-view",
          color: "#f59e0b", 
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

.container { max-width: 1200px; margin: 0 auto; }

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

.section-subtitle {
  color: #6b7280;
  font-family: Consolas, monospace;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.cards-grid {
  display: grid;
  /* 保证宽屏下 4 个卡片一行 */
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
}

.feature-card {
  text-align: left;
  padding: 20px 10px;
  transition: all 0.3s ease;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.06);
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
  min-height: 70px;
}

.learn-more {
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0;
}
</style>