<template>
  <div class="analysis-center-container">
    <!-- 分析中心主内容 -->
    <div class="analysis-main">
      <!-- 欢迎横幅 -->
      <div class="welcome-banner">
        <div class="banner-content">
          <h2>生物信息分析中心</h2>
          <p>
            专业的高通量测序数据分析平台，支持RNA-Seq、WGS、scRNA-Seq等多种分析流程
          </p>
          <div class="banner-stats">
            <div class="stat-item">
              <span class="stat-number">{{ stats.totalTasks }}</span>
              <span class="stat-label">分析任务</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ stats.completedTasks }}</span>
              <span class="stat-label">已完成</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ stats.successRate }}%</span>
              <span class="stat-label">成功率</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 快速操作区域 -->
      <div class="quick-actions">
        <h3 class="section-title">快速操作</h3>
        <div class="action-buttons">
          <el-button
            type="primary"
            icon="el-icon-upload"
            @click="handleUploadData"
            class="action-btn"
          >
            上传数据
          </el-button>
          <el-button
            type="success"
            icon="el-icon-video-play"
            @click="handleNewAnalysis"
            class="action-btn"
          >
            新建分析
          </el-button>
          <el-button
            type="warning"
            icon="el-icon-download"
            @click="handleExportReports"
            class="action-btn"
          >
            导出报告
          </el-button>
          <el-button
            type="info"
            icon="el-icon-setting"
            @click="handleAIAssistant"
            class="action-btn"
          >
            AI助手
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "AnalysisPage",
  data() {
    return {
      stats: {
        totalTasks: 156,
        completedTasks: 132,
        successRate: 94.5,
      },
    };
  },
  methods: {
    handleUploadData() {
      this.$message({
        message: "打开数据上传对话框",
        type: "info",
      });
    },

    handleNewAnalysis() {
      this.$message({
        message: "开始新建分析任务",
        type: "info",
      });
    },

    handleExportReports() {
      this.$message({
        message: "开始导出分析报告",
        type: "info",
      });
    },

    handleAIAssistant() {
      this.$router.push({ name: "AnalysisAssistant" });
    },
  },
};
</script>

<style lang="scss" scoped>
.analysis-center-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.analysis-main {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  width: 100%;
}

.welcome-banner {
  background: linear-gradient(135deg, #2c3e50 0%, #42b983 100%);
  border-radius: 12px;
  padding: 30px;
  color: white;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  .banner-content {
    h2 {
      font-size: 28px;
      margin-bottom: 10px;
    }

    p {
      font-size: 16px;
      opacity: 0.9;
      margin-bottom: 20px;
    }
  }

  .banner-stats {
    display: flex;
    gap: 40px;

    .stat-item {
      text-align: center;

      .stat-number {
        display: block;
        font-size: 36px;
        font-weight: bold;
        margin-bottom: 5px;
      }

      .stat-label {
        font-size: 14px;
        opacity: 0.8;
      }
    }
  }
}

.section-title {
  font-size: 20px;
  color: #303133;
  margin-bottom: 15px;
  font-weight: 600;
}

.quick-actions {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  .action-buttons {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;

    .action-btn {
      padding: 10px 20px;
    }
  }
}
</style>