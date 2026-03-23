<template>
  <div class="detail-wrapper">
    <div class="detail-layout" v-if="caseData">
      
      <div
        class="case-banner"
        :style="{ backgroundImage: `url(${resolveImageUrl(caseData.imageUrl)})` }"
      >
        <div class="banner-grid-overlay"></div>
        <div class="banner-overlay">
          <el-button
            class="back-btn dark-plain-btn"
            size="small"
            icon="el-icon-back"
            @click="$router.back()"
          >返回案例大厅</el-button>
          
          <div class="banner-content">
            <div class="tags">
              <el-tag
                v-for="tag in getTags(caseData.tags)"
                :key="tag"
                size="small"
                effect="dark"
                class="cyber-tag"
              >{{ tag }}</el-tag>
            </div>
            <h1 class="title">{{ caseData.title }}</h1>
            <div class="meta">
              <span><i class="el-icon-time"></i> {{ formatDate(caseData.createTime) }}</span>
              <span><i class="el-icon-view"></i> {{ caseData.forks || 0 }} 次学习</span>
              <span class="difficulty" :class="caseData.difficulty">
                <i class="el-icon-medal"></i> {{ (caseData.difficulty || "medium").toUpperCase() }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="main-content">
        <el-row :gutter="30">
          <el-col :span="16">
            <div class="content-panel panel-glass">
              <h3 class="panel-title">
                <i class="el-icon-reading"></i> 案例解析
              </h3>
              <div
                class="markdown-body custom-scroll"
                v-html="renderedContent"
              ></div>
            </div>
          </el-col>

          <el-col :span="8">
            <div class="action-panel panel-glass sticky-panel">
              <h3 class="panel-title">
                <i class="el-icon-cpu"></i> 实验执行配置
              </h3>

              <div class="info-block">
                <label>目标分析模块</label>
                <div class="engine-badge glow-text">
                  <i class="el-icon-connection"></i> {{ getEngineName(caseData.category) }}
                </div>
              </div>

              <div class="info-block">
                <label>关联数据集 (Dataset)</label>
                <div class="dataset-box terminal-style">
                  <span class="prompt-arrow">❯</span> {{ caseData.dataset || "无需外部数据" }}
                </div>
              </div>

              <div class="info-block" v-if="caseData.prompt">
                <label>预设分析指令 (System Prompt)</label>
                <div class="prompt-box terminal-style">
                  <span class="prompt-arrow">#</span> {{ caseData.prompt }}
                </div>
              </div>

              <div class="dispatch-action">
                <el-button
                  type="success"
                  class="glow-btn-success fork-big-btn"
                  icon="el-icon-video-play"
                  @click="forkCase"
                >
                  载入案例并开始实验
                </el-button>
                <p class="action-hint"><i class="el-icon-info"></i> 系统将自动配置实验运行环境</p>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <div v-else-if="loading" class="loading-state">
      <div class="loader-core"></div>
      <p>正在加载案例详细信息...</p>
    </div>

    <div v-else class="loading-state">
      <i class="el-icon-document-delete" style="font-size: 40px; color: #f87171;"></i>
      <p>未找到该案例</p>
      <el-button type="text" @click="$router.back()">点击返回</el-button>
    </div>
  </div>
</template>

<script>
import { getCaseDetail } from "@/api/case";
import { getImageUrl } from "@/utils/image";
import MarkdownIt from 'markdown-it';
import mdKatex from 'markdown-it-katex';
import 'katex/dist/katex.min.css';

export default {
  name: "CaseDetail",
  data() {
    return {
      caseData: null,
      loading: true,
      md: new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true
      }).use(mdKatex) 
    };
  },
  computed: {
    renderedContent() {
      if (this.caseData && this.caseData.content) {
        return this.md.render(this.caseData.content);
      }
      return '<p class="no-data">系统暂未收录该案例的详细文档...</p>';
    }
  },
  created() {
    const id = this.$route.params.id;
    if (id) {
      this.fetchCaseDetail(id);
    } else {
      this.$message.error("未获取到案例 ID");
      this.$router.back();
    }
  },
  methods: {
    resolveImageUrl(url) {
      return getImageUrl(url);
    },
    async fetchCaseDetail(id) {
      this.loading = true;
      try {
        const res = await getCaseDetail(id);
        const responseData = res.success !== undefined ? res : res.data;
        if (responseData && responseData.success) {
          this.caseData = responseData.data;
        } else {
          this.$message.error(responseData.message || "获取案例解析失败");
        }
      } catch (e) {
        console.error("详情获取失败", e);
        this.$message.error("网络连接失败，请检查服务器状态");
      } finally {
        this.loading = false;
      }
    },
    getTags(tagsStr) {
      return tagsStr ? tagsStr.split(",") : [];
    },
    formatDate(dateStr) {
      if (!dateStr) return "未知时间";
      const date = new Date(dateStr);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },
    getEngineName(cat) {
      const map = {
        pipeline: "分析流水线 (Pipelines)",
        structure: "分子结构展示 (3D-Viewer)",
        template: "交互式分析模板",
        copilot: "代码辅助生成 (Sandbox)",
      };
      return map[cat] || "未知分析模块";
    },
    forkCase() {
      this.$message.success(`案例载入中，正在前往实验区...`);
      switch (this.caseData.category) {
        case "copilot":
          this.$router.push({ 
            path: "/assistant", 
            query: { 
              fork_prompt: this.caseData.prompt, 
              mount_dataset: this.caseData.dataset 
            }
          });
          break;
        case "pipeline":
          this.$router.push({ path: "/analysis/pipelines", query: { load_pipeline_id: this.caseData.id }});
          break;
        case "structure":
          this.$router.push({ path: "/3d-viewer", query: { load_pdb: this.caseData.dataset }});
          break;
        case "template":
          this.$router.push({ path: "/analysis/data", query: { use_template_id: this.caseData.id }});
          break;
        default:
          this.$message.warning("未知分析类别，无法自动跳转！");
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.detail-wrapper {
  width: 100%;
  min-height: calc(100vh - 60px);
  background-color: #050810;
  background-image: radial-gradient(circle at 50% 0%, #111827 0%, #050810 70%);
  font-family: "Inter", -apple-system, sans-serif;
  color: #e2e8f0;
  padding-bottom: 60px;
}
.detail-layout {
  max-width: 1200px;
  margin: 0 auto;
}

.case-banner {
  height: 340px;
  background-size: cover;
  background-position: center;
  position: relative;
  border-bottom: 1px solid rgba(59, 130, 246, 0.3);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  
  .banner-grid-overlay {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px);
    background-size: 30px 30px;
    z-index: 1;
  }
  
  .banner-overlay {
    position: absolute;
    inset: 0;
    z-index: 2;
    background: linear-gradient(to bottom, rgba(5, 8, 16, 0.2) 0%, #050810 100%);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 40px 50px;

    .back-btn {
      position: absolute;
      top: 30px;
      left: 30px;
      backdrop-filter: blur(5px);
    }
  }

  .banner-content {
    .tags {
      margin-bottom: 15px;
      display: flex;
      gap: 10px;
      .cyber-tag {
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid #3b82f6;
        color: #93c5fd;
        backdrop-filter: blur(4px);
        box-shadow: 0 0 10px rgba(59, 130, 246, 0.2);
      }
    }
    .title {
      margin: 0 0 15px 0;
      font-size: 40px;
      font-weight: 900;
      color: #fff;
      letter-spacing: 1px;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(59, 130, 246, 0.4);
    }
    .meta {
      display: flex;
      gap: 25px;
      font-size: 14px;
      color: #94a3b8;
      font-family: Consolas, monospace;
      span {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .difficulty {
        padding: 2px 10px;
        border-radius: 4px;
        font-weight: bold;
        background: rgba(255, 255, 255, 0.05);
        &.easy { color: #34d399; border: 1px solid rgba(52, 211, 153, 0.3); }
        &.medium { color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.3); }
        &.hard { color: #f87171; border: 1px solid rgba(248, 113, 113, 0.3); }
      }
    }
  }
}

.main-content {
  margin-top: -30px; 
  padding: 0 30px;
  position: relative;
  z-index: 10;
}

.panel-glass {
  background: rgba(17, 24, 39, 0.7);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  
  .panel-title {
    margin: 0 0 25px 0;
    font-size: 20px;
    font-weight: 700;
    color: #f8fafc;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    padding-bottom: 15px;
    display: flex;
    align-items: center;
    i { color: #3b82f6; margin-right: 10px; font-size: 22px; }
    span { font-size: 14px; color: #64748b; margin-left: 10px; font-family: Consolas, monospace; font-weight: normal; }
  }
}

.sticky-panel {
  position: sticky;
  top: 30px; 
}

.markdown-body {
  font-size: 15px;
  line-height: 1.8;
  color: #cbd5e1;
  min-height: 400px;
  text-align: left;

  ::v-deep {
    h1, h2, h3 { 
      color: #fff; 
      margin-top: 24px; 
      margin-bottom: 16px; 
      font-weight: 600; 
      line-height: 1.25; 
    }
    h1 { font-size: 2em; border-bottom: 1px solid #30363d; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #30363d; padding-bottom: 0.3em; }
    p { margin-top: 0; margin-bottom: 16px; line-height: 1.6; }
    ul, ol { padding-left: 2em; margin-bottom: 16px; }
    li { margin: 0.25em 0; }
    strong { color: #60a5fa; font-weight: 600; } 
    code { 
      background: rgba(255, 255, 255, 0.1); 
      padding: 2px 6px; 
      border-radius: 4px; 
      font-family: Consolas, monospace; 
      font-size: 0.9em;
    }
    .katex-display {
      margin: 20px 0;
      overflow-x: auto;
      overflow-y: hidden;
      padding: 10px 0;
      color: #34d399;
    }
    blockquote {
      padding: 0 1em;
      color: #8b949e;
      border-left: 0.25em solid #3b82f6;
      margin: 0 0 16px 0;
      background: rgba(59, 130, 246, 0.05);
    }
  }

  .no-data {
    color: #475569;
    font-style: italic;
    text-align: center;
    margin-top: 50px;
  }
}

.action-panel {
  .info-block {
    margin-bottom: 25px;
    label {
      display: block;
      font-size: 13px;
      color: #94a3b8;
      margin-bottom: 10px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    
    .engine-badge {
      display: inline-flex;
      align-items: center;
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.4);
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
    }

    .terminal-style {
      background: #000;
      border: 1px solid #334155;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: Consolas, "Courier New", monospace;
      font-size: 13px;
      color: #a7f3d0;
      line-height: 1.6;
      word-break: break-all;
      box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);
      .prompt-arrow {
        color: #f59e0b;
        margin-right: 8px;
        font-weight: bold;
      }
    }
    
    .prompt-box {
      color: #e2e8f0;
    }
  }

  .dispatch-action {
    margin-top: 40px;
    border-top: 1px dashed rgba(255, 255, 255, 0.1);
    padding-top: 25px;
    
    .fork-big-btn {
      width: 100%;
      height: 54px;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 1px;
      border-radius: 12px;
      transition: all 0.3s ease;
      &:hover {
        transform: translateY(-2px);
      }
    }
    
    .action-hint {
      text-align: center;
      font-size: 12px;
      color: #64748b;
      margin-top: 15px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 5px;
    }
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  .loader-core {
    width: 50px;
    height: 50px;
    border: 3px solid rgba(59, 130, 246, 0.2);
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
    margin-bottom: 20px;
  }
  p {
    color: #60a5fa;
    font-family: Consolas, monospace;
    letter-spacing: 2px;
  }
}
@keyframes spin { 100% { transform: rotate(360deg); } }

::v-deep .dark-plain-btn {
  background: rgba(15, 23, 42, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: #f8fafc !important;
  backdrop-filter: blur(4px);
  &:hover {
    background: rgba(59, 130, 246, 0.4) !important;
    border-color: #60a5fa !important;
  }
}
::v-deep .glow-btn-success {
  background: linear-gradient(135deg, #10b981, #059669) !important;
  border: none !important;
  color: #fff;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
  &:hover {
    box-shadow: 0 6px 25px rgba(16, 185, 129, 0.6);
  }
}
</style>