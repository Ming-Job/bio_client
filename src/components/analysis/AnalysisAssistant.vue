<template>
  <div class="assistant-wrapper">
    <div class="assistant-layout">
      <div class="generation-area">
        <div class="area-header">
          <div class="header-title">
            <i class="el-icon-magic-stick"></i>
            <h3>AI 极客副驾 (Code Copilot)</h3>
            <div class="code-info" v-if="generatedCode">
              <el-tag size="small" effect="dark" :type="getLanguageTagType()">
                {{ language.toUpperCase() }}
              </el-tag>
              <span class="lines-count">{{ codeLines }} 行</span>
            </div>
          </div>
          <div class="header-status">
            <el-tag
              size="small"
              effect="dark"
              type="success"
              v-if="codeStatus === 'generated'"
            >
              已生成
            </el-tag>
            <el-tag
              size="small"
              effect="dark"
              type="warning"
              v-else-if="codeStatus === 'generating'"
            >
              <i class="el-icon-loading"></i> 生成中
            </el-tag>
            <el-tag size="small" effect="plain" type="info" v-else
              >等待输入</el-tag
            >
          </div>
        </div>

        <div class="area-content">
          <div class="input-section">
            <el-input
              v-model="userInput"
              type="textarea"
              :rows="3"
              placeholder="输入你的数据处理需求，例如：使用 pandas 读取数据舱的 CSV 矩阵，并用 seaborn 绘制表达量热图..."
              resize="none"
              @keyup.enter.native="askAssistant"
              class="generation-input dark-textarea"
            />
          </div>

          <div class="quick-examples">
            <span class="examples-label"
              ><i class="el-icon-s-opportunity"></i> 极客提示词 (Prompt
              Templates)：</span
            >
            <div class="examples-grid">
              <el-button
                v-for="(example, index) in examples"
                :key="index"
                size="mini"
                @click="userInput = example"
                class="example-btn dark-plain-btn"
              >
                {{ example }}
              </el-button>
            </div>
          </div>

          <div class="action-section">
            <div class="action-left">
              <el-button
                size="small"
                @click="clearInput"
                :disabled="!userInput"
                icon="el-icon-delete"
                class="dark-plain-btn"
              >
                清空输入
              </el-button>
            </div>
            <div class="action-right">
              <el-button
                type="primary"
                @click="askAssistant"
                :loading="loading"
                icon="el-icon-cpu"
                class="generate-btn glow-btn"
              >
                {{ loading ? "引擎推演中..." : "生成可执行代码" }}
              </el-button>
            </div>
          </div>

          <div v-if="generatedCode" class="generated-code-section">
            <div class="section-header">
              <div class="header-left">
                <i class="el-icon-document"></i>
                <span class="section-title">AI 输出的脚本</span>
                <el-tag
                  size="mini"
                  type="success"
                  effect="dark"
                  v-if="codeStatus === 'generated'"
                >
                  只读模式
                </el-tag>
              </div>
              <div class="header-right">
                <el-tooltip content="复制代码" placement="top">
                  <el-button
                    size="small"
                    circle
                    class="dark-circle-btn"
                    @click="copyGeneratedCode"
                    icon="el-icon-document-copy"
                  />
                </el-tooltip>
                <el-tooltip content="下载 .py/.r 文件" placement="top">
                  <el-button
                    size="small"
                    circle
                    class="dark-circle-btn"
                    @click="downloadGeneratedCode"
                    icon="el-icon-download"
                  />
                </el-tooltip>
              </div>
            </div>

            <div class="code-display">
              <div class="code-container">
                <pre v-highlight="generatedCode">
                  <code :class="'language-' + language">{{ generatedCode }}</code>
                </pre>
                <div class="readonly-overlay">
                  <div class="overlay-content">
                    <i class="el-icon-lock"></i>
                    <span>终端沙盒锁定 - 代码不可直接编辑</span>
                    <el-tag size="mini" type="info" effect="dark"
                      >请复制到下方执行区</el-tag
                    >
                  </div>
                </div>
              </div>
            </div>

            <div class="code-actions">
              <div class="action-hint">
                <i class="el-icon-info"></i>
                <span>检验代码无误后，可一键发送至下方算力节点</span>
              </div>
              <el-button
                size="small"
                @click="copyToExecution"
                icon="el-icon-bottom"
                type="success"
                class="glow-btn-success"
              >
                提取并载入执行区
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="execution-area">
        <div class="area-header">
          <div class="header-title">
            <i class="el-icon-video-play"></i>
            <h3>算力执行节点 (Compute Sandbox)</h3>
            <div class="execution-status" v-if="executionStatus !== 'idle'">
              <el-tag
                size="small"
                effect="dark"
                type="info"
                v-if="executionStatus === 'idle'"
                >等待挂载</el-tag
              >
              <el-tag
                size="small"
                effect="dark"
                class="blink-tag"
                type="warning"
                v-else-if="
                  executionStatus === 'executing' ||
                  executionStatus === 'pending'
                "
              >
                <i class="el-icon-loading"></i> 算力运转中
              </el-tag>
              <el-tag
                size="small"
                effect="dark"
                type="success"
                v-else-if="executionStatus === 'completed'"
                >执行完成</el-tag
              >
              <el-tag
                size="small"
                effect="dark"
                type="danger"
                v-else-if="executionStatus === 'error'"
                >进程崩溃</el-tag
              >
            </div>
          </div>
          <div class="header-actions">
            <el-button
              size="small"
              @click="clearExecutionCode"
              :disabled="!executionCode"
              icon="el-icon-delete"
              class="dark-plain-btn"
              >清空代码</el-button
            >
            <el-button
              size="small"
              @click="copyExecutionCode"
              :disabled="!executionCode"
              icon="el-icon-document-copy"
              class="dark-plain-btn"
              >复制代码</el-button
            >
          </div>
        </div>

        <div class="area-content">
          <div class="execution-input-section">
            <div class="input-header">
              <span class="input-label">
                <i class="el-icon-edit"></i> 终端编辑器 (Vim-like)
              </span>
              <div class="input-info">
                <el-select
                  v-model="language"
                  size="small"
                  class="dark-select"
                  style="width: 120px"
                >
                  <el-option label="Python 3.9" value="python">
                    <span class="language-option"
                      ><i class="el-icon-s-data" style="color: #3b82f6"></i>
                      Python</span
                    >
                  </el-option>
                  <el-option label="R 4.2" value="r">
                    <span class="language-option"
                      ><i class="el-icon-s-data" style="color: #10b981"></i>
                      R</span
                    >
                  </el-option>
                </el-select>
                <span class="lines-count" v-if="executionCode"
                  >{{ executionCodeLines }} 行</span
                >
              </div>
            </div>

            <div class="code-editor-container">
              <textarea
                v-model="executionCode"
                class="execution-code-editor"
                :placeholder="'在此挂载 ' + language.toUpperCase() + ' 脚本...'"
                spellcheck="false"
                @input="onExecutionCodeChange"
                @keydown.tab.prevent="insertTab"
                rows="15"
              ></textarea>
            </div>
          </div>

          <div class="execution-controls">
            <div class="control-group">
              <div class="control-item">
                <label class="control-label">调度模式：</label>
                <el-select
                  v-model="executionMode"
                  size="small"
                  class="dark-select"
                  style="width: 160px"
                >
                  <el-option label="集群异步排队" value="async">
                    <span class="mode-option"
                      ><i class="el-icon-time"></i> 集群异步排队</span
                    >
                  </el-option>
                  <el-option label="节点阻塞直跑" value="sync">
                    <span class="mode-option"
                      ><i class="el-icon-s-check"></i> 节点阻塞直跑</span
                    >
                  </el-option>
                </el-select>
              </div>
              <div class="control-item">
                <label class="control-label">内存剔除阈值：</label>
                <el-select
                  v-model="timeout"
                  size="small"
                  class="dark-select"
                  style="width: 120px"
                >
                  <el-option label="30秒 (Debug)" value="30"></el-option>
                  <el-option label="1分钟" value="60"></el-option>
                  <el-option label="5分钟" value="300"></el-option>
                  <el-option label="10分钟 (Heavy)" value="600"></el-option>
                </el-select>
              </div>
            </div>

            <div class="execution-actions">
              <div class="security-notice">
                <div class="notice-content">
                  <i class="el-icon-lock" style="color: #3b82f6"></i>
                  <span>Docker 容器隔离层已激活</span>
                </div>
                <div class="notice-detail">
                  <span>算力上限：4 Cores | 内存：16GB | 不允许外网外联</span>
                </div>
              </div>

              <div class="action-buttons">
                <el-button
                  type="success"
                  @click="executeCode"
                  :loading="executing"
                  :disabled="!canExecute"
                  icon="el-icon-video-play"
                  class="execute-btn glow-btn-success"
                >
                  {{ executing ? "提交集群..." : "发射代码任务" }}
                </el-button>

                <el-button
                  type="info"
                  @click="checkExecutionStatus"
                  :loading="checkingStatus"
                  :disabled="!hasExecutionId"
                  icon="el-icon-refresh"
                  class="dark-plain-btn"
                  v-if="executionMode === 'async'"
                >
                  探针检测
                </el-button>

                <el-button
                  type="danger"
                  @click="stopExecution"
                  :disabled="!isExecuting"
                  icon="el-icon-switch-button"
                  class="dark-plain-btn-danger"
                >
                  强行 Kill
                </el-button>
              </div>
            </div>
          </div>

          <div v-if="executionResult" class="execution-output-section">
            <div class="output-header">
              <div class="output-title">
                <i class="el-icon-monitor"></i>
                <h4>终端 Stdout/Stderr</h4>
                <span
                  class="execution-time"
                  v-if="executionResult?.executionTime"
                >
                  <i class="el-icon-time"></i> 耗时：{{
                    executionResult.executionTime
                  }}ms
                </span>
                <span class="memory-usage" v-if="executionResult?.memoryUsage">
                  <i class="el-icon-cpu"></i> 峰值内存：{{
                    executionResult.memoryUsage
                  }}MB
                </span>
              </div>
              <div class="output-actions">
                <el-button
                  size="mini"
                  @click="copyOutput"
                  icon="el-icon-document-copy"
                  class="dark-circle-btn"
                ></el-button>
                <el-button
                  size="mini"
                  @click="clearOutput"
                  icon="el-icon-delete"
                  class="dark-circle-btn"
                ></el-button>
              </div>
            </div>

            <div class="output-content">
              <div v-if="executionResult?.error" class="error-output">
                <div class="error-header">
                  <i class="el-icon-warning-outline"></i>
                  <span class="error-title"
                    >Traceback (most recent call last)</span
                  >
                  <el-tag type="danger" effect="dark" size="mini"
                    >Exit Code 1</el-tag
                  >
                </div>
                <pre class="error-detail">{{ executionResult.error }}</pre>
              </div>

              <div v-if="executionResult?.output" class="std-output">
                <div class="output-header">
                  <i class="el-icon-s-data"></i>
                  <span class="output-title">Console Output</span>
                  <el-tag type="success" effect="dark" size="mini"
                    >Exit Code 0</el-tag
                  >
                </div>
                <pre class="output-detail">{{ executionResult.output }}</pre>
              </div>

              <div
                v-else-if="executionResult?.status === 'completed'"
                class="no-output"
              >
                <i class="el-icon-chat-dot-round"></i>
                <p>脚本运行完毕，未捕捉到任何打印输出 (Stdout)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="visualization-area" v-if="showVisualizationArea">
        <div class="area-header">
          <div class="header-title">
            <i class="el-icon-picture"></i>
            <h3>可视化矩阵 (Visualization)</h3>
            <div class="charts-info" v-if="hasCharts">
              <el-tag size="small" type="success" effect="dark">
                截获 {{ executionResult.images.length }} 张流媒体图表
              </el-tag>
            </div>
          </div>
          <div class="header-actions">
            <el-button
              size="small"
              @click="clearVisualization"
              :disabled="!hasCharts && !executionResult"
              icon="el-icon-delete"
              class="dark-plain-btn"
              >清空画板</el-button
            >
            <el-button
              size="small"
              @click="exportAllCharts"
              :disabled="!hasCharts"
              icon="el-icon-download"
              type="primary"
              class="glow-btn"
              >导出全套 PDF</el-button
            >
          </div>
        </div>

        <div class="area-content">
          <div v-if="hasCharts" class="charts-display">
            <div class="charts-grid">
              <div
                v-for="(image, index) in executionResult.images"
                :key="index"
                class="chart-item"
              >
                <div class="chart-container">
                  <div class="chart-header">
                    <span class="chart-title">Figure_{{ index + 1 }}.png</span>
                    <div class="chart-actions">
                      <el-button
                        size="mini"
                        circle
                        @click="previewChart(image)"
                        icon="el-icon-view"
                        class="dark-circle-btn"
                      />
                      <el-button
                        size="mini"
                        circle
                        @click="downloadChart(image, index)"
                        icon="el-icon-download"
                        class="dark-circle-btn"
                      />
                    </div>
                  </div>
                  <div class="chart-content">
                    <img
                      :src="image"
                      :alt="'图表 ' + (index + 1)"
                      @error="handleImageError"
                      class="chart-image"
                    />
                  </div>
                  <div class="chart-footer">
                    <span class="chart-index">High-Res Rendered</span>
                    <span class="chart-size">PNG / Base64</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            v-else-if="executionResult?.status === 'completed'"
            class="no-charts"
          >
            <div class="no-charts-content">
              <i class="el-icon-picture-outline"></i>
              <p>本次分析未触发绘图引擎</p>
              <span class="hint"
                >如果需要出图，请在代码中显式调用
                matplotlib.pyplot.savefig()</span
              >
              <div class="hint-code">
                <code>plt.savefig('output.png', dpi=300)</code>
              </div>
            </div>
          </div>

          <div v-else class="waiting-execution">
            <div class="waiting-content">
              <i class="el-icon-loading"></i>
              <p>监听进程中...</p>
              <span class="hint">如果脚本生成了图像，这里将自动渲染</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading-overlay">
        <div class="loading-content">
          <div class="loading-spinner">
            <i class="el-icon-loading"></i>
          </div>
          <p class="loading-text">Bio-OS AI Engine 正在极速推演逻辑...</p>
          <p class="loading-subtext">正在扫描上下文并生成高鲁棒性代码框架</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// 这里保持你的所有逻辑原封不动
