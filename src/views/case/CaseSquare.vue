<template>
  <div class="matrix-wrapper">
    <div class="matrix-layout">
      <div class="page-header">
        <div class="header-content">
          <h1 class="glitch-title" data-text="Bio-OS 算子矩阵">
            Bio-OS 案例矩阵 (Case Matrix)
          </h1>
          <p class="subtitle">
            Explore & Execute. 探索标准生信工作流，一键克隆至对应计算引擎。
          </p>
        </div>
        <div class="header-search">
          <el-input
            placeholder="搜索 16S、分子对接、PCA..."
            v-model="searchQuery"
            class="dark-input"
            prefix-icon="el-icon-search"
          ></el-input>
        </div>
      </div>

      <div class="filter-tabs">
        <el-radio-group
          v-model="activeCategory"
          size="small"
          class="dark-radio-group"
        >
          <el-radio-button label="all">综合大厅 (All)</el-radio-button>
          <el-radio-button label="pipeline"
            ><i class="el-icon-guide"></i> 智能分析流</el-radio-button
          >
          <el-radio-button label="structure"
            ><i class="el-icon-discover"></i> 三维洞察</el-radio-button
          >
          <el-radio-button label="template"
            ><i class="el-icon-document-copy"></i> 零代码模板</el-radio-button
          >
          <el-radio-button label="copilot"
            ><i class="el-icon-cpu"></i> 极客副驾</el-radio-button
          >
        </el-radio-group>
      </div>

      <div class="case-grid">
        <div
          v-for="caseItem in filteredCases"
          :key="caseItem.id"
          class="case-card"
        >
          <div class="card-image-wrapper">
            <img
              :src="resolveImageUrl(caseItem.imageUrl)"
              :alt="caseItem.title"
              class="card-image"
            />
            <div class="image-overlay">
              <el-button
                type="primary"
                size="mini"
                icon="el-icon-view"
                circle
                class="preview-btn"
                @click="previewCase(caseItem)"
              ></el-button>
            </div>

            <div class="module-badge" :class="caseItem.category">
              {{ getCategoryName(caseItem.category) }}
            </div>
          </div>

          <div class="card-body">
            <div class="tags">
              <el-tag
                v-for="tag in caseItem.tags"
                :key="tag"
                size="mini"
                effect="dark"
                class="cyber-tag"
                >{{ tag }}</el-tag
              >
            </div>
            <h3 class="case-title">{{ caseItem.title }}</h3>
            <p class="case-desc">{{ caseItem.description }}</p>

            <div class="case-meta">
              <span class="dataset-info">
                <i class="el-icon-coin"></i> 数据集: {{ caseItem.dataset }}
              </span>
              <span class="views-info">
                <i class="el-icon-download"></i> {{ caseItem.forks }} Forks
              </span>
            </div>
          </div>

          <div class="card-footer">
            <el-button
              :type="getButtonType(caseItem.category)"
              size="small"
              class="fork-btn"
              :class="getButtonGlowClass(caseItem.category)"
              @click="dispatchToEngine(caseItem)"
              :icon="getButtonIcon(caseItem.category)"
            >
              {{ getButtonText(caseItem.category) }}
            </el-button>
          </div>
        </div>
      </div>

      <div v-if="filteredCases.length === 0" class="empty-state">
        <i class="el-icon-cpu"></i>
        <p>未检索到匹配的算子矩阵</p>
      </div>
    </div>
  </div>
</template>

<script>
import { getCaseList } from "@/api/case";
import { getImageUrl } from "@/utils/image";

