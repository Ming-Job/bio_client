<template>
  <div class="news-section">
    <div class="container">
      <div class="section-header">
        <h2 class="section-title">最新动态</h2>
        <el-button type="text" @click="goToAllNews">查看更多 →</el-button>
      </div>

      <div class="news-grid">
        <el-card
          v-for="(news, index) in newsList"
          :key="index"
          class="news-card"
          shadow="hover"
          @click.native="goToNews(news)"
          style="cursor: pointer"
        >
          <img :src="news.image" class="news-image" alt="新闻图片" />
          <div class="news-content">
            <div class="news-meta">
              <span class="category">{{ news.category }}</span>
              <span class="date">{{ news.date }}</span>
            </div>
            <h3 class="news-title">{{ news.title }}</h3>
            <p class="news-desc">{{ news.description }}</p>
            <div class="news-footer">
              <span class="author">作者: {{ news.author }}</span>
              <el-button type="text" size="small" @click.stop="goToNews(news)">
                阅读全文
              </el-button>
            </div>
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
          title: "新物种发现：亚马逊雨林的神秘蜘蛛",
          description:
            "科学家在亚马逊雨林深处发现了一种全新的蜘蛛物种，其独特的织网行为令人惊叹。",
          category: "新发现",
          date: "2024-01-15",
          author: "李教授",
          image: require("@/assets/images/news/zhizhu.webp"),
          // 百度搜索链接 - 使用新闻标题作为关键词
          baiduUrl: "https://www.baidu.com/s?wd=新物种发现亚马逊雨林神秘蜘蛛",
        },
        {
          title: "基因编辑技术新突破",
          description:
            "最新研究改进了CRISPR技术，提高了基因编辑的精确度和安全性。",
          category: "科研进展",
          date: "2024-01-14",
          author: "王博士",
          image: require("@/assets/images/news/jiyin.webp"),
          baiduUrl: "https://www.baidu.com/s?wd=基因编辑技术新突破CRISPR",
        },
        {
          title: "全球生物多样性保护大会召开",
          description:
            "各国代表齐聚一堂，共同商讨生物多样性保护策略与行动计划。",
          category: "会议报道",
          date: "2024-01-13",
          author: "张记者",
          image: require("@/assets/images/news/duoyangxing.jpg"),
          baiduUrl: "https://www.baidu.com/s?wd=全球生物多样性保护大会",
        },
        // 可以继续添加更多新闻
        {
          title: "海洋保护新举措",
          description: "联合国通过新决议，加强全球海洋生态保护力度。",
          category: "环境保护",
          date: "2024-01-12",
          author: "陈研究员",
          image: require("@/assets/images/news/haiyang.webp"), // 这里可以使用其他图片
          baiduUrl: "https://www.baidu.com/s?wd=海洋保护新举措联合国决议",
        },
        {
          title: "人工智能助力生物研究",
          description: "AI技术应用于蛋白质结构预测，加速新药研发进程。",
          category: "技术应用",
          date: "2024-01-11",
          author: "赵工程师",
          image: require("@/assets/images/news/ai.webp"), // 这里可以使用其他图片
          baiduUrl: "https://www.baidu.com/s?wd=人工智能生物研究蛋白质结构预测",
        },
        {
          title: "气候变化对生物多样性的影响",
          description: "最新研究报告揭示全球变暖对物种分布的深远影响。",
          category: "研究报告",
          date: "2024-01-10",
          author: "刘博士",
          image: require("@/assets/images/news/qihou.png"), // 这里可以使用其他图片
          baiduUrl: "https://www.baidu.com/s?wd=气候变化生物多样性影响",
        },
      ],
    };
  },
  methods: {
    // 跳转到新闻对应的百度页面
    goToNews(news) {
      if (news.baiduUrl) {
        // 在新窗口打开百度搜索页面
        window.open(news.baiduUrl, "_blank");
      } else {
        // 如果没有指定链接，使用标题作为关键词搜索
        const searchQuery = encodeURIComponent(news.title);
        window.open(`https://www.baidu.com/s?wd=${searchQuery}`, "_blank");
      }
    },

    // 查看更多新闻（跳转到百度新闻搜索）
    goToAllNews() {
      // 跳转到百度新闻的生物科技相关新闻
      window.open(
        "https://www.baidu.com/s?wd=生物科技最新动态&tn=news",
        "_blank"
      );
    },

    // 生成百度搜索链接（辅助方法）
    generateBaiduUrl(keyword) {
      const encodedKeyword = encodeURIComponent(keyword);
      return `https://www.baidu.com/s?wd=${encodedKeyword}`;
    },
  },
  mounted() {
    // 如果没有为新闻设置百度链接，自动生成
    this.newsList = this.newsList.map((news) => {
      if (!news.baiduUrl) {
        return {
          ...news,
          baiduUrl: this.generateBaiduUrl(news.title),
        };
      }
      return news;
    });
  },
};
</script>

<style scoped>
.news-section {
  border-radius: 10px;
  padding: 60px 20px;
  background-color: #f9f9f9;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.section-title {
  font-size: 2rem;
  color: #333;
  position: relative;
  padding-bottom: 10px;
}

.section-title::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 60px;
  height: 3px;
  background-color: #4caf50;
}

.section-header .el-button {
  color: #4caf50;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.section-header .el-button:hover {
  color: #3d8b40;
  transform: translateX(5px);
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
}

.news-card {
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: none;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.news-card:hover {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  transform: translateY(-5px);
}

.news-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.news-card:hover .news-image {
  transform: scale(1.05);
}

.news-content {
  padding: 20px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.news-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  align-items: center;
}

.category {
  background-color: #4caf50;
  color: white;
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 0.9rem;
  font-weight: 500;
}

.date {
  color: #999;
  font-size: 0.9rem;
}

.news-title {
  font-size: 1.2rem;
  margin-bottom: 10px;
  color: #333;
  line-height: 1.4;
  font-weight: 600;
  transition: color 0.3s ease;
}

.news-card:hover .news-title {
  color: #4caf50;
}

.news-desc {
  color: #666;
  line-height: 1.6;
  margin-bottom: 15px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex-grow: 1;
}

.news-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.author {
  color: #888;
  font-size: 0.9rem;
}

.news-footer .el-button {
  color: #4caf50;
  transition: all 0.3s ease;
}

.news-footer .el-button:hover {
  color: #3d8b40;
  transform: translateX(5px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .news-section {
    padding: 40px 15px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 30px;
  }

  .section-title {
    margin-bottom: 15px;
  }

  .news-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .news-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
