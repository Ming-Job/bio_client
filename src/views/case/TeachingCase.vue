<template>
  <div class="teaching-analysis-container">
    <!-- 教学分析平台主内容 -->
    <div class="teaching-main">
      <!-- 欢迎横幅 -->
      <div class="teaching-banner">
        <div class="banner-content">
          <h2>生物信息学教学平台</h2>
          <p>
            专注于生物信息学实践教学，提供RNA-Seq、WGS、scRNA-Seq等分析流程的互动学习
          </p>
          <div class="banner-stats">
            <div class="stat-item">
              <span class="stat-number">{{ stats.courses }}</span>
              <span class="stat-label">教学课程</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ stats.students }}</span>
              <span class="stat-label">学习人数</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ stats.completionRate }}%</span>
              <span class="stat-label">完成率</span>
            </div>
          </div>
        </div>
        <div class="banner-icon">
          <i class="el-icon-notebook-2"></i>
        </div>
      </div>

      <!-- 快速操作区域 -->
      <div class="teaching-actions">
        <h3 class="section-title"><i class="el-icon-guide"></i> 教学功能</h3>
        <div class="action-buttons">
          <el-button
            type="primary"
            icon="el-icon-reading"
            @click="handleStartCourse"
            class="action-btn"
          >
            开始课程
          </el-button>
          <el-button
            type="success"
            icon="el-icon-edit-outline"
            @click="handlePractice"
            class="action-btn"
          >
            实践练习
          </el-button>
          <el-button
            type="warning"
            icon="el-icon-document"
            @click="handleViewMaterials"
            class="action-btn"
          >
            教学资料
          </el-button>
          <el-button
            type="info"
            icon="el-icon-question"
            @click="handleAskQuestion"
            class="action-btn"
          >
            答疑解惑
          </el-button>
        </div>
      </div>

      <!-- 课程模块展示 -->
      <div class="course-modules">
        <h3 class="section-title">
          <i class="el-icon-collection"></i> 课程模块
        </h3>
        <div class="modules-grid">
          <div class="module-card" @click="handleModuleClick('RNA-Seq')">
            <div class="module-icon rnaseq">
              <i class="el-icon-data-line"></i>
            </div>
            <h4>RNA-Seq分析</h4>
            <p>转录组测序数据分析与差异表达分析</p>
            <el-tag type="success" size="mini">初级</el-tag>
          </div>
          <div class="module-card" @click="handleModuleClick('WGS')">
            <div class="module-icon wgs">
              <i class="el-icon-cpu"></i>
            </div>
            <h4>全基因组测序</h4>
            <p>全基因组测序与变异检测分析</p>
            <el-tag type="warning" size="mini">中级</el-tag>
          </div>
          <div class="module-card" @click="handleModuleClick('scRNA-Seq')">
            <div class="module-icon scrnaseq">
              <i class="el-icon-pie-chart"></i>
            </div>
            <h4>单细胞测序</h4>
            <p>单细胞转录组数据分析与细胞分型</p>
            <el-tag type="danger" size="mini">高级</el-tag>
          </div>
          <div class="module-card" @click="handleModuleClick('Chip-Seq')">
            <div class="module-icon chipseq">
              <i class="el-icon-trend-charts"></i>
            </div>
            <h4>ChIP-Seq分析</h4>
            <p>染色质免疫沉淀测序与峰识别</p>
            <el-tag type="success" size="mini">初级</el-tag>
          </div>
        </div>
      </div>

      <!-- 最近学习记录 -->
      <div class="recent-learning" v-if="recentLearning.length > 0">
        <h3 class="section-title"><i class="el-icon-time"></i> 最近学习</h3>
        <el-table :data="recentLearning" style="width: 100%">
          <el-table-column prop="course" label="课程名称" width="200">
          </el-table-column>
          <el-table-column prop="progress" label="学习进度">
            <template slot-scope="scope">
              <el-progress
                :percentage="scope.row.progress"
                :color="progressColor(scope.row.progress)"
              ></el-progress>
            </template>
          </el-table-column>
          <el-table-column prop="lastTime" label="上次学习" width="180">
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template slot-scope="scope">
              <el-button
                @click="continueLearning(scope.row)"
                type="text"
                size="small"
                >继续</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TeachingCase",
  data() {
    return {
      stats: {
        courses: 12,
        students: 856,
        completionRate: 78.5,
      },
      recentLearning: [
        {
          course: "RNA-Seq基础分析",
          progress: 65,
          lastTime: "2023-10-15 14:30",
        },
        {
          course: "WGS变异检测",
          progress: 30,
          lastTime: "2023-10-14 10:15",
        },
        {
          course: "scRNA-Seq细胞分型",
          progress: 90,
          lastTime: "2023-10-12 16:45",
        },
      ],
    };
  },
  methods: {
    handleStartCourse() {
      this.$message({
        message: "开始新的课程学习",
        type: "success",
      });
    },

    handlePractice() {
      this.$message({
        message: "进入实践练习环节",
        type: "info",
      });
    },

    handleViewMaterials() {
      this.$message({
        message: "查看教学资料库",
        type: "info",
      });
    },

    handleAskQuestion() {
      this.$message({
        message: "进入答疑解惑区",
        type: "info",
      });
    },

    handleModuleClick(moduleName) {
      this.$message({
        message: `进入${moduleName}课程模块`,
        type: "success",
      });
    },

    continueLearning(course) {
      this.$message({
        message: `继续学习: ${course.course}`,
        type: "info",
      });
    },

    progressColor(progress) {
      if (progress >= 80) return "#67C23A";
      if (progress >= 50) return "#E6A23C";
      return "#F56C6C";
    },
  },
};
</script>