export default {
  name: "CaseSquare",
  data() {
    return {
      searchQuery: "",
      activeCategory: "all",
      cases: [],
    };
  },
  computed: {
    filteredCases() {
      return this.cases.filter((c) => {
        const matchCategory =
          this.activeCategory === "all" || c.category === this.activeCategory;
        const matchSearch = c.title
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase());
        return matchCategory && matchSearch;
      });
    },
  },

  mounted() {
    this.fetchCases();
  },
  methods: {
    resolveImageUrl(url) {
      return getImageUrl(url);
    },
    async fetchCases() {
      try {
        const res = await getCaseList();
        console.log("【Debug】后端传来的原始包:", res); // 留个监控探针

        // 🌟 终极兼容解包逻辑：无论拦截器怎么剥洋葱，都能精准命中
        const responseData = res.success !== undefined ? res : res.data;

        if (responseData && responseData.success) {
          this.cases = responseData.data.map((item) => ({
            ...item,
            tags: item.tags ? item.tags.split(",") : [],
          }));
        } else {
          this.$message.error(responseData.message || "后端返回状态异常");
        }
      } catch (e) {
        console.error("加载案例失败", e);
        this.$message.error("网络异常，无法连接到 Bio-OS 核心节点");
      }
    },
    getCategoryName(cat) {
      const map = {
        pipeline: "智能分析流",
        structure: "三维洞察",
        template: "分析模板",
        copilot: "极客副驾",
      };
      return map[cat] || "未知组件";
    },
    getButtonText(cat) {
      const map = {
        pipeline: "载入分析流 (Load)",
        structure: "开启 3D 引擎 (View)",
        template: "应用此模板 (Use)",
        copilot: "提取至沙箱 (Fork)",
      };
      return map[cat] || "启动";
    },
    getButtonIcon(cat) {
      const map = {
        pipeline: "el-icon-guide",
        structure: "el-icon-discover",
        template: "el-icon-document-copy",
        copilot: "el-icon-cpu",
      };
      return map[cat] || "el-icon-right";
    },
    getButtonType(cat) {
      return cat === "structure"
        ? "primary"
        : cat === "template"
        ? "warning"
        : "success";
    },
    getButtonGlowClass(cat) {
      const map = {
        pipeline: "glow-btn-cyan",
        structure: "glow-btn-purple",
        template: "glow-btn-warning",
        copilot: "glow-btn-success",
      };
      return map[cat] || "";
    },
    previewCase(caseItem) {
      this.$router.push({
        name: "CaseDetail", // 👈 对应 router 里的 name
        params: { id: caseItem.id }, // 👈 这里的 id 对应 path: "case/:id"
      });
    },
    dispatchToEngine(caseItem) {
      this.$message.success(`算子 [${caseItem.title}] 提取成功...`);
      switch (caseItem.category) {
        case "copilot":
          this.$router.push({
            path: "/analysis-assistant",
            query: {
              fork_prompt: caseItem.prompt,
              fork_dataset: caseItem.dataset,
            },
          });
          break;
        case "pipeline":
          this.$router.push({
            path: "/pipeline",
            query: { load_pipeline_id: caseItem.id },
          });
          break;
        case "structure": // 🌟 修复点：3d -> structure
          this.$router.push({
            path: "/3d-viewer",
            query: { load_pdb: caseItem.dataset },
          });
          break;
        case "template":
          this.$router.push({
            path: "/template-tools",
            query: { use_template_id: caseItem.id },
          });
          break;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.matrix-wrapper {
  width: 100%;
  min-height: calc(100vh - 60px);
  background-color: #0b0f19;
  font-family: "Inter", -apple-system, sans-serif;
  color: #e2e8f0;
  padding-bottom: 40px;
}
.matrix-layout {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 30px;
  border-bottom: 1px solid #1f2937;
  padding-bottom: 20px;
  .header-content {
    .glitch-title {
      margin: 0 0 10px 0;
      font-size: 32px;
      font-weight: 800;
      color: #f8fafc;
      letter-spacing: 1px;
    }
    .subtitle {
      margin: 0;
      color: #64748b;
      font-size: 15px;
      font-family: Consolas, monospace;
    }
  }
  .header-search {
    width: 300px;
  }
}

.filter-tabs {
  margin-bottom: 30px;
}
.case-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.case-card {
  background: #111827;
  border-radius: 12px;
  border: 1px solid #1f2937;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
    border-color: #475569;
    .image-overlay {
      opacity: 1;
    }
    .card-image {
      transform: scale(1.05);
    }
  }

  .card-image-wrapper {
    position: relative;
    height: 180px;
    overflow: hidden;
    background: #000;
    .card-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
      opacity: 0.8;
    }
    .image-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(11, 15, 25, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
      .preview-btn {
        background: #1e293b;
        border: none;
        color: #fff;
        &:hover {
          background: #3b82f6;
          transform: scale(1.1);
        }
      }
    }

    /* 🌟 核心修复：这里不再使用 .3d 而是使用 .structure */
    .module-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 800;
      font-family: Consolas, monospace;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
      &.pipeline {
        background: rgba(6, 182, 212, 0.2);
        color: #22d3ee;
        border: 1px solid rgba(6, 182, 212, 0.4);
      }
      &.structure {
        background: rgba(139, 92, 246, 0.2);
        color: #a78bfa;
        border: 1px solid rgba(139, 92, 246, 0.4);
      }
      &.template {
        background: rgba(245, 158, 11, 0.2);
        color: #fbbf24;
        border: 1px solid rgba(245, 158, 11, 0.4);
      }
      &.copilot {
        background: rgba(16, 185, 129, 0.2);
        color: #34d399;
        border: 1px solid rgba(16, 185, 129, 0.4);
      }
    }
  }

  .card-body {
    padding: 20px;
    flex-grow: 1;
    .tags {
      margin-bottom: 12px;
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      .cyber-tag {
        background: #1e293b;
        border: 1px solid #334155;
        color: #94a3b8;
      }
    }
    .case-title {
      margin: 0 0 10px 0;
      font-size: 16px;
      font-weight: 600;
      color: #f8fafc;
      line-height: 1.4;
    }
    .case-desc {
      margin: 0 0 16px 0;
      font-size: 13px;
      color: #64748b;
      line-height: 1.6;
    }
    .case-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #475569;
      font-family: Consolas, monospace;
      margin-top: auto;
      .dataset-info {
        color: #60a5fa;
      }
    }
  }

  .card-footer {
    padding: 16px 20px;
    background: #0f172a;
    border-top: 1px solid #1f2937;
    .fork-btn {
      width: 100%;
      font-weight: 600;
      letter-spacing: 1px;
    }
  }
}

