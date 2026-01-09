<template>
  <div class="assistant-inner">
    <!-- 分析输入区 -->
    <div class="analysis-input-section">
      <div class="input-header">
        <div class="header-content">
          <i class="el-icon-cpu header-icon"></i>
          <span class="header-title">分析助手</span>
          <el-tooltip
            content="输入分析需求，AI将生成对应的R代码"
            placement="top"
          >
            <i class="el-icon-question help-icon"></i>
          </el-tooltip>
        </div>
        <el-tag size="small" effect="dark" type="info">Beta</el-tag>
      </div>

      <div class="input-container">
        <el-input
          v-model="userInput"
          placeholder="输入分析需求，例如：两组数据的t检验并绘制箱线图"
          @keyup.enter.native="askAssistant"
          class="analysis-input"
          type="textarea"
          :rows="2"
          :autosize="{ minRows: 2, maxRows: 4 }"
        />

        <div class="input-actions">
          <div class="quick-actions">
            <el-tooltip content="清除输入" placement="top">
              <el-button
                circle
                size="small"
                @click="userInput = ''"
                :disabled="!userInput"
              >
                <i class="el-icon-delete"></i>
              </el-button>
            </el-tooltip>

            <el-tooltip content="添加示例" placement="top">
              <el-dropdown @command="addExample" trigger="click" size="small">
                <el-button circle>
                  <i class="el-icon-magic-stick"></i>
                </el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item
                    v-for="(example, index) in examples"
                    :key="index"
                    :command="example"
                  >
                    {{ example }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </el-tooltip>
          </div>

          <el-button
            type="primary"
            @click="askAssistant"
            :loading="loading"
            class="generate-btn"
            :disabled="!userInput.trim()"
          >
            <i class="el-icon-search"></i>
            生成代码
          </el-button>
        </div>
      </div>
    </div>

    <!-- 代码输出区 -->
    <transition name="slide-fade">
      <div v-if="code" class="code-output-section">
        <div class="output-header">
          <div class="output-title">
            <i class="el-icon-document"></i>
            <span>生成的R代码</span>
            <el-badge
              v-if="codeLines > 0"
              :value="`${codeLines}行`"
              class="lines-badge"
            />
          </div>

          <div class="output-actions">
            <el-tooltip content="复制代码" placement="top">
              <el-button
                circle
                size="small"
                @click="copyToClipboard"
                class="action-btn"
              >
                <i class="el-icon-document-copy"></i>
              </el-button>
            </el-tooltip>

            <el-tooltip content="下载代码文件" placement="top">
              <el-button
                circle
                size="small"
                @click="downloadCode"
                class="action-btn"
              >
                <i class="el-icon-download"></i>
              </el-button>
            </el-tooltip>

            <el-tooltip content="折叠代码" placement="top">
              <el-button
                circle
                size="small"
                @click="toggleCode"
                class="action-btn"
              >
                <i class="el-icon-arrow-up" v-if="codeExpanded"></i>
                <i class="el-icon-arrow-down" v-else></i>
              </el-button>
            </el-tooltip>
          </div>
        </div>

        <transition name="el-collapse-transition">
          <div v-if="codeExpanded" class="code-content">
            <div class="code-wrapper">
              <pre
                ref="codeBlock"
                class="language-r"
              ><code>{{ code }}</code></pre>
            </div>

            <div class="execution-actions">
              <el-button
                type="success"
                @click="executeCode"
                class="execute-btn"
                :loading="executing"
              >
                <i class="el-icon-video-play"></i>
                执行代码
              </el-button>

              <el-alert
                title="代码将在安全的沙箱环境中执行"
                type="info"
                :closable="false"
                show-icon
                class="execution-alert"
              />
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 状态指示器 -->
    <div v-if="loading" class="status-indicator">
      <div class="status-content">
        <i class="el-icon-loading spinner"></i>
        <span>正在生成代码...</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "AnalysisAssistantInner",
  data() {
    return {
      userInput: "",
      code: "",
      loading: false,
      executing: false,
      codeExpanded: true,
      examples: [
        "两组独立样本的t检验，并绘制箱线图",
        "线性回归分析，展示回归系数和残差图",
        "主成分分析(PCA)并绘制双标图",
        "时间序列的ARIMA模型拟合与预测",
        "K-means聚类分析并可视化结果",
        "生存分析的Kaplan-Meier曲线绘制",
      ],
    };
  },
  computed: {
    codeLines() {
      if (!this.code) return 0;
      return this.code.split("\n").length;
    },
  },
  methods: {
    async askAssistant() {
      if (!this.userInput.trim()) {
        this.$message.warning("请输入分析需求");
        return;
      }

      this.loading = true;
      try {
        const response = await fetch(
          "http://localhost:8080/api/analysis/assist",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: this.userInput }),
          }
        );
        const data = await response.json();
        this.code = data.code;
        this.codeExpanded = true;
      } catch (error) {
        this.$message.error("请求失败，请检查网络连接");
      } finally {
        this.loading = false;
      }
    },

    executeCode() {
      this.executing = true;
      // 模拟执行过程
      setTimeout(() => {
        this.$message({
          message: "代码执行完成",
          type: "success",
          duration: 2000,
        });
        this.executing = false;
      }, 1500);
    },

    copyToClipboard() {
      navigator.clipboard
        .writeText(this.code)
        .then(() => {
          this.$message.success("代码已复制到剪贴板");
        })
        .catch((err) => {
          this.$message.error("复制失败");
          console.error("复制失败:", err);
        });
    },

    downloadCode() {
      const blob = new Blob([this.code], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analysis_${Date.now()}.py`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      this.$message.success("代码文件已下载");
    },

    addExample(example) {
      this.userInput = example;
    },

    toggleCode() {
      this.codeExpanded = !this.codeExpanded;
    },
  },
};
</script>

<style lang="scss" scoped>
.assistant-inner {
  width: 900px; /* 缩小宽度为900px */
  max-width: 90%; /* 在小屏幕上自适应 */
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #e4e7ed;
  margin: 20px auto; /* 水平居中 */
}

/* 输入区样式 */
.analysis-input-section {
  padding: 20px;
  border-bottom: 1px solid #f0f2f5;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
}

.input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  color: #409eff;
  font-size: 18px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.help-icon {
  color: #909399;
  font-size: 14px;
  cursor: pointer;
}

.input-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.analysis-input ::v-deep .el-textarea__inner {
  border: 1.5px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.5;
  background: #ffffff;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

  &:focus {
    border-color: #409eff;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.12);
  }
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quick-actions {
  display: flex;
  gap: 8px;
}

.generate-btn {
  padding: 8px 20px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.2);

  &:hover:not(.is-disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(64, 158, 255, 0.3);
  }
}

/* 代码输出区样式 */
.code-output-section {
  border-top: 1px solid #f0f2f5;
}

.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e4e7ed;
}

.output-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
}

.output-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  color: #606266;
  transition: all 0.2s ease;

  &:hover {
    color: #409eff;
    background: rgba(64, 158, 255, 0.08);
  }
}

.lines-badge ::v-deep .el-badge__content {
  background-color: #909399;
  border: none;
  font-weight: 500;
}

.code-content {
  padding: 20px;
  background: #fafbfc;
}

.code-wrapper {
  background: #1e1e1e;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  overflow: auto;
  max-height: 400px;
}

.code-wrapper pre {
  margin: 0;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #d4d4d4;
  white-space: pre-wrap;
  word-wrap: break-word;
  position: relative;
}

.code-wrapper code {
  display: block;
  counter-reset: line;

  &:before {
    counter-increment: line;
    content: counter(line);
    display: inline-block;
    width: 2em;
    padding-right: 1em;
    margin-right: 1em;
    text-align: right;
    color: #6a9955;
    border-right: 1px solid #3e3e3e;
    user-select: none;
  }
}

.execution-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.execute-btn {
  min-width: 120px;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(103, 194, 58, 0.2);

  &:hover:not(.is-loading) {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(103, 194, 58, 0.3);
  }
}

.execution-alert {
  flex: 1;
  border-radius: 6px;
  background: #f4f4f5;
  border: none;

  ::v-deep .el-alert__content {
    padding: 0;
  }
}

/* 状态指示器 */
.status-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.status-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.spinner {
  animation: spin 1s linear infinite;
  color: #409eff;
  font-size: 18px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 过渡动画 */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
