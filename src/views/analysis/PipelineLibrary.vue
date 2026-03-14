<template>
  <div class="pipeline-library">
    <div class="library-header">
      <el-page-header
        @back="goBack"
        content="云端分析流模板库 (Pipeline Library)"
        class="dark-page-header"
      ></el-page-header>

      <div class="header-actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索 Pipeline 名称或关键字..."
          prefix-icon="el-icon-search"
          clearable
          class="dark-search-input"
        ></el-input>
      </div>
    </div>

    <div class="filter-section">
      <el-radio-group
        v-model="activeCategory"
        size="medium"
        class="dark-radio-group"
      >
        <el-radio-button label="all">全部领域</el-radio-button>
        <el-radio-button label="genomics">基因组学 (Genomics)</el-radio-button>
        <el-radio-button label="transcriptomics"
          >转录组学 (Transcriptomics)</el-radio-button
        >
        <el-radio-button label="proteomics">蛋白质组/分子对接</el-radio-button>
      </el-radio-group>
    </div>

    <div v-if="loading" class="pipeline-grid">
      <el-skeleton v-for="i in 6" :key="i" animated class="skeleton-card">
        <template slot="template">
          <el-skeleton-item variant="rect" style="height: 120px" />
          <div style="padding: 14px">
            <el-skeleton-item variant="h3" style="width: 50%" />
            <div style="margin-top: 10px; height: 40px">
              <el-skeleton-item variant="text" style="margin-bottom: 5px" />
              <el-skeleton-item variant="text" style="width: 80%" />
            </div>
          </div>
        </template>
      </el-skeleton>
    </div>

    <div v-else class="pipeline-grid">
      <div v-for="tpl in filteredPipelines" :key="tpl.id" class="pipeline-card">
        <div class="card-header">
          <div class="icon-box" :style="{ background: tpl.color || '#3b82f6' }">
            <i :class="tpl.icon || 'el-icon-data-analysis'"></i>
          </div>
          <el-tag
            size="mini"
            effect="dark"
            :type="tpl.isActive ? 'success' : 'info'"
          >
            {{ tpl.isActive ? "v2.1.0 稳定" : "维护中" }}
          </el-tag>
        </div>

        <div class="card-body">
          <h3 class="pipeline-name">{{ tpl.name }}</h3>
          <p class="pipeline-desc">
            {{
              tpl.description || "官方预置的标准生信分析流程，支持分布式加速。"
            }}
          </p>

          <div class="pipeline-tags">
            <el-tag size="mini" type="info" effect="plain" v-if="tpl.category"
              ># {{ tpl.category }}</el-tag
            >
            <el-tag size="mini" type="info" effect="plain"
              ><i class="el-icon-time"></i> ~45 Min</el-tag
            >
          </div>
        </div>

        <div class="card-footer">
          <div class="author-info">
            <i class="el-icon-user-solid"></i> Bio-OS 官方
          </div>
          <el-button
            type="primary"
            size="small"
            class="use-btn"
            :disabled="!tpl.isActive"
            @click="usePipeline(tpl)"
          >
            去工作台使用 <i class="el-icon-right"></i>
          </el-button>
        </div>
      </div>

      <div v-if="filteredPipelines.length === 0" class="empty-state">
        <el-empty
          description="未找到匹配的分析流程"
          :image-size="100"
        ></el-empty>
      </div>
    </div>
  </div>
</template>

<script>
import { getPipelines } from "@/api/analysis";