.empty-state {
  text-align: center;
  padding: 80px 0;
  i {
    font-size: 48px;
    color: #334155;
    margin-bottom: 16px;
  }
  p {
    color: #64748b;
    font-family: Consolas, monospace;
  }
}

::v-deep .dark-input .el-input__inner {
  background-color: #111827;
  border: 1px solid #334155;
  color: #f8fafc;
  border-radius: 8px;
  &:focus {
    border-color: #3b82f6;
  }
}
::v-deep .dark-radio-group .el-radio-button__inner {
  background: #111827;
  border-color: #334155;
  color: #94a3b8;
  border-left: 1px solid #334155;
}
::v-deep
  .dark-radio-group
  .el-radio-button__orig-radio:checked
  + .el-radio-button__inner {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
  box-shadow: -1px 0 0 0 #3b82f6;
}

::v-deep .glow-btn-cyan {
  background: linear-gradient(135deg, #06b6d4, #0891b2) !important;
  border: none !important;
  color: #fff;
  &:hover {
    box-shadow: 0 0 15px rgba(6, 182, 212, 0.4);
  }
}
::v-deep .glow-btn-purple {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed) !important;
  border: none !important;
  color: #fff;
  &:hover {
    box-shadow: 0 0 15px rgba(139, 92, 246, 0.4);
  }
}
::v-deep .glow-btn-warning {
  background: linear-gradient(135deg, #f59e0b, #d97706) !important;
  border: none !important;
  color: #fff;
  &:hover {
    box-shadow: 0 0 15px rgba(245, 158, 11, 0.4);
  }
}
::v-deep .glow-btn-success {
  background: linear-gradient(135deg, #10b981, #059669) !important;
  border: none !important;
  color: #fff;
  &:hover {
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
  }
}
</style>
