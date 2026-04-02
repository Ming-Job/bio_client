<template>
  <div class="detail-wrapper">
    <div class="detail-layout" v-if="caseData">
      <div
        class="case-banner"
        :style="{
          backgroundImage: `url(${resolveImageUrl(caseData.imageUrl)})`,
        }"
      >
        <div class="banner-grid-overlay"></div>
        <div class="banner-overlay">
          <el-button
            class="back-btn dark-plain-btn"
            size="small"
            icon="el-icon-back"
            @click="$router.back()"
            >返回案例大厅</el-button
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
            </div>
          </div>
        </div>
      </div>

      <div class="main-content single-column">
        <div class="content-panel panel-glass">
          <div class="panel-header-flex">
            <h3 class="panel-title no-border">
              <i class="el-icon-setting"></i> 运行参数概览
            </h3>
            <el-button
              :type="getButtonType(caseData.category)"
              :class="getButtonGlowClass(caseData.category)"
              :icon="getButtonIcon(caseData.category)"
              @click="forkCase"
            >
              {{ getSmallButtonText(caseData.category) }}
            </el-button>
          </div>

          <div class="params-grid">
            <div class="param-box">
              <label>目标分析模块</label>
              <div class="engine-badge glow-text">
                <i class="el-icon-connection"></i>
                {{ getEngineName(caseData.category) }}
              </div>
            </div>

            <div class="param-box">
              <label>关联数据集 (Dataset)</label>
              <div
                class="dataset-download-box terminal-style"
                :class="{ 'is-clickable': caseData.dataset }"
                @click="handleDownloadData(caseData.dataset)"
                v-loading="isDownloading"
                element-loading-background="rgba(15, 23, 42, 0.8)"
                element-loading-text="正在为您打包下载..."
              >
                <div class="file-info">
                  <span class="prompt-arrow" v-if="!caseData.dataset">❯</span>
                  <i
                    class="el-icon-folder-opened text-yellow"
                    v-if="caseData.dataset"
                  ></i>
                  {{ caseData.dataset || "无需外部数据，直接运行即可" }}
                </div>
                <div class="download-action" v-if="caseData.dataset">
                  <i class="el-icon-download"></i> <span>点击下载</span>
                </div>
              </div>
            </div>
          </div>

          <div
            class="param-box"
            v-if="caseData.prompt"
            style="margin-top: 20px"
          >
            <label>预设分析指令 (Prompt)</label>
            <div
              class="terminal-style custom-scroll"
              style="max-height: 250px; overflow-y: auto"
            >
              <span class="prompt-arrow">#</span>
              <span style="white-space: pre-wrap">{{
                formatPrompt(caseData.prompt)
              }}</span>
            </div>
          </div>
        </div>

        <div
          class="content-panel panel-glass"
          style="margin-top: 24px"
          v-if="caseData.content"
        >
          <h3 class="panel-title"><i class="el-icon-reading"></i> 案例解析</h3>
          <div
            class="markdown-body custom-scroll"
            v-html="renderedContent"
          ></div>
        </div>

        <div
          class="content-panel panel-glass"
          style="margin-top: 24px"
          v-if="caseData.resultImageUrl"
        >
          <h3 class="panel-title">
            <i class="el-icon-picture-outline"></i> 预期产出样例 (Expected
            Output)
          </h3>
          <div class="result-image-box-large">
            <el-image
              :src="resolveImageUrl(caseData.resultImageUrl)"
              :preview-src-list="[resolveImageUrl(caseData.resultImageUrl)]"
              fit="contain"
              class="expected-result-img-large"
            >
              <div slot="placeholder" class="image-slot">
                加载图表中<span class="dot">...</span>
              </div>
              <div slot="error" class="image-slot text-gray">
                <i class="el-icon-picture-outline"></i> 图表加载失败
              </div>
            </el-image>
            <p class="image-hint">
              <i class="el-icon-zoom-in"></i> 点击图片可全屏查看高清细节
            </p>

            <div class="image-caption-box" v-if="caseData.resultImageDesc">
              <div class="caption-title">
                <i class="el-icon-data-analysis"></i> 图表专家解读：
              </div>
              <div
                class="caption-text markdown-body"
                v-html="md.render(caseData.resultImageDesc)"
                style="
                  background: transparent;
                  padding: 0;
                  border: none;
                  box-shadow: none;
                "
              ></div>
            </div>
          </div>
        </div>

        <div class="bottom-action-area">
          <el-button
            :type="getButtonType(caseData.category)"
            class="big-bottom-btn"
            :class="getButtonGlowClass(caseData.category)"
            :icon="getButtonIcon(caseData.category)"
            @click="forkCase"
          >
            阅读完毕，{{ getBigButtonText(caseData.category) }}
          </el-button>
        </div>
      </div>
    </div>

    <div v-else-if="loading" class="loading-state">
      <div class="loader-core"></div>
      <p>正在加载案例详细信息...</p>
    </div>

    <div v-else class="loading-state">
      <i
        class="el-icon-document-delete"
        style="font-size: 40px; color: #f87171"
      ></i>
      <p>未找到该案例</p>
      <el-button type="text" @click="$router.back()">点击返回</el-button>
    </div>
  </div>