import request from "@/api/request";

export default {
  name: "AnalysisAssistant",
  data() {
    return {
      userInput: "",
      generatedCode: "",
      language: "python",
      executionCode: "",
      executionMode: "async",
      timeout: "60",
      executionId: null,
      executionResult: null,
      executionStatus: "idle",
      loading: false,
      executing: false,
      checkingStatus: false,
      examples: [
        "两组独立样本的t检验，并绘制火山图",
        "使用 pandas 读取 data.csv，做主成分分析(PCA)并绘制双标图",
        "时间序列的 ARIMA 模型拟合与预测",
        "利用 seaborn 绘制表达量矩阵的热图 (Heatmap)",
        "生存分析的 Kaplan-Meier 曲线绘制",
      ],
      codeStatus: "empty",
      pollTimer: null,
      timeoutTimer: null,
    };
  },
  computed: {
    codeLines() {
      return this.generatedCode ? this.generatedCode.split("\n").length : 0;
    },
    executionCodeLines() {
      return this.executionCode ? this.executionCode.split("\n").length : 0;
    },
    showVisualizationArea() {
      return this.executionResult || this.executionStatus !== "idle";
    },
    hasCharts() {
      return (
        this.executionResult?.images && this.executionResult.images.length > 0
      );
    },
    canExecute() {
      return this.executionCode && this.executionCode.trim() && !this.executing;
    },
    hasExecutionId() {
      return this.executionId && this.executionMode === "async";
    },
    isExecuting() {
      return (
        this.executionStatus === "executing" ||
        this.executionStatus === "pending"
      );
    },
  },
  beforeDestroy() {
    this.clearPolling();
  },
  methods: {
    insertTab(e) {
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const spaces = "    ";
      this.executionCode =
        this.executionCode.substring(0, start) +
        spaces +
        this.executionCode.substring(end);
      this.$nextTick(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
      });
    },
    async askAssistant() {
      if (!this.userInput.trim()) {
        this.$message.warning("请输入分析需求");
        return;
      }
      this.loading = true;
      this.codeStatus = "generating";
      try {
        const response = await request({
          url: "/api/analysis/assist",
          method: "post",
          data: { question: this.userInput },
        });
        const data = response.data || response;
        this.generatedCode = data.code;
        this.codeStatus = "generated";
        this.$message.success("代码生成成功, 已同步至上方代码区");
      } catch (error) {
        this.$message.error("生成代码失败：" + (error.message || error));
        this.codeStatus = "empty";
      } finally {
        this.loading = false;
      }
    },
    clearInput() {
      this.userInput = "";
      this.$message.info("已清空");
    },
    getLanguageTagType() {
      return this.language === "python" ? "success" : "primary";
    },
    copyGeneratedCode() {
      if (!this.generatedCode) return;
      navigator.clipboard
        .writeText(this.generatedCode)
        .then(() => this.$message.success("代码已复制"))
        // 🌟 把 err 拼接到提示信息里，ESLint 就不会拦截了
        .catch((err) => this.$message.error("复制失败: " + err.message));
    },
    downloadGeneratedCode() {
      if (!this.generatedCode) return;
      const extension = this.language === "python" ? "py" : "R";
      const filename = `bio_os_script_${Date.now()}.${extension}`;
      const blob = new Blob([this.generatedCode], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    extractCodeFromMarkdown(code) {
      const pythonRegex = /```python[ \t]*\n([\s\S]*?)```/i;
      const rRegex = /```r[ \t]*\n([\s\S]*?)```/i;
      const genericRegex = /```[ \t]*\n([\s\S]*?)```/;
      let match =
        this.language === "python" ? pythonRegex.exec(code) : rRegex.exec(code);
      if (!match) match = genericRegex.exec(code);
      return match ? match[1].trim() : code;
    },
    copyToExecution() {
      if (!this.generatedCode) return;
      this.executionCode = this.extractCodeFromMarkdown(this.generatedCode);
      this.$message.success("代码已安全提取并挂载至执行器");
    },
    clearExecutionCode() {
      this.executionCode = "";
    },
    copyExecutionCode() {
      if (!this.executionCode) return;
      navigator.clipboard
        .writeText(this.executionCode)
        .then(() => this.$message.success("代码已复制"));
    },
    onExecutionCodeChange() {},
    async executeCode() {
      if (!this.canExecute) return;
      this.executing = true;
      this.executionStatus = "executing";
      this.executionResult = null;
      try {
        const url =
          this.executionMode === "async"
            ? "/api/code/execute"
            : "/api/code/execute-sync";
        const response = await request({
          url: url,
          method: "post",
          data: {
            code: this.executionCode,
            language: this.language,
            timeout: parseInt(this.timeout),
          },
        });
        const data = response.data || response;
        if (this.executionMode === "async") {
          if (data.success || data.taskId) {
            this.executionId = data.taskId;
            this.$message.success(`任务提交，ID: ${data.taskId}`);
            this.startPolling();
          } else throw new Error(data.error || "任务下发失败");
        } else {
          this.handleExecutionResult(data);
        }
      } catch (error) {
        this.executionStatus = "error";
        this.$message.error("执行拒绝：" + (error.message || error));
      } finally {
        if (this.executionMode !== "async") this.executing = false;
      }
    },
    startPolling() {
      this.clearPolling();
      const timeoutMs = parseInt(this.timeout) * 1000 + 5000;
      this.timeoutTimer = setTimeout(() => {
        this.clearPolling();
        if (
          this.executionStatus === "executing" ||
          this.executionStatus === "pending"
        ) {
          this.$message.warning("执行超时，前端已切断游离连接");
          this.executionStatus = "error";
          this.executing = false;
        }
      }, timeoutMs);
      this.checkExecutionStatus();
    },
    async checkExecutionStatus() {
      if (!this.executionId) return;
      this.checkingStatus = true;
      try {
        const response = await request({
          url: `/api/code/result/${this.executionId}`,
          method: "get",
        });
        if (response.status === 404) {
          this.$message.warning("句柄失效");
          this.clearPolling();
          this.executing = false;
          return;
        }
        const result = response.data || response;
        this.handleExecutionResult(result);
        if (result.status === "pending" || result.status === "executing") {
          this.pollTimer = setTimeout(() => {
            this.checkExecutionStatus();
          }, 2000);
        }
      } catch (error) {
        this.pollTimer = setTimeout(() => {
          this.checkExecutionStatus();
        }, 3000);
      } finally {
        this.checkingStatus = false;
      }
    },
    handleExecutionResult(result) {
      this.executionResult = result;
      this.executionStatus = result.status;
      if (result.status === "completed" || result.status === "error") {
        this.clearPolling();
        this.executing = false;
        if (result.status === "completed")
          this.$message.success(`进程终结，耗时 ${result.executionTime} ms`);
        else this.$message.error("抛出异常：" + (result.error || "Unknown"));
      }
    },
    stopExecution() {
      this.executionStatus = "idle";
      this.executing = false;
      this.clearPolling();
      this.executionResult = null;
      this.$message.info("Kill 指令已发送");
    },
    clearPolling() {
      if (this.pollTimer) clearTimeout(this.pollTimer);
      this.pollTimer = null;
      if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    },
    copyOutput() {
      if (this.executionResult?.output)
        navigator.clipboard
          .writeText(this.executionResult.output)
          .then(() => this.$message.success("日志已复制"));
    },
    clearOutput() {
      this.executionResult = null;
      this.executionStatus = "idle";
    },
    clearVisualization() {
      if (this.executionResult) this.executionResult.images = [];
    },
    exportAllCharts() {
      if (!this.hasCharts) return;
      this.$message.info("多通道 PDF 渲染开发中...");
    },
    previewChart(imageUrl) {
      window.open(imageUrl, "_blank");
    },
    downloadChart(imageUrl, index) {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `bio_fig_${index + 1}_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    handleImageError(event) {
      event.target.src =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik03NSAyNUgyNUwyNSA3NUw3NSA3NUw3NSAyNVoiIGZpbGw9IiMzMzQxNTUiLz4KPHBhdGggZD0iTTQ1IDUwQzQ1IDQ3Ljc5MDkgNDYuNzkwOSA0NiA0OSA0NiA1MS4yMDkxIDQ2IDUzIDQ3Ljc5MDkgNTMgNTAgNTMgNTIuMjA5MSA1MS4yMDkxIDU0IDQ5IDU0IDQ2Ljc5MDkgNTQgNDUgNTIuMjA5MSA0NSA1MFoiIGZpbGw9IiM5NGEzYjgiLz4KPHBhdGggZD0iTTUwIDU3TDM5IDY4SDYxTDUwIDU3WiIgZmlsbD0iIzk0YTNiOCIvPgo8L3N2Zz4=";
    },
  },
};
</script>

<style lang="scss" scoped>
/* ================= 极客暗黑风全局适配 ================= */
/* 🌟 新增：强制撑满屏幕宽度的底层黑盒 */
.assistant-wrapper {
  width: 100%;
  min-height: calc(100vh - 60px); /* 减去顶部导航栏高度 */
  background-color: #0b0f19; /* 暗黑底色放在这里！ */
}

.assistant-layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100%;
  /* 🚨 注意：把这里的 background-color: #0b0f19; 删掉，因为它已经移交给 wrapper 了 */
  font-family: "Inter", -apple-system, sans-serif;
  color: #e2e8f0;
}

/* ================= 通用面板暗黑化 ================= */
[class$="-area"] {
  background: #111827;
  border-radius: 16px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
  border: 1px solid #1f2937;
  overflow: hidden;
  transition: all 0.3s ease;

  .area-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: linear-gradient(135deg, #111827 0%, #0f172a 100%);
    border-bottom: 1px solid #1f2937;

    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;
      i {
        font-size: 20px;
        color: #3b82f6;
      }
      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #f8fafc;
        letter-spacing: 0.5px;
      }
      .code-info {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: 16px;
        .lines-count {
          font-size: 12px;
          color: #64748b;
          font-family: Consolas, monospace;
        }
      }
      .execution-status,
      .charts-info {
        margin-left: 16px;
      }
    }
    .header-status,
    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
  .area-content {
    padding: 24px;
  }
}

/* ================= 暗黑版常用组件重写 ================= */
::v-deep .dark-textarea .el-textarea__inner {
  background-color: #0f172a;
  border: 1px solid #334155;
  color: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  font-size: 14px;
  line-height: 1.6;
  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
}

::v-deep .dark-select .el-input__inner {
  background-color: #0f172a;
  border: 1px solid #334155;
  color: #f8fafc;
  border-radius: 6px;
  &:focus {
    border-color: #3b82f6;
  }
}

/* 透明/边框按钮 */
::v-deep .dark-plain-btn {
  background: transparent !important;
  border: 1px solid #334155 !important;
  color: #94a3b8 !important;
  &:hover:not(:disabled) {
    border-color: #3b82f6 !important;
    color: #3b82f6 !important;
    background: rgba(59, 130, 246, 0.1) !important;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
::v-deep .dark-plain-btn-danger {
  background: transparent !important;
  border: 1px solid #334155 !important;
  color: #94a3b8 !important;
  &:hover:not(:disabled) {
    border-color: #ef4444 !important;
    color: #ef4444 !important;
    background: rgba(239, 68, 68, 0.1) !important;
  }
  &:disabled {
    opacity: 0.5;
  }
}
::v-deep .dark-circle-btn {
  background: #1e293b !important;
  border: 1px solid #334155 !important;
  color: #94a3b8 !important;
  &:hover {
    background: #3b82f6 !important;
    color: #fff !important;
    border-color: #3b82f6 !important;
    transform: scale(1.1);
  }
}

/* 发光主按钮 */
::v-deep .glow-btn {
  background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
  border: none !important;
  color: #fff;
  &:hover:not(:disabled) {
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
    transform: translateY(-1px);
  }
}
::v-deep .glow-btn-success {
  background: linear-gradient(135deg, #10b981, #059669) !important;
  border: none !important;
  color: #fff;
  &:hover:not(:disabled) {
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
    transform: translateY(-1px);
  }
}

/* ================= 1. 代码生成区 ================= */
.generation-area {
  .quick-examples {
    margin-top: 16px;
    .examples-label {
      display: block;
      font-size: 13px;
      color: #64748b;
      margin-bottom: 12px;
      i {
        color: #f59e0b;
      }
    }
    .examples-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
  }
  .action-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 24px;
  }

  .generated-code-section {
    margin-top: 24px;
    border: 1px solid #1f2937;
    border-radius: 12px;
    overflow: hidden;
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      background: #0f172a;
      border-bottom: 1px solid #1f2937;
      .header-left {
        display: flex;
        align-items: center;
        gap: 10px;
        i {
          color: #10b981;
        }
        .section-title {
          font-weight: 500;
          color: #94a3b8;
        }
      }
      .header-right {
        display: flex;
        gap: 8px;
      }
    }

    .code-display {
      position: relative;
      max-height: 400px;
      overflow: auto;
      background: #000000; /* 纯黑背景才有 IDE 的感觉 */
      &::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      &::-webkit-scrollbar-thumb {
        background: #334155;
        border-radius: 4px;
      }
      &::-webkit-scrollbar-track {
        background: #000000;
      }

      .code-container {
        pre {
          margin: 0;
          padding: 20px;
          font-family: "Consolas", monospace;
          font-size: 14px;
          line-height: 1.6;
          code {
            display: block;
            color: #a7f3d0; /* 极客绿文字 */
          }
        }
        .readonly-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(11, 15, 25, 0.85);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
          &:hover {
            opacity: 1;
          }
          .overlay-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            i {
              font-size: 28px;
              color: #ef4444;
            }
            span {
              color: #f8fafc;
              font-size: 14px;
              font-weight: 500;
            }
          }
        }
      }
    }
    .code-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: #0f172a;
      border-top: 1px solid #1f2937;
      .action-hint {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #64748b;
        i {
          color: #3b82f6;
          font-size: 16px;
        }
      }
    }
  }
}

/* ================= 2. 代码执行区 ================= */
.execution-area {
  .execution-input-section {
    margin-bottom: 24px;
    .input-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      .input-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
        color: #94a3b8;
        i {
          color: #10b981;
          font-size: 16px;
        }
      }
      .input-info {
        display: flex;
        align-items: center;
        gap: 12px;
        .lines-count {
          font-size: 13px;
          color: #64748b;
          font-family: Consolas, monospace;
        }
      }
    }
    .code-editor-container {
      border: 1px solid #1f2937;
      border-radius: 12px;
      overflow: hidden;
      background: #000000;
      .execution-code-editor {
        width: 100%;
        padding: 20px;
        font-family: "Consolas", monospace;
        font-size: 14px;
        line-height: 1.6;
        border: none;
        resize: none;
        outline: none;
        background: transparent;
        color: #e2e8f0;
        &::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        &::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 4px;
        }
      }
    }
  }

  .execution-controls {
    .control-group {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;
      .control-item {
        display: flex;
        align-items: center;
        gap: 12px;
        .control-label {
          font-size: 13px;
          color: #64748b;
        }
      }
    }
    .execution-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      .security-notice {
        background: rgba(59, 130, 246, 0.05);
        border: 1px solid rgba(59, 130, 246, 0.2);
        border-radius: 8px;
        padding: 12px 16px;
        .notice-content {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #60a5fa;
          margin-bottom: 6px;
          font-weight: 500;
        }
        .notice-detail {
          font-size: 12px;
          color: #64748b;
          font-family: Consolas, monospace;
        }
      }
      .action-buttons {
        display: flex;
        gap: 12px;
      }
    }
  }

  .execution-output-section {
    margin-top: 24px;
    border: 1px solid #1f2937;
    border-radius: 12px;
    overflow: hidden;
    background: #0b0f19;
    .output-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      background: #0f172a;
      border-bottom: 1px solid #1f2937;
      .output-title {
        display: flex;
        align-items: center;
        gap: 12px;
        i {
          color: #f59e0b;
          font-size: 16px;
        }
        h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 500;
          color: #e2e8f0;
        }
        .execution-time,
        .memory-usage {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #64748b;
          font-family: Consolas, monospace;
        }
      }
      .output-actions {
        display: flex;
        gap: 8px;
      }
    }
    .output-content {
      max-height: 400px;
      overflow: auto;
      padding: 20px;
      &::-webkit-scrollbar {
        width: 8px;
      }
      &::-webkit-scrollbar-thumb {
        background: #334155;
        border-radius: 4px;
      }

      .error-output,
      .std-output {
        border: 1px solid #1f2937;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 20px;
        &:last-child {
          margin-bottom: 0;
        }
        .error-header,
        .output-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          border-bottom: 1px solid #1f2937;
          i {
            font-size: 16px;
          }
          .error-title,
          .output-title {
            font-size: 13px;
            font-family: Consolas, monospace;
            flex: 1;
          }
        }

        /* 报错极客红 */
        .error-header {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.2);
          i,
          .error-title {
            color: #fca5a5;
          }
        }
        .error-detail {
          margin: 0;
          padding: 16px;
          font-family: Consolas, monospace;
          font-size: 13px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-all;
          background: rgba(239, 68, 68, 0.05);
          color: #ef4444;
        }

        /* 正常输出极客绿/白 */
        .output-header {
          background: rgba(16, 185, 129, 0.05);
          i,
          .output-title {
            color: #6ee7b7;
          }
        }
        .output-detail {
          margin: 0;
          padding: 16px;
          font-family: Consolas, monospace;
          font-size: 13px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-all;
          background: #000000;
          color: #e2e8f0;
        }
      }
      .no-output {
        text-align: center;
        padding: 60px 20px;
        i {
          font-size: 40px;
          margin-bottom: 16px;
          color: #334155;
        }
        p {
          margin: 0;
          font-size: 14px;
          color: #64748b;
        }
      }
    }
  }
}

/* ================= 3. 图表区 ================= */
.visualization-area {
  .charts-display .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 24px;
    .chart-item .chart-container {
      border: 1px solid #1f2937;
      border-radius: 12px;
      overflow: hidden;
      background: #111827;
      transition: all 0.3s ease;
      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
        border-color: #3b82f6;
      }
      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: #0f172a;
        border-bottom: 1px solid #1f2937;
        .chart-title {
          font-size: 13px;
          font-weight: 500;
          color: #94a3b8;
          font-family: Consolas, monospace;
        }
        .chart-actions {
          display: flex;
          gap: 8px;
        }
      }
      .chart-content {
        height: 280px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #000000;
        padding: 10px;
        .chart-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
      }
      .chart-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 16px;
        background: #0f172a;
        border-top: 1px solid #1f2937;
        .chart-index,
        .chart-size {
          font-size: 11px;
          color: #64748b;
          font-family: Consolas, monospace;
        }
      }
    }
  }
  .no-charts,
  .waiting-execution {
    text-align: center;
    padding: 80px 20px;
    i {
      font-size: 50px;
      margin-bottom: 20px;
      color: #334155;
    }
    p {
      font-size: 15px;
      margin: 0 0 12px 0;
      color: #94a3b8;
    }
    .hint {
      font-size: 13px;
      color: #64748b;
      display: block;
      margin-bottom: 16px;
    }
    .hint-code {
      background: #000;
      border: 1px solid #1f2937;
      border-radius: 6px;
      padding: 10px 16px;
      display: inline-block;
      code {
        font-family: Consolas, monospace;
        font-size: 13px;
        color: #10b981;
      }
    }
  }
}

/* ================= 沉浸式加载动画 ================= */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(11, 15, 25, 0.9);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  .loading-content {
    text-align: center;
    .loading-spinner i {
      font-size: 50px;
      color: #3b82f6;
      animation: spin 1.5s linear infinite;
      margin-bottom: 24px;
    }
    .loading-text {
      margin: 0 0 12px 0;
      font-size: 18px;
      color: #f8fafc;
      font-weight: 500;
      letter-spacing: 1px;
    }
    .loading-subtext {
      font-size: 14px;
      color: #64748b;
      font-family: Consolas, monospace;
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.blink-tag i {
  animation: spin 2s linear infinite;
}

/* 代码高亮左上角小角标 */
::v-deep pre {
  position: relative;
  &:before {
    content: attr(data-lang);
    position: absolute;
    top: 0;
    right: 0;
    background: #1e293b;
    color: #94a3b8;
    padding: 4px 10px;
    font-size: 11px;
    border-bottom-left-radius: 8px;
    font-family: Consolas, monospace;
    text-transform: uppercase;
  }
}
</style>