<style lang="scss" scoped>
.teaching-analysis-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  display: flex;
  flex-direction: column;
}

.teaching-main {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  width: 100%;
}

.teaching-banner {
  background: linear-gradient(135deg, #3498db 0%, #2ecc71 100%);
  border-radius: 16px;
  padding: 30px;
  color: white;
  margin-bottom: 25px;
  box-shadow: 0 6px 16px rgba(52, 152, 219, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200px;
    height: 200px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
  }

  .banner-content {
    flex: 1;
    z-index: 1;

    h2 {
      font-size: 32px;
      margin-bottom: 10px;
      font-weight: 700;
    }

    p {
      font-size: 16px;
      opacity: 0.95;
      margin-bottom: 25px;
      max-width: 600px;
      line-height: 1.5;
    }
  }

  .banner-icon {
    font-size: 80px;
    opacity: 0.2;
    z-index: 0;
    margin-right: 20px;
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
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .stat-label {
        font-size: 14px;
        opacity: 0.9;
      }
    }
  }
}

.section-title {
  font-size: 20px;
  color: #2c3e50;
  margin-bottom: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;

  i {
    font-size: 22px;
  }
}

.teaching-actions {
  background: white;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-left: 5px solid #3498db;

  .action-buttons {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;

    .action-btn {
      padding: 12px 24px;
      font-size: 15px;
      border-radius: 8px;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
    }
  }
}

.course-modules {
  background: white;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  .modules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
    margin-top: 15px;

    .module-card {
      background: #f8f9fa;
      border-radius: 10px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid transparent;
      text-align: center;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
        border-color: #3498db;
        background: white;
      }

      .module-icon {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 15px;
        font-size: 28px;
        color: white;

        &.rnaseq {
          background: linear-gradient(135deg, #3498db, #2980b9);
        }
        &.wgs {
          background: linear-gradient(135deg, #2ecc71, #27ae60);
        }
        &.scrnaseq {
          background: linear-gradient(135deg, #e74c3c, #c0392b);
        }
        &.chipseq {
          background: linear-gradient(135deg, #9b59b6, #8e44ad);
        }
      }

      h4 {
        margin: 0 0 8px 0;
        color: #2c3e50;
        font-size: 18px;
      }

      p {
        color: #7f8c8d;
        font-size: 14px;
        margin-bottom: 12px;
        line-height: 1.4;
      }
    }
  }
}

.recent-learning {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  ::v-deep .el-table {
    border-radius: 8px;
    overflow: hidden;

    th {
      background-color: #f8f9fa;
      color: #2c3e50;
      font-weight: 600;
    }
  }
}

@media (max-width: 768px) {
  .teaching-banner {
    flex-direction: column;
    text-align: center;
    padding: 20px;

    .banner-icon {
      display: none;
    }

    .banner-stats {
      justify-content: center;
      gap: 20px;
    }
  }

  .action-buttons {
    justify-content: center;
  }

  .modules-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