</template>

<script>
import { getCaseDetail, downloadCaseData } from "@/api/case";
import { getImageUrl } from "@/utils/image";
import MarkdownIt from "markdown-it";
import mdKatex from "markdown-it-katex";
import "katex/dist/katex.min.css";

export default {
  name: "CaseDetail",
  data() {
    return {
      caseData: null,
      loading: true,
      isDownloading: false,
      defaultImage:
        "https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png",
      md: new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
      }).use(mdKatex),
    };
  },
  computed: {
    renderedContent() {
      if (this.caseData && this.caseData.content) {
        const cleanContent = this.caseData.content.replace(/^[ \t]+/gm, "");
        return this.md.render(cleanContent);
      }
      return '<p class="no-data">系统暂未收录该案例的详细文档...</p>';
    },
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
      if (!url) return this.defaultImage;
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

    async handleDownloadData(fileName) {
      if (!fileName) return;

      this.isDownloading = true;
      try {
        const res = await downloadCaseData(fileName);

        const blob = new Blob([res], { type: "application/octet-stream" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.style.display = "none";
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.$message.success(
          `【${fileName}】 开始下载，请查看浏览器下载队列！`,
        );
      } catch (error) {
        console.error("Download Error:", error);
        this.$message.error("下载失败，该数据集文件可能在服务器端已丢失。");
      } finally {
        this.isDownloading = false;
      }
    },

    getTags(tagsStr) {
      return tagsStr ? tagsStr.split(",").filter((t) => t.trim()) : [];
    },
    formatDate(dateStr) {
      if (!dateStr) return "未知时间";
      const date = new Date(dateStr);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0",
      )}-${String(date.getDate()).padStart(2, "0")}`;
    },
    getEngineName(cat) {
      const map = {
        pipeline: "标准分析流 (Pipelines)",
        structure: "三维结构预览 (3D-Viewer)",
        template: "交互式分析模板",
        copilot: "代码辅助 (Copilot Sandbox)",
      };
      return map[cat] || "未知分析模块";
    },

    formatPrompt(promptStr) {
      if (!promptStr) return "";
      try {
        const parsed = JSON.parse(promptStr);
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        return promptStr;
      }
    },

    getSmallButtonText(cat) {
      const map = {
        pipeline: "前往工作台开始分析",
        structure: "开启三维结构预览",
        copilot: "载入参数至副驾",
      };
      return map[cat] || "前往实操";
    },
    getBigButtonText(cat) {
      const map = {
        pipeline: "立即开启分析",
        structure: "一键载入至 3D 渲染工作台",
        copilot: "一键将指令发送至极客副驾",
      };
      return map[cat] || "立即前往实操工作区";
    },
    getButtonIcon(cat) {
      const map = {
        pipeline: "el-icon-guide",
        structure: "el-icon-discover",
        copilot: "el-icon-cpu",
      };
      return map[cat] || "el-icon-position";
    },
    getButtonType(cat) {
      return cat === "structure" ? "primary" : "success";
    },
    getButtonGlowClass(cat) {
      const map = {
        pipeline: "glow-btn-cyan",
        structure: "glow-btn-purple",
        copilot: "glow-btn-success",
      };
      return map[cat] || "glow-btn-cyan";
    },

    // 🌟 核心修改 1：拦截点击事件，加入弹窗确认
    forkCase() {
      // 只有当分类是 Pipeline 且真的绑定了数据集时，才弹窗询问
      if (this.caseData.category === "pipeline" && this.caseData.dataset) {
        this.$confirm(
          `本次标准分析流实操需要依赖关联数据集<strong style="color:#3b82f6;">【${this.caseData.dataset}】</strong>。<br/>请问您是否已在页面上方完成下载？`,
          "操作确认",
          {
            confirmButtonText: "已下载，前往向导",
            cancelButtonText: "暂未下载",
            type: "warning",
            dangerouslyUseHTMLString: true, // 允许使用 HTML 标签让文件名高亮
            confirmButtonClass: "el-button--success", // 确认按钮变绿，符合极客风
          },
        )
          .then(() => {
            // 用户点击已下载，继续路由跳转
            this.proceedToRoute();
          })
          .catch(() => {
            // 用户点击暂未下载，关闭弹窗并友好提示
            this.$message.info(
              "请先点击页面上方【关联数据集】区域的下载按钮获取数据。",
            );
          });
      } else {
        // 如果是其他模块(Copilot/3D)，或者没有数据集，直接跳过去就行
        this.proceedToRoute();
      }
    },

    // 🌟 核心修改 2：把真正的路由跳转逻辑抽离出来
    proceedToRoute() {
      this.$message.success(`参数提取成功，正在前往对应模块...`);
      switch (this.caseData.category) {
        case "copilot":
          this.$router.push({
            path: "/assistant",
            query: {
              fork_prompt: this.caseData.prompt,
              mount_dataset: this.caseData.dataset,
            },
          });
          break;
        case "pipeline": {
          let targetPipelineId = "";
          try {
            const promptData = JSON.parse(this.caseData.prompt);
            targetPipelineId = promptData.target_pipeline_id;
          } catch (e) {
            targetPipelineId = this.caseData.prompt;
          }
          this.$router.push({
            path: "/analysis/new",
            query: {
              pipelineId: targetPipelineId,
              dataset: this.caseData.dataset,
            },
          });
          break;
        }
        case "structure":
          this.$router.push({
            path: "/analysis",
            query: {
              action: "open_3d_viewer",
              file_id: this.caseData.dataset,
            },
          });
          break;
        case "template":
          this.$router.push({
            path: "/analysis/data",
            query: { use_template_id: this.caseData.id },
          });
          break;
        default:
          this.$message.warning("未知的案例类型，无法自动跳转");
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
  padding-bottom: 80px;
}
.detail-layout {
  width: 100%;
}

.case-banner {
  height: 360px;
  background-size: cover;
  background-position: center;
  position: relative;
  border-bottom: 1px solid rgba(59, 130, 246, 0.3);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);

  .banner-grid-overlay {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(
        rgba(59, 130, 246, 0.1) 1px,
        transparent 1px
      ),
      linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px);
    background-size: 30px 30px;
    z-index: 1;
  }

  .banner-overlay {
    position: absolute;
    inset: 0;
    z-index: 2;
    background: linear-gradient(
      to bottom,
      rgba(5, 8, 16, 0.2) 0%,
      #050810 100%
    );
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    padding: 50px 20px;

    .back-btn {
      position: absolute;
      top: 30px;
      left: 30px;
      backdrop-filter: blur(5px);
    }
  }

  .banner-content {
    max-width: 1000px;
    width: 100%;
    .tags {
      margin-bottom: 15px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
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
      font-size: 42px;
      font-weight: 900;
      color: #fff;
      letter-spacing: 1px;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8),
        0 0 20px rgba(59, 130, 246, 0.4);
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
    }
  }
}

.single-column {
  max-width: 1000px;
  width: 100%;
  margin: -40px auto 0;
  padding: 0 20px;
  position: relative;
  z-index: 10;
}

.panel-glass {
  background: rgba(17, 24, 39, 0.8);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 35px 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);

  .panel-title {
    margin: 0 0 25px 0;
    font-size: 22px;
    font-weight: 700;
    color: #f8fafc;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    padding-bottom: 15px;
    display: flex;
    align-items: center;
    i {
      color: #3b82f6;
      margin-right: 12px;
      font-size: 24px;
    }
    &.no-border {
      border-bottom: none;
      padding-bottom: 0;
      margin-bottom: 0;
    }
  }
}

.panel-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 20px;
  margin-bottom: 20px;
}

.params-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.param-box {
  label {
    display: block;
    font-size: 13px;
    color: #94a3b8;
    margin-bottom: 8px;
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
    height: 42px;
    box-sizing: border-box;
  }

  .terminal-style {
    background: #000;
    border: 1px solid #334155;
    padding: 10px 16px;
    border-radius: 8px;
    font-family: Consolas, "Courier New", monospace;
    font-size: 13px;
    color: #a7f3d0;
    line-height: 1.6;
    word-break: break-all;

    /* 让内容维持 JSON 格式的换行 */
    white-space: pre-wrap;

    box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.5);
    min-height: 42px;
    box-sizing: border-box;

    .prompt-arrow {
      color: #f59e0b;
      margin-right: 8px;
      font-weight: bold;
    }
  }

  .dataset-download-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.3s ease;

    &.is-clickable {
      cursor: pointer;
      color: #cbd5e1;
      &:hover {
        border-color: #10b981;
        background: rgba(16, 185, 129, 0.05);
        color: #f8fafc;
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.15);

        .download-action {
          opacity: 1;
          transform: translateX(0);
        }
      }
    }

    .file-info {
      display: flex;
      align-items: center;
      .text-yellow {
        color: #eab308;
        margin-right: 8px;
        font-size: 16px;
      }
    }

    .download-action {
      color: #10b981;
      font-weight: bold;
      opacity: 0;
      transform: translateX(10px);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
}

.result-image-box-large {
  background: #000;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 10px;
  text-align: center;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);

  .expected-result-img-large {
    width: 100%;
    max-height: 800px;
    border-radius: 8px;
    cursor: zoom-in;
    background-color: #0b0f19;
  }

  .image-caption {
    margin-top: 15px;
    margin-bottom: 5px;
    font-size: 14px;
    color: #94a3b8;
  }

  .image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 300px;
    color: #64748b;
  }
}

.bottom-action-area {
  margin-top: 40px;
  display: flex;
  justify-content: center;

  .big-bottom-btn {
    width: 320px;
    height: 54px;
    font-size: 16px;
    font-weight: 700;
    border-radius: 27px;
    letter-spacing: 1px;
    transition: all 0.3s ease;
    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px rgba(6, 182, 212, 0.4);
    }
  }
}

.markdown-body {
  font-size: 16px;
  line-height: 1.8;
  color: #cbd5e1;
  text-align: left;

  ::v-deep {
    h1,
    h2,
    h3 {
      color: #fff;
      margin-top: 30px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.3;
    }
    h1 {
      font-size: 2.2em;
      border-bottom: 1px solid #30363d;
      padding-bottom: 0.3em;
    }
    h2 {
      font-size: 1.6em;
      border-bottom: 1px solid #30363d;
      padding-bottom: 0.3em;
    }
    h3 {
      font-size: 1.3em;
      color: #93c5fd;
    }
    p {
      margin-top: 0;
      margin-bottom: 18px;
      line-height: 1.7;
    }
    ul,
    ol {
      padding-left: 2em;
      margin-bottom: 18px;
    }
    li {
      margin: 0.3em 0;
    }
    strong {
      color: #60a5fa;
      font-weight: 700;
    }
    code {
      background: rgba(255, 255, 255, 0.1);
      padding: 3px 6px;
      border-radius: 4px;
      font-family: Consolas, monospace;
      font-size: 0.9em;
      color: #fbbf24;
    }
    pre {
      background: #000;
      border: 1px solid #334155;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin-bottom: 20px;
      code {
        background: transparent;
        padding: 0;
        color: #e2e8f0;
      }
    }
    .katex-display {
      margin: 20px 0;
      overflow-x: auto;
      overflow-y: hidden;
      padding: 10px 0;
      color: #34d399;
    }
    blockquote {
      padding: 10px 20px;
      color: #94a3b8;
      border-left: 4px solid #3b82f6;
      margin: 0 0 20px 0;
      background: rgba(59, 130, 246, 0.08);
      border-radius: 0 8px 8px 0;
    }
  }

  .no-data {
    color: #475569;
    font-style: italic;
    text-align: center;
    margin-top: 50px;
  }
}

/* 🌟 图表解读框的极客风样式 */
.image-caption-box {
  margin-top: 20px;
  padding: 16px 20px;
  background: rgba(59, 130, 246, 0.1);
  border-left: 4px solid #3b82f6;
  border-radius: 0 8px 8px 0;
  text-align: left;
}

.image-caption-box .caption-title {
  color: #60a5fa;
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 8px;
}

.image-hint {
  margin-top: 15px;
  font-size: 13px;
  color: #64748b;
}

/* 🌟 核心修改：覆盖 markdown-body 在解读框里的默认段落间距 */
.image-caption-box .caption-text.markdown-body ::v-deep p {
  margin-bottom: 10px;
  font-size: 14px;
  line-height: 1.6;
  color: #cbd5e1;
}
.image-caption-box .caption-text.markdown-body ::v-deep p:last-child {
  margin-bottom: 0;
}
/* 🌟 核心修改：让公式颜色和整体极客蓝更搭 */
.image-caption-box .caption-text.markdown-body ::v-deep .katex {
  color: #60a5fa;
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
@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

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
::v-deep .glow-btn-cyan {
  background: linear-gradient(135deg, #06b6d4, #0ea5e9) !important;
  border: none !important;
  color: #fff;
  box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3);
  &:hover {
    box-shadow: 0 6px 25px rgba(6, 182, 212, 0.6);
  }
}
.text-gray {
  color: #64748b;
}
</style>
