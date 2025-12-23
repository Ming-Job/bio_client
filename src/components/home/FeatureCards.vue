<template>
  <div class="feature-cards">
    <div class="container">
      <h2 class="section-title">平台特色功能</h2>
      <div class="cards-grid">
        <el-card
          v-for="(feature, index) in features"
          :key="index"
          class="feature-card"
          shadow="hover"
        >
          <div class="card-icon" :style="{ backgroundColor: feature.color }">
            <i :class="feature.icon" style="font-size: 32px; color: white"></i>
          </div>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
          <el-button type="text" class="learn-more"> 探索更多 → </el-button>
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
          title: "3D生物模型",
          description: "交互式3D生物模型，360度观察生物结构",
          icon: "el-icon-view",
          color: "#4CAF50",
        },
        {
          title: "虚拟实验室",
          description: "在线模拟实验，安全便捷的实验体验",
          icon: "el-icon-set-up",
          color: "#2196F3",
        },
        {
          title: "知识图谱",
          description: "可视化知识关联，系统学习生物学知识",
          icon: "el-icon-connection",
          color: "#9C27B0",
        },
        {
          title: "专家讲座",
          description: "生物学领域专家在线讲座与答疑",
          icon: "el-icon-microphone",
          color: "#FF9800",
        },
      ],
    };
  },
};
</script>

<style scoped>
.feature-cards {
  border-radius: 10px;
  padding: 40px 20px;
  background-color: #f9f9f9;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  text-align: center;
  margin-bottom: 40px;
  font-size: 2rem;
  color: #333;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
}

.feature-card {
  text-align: center;
  padding: 30px 20px;
  transition: transform 0.3s ease;
  border-radius: 10px;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.card-icon {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.feature-card h3 {
  margin: 15px 0 10px;
  color: #333;
  font-size: 1.3rem;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 20px;
  min-height: 60px;
}

.learn-more {
  color: #4caf50;
  font-weight: bold;
}
</style>
