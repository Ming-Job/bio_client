<template>
  <div class="assistant-inner">
    <!-- 分析输入区 -->
    <div class="analysis-input-section">
      <div class="input-header">
        <div class="header-content">
          <i class="el-icon-cpu header-icon"></i>
          <span class="header-title">分析助手</span>
          <el-tooltip
            content="输入分析需求，AI将生成对应的python/R代码"
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
            <span>生成的代码</span>
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

            <!-- 执行代码区域 -->
            <div class="execution-actions">
              <el-select
                v-model="language"
                size="small"
                style="width: 100px; margin-right: 10px"
              >
                <el-option label="Python" value="python"></el-option>
                <el-option label="R" value="r"></el-option>
                <el-option label="JavaScript" value="javascript"></el-option>
              </el-select>

              <el-button
                type="success"
                @click="executeCode"
                class="execute-btn"
                :loading="executing"
              >
                <i class="el-icon-video-play"></i>
                执行代码
              </el-button>

              <el-button
                v-if="executionId"
                type="info"
                size="small"
                @click="checkExecutionStatus"
                :loading="checkingStatus"
              >
                检查状态
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

    <!-- 执行结果区域 -->
    <transition name="el-fade-in">
      <div v-if="executionResult" class="execution-result-section">
        <div class="result-header">
          <span class="result-title">执行结果</span>
          <div class="result-status">
            <el-tag
              :type="
                executionResult.status === 'completed'
                  ? 'success'
                  : executionResult.status === 'error'
                  ? 'danger'
                  : 'warning'
              "
              size="small"
            >
              {{ executionResult.status }}
            </el-tag>
            <span v-if="executionResult.executionTime" class="time-info">
              执行时间: {{ executionResult.executionTime }}ms
            </span>
          </div>
          <div class="result-actions">
            <el-tooltip content="清空结果" placement="top">
              <el-button
                circle
                size="small"
                @click="clearExecutionResult"
                class="action-btn"
              >
                <i class="el-icon-delete"></i>
              </el-button>
            </el-tooltip>
          </div>
        </div>

        <div class="result-content">
          <!-- 控制台输出 -->
          <div v-if="executionResult.output" class="console-output">
            <div class="output-header">
              <i class="el-icon-cpu"></i>
              <span>控制台输出</span>
            </div>
            <pre class="output-content">{{ executionResult.output }}</pre>
          </div>

          <!-- 错误信息 -->
          <div v-if="executionResult.error" class="error-output">
            <div class="error-header">
              <i class="el-icon-warning"></i>
              <span>错误信息</span>
            </div>
            <pre class="error-content">{{ executionResult.error }}</pre>
          </div>

          <!-- 图表输出 -->
          <div
            v-if="executionResult.images && executionResult.images.length > 0"
            class="image-output"
          >
            <div class="image-header">
              <i class="el-icon-picture"></i>
              <span>生成的图表</span>
            </div>
            <div class="image-grid">
              <div
                v-for="(image, index) in executionResult.images"
                :key="index"
                class="image-item"
              >
                <el-image
                  :src="image"
                  :preview-src-list="executionResult.images"
                  fit="contain"
                  style="width: 100%; height: 200px"
                >
                  <div slot="error" class="image-slot">
                    <i class="el-icon-picture-outline"></i>
                  </div>
                </el-image>
              </div>
            </div>
          </div>
        </div>
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
      checkingStatus: false,
      codeExpanded: true,
      language: "python",
      executionResult: null,
      executionId: null,
      pollInterval: null,
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
      // 清空之前的执行结果
      this.clearExecutionResult();

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

    async executeCode() {
      if (!this.code.trim()) {
        this.$message.warning("请先生成代码");
        return;
      }

      this.executing = true;
      this.executionResult = null;

      try {
        const response = await fetch(
          "http://localhost:8080/api/execution/execute",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: this.code,
              language: this.language,
              taskId: Date.now().toString(),
            }),
          }
        );

        const data = await response.json();
        if (data.success) {
          this.executionId = data.data.taskId;
          this.$message.success("代码执行已提交");

          // 开始轮询执行状态
          this.startPollingStatus();
        } else {
          this.$message.error(data.message || "执行失败");
        }
      } catch (error) {
        this.$message.error("请求失败: " + error.message);
      } finally {
        this.executing = false;
      }
    },

    // 开始轮询执行状态
    startPollingStatus() {
      // 清除之前的轮询
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
      }

      // 第一次立即检查
      this.checkExecutionStatus();

      // 设置轮询（每2秒检查一次）
      this.pollInterval = setInterval(() => {
        if (this.executionId) {
          this.checkExecutionStatus();
        }
      }, 2000);

      // 5分钟后停止轮询
      setTimeout(() => {
        if (this.pollInterval) {
          clearInterval(this.pollInterval);
          this.pollInterval = null;
        }
      }, 5 * 60 * 1000);
    },

    // 检查执行状态
    async checkExecutionStatus() {
      if (!this.executionId) return;

      this.checkingStatus = true;
      try {
        const response = await fetch(
          `http://localhost:8080/api/execution/status/${this.executionId}`
        );
        const data = await response.json();

        if (data.success && data.data) {
          this.executionResult = data.data;

          // 如果执行完成或出错，停止轮询
          if (["completed", "error", "expired"].includes(data.data.status)) {
            if (this.pollInterval) {
              clearInterval(this.pollInterval);
              this.pollInterval = null;
            }

            if (data.data.status === "completed") {
              this.$notify({
                title: "执行完成",
                message: `代码执行成功，耗时${data.data.executionTime}ms`,
                type: "success",
              });
            }
          }
        }
      } catch (error) {
        console.error("检查状态失败:", error);
      } finally {
        this.checkingStatus = false;
      }
    },

    // 清空执行结果
    clearExecutionResult() {
      this.executionResult = null;
      this.executionId = null;
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
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
      const extension =
        this.language === "python" ? "py" : this.language === "r" ? "R" : "js";
      const blob = new Blob([this.code], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analysis_${Date.now()}.${extension}`;
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
  width: 900px;
  max-width: 90%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #e4e7ed;
  margin: 20px auto;
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
  gap: 12px;
  flex-wrap: wrap;
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

/* 执行结果区域样式 */
.execution-result-section {
  margin: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e4e7ed;
}

.result-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.result-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-info {
  font-size: 12px;
  color: #909399;
}

.result-actions {
  display: flex;
  gap: 4px;
}

.result-content {
  padding: 16px;
}

.console-output,
.error-output,
.image-output {
  margin-bottom: 20px;
}

.output-header,
.error-header,
.image-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #409eff;
}

.error-header {
  color: #f56c6c;
}

.output-content,
.error-content {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow: auto;
  max-height: 300px;
}

.error-content {
  background: #fef0f0;
  border-color: #fde2e2;
  color: #f56c6c;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 8px;
}

.image-item {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
  background: #f5f7fa;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
  font-size: 30px;
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

.el-fade-in-enter-active,
.el-fade-in-leave-active {
  transition: opacity 0.3s ease;
}

.el-fade-in-enter-from,
.el-fade-in-leave-to {
  opacity: 0;
}
</style>