export default {
  name: "PipelineLibrary",
  data() {
    return {
      loading: true,
      searchQuery: "",
      activeCategory: "all",
      pipelines: [],
    };
  },
  computed: {
    filteredPipelines() {
      return this.pipelines.filter((p) => {
        // 1. 搜索词匹配
        const matchQuery =
          p.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          (p.description &&
            p.description
              .toLowerCase()
              .includes(this.searchQuery.toLowerCase()));

        // 2. 分类匹配 (模拟逻辑：如果你的后端没有返回 category，这里默认全展示)
        const matchCategory =
          this.activeCategory === "all" || p.category === this.activeCategory;

        return matchQuery && matchCategory;
      });
    },
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    goBack() {
      this.$router.push("/analysis");
    },
    async fetchData() {
      this.loading = true;
      try {
        const res = await getPipelines();
        if (res && res.data) {
          // 兼容 axios 的响应结构
          this.pipelines = res.data.data || res.data;

          // 如果后端数据没有 category 字段，我们给它模拟分配一下以便测试筛选功能
          this.pipelines = this.pipelines.map((p, index) => ({
            ...p,
            isActive: p.isActive !== 0,
            category:
              p.category || (index % 2 === 0 ? "genomics" : "transcriptomics"),
          }));
        }
      } catch (error) {
        this.$message.error("获取流程模板失败！");
      } finally {
        this.loading = false;
      }
    },
    // 🌟 核心跳转：带上选中的模板 ID 回到主页面！
    usePipeline(tpl) {
      this.$message.success(`已选定流程: ${tpl.name}，正在返回工作台装载...`);
      this.$router.push({
        path: "/analysis",
        query: { autoLaunchPipelineId: tpl.id }, // 把 ID 挂在 URL 后面带过去
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.pipeline-library {
  min-height: calc(100vh - 60px);
  background-color: #0b0f19;
  padding: 30px;
  color: #e2e8f0;
}

.library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;

  ::v-deep .dark-page-header {
    .el-page-header__left {
      color: #94a3b8;
      &:hover {
        color: #3b82f6;
      }
    }
    .el-page-header__content {
      color: #f8fafc;
      font-weight: 600;
    }
  }

  .header-actions {
    width: 350px;
    ::v-deep .dark-search-input .el-input__inner {
      background-color: #1e293b;
      border: 1px solid #334155;
      color: #f8fafc;
      border-radius: 20px;
      &:focus {
        border-color: #3b82f6;
      }
    }
  }
}

.filter-section {
  margin-bottom: 30px;
  ::v-deep .dark-radio-group {
    .el-radio-button__inner {
      background: #1e293b;
      border-color: #334155;
      color: #94a3b8;
      box-shadow: none !important;
    }
    .el-radio-button__orig-radio:checked + .el-radio-button__inner {
      background-color: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }
  }
}

.pipeline-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;

  .skeleton-card {
    background: #111827;
    border-radius: 12px;
    padding: 0;
    overflow: hidden;
    border: 1px solid #1f2937;
  }

  .pipeline-card {
    background: #111827;
    border: 1px solid #1f2937;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
      border-color: #374151;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      .icon-box {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        i {
          font-size: 24px;
          color: white;
        }
      }
    }

    .card-body {
      flex: 1;
      .pipeline-name {
        font-size: 18px;
        color: #f8fafc;
        margin: 0 0 10px 0;
        font-weight: 600;
      }
      .pipeline-desc {
        color: #64748b;
        font-size: 13px;
        line-height: 1.5;
        margin-bottom: 16px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .pipeline-tags {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        ::v-deep .el-tag {
          background: transparent;
          border-color: #334155;
          color: #94a3b8;
        }
      }
    }

    .card-footer {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px dashed #334155;
      display: flex;
      justify-content: space-between;
      align-items: center;
      .author-info {
        font-size: 12px;
        color: #475569;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .use-btn {
        background: #1e293b;
        border: 1px solid #3b82f6;
        color: #3b82f6;
        transition: 0.3s;
        &:hover:not(:disabled) {
          background: #3b82f6;
          color: white;
        }
        &:disabled {
          border-color: #334155;
          color: #475569;
        }
      }
    }
  }

  .empty-state {
    grid-column: 1 / -1;
    display: flex;
    justify-content: center;
    padding: 60px;
  }
}
</style>
