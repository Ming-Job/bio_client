<template>
  <div class="latest-cases-section">
    <div class="container">
      <div class="section-header">
        <div>
          <h2 class="section-title">收录案例</h2>
        </div>
        <el-button type="primary" plain round @click="$router.push('/case')">
          前往案例广场 <i class="el-icon-right"></i>
        </el-button>
      </div>

      <div
        v-if="cases.length > 0"
        class="cases-grid"
        v-loading="loading"
        element-loading-background="transparent"
      >
        <el-card
          v-for="(item, index) in cases"
          :key="index"
          class="case-card"
          shadow="hover"
          @click.native="goToCaseDetail(item.id)"
        >
          <div class="case-image-wrapper">
            <img
              :src="
                resolveImageUrl(item.imageUrl || item.image_url || item.image)
              "
              class="case-image"
              alt="案例封面"
              @error="handleImageError"
            />
            <div class="case-category-badge">
              {{ getCategoryName(item.category) }}
            </div>
          </div>
          <div class="case-content">
            <div class="case-meta">
              <span class="date">
                <i class="el-icon-time"></i>
                {{
                  formatDate(item.createTime || item.create_time || item.date)
                }}
              </span>
              <span class="difficulty" :class="item.difficulty">
                <i class="el-icon-data-line"></i>
                {{ getDifficultyName(item.difficulty) }}
              </span>
            </div>
            <h3 class="case-title">{{ item.title }}</h3>
            <p class="case-desc">{{ item.description }}</p>
          </div>
        </el-card>
      </div>

      <div v-else-if="!loading && cases.length === 0" class="empty-state">
        <i class="el-icon-document-delete"></i>
        <p>系统暂未收录案例</p>
      </div>

      <div v-else class="loading-state">
        <i class="el-icon-loading"></i>
        <p>正在同步云端数据...</p>
      </div>
    </div>
  </div>
</template>

<script>
import { getCaseList } from "@/api/case";
import { getImageUrl } from "@/utils/image";

export default {
  name: "LatestCases",
  data() {
    return {
      loading: true,
      cases: [],
    };
  },
  mounted() {
    this.fetchLatestCases();
  },
  methods: {
    resolveImageUrl(url) {
      if (!url) return "";
      return getImageUrl(url);
    },

    handleImageError(event) {
      // 🌟 换成了亮色背景 (#f3f4f6) 和深色字体 (#9ca3af) 的占位图
      event.target.src =
        "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJDb25zb2xhcywgbW9ub3NwYWNlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOWNhM2FmIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbWFnZSBOb3QgRm91bmQ8L3RleHQ+PC9zdmc+";
    },

    async fetchLatestCases() {
      this.loading = true;
      try {
        const res = await getCaseList();
        const responseData = res.success !== undefined ? res : res.data;

        if (
          responseData &&
          responseData.success &&
          responseData.data &&
          responseData.data.length > 0
        ) {
          let sortedCases = responseData.data.sort((a, b) => {
            const timeA = new Date(
              a.createTime || a.create_time || 0,
            ).getTime();
            const timeB = new Date(
              b.createTime || b.create_time || 0,
            ).getTime();
            return timeB - timeA;
          });
          this.cases = sortedCases.slice(0, 3);
        } else {
          this.cases = [];
        }
      } catch (e) {
        console.error("拉取真实案例列表失败:", e);
        this.cases = [];
      } finally {
        this.loading = false;
      }
    },

    goToCaseDetail(id) {
      if (!id) return;
      this.$router.push({ name: "CaseDetail", params: { id: id } });
    },

    formatDate(dateStr) {
      if (!dateStr) return "-";
      return dateStr.substring(0, 10);
    },

    getCategoryName(cat) {
      const map = {
        pipeline: "标准分析流",
        structure: "三维结构",
        copilot: "代码辅助",
      };
      return map[cat] || "热门实战";
    },

    getDifficultyName(diff) {
      const map = { easy: "入门", medium: "进阶", hard: "挑战" };
      return map[diff] || "通用";
    },
  },
};
</script>

<style scoped>
/* 背景切换为极浅灰色，与纯白卡片形成层次感 */
.latest-cases-section {
  padding: 80px 20px;
  background-color: #f9fafb;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 40px;
}

.section-title {
  font-size: 2.2rem;
  color: #111827; /* 深色标题 */
  margin: 0 0 5px 0;
  font-weight: 700;
}

.cases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
}

.case-card {
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff; /* 纯白卡片 */
  border: 1px solid #f3f4f6; /* 极浅色边框 */
  cursor: pointer;
  transition: all 0.3s ease;
}

.case-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.08); /* 柔和的浅色阴影 */
}

.case-image-wrapper {
  position: relative;
  height: 200px;
  overflow: hidden;
  background: #f3f4f6;
}

.case-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
  opacity: 1; /* 移除暗黑风的透明度压暗 */
}

.case-card:hover .case-image {
  transform: scale(1.05);
}

.case-category-badge {
  position: absolute;
  top: 15px;
  left: 15px;
  background: rgba(17, 24, 39, 0.8);
  backdrop-filter: blur(4px);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-family: Consolas, monospace;
  font-weight: bold;
  color: #ffffff;
}

.case-content {
  padding: 24px;
}

.case-meta {
  display: flex;
  justify-content: space-between;
  color: #9ca3af;
  font-size: 0.85rem;
  margin-bottom: 12px;
  font-family: Consolas, monospace;
}

.difficulty {
  padding: 2px 8px;
  border-radius: 4px;
  background: #f3f4f6;
}
.difficulty.easy {
  color: #10b981;
}
.difficulty.medium {
  color: #f59e0b;
}
.difficulty.hard {
  color: #ef4444;
}

.case-title {
  font-size: 1.15rem;
  color: #1f2937; /* 深灰标题 */
  margin: 0 0 12px 0;
  font-weight: 600;
  line-height: 1.4;
  transition: color 0.3s;
}
.case-card:hover .case-title {
  color: #3b82f6; /* Hover 时变蓝 */
}

.case-desc {
  color: #6b7280; /* 灰色正文 */
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 空状态和加载状态的亮色样式 */
.empty-state,
.loading-state {
  text-align: center;
  padding: 80px 0;
  color: #6b7280;
  background: #ffffff;
  border-radius: 12px;
  border: 1px dashed #d1d5db;
}
.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  color: #d1d5db;
}
.loading-state i {
  font-size: 40px;
  margin-bottom: 16px;
  color: #3b82f6;
  animation: spin 1.5s linear infinite;
}
.empty-state p,
.loading-state p {
  font-family: Consolas, monospace;
  margin: 0;
  font-size: 14px;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
