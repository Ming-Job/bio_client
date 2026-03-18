<template>
  <div class="detail-wrapper">
    <div class="detail-layout" v-if="caseData">
      <div
        class="case-banner"
        :style="{ backgroundImage: `url(${caseData.imageUrl})` }"
      >
        <div class="banner-overlay">
          <el-button
            class="back-btn dark-plain-btn"
            size="small"
            icon="el-icon-back"
            @click="$router.back()"
            >返回矩阵</el-button
          >
          <div class="banner-content">
            <div class="tags">
              <el-tag
                v-for="tag in getTags(caseData.tags)"
                :key="tag"
                size="small"
                effect="dark"
                class="cyber-tag"
                >{{ tag }}</el-tag
              >
            </div>
            <h1 class="title">{{ caseData.title }}</h1>
            <div class="meta">
              <span
                ><i class="el-icon-time"></i>
                {{ formatDate(caseData.createTime) }}</span
              >
              <span
                ><i class="el-icon-download"></i>
                {{ caseData.forks }} 次克隆</span
              >
              <span class="difficulty" :class="caseData.difficulty"
                ><i class="el-icon-medal"></i>
                {{ (caseData.difficulty || "medium").toUpperCase() }}</span
              >
            </div>
          </div>
        </div>
      </div>

      <div class="main-content">
        <el-row :gutter="30">
          <el-col :span="16">
            <div class="content-panel panel-dark">
              <h3 class="panel-title">
                <i class="el-icon-reading"></i> 案例解析 (Analysis Protocol)
              </h3>
              <div
                class="markdown-body"
                v-html="caseData.content || '暂无详细文档...'"
              ></div>
            </div>
          </el-col>

          <el-col :span="8">
            <div class="action-panel panel-dark">
              <h3 class="panel-title">
                <i class="el-icon-cpu"></i> 执行参数 (Execution Meta)
              </h3>

              <div class="info-block">
                <label>目标算力引擎：</label>
                <div class="engine-badge">
                  {{ getEngineName(caseData.category) }}
                </div>
              </div>

              <div class="info-block">
                <label>依赖数据舱：</label>
                <div class="dataset-box">
                  <i class="el-icon-document"></i>
                  {{ caseData.dataset || "无依赖数据" }}
                </div>
              </div>

              <div class="info-block" v-if="caseData.prompt">
                <label>预设极客提示词：</label>
                <div class="prompt-box">
                  {{ caseData.prompt }}
                </div>
              </div>

              <div class="dispatch-action">
                <el-button
                  type="success"
                  class="glow-btn-success fork-big-btn"
                  icon="el-icon-connection"
                  @click="forkCase"
                >
                  [ 确认克隆并载入引擎 ]
                </el-button>
                <p class="action-hint">系统将自动为您配置环境并填入上方参数</p>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <div v-else-if="loading" class="loading-state">
      <i class="el-icon-loading"></i> 数据解密中...
    </div>
  </div>
</template>

<script>
import { getCaseDetail } from "@/api/case";

