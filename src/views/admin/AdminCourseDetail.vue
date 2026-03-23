<template>
  <el-dialog
    title="课程详情预览"
    :visible="visible"
    width="720px"
    @close="handleClose"
    custom-class="course-detail-dialog"
    :close-on-click-modal="true"
    append-to-body
  >
    <div class="course-preview-container" v-if="course">
      <div class="meta-section">
        <div class="cover-wrapper">
          <el-image
            v-if="course.coverImage"
            :src="getRealCoverUrl(course.coverImage)"
            fit="cover"
            class="course-cover"
            :preview-src-list="[getRealCoverUrl(course.coverImage)]"
          >
            <div slot="error" class="image-slot error-slot">
              <i class="el-icon-picture-outline"></i>
              <span>封面失效</span>
            </div>
          </el-image>
          <div v-else class="course-cover placeholder-cover">
            <i class="el-icon-notebook-1"></i>
            <span>暂无封面</span>
          </div>
          
          <div class="status-badge" :class="course.status === 'PUBLISHED' ? 'published' : 'offline'">
            {{ course.status === 'PUBLISHED' ? '已发布' : '已下架' }}
          </div>
        </div>

        <div class="info-wrapper">
          <h3 class="course-title">{{ course.title || '未命名课程' }}</h3>
          
          <div class="tags-row">
            <el-tag :type="getDifficultyType(course.difficulty)" size="small" effect="light">
              <i class="el-icon-medal"></i> {{ formatDifficulty(course.difficulty) }}
            </el-tag>
            <el-tag type="info" size="small" effect="plain" class="creator-tag">
              <i class="el-icon-s-custom"></i> 
              创建者：{{ course.instructorName || '系统管理员' }} (管理员)
            </el-tag>
          </div>

          <div class="data-grid">
            <div class="data-item">
              <span class="label">创建时间</span>
              <span class="value time">{{ formatDate(course.createdAt) }}</span>
            </div>
            
            <div class="data-item" v-if="course.updatedAt">
              <span class="label">最后更新</span>
              <span class="value time">{{ formatDate(course.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <el-divider content-position="left">课程简介</el-divider>

      <div class="description-section">
        <div v-if="course.description" class="desc-content">
          {{ course.description }}
        </div>
        <div v-else class="empty-desc">
          <i class="el-icon-document-remove"></i>
          <p>这门课程还没有填写详细的简介说明哦~</p>
        </div>
      </div>
    </div>

    <span slot="footer" class="dialog-footer">
      <el-button @click="handleClose" size="small" plain>关 闭</el-button>
      <el-button type="primary" @click="handleEdit" size="small" icon="el-icon-edit">修改资料</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: "AdminCourseDetail",
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    course: {
      type: Object,
      default: () => null
    }
  },
  methods: {
    getRealCoverUrl(path) {
      if (!path) return '';
      if (path.startsWith('http')) return path;
      const baseUrl = process.env.VUE_APP_BASE_API || 'http://localhost:8080';
      return baseUrl + path;
    },

    handleClose() {
      this.$emit("update:visible", false);
      this.$emit("close");
    },
    handleEdit() {
      this.handleClose();
      this.$emit("edit", this.course); 
    },
    formatDifficulty(val) {
      const map = { "BEGINNER": "初阶入门", "INTERMEDIATE": "中阶进阶", "ADVANCED": "高阶精通" };
      return map[val] || val || "未设置";
    },
    getDifficultyType(val) {
      const map = { "BEGINNER": "success", "INTERMEDIATE": "warning", "ADVANCED": "danger" };
      return map[val] || "info";
    },
    formatDate(dateStr) {
      if (!dateStr) return "-";
      return dateStr.substring(0, 16); 
    }
  }
};
</script>

<style lang="scss" scoped>
::v-deep .course-detail-dialog {
  border-radius: 12px;
  overflow: hidden;
  
  .el-dialog__header {
    background-color: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    padding: 16px 24px;
    .el-dialog__title {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }
  }
  .el-dialog__body {
    padding: 24px;
  }
  .el-dialog__footer {
    border-top: 1px solid #e2e8f0;
    padding: 16px 24px;
    background-color: #f8fafc;
  }
}

.course-preview-container {
  .meta-section {
    display: flex;
    gap: 24px;
    margin-bottom: 8px;

    .cover-wrapper {
      position: relative;
      width: 240px;
      height: 135px;
      flex-shrink: 0;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);

      .course-cover {
        width: 100%;
        height: 100%;
        background-color: #f1f5f9;
        ::v-deep .el-image__inner {
          object-fit: cover;
        }
      }

      .placeholder-cover, .error-slot {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #94a3b8;
        font-size: 13px;
        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
        i {
          font-size: 32px;
          margin-bottom: 8px;
          color: #cbd5e1;
        }
      }

      .status-badge {
        position: absolute;
        top: 8px;
        left: 8px;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        color: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);

        &.published {
          background-color: rgba(16, 185, 129, 0.9); 
          backdrop-filter: blur(4px);
        }
        &.offline {
          background-color: rgba(100, 116, 139, 0.9); 
          backdrop-filter: blur(4px);
        }
      }
    }

    .info-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center; /* 让右侧内容在没有 ID 的情况下垂直居中更好看 */

      .course-title {
        margin: 0 0 12px 0;
        font-size: 20px;
        font-weight: 600;
        color: #0f172a;
        line-height: 1.4;
      }

      .tags-row {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
        
        .creator-tag {
          color: #64748b;
          border-color: #e2e8f0;
          background-color: #f8fafc;
        }
      }

      .data-grid {
        display: flex;
        flex-direction: column;
    
        gap: 2px;
        background-color: #f8fafc;
        padding: 12px 16px;
        border-radius: 6px;
        border: 1px solid #f1f5f9;

        .data-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;

          .label {
            color: #64748b;
          }
          .value {
            color: #334155;
            font-weight: 500;
            
            &.time {
              font-family: Consolas, monospace;
              color: #94a3b8;
              font-weight: 400;
            }
          }
        }
      }
    }
  }

  ::v-deep .el-divider__text {
    font-size: 14px;
    font-weight: 500;
    color: #475569;
    padding: 0 12px;
  }

  .description-section {
    background-color: #f8fafc;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #f1f5f9;
    min-height: 100px;

    .desc-content {
      font-size: 14px;
      color: #334155;
      line-height: 1.6;
      white-space: pre-wrap; 
    }

    .empty-desc {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      padding: 20px 0;
      
      i {
        font-size: 32px;
        margin-bottom: 8px;
        color: #cbd5e1;
      }
      p {
        margin: 0;
        font-size: 13px;
      }
    }
  }
}
</style>