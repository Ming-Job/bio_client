<template>
  <div class="analysis-templates">
    <div class="templates-header">
      <h3 class="section-title">
        <i class="el-icon-magic-stick"></i> 分析流程模板
      </h3>
      <el-button
        type="text"
        size="mini"
        class="more-btn"
        @click="$router.push('/analysis/pipelines')"
      >
        更多 <i class="el-icon-more"></i>
      </el-button>
    </div>

    <div class="template-grid">
      <div
        v-for="template in templates.slice(0, 4)"
        :key="template.id"
        class="template-card"
        @click="$emit('use', template)"
      >
        <div class="card-header">
          <h4 class="template-name text-ellipsis" :title="template.name">
            {{ template.name }}
          </h4>
          <el-tag
            size="mini"
            effect="dark"
            :type="template.isActive ? 'success' : 'info'"
            class="status-tag"
          >
            {{ template.isActive ? "可用" : "维护" }}
          </el-tag>
        </div>

        <div class="card-body">
          <p class="template-description">
            {{
              template.description || "系统预置标准生信分析流程，暂无详细描述。"
            }}
          </p>
        </div>

        <div class="card-footer">
          <el-tag
            size="mini"
            type="info"
            effect="plain"
            v-if="template.category"
            class="category-tag"
          >
            {{ formatCategory(template.category) }}
          </el-tag>
          <span v-else></span>
          <el-button
            type="primary"
            size="small"
            class="use-btn"
            :disabled="!template.isActive"
            @click.stop="$emit('use', template)"
          >
            启动 <i class="el-icon-right"></i>
          </el-button>
        </div>
      </div>

      <div v-if="templates.length === 0" class="empty-state">
        <span style="color: #64748b; font-size: 13px">暂无可用模板</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "AnalysisTemplates",
  props: {
    templates: {
      type: Array,
      required: true,
      default: () => [],
    },
  },
  methods: {
    // 简单翻译一下英文标识为中文展示
    formatCategory(category) {
      const map = {
        genomics: "基因组学",
        transcriptomics: "转录组学",
        microbiome: "微生物组",
      };
      return map[category] || category;
    },
  },
};
</script>

<style lang="scss" scoped>
.analysis-templates {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);

  .templates-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .section-title {
      font-size: 16px;
      color: #f8fafc;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      i {
        color: #3b82f6;
      }
    }
    .more-btn {
      color: #94a3b8;
      &:hover {
        color: #3b82f6;
      }
    }
  }

  .template-grid {
    display: grid;
    /* 调整卡片最小宽度，适应工作台左侧便当盒的空间 */
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;

    .template-card {
      background: #1f2937;
      border: 1px solid #374151;
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;

      &:hover {
        transform: translateY(-4px);
        background: #262f3f;
        border-color: #4b5563;
        box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.4);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;

        .template-name {
          margin: 0;
          font-size: 15px;
          color: #f8fafc;
          font-weight: 600;
          flex: 1;
          padding-right: 12px;
        }
        .status-tag {
          border: none;
          transform: scale(0.9);
          transform-origin: right center;
        }
      }

      .card-body {
        flex: 1;
        .template-description {
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.6;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2; /* 紧凑一点，只展示2行 */
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      }

      .card-footer {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #374151;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .category-tag {
          background: #111827;
          border: 1px solid #334155;
          color: #94a3b8;
        }

        .use-btn {
          background: transparent;
          border: 1px solid #3b82f6;
          color: #3b82f6;
          border-radius: 6px;
          font-weight: 500;
          padding: 6px 12px;
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
      text-align: center;
      padding: 40px 0;
      background: #1f2937;
      border-radius: 12px;
      border: 1px dashed #374151;
    }
  }
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