export default {
  name: "CaseDetail",
  data() {
    return {
      caseData: null,
      loading: true,
    };
  },
  created() {
    // 🌟 重点：因为路由是 case/:id，所以必须用 params.id 取值！
    const id = this.$route.params.id;

    if (id) {
      this.fetchCaseDetail(id); // 拿着这个 ID 去呼叫你的 Java 后端
    } else {
      this.$message.error("未获取到案例 ID！");
    }
  },
  methods: {
    async fetchCaseDetail(id) {
      this.loading = true;
      try {
        const res = await getCaseDetail(id);

        // 🌟 终极兼容解包逻辑
        const responseData = res.success !== undefined ? res : res.data;

        if (responseData && responseData.success) {
          this.caseData = responseData.data;
        } else {
          this.$message.error(responseData.message || "获取案例解析失败");
        }
      } catch (e) {
        console.error("详情获取失败", e);
        this.$message.error("网络链路中断");
      } finally {
        this.loading = false;
      }
    },
    getTags(tagsStr) {
      return tagsStr ? tagsStr.split(",") : [];
    },
    formatDate(dateStr) {
      if (!dateStr) return "未知时间";
      return new Date(dateStr).toLocaleDateString();
    },
    getEngineName(cat) {
      const map = {
        pipeline: "智能分析流",
        structure: "三维结构洞察",
        template: "零代码模板",
        copilot: "AI 极客副驾",
      };
      return map[cat] || "未知引擎";
    },
    forkCase() {
      this.$message.success(`克隆协议启动！正在前往引擎...`);
      // 借用之前写好的分发逻辑
      switch (this.caseData.category) {
        case "copilot":
          this.$router.push({
            path: "/analysis-assistant",
            query: {
              fork_prompt: this.caseData.prompt,
              fork_dataset: this.caseData.dataset,
            },
          });
          break;
        case "pipeline":
          this.$router.push({
            path: "/pipeline",
            query: { load_pipeline_id: this.caseData.id },
          });
          break;
        case "structure":
          this.$router.push({
            path: "/3d-viewer",
            query: { load_pdb: this.caseData.dataset },
          });
          break;
        case "template":
          this.$router.push({
            path: "/template-tools",
            query: { use_template_id: this.caseData.id },
          });
          break;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.detail-wrapper {
  width: 100%;
  min-height: calc(100vh - 60px);
  background-color: #0b0f19;
  font-family: "Inter", sans-serif;
  color: #e2e8f0;
  padding-bottom: 40px;
}
.detail-layout {
  max-width: 1200px;
  margin: 0 auto;
}

/* 顶部 Banner */
.case-banner {
  height: 300px;
  background-size: cover;
  background-position: center;
  position: relative;
  border-bottom: 1px solid #1f2937;
  .banner-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      to bottom,
      rgba(11, 15, 25, 0.4) 0%,
      rgba(11, 15, 25, 0.95) 100%
    );
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 40px;
    .back-btn {
      position: absolute;
      top: 20px;
      left: 20px;
    }
  }
  .banner-content {
    .tags {
      margin-bottom: 15px;
      display: flex;
      gap: 8px;
      .cyber-tag {
        background: #1e293b;
        border-color: #3b82f6;
        color: #93c5fd;
      }
    }
    .title {
      margin: 0 0 15px 0;
      font-size: 36px;
      font-weight: 800;
      color: #fff;
      letter-spacing: 1px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
    }
    .meta {
      display: flex;
      gap: 20px;
      font-size: 14px;
      color: #94a3b8;
      font-family: Consolas, monospace;
      .difficulty {
        padding: 2px 8px;
        border-radius: 4px;
        &.easy {
          color: #34d399;
        }
        &.medium {
          color: #fbbf24;
        }
        &.hard {
          color: #f87171;
        }
      }
    }
  }
}

/* 主体内容区 */
.main-content {
  margin-top: 30px;
  padding: 0 20px;
}
.panel-dark {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  .panel-title {
    margin: 0 0 20px 0;
    font-size: 18px;
    color: #f8fafc;
    border-bottom: 1px solid #1f2937;
    padding-bottom: 12px;
    i {
      color: #3b82f6;
      margin-right: 8px;
    }
  }
}

/* 左侧正文 */
.markdown-body {
  font-size: 15px;
  line-height: 1.8;
  color: #cbd5e1;
}

/* 右侧控制台 */
.action-panel {
  .info-block {
    margin-bottom: 20px;
    label {
      display: block;
      font-size: 13px;
      color: #64748b;
      margin-bottom: 8px;
    }
    .engine-badge {
      display: inline-block;
      background: rgba(59, 130, 246, 0.1);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.3);
      padding: 6px 12px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 13px;
    }
    .dataset-box {
      background: #000;
      border: 1px solid #334155;
      padding: 10px;
      border-radius: 6px;
      font-family: Consolas, monospace;
      font-size: 13px;
      color: #a7f3d0;
    }
    .prompt-box {
      background: #0b0f19;
      border-left: 3px solid #f59e0b;
      padding: 12px;
      font-size: 13px;
      color: #d1d5db;
      line-height: 1.5;
      font-style: italic;
    }
  }
  .dispatch-action {
    margin-top: 30px;
    border-top: 1px dashed #334155;
    padding-top: 20px;
    .fork-big-btn {
      width: 100%;
      height: 50px;
      font-size: 16px;
      font-weight: bold;
      letter-spacing: 1px;
    }
    .action-hint {
      text-align: center;
      font-size: 12px;
      color: #64748b;
      margin-top: 10px;
    }
  }
}

.loading-state {
  text-align: center;
  padding: 100px 0;
  font-size: 18px;
  color: #3b82f6;
  i {
    font-size: 24px;
    animation: spin 1s linear infinite;
    margin-right: 10px;
  }
}
@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
::v-deep .dark-plain-btn {
  background: transparent !important;
  border: 1px solid #334155 !important;
  color: #94a3b8 !important;
  &:hover {
    border-color: #3b82f6 !important;
    color: #3b82f6 !important;
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
