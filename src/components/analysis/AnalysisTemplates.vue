<template>
  <div class="analysis-templates">
    <div class="templates-header">
      <h3 class="section-title">
        <i class="el-icon-magic-stick"></i> 分析流程模板
      </h3>
      <el-button
        type="text"
        size="mini"
        @click="$router.push('/analysis/pipelines')"
      >
        更多 <i class="el-icon-more"></i>
      </el-button>
    </div>

    <div class="template-grid">
      <el-card
        v-for="template in templates"
        :key="template.id"
        class="template-card"
        shadow="hover"
        @click.native="$emit('use', template)"
      >
        <div slot="header" class="template-card-header">
          <div
            class="template-icon-wrapper"
            :style="{ background: template.color }"
          >
            <i :class="template.icon"></i>
          </div>
          <div class="template-title">
            <h4>{{ template.name }}</h4>
            <el-rate
              v-model="template.rating"
              disabled
              show-score
              text-color="#ff9900"
              score-template="{value}分"
              class="template-rating"
            />
          </div>
        </div>
        <div class="template-content">
          <p class="template-description">{{ template.description }}</p>
          <div class="template-tags">
            <el-tag
              v-for="tag in template.tags"
              :key="tag"
              size="mini"
              :type="getTagType(tag)"
            >
              {{ tag }}
            </el-tag>
          </div>
          <div class="template-meta">
            <span>
              <i class="el-icon-time"></i>
              {{ template.duration }}分钟
            </span>
            <span>
              <i class="el-icon-user"></i>
              {{ template.usedCount }}次使用
            </span>
          </div>
        </div>
        <div class="template-footer">
          <el-button
            type="primary"
            size="small"
            plain
            @click.stop="$emit('use', template)"
          >
            使用模板
          </el-button>
          <el-button
            type="text"
            size="small"
            @click.stop="$emit('preview', template)"
          >
            预览
          </el-button>
        </div>
      </el-card>
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
    getTagType(tag) {
      const tagMap = {
        基础: "success",
        中级: "warning",
        高级: "danger",
        教学: "info",
        科研: "",
        临床: "danger",
        自动化: "success",
        可视化: "warning",
        表观遗传: "info",
        转录调控: "",
      };
      return tagMap[tag] || "info";
    },
  },
};
</script>

<style lang="scss" scoped>
.analysis-templates {
  /* 适配主页面的暗黑背景和边框 */
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 16px;
  padding: 24px;
  margin-top: 24px; /* 与上方的便当盒拉开间距 */
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);

  .templates-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    .section-title {
      font-size: 18px;
      color: #f8fafc; /* 白色标题 */
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      i {
        color: #3b82f6;
      }
    }
  }

  .template-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;

    .template-card {
      /* 卡片底色调整 */
      background: #1f2937;
      border: 1px solid #374151;
      color: #e2e8f0;
      transition: all 0.3s ease;
      cursor: pointer;

      &:hover {
        transform: translateY(-4px);
        background: #262f3f; /* 悬浮时稍微提亮 */
        border-color: #4b5563;
      }

      /* 去除 element-ui 默认的白色背景 */
      ::v-deep .el-card__header {
        border-bottom: none;
        padding-bottom: 0;
      }
      ::v-deep .el-card__body {
        background: transparent;
      }

      .template-card-header {
        display: flex;
        align-items: center;
        gap: 16px;
        .template-icon-wrapper {
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
        .template-title {
          flex: 1;
          h4 {
            margin: 0 0 8px 0;
            font-size: 16px;
            color: #f8fafc; /* 标题变白 */
          }
        }
      }

      .template-content {
        .template-description {
          font-size: 14px;
          color: #94a3b8; /* 描述文字变灰蓝 */
          line-height: 1.5;
          margin-bottom: 16px;
          height: 42px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .template-tags {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .template-meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #64748b; /* meta信息 */
          span {
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }
      }
      .template-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 16px;
        border-top: 1px solid #374151; /* 边框线融入暗黑环境 */
      }
    }
  }
}
</style>
