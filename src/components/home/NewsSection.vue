<template>
  <div class="news-section">
    <div class="container">
      <div class="section-header">
        <div>
          <h2 class="section-title">平台动态 & 前沿视界</h2>
          <p class="section-subtitle">Release Notes & Bio-Tech News</p>
        </div>
        <el-button type="primary" plain round @click="goToAllNews">查看完整日志</el-button>
      </div>

      <div class="news-grid">
        <el-card
          v-for="(news, index) in newsList"
          :key="index"
          class="news-card"
          shadow="hover"
          @click.native="goToNews(news)"
        >
          <div class="news-image-wrapper">
            <img :src="news.image" class="news-image" alt="封面" />
            <div class="news-category-badge">{{ news.category }}</div>
          </div>
          <div class="news-content">
            <div class="news-meta">
              <span class="date"><i class="el-icon-time"></i> {{ news.date }}</span>
              <span class="author"><i class="el-icon-user"></i> {{ news.author }}</span>
            </div>
            <h3 class="news-title">{{ news.title }}</h3>
            <p class="news-desc">{{ news.description }}</p>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "NewsSection",
  data() {
    return {
 newsList: [
        {
          title: "Bio-OS v2.0 发布：支持沙箱隐式挂载技术",
          description: "底层架构大升级！现已支持用户无需修改代码路径，系统自动将云端数据集无缝挂载至 Docker 隔离执行区，大幅提升计算体验。",
          category: "Release Note",
          date: "2026-03-18",
          author: "架构组",
          image: "/sections/pic1.webp", 
          baiduUrl: "https://www.baidu.com/s?wd=Docker容器挂载技术",
        },
        {
          title: "AI 颠覆结构生物学：AlphaFold 3 开启新纪元",
          description: "最新模型已能高精度预测所有生命分子的结构，包括蛋白质、DNA、RNA及小分子配体。平台即将集成该预测流。",
          category: "前沿视界",
          date: "2026-03-15",
          author: "Nature速递",
          image: "/sections/pic2.webp", 
          baiduUrl: "https://www.baidu.com/s?wd=AlphaFold3",
        },
        {
          title: "实战指南：云端转录组差异分析最佳实践",
          description: "本期教程将带您使用 Bio-OS 极客沙箱，结合 Python Pandas 与 SciPy，完成从表达矩阵读取到火山图渲染的全套流程。",
          category: "极客教程",
          date: "2026-03-10",
          author: "应用支持",
          image: "/sections/pic3.webp", 
          baiduUrl: "https://www.baidu.com/s?wd=Python转录组差异分析",
        }
      ],
    };
  },
  methods: {
    goToNews(news) { window.open(news.baiduUrl, "_blank"); },
    goToAllNews() { window.open("https://www.baidu.com/s?wd=生信云平台", "_blank"); }
  }
};
</script>

<style scoped>
.news-section {
  padding: 80px 20px;
  background-color: #f9fafb;
}

.container { max-width: 1200px; margin: 0 auto; }

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 40px;
}

.section-title { font-size: 2.2rem; color: #111827; margin: 0 0 5px 0; font-weight: 700; }
.section-subtitle { color: #6b7280; font-family: Consolas, monospace; margin: 0;}

.news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
}

.news-card {
  border-radius: 12px;
  overflow: hidden;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.news-card:hover { transform: translateY(-6px); box-shadow: 0 15px 30px rgba(0,0,0,0.1); }

.news-image-wrapper {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.news-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.news-card:hover .news-image { transform: scale(1.05); }

.news-category-badge {
  position: absolute;
  top: 15px;
  left: 15px;
  background: rgba(17, 24, 39, 0.8);
  backdrop-filter: blur(4px);
  color: #fff;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-family: Consolas, monospace;
}

.news-content { padding: 24px; }
.news-meta { display: flex; gap: 15px; color: #9ca3af; font-size: 0.85rem; margin-bottom: 12px; }
.news-title { font-size: 1.2rem; color: #1f2937; margin: 0 0 12px 0; font-weight: 600; line-height: 1.4; }
.news-card:hover .news-title { color: #3b82f6; }
.news-desc { color: #6b7280; font-size: 0.95rem; line-height: 1.6; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>