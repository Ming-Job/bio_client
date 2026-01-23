<template>
  <div class="assistant-layout">
    <!-- 代码生成区 -->
    <div class="generation-area">
      <div class="area-header">
        <div class="header-title">
          <i class="el-icon-magic-stick"></i>
          <h3>代码生成区</h3>
          <div class="code-info" v-if="generatedCode">
            <el-tag size="small" :type="getLanguageTagType()">
              {{ language.toUpperCase() }}
            </el-tag>
            <span class="lines-count">{{ codeLines }} 行</span>
          </div>
        </div>
        <div class="header-status">
          <el-tag size="small" type="success" v-if="codeStatus === 'generated'">
            已生成
          </el-tag>
          <el-tag
            size="small"
            type="warning"
            v-else-if="codeStatus === 'generating'"
          >
            生成中
          </el-tag>
          <el-tag size="small" type="info" v-else>等待生成</el-tag>
        </div>
      </div>

      <div class="area-content">
        <div class="input-section">
          <el-input
            v-model="userInput"
            type="textarea"
            :rows="3"
            placeholder="输入分析需求，例如：两组数据的t检验并绘制箱线图"
            resize="none"
            @keyup.enter.native="askAssistant"
            class="generation-input"
          />
        </div>

        <div class="quick-examples">
          <span class="examples-label">常用示例：</span>
          <div class="examples-grid">
            <el-button
              v-for="(example, index) in examples"
              :key="index"
              size="mini"
              @click="userInput = example"
              class="example-btn"
              plain
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
              plain
            >
              清空输入
            </el-button>
          </div>
          <div class="action-right">
            <el-button
              type="primary"
              @click="askAssistant"
              :loading="loading"
              icon="el-icon-magic-stick"
              class="generate-btn"
            >
              {{ loading ? "生成中..." : "生成代码" }}
            </el-button>
          </div>
        </div>

        <!-- 生成的代码展示 -->
        <div v-if="generatedCode" class="generated-code-section">
          <div class="section-header">
            <div class="header-left">
              <i class="el-icon-document"></i>
              <span class="section-title">生成的代码</span>
              <el-tag
                size="mini"
                type="success"
                v-if="codeStatus === 'generated'"
              >
                只读 - 可复制
              </el-tag>
            </div>
            <div class="header-right">
              <el-tooltip content="复制代码" placement="top">
                <el-button
                  size="small"
                  circle
                  @click="copyGeneratedCode"
                  icon="el-icon-document-copy"
                />
              </el-tooltip>
              <el-tooltip content="下载代码" placement="top">
                <el-button
                  size="small"
                  circle
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
                  <span>只读模式 - 代码不可编辑</span>
                  <el-tag size="mini" type="info">仅可复制</el-tag>
                </div>
              </div>
            </div>
          </div>

          <div class="code-actions">
            <div class="action-hint">
              <i class="el-icon-info"></i>
              <span>可点击按钮复制代码到执行区运行</span>
            </div>
            <el-button
              size="small"
              @click="copyToExecution"
              icon="el-icon-copy-document"
              type="success"
              plain
            >
              复制到执行区
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 代码执行区 -->
    <div class="execution-area">
      <div class="area-header">
        <div class="header-title">
          <i class="el-icon-video-play"></i>
          <h3>代码执行区</h3>
          <div class="execution-status" v-if="executionStatus !== 'idle'">
            <el-tag size="small" type="info" v-if="executionStatus === 'idle'">
              等待执行
            </el-tag>
            <el-tag
              size="small"
              type="warning"
              v-else-if="executionStatus === 'executing'"
            >
              执行中
            </el-tag>
            <el-tag
              size="small"
              type="success"
              v-else-if="executionStatus === 'completed'"
            >
              执行完成
            </el-tag>
            <el-tag
              size="small"
              type="danger"
              v-else-if="executionStatus === 'error'"
            >
              执行错误
            </el-tag>
          </div>
        </div>
        <div class="header-actions">
          <el-button
            size="small"
            @click="clearExecutionCode"
            :disabled="!executionCode"
            icon="el-icon-delete"
            plain
          >
            清空代码
          </el-button>
          <el-button
            size="small"
            @click="copyExecutionCode"
            :disabled="!executionCode"
            icon="el-icon-document-copy"
            plain
          >
            复制代码
          </el-button>
        </div>
      </div>

      <div class="area-content">
        <!-- 执行代码输入框 -->
        <div class="execution-input-section">
          <div class="input-header">
            <span class="input-label">
              <i class="el-icon-edit"></i>
              执行代码编辑器
            </span>
            <div class="input-info">
              <el-select
                v-model="language"
                size="small"
                class="language-select"
                style="width: 120px"
              >
                <el-option label="Python" value="python">
                  <span class="language-option">
                    <i class="el-icon-s-data" style="color: #3572a5"></i>
                    Python
                  </span>
                </el-option>
                <el-option label="R" value="r">
                  <span class="language-option">
                    <i class="el-icon-s-data" style="color: #198ce7"></i>
                    R
                  </span>
                </el-option>
              </el-select>
              <span class="lines-count" v-if="executionCode">
                {{ executionCodeLines }} 行
              </span>
            </div>
          </div>

          <div class="code-editor-container">
            <textarea
              v-model="executionCode"
              class="execution-code-editor"
              :placeholder="'输入' + language + '代码...'"
              spellcheck="false"
              @input="onExecutionCodeChange"
              rows="15"
            ></textarea>
          </div>
        </div>

        <div class="execution-controls">
          <div class="control-group">
            <div class="control-item">
              <label class="control-label">执行模式：</label>
              <el-select
                v-model="executionMode"
                size="small"
                class="mode-select"
                style="width: 160px"
              >
                <el-option label="异步执行" value="async">
                  <span class="mode-option">
                    <i class="el-icon-time"></i>
                    异步执行
                  </span>
                </el-option>
                <el-option label="同步执行" value="sync">
                  <span class="mode-option">
                    <i class="el-icon-s-check"></i>
                    同步执行
                  </span>
                </el-option>
              </el-select>
            </div>

            <div class="control-item">
              <label class="control-label">超时设置：</label>
              <el-select v-model="timeout" size="small" style="width: 120px">
                <el-option label="30秒" value="30"></el-option>
                <el-option label="1分钟" value="60"></el-option>
                <el-option label="5分钟" value="300"></el-option>
                <el-option label="10分钟" value="600"></el-option>
              </el-select>
            </div>
          </div>

          <div class="execution-actions">
            <div class="security-notice">
              <div class="notice-content">
                <i class="el-icon-lock" style="color: #409eff"></i>
                <span>所有代码均在安全的沙箱环境中执行</span>
              </div>
              <div class="notice-detail">
                <span>内存限制：512MB | 文件大小：10MB</span>
              </div>
            </div>

            <div class="action-buttons">
              <el-button
                type="success"
                @click="executeCode"
                :loading="executing"
                :disabled="!canExecute"
                icon="el-icon-video-play"
                class="execute-btn"
              >
                {{ executing ? "执行中..." : "执行代码" }}
              </el-button>

              <el-button
                type="info"
                @click="checkExecutionStatus"
                :loading="checkingStatus"
                :disabled="!hasExecutionId"
                icon="el-icon-refresh"
                plain
                v-if="executionMode === 'async'"
              >
                检查状态
              </el-button>

              <el-button
                type="danger"
                @click="stopExecution"
                :disabled="!isExecuting"
                icon="el-icon-switch-button"
                plain
              >
                停止执行
              </el-button>
            </div>
          </div>
        </div>

        <!-- 执行输出 -->
        <div v-if="executionResult" class="execution-output-section">
          <div class="output-header">
            <div class="output-title">
              <i class="el-icon-monitor"></i>
              <h4>执行输出</h4>
              <span
                class="execution-time"
                v-if="executionResult?.executionTime"
              >
                <i class="el-icon-time"></i>
                耗时：{{ executionResult.executionTime }}ms
              </span>
              <span class="memory-usage" v-if="executionResult?.memoryUsage">
                <i class="el-icon-cpu"></i>
                内存：{{ executionResult.memoryUsage }}MB
              </span>
            </div>
            <div class="output-actions">
              <el-button
                size="mini"
                @click="copyOutput"
                icon="el-icon-document-copy"
                plain
              >
                复制输出
              </el-button>
              <el-button
                size="mini"
                @click="clearOutput"
                icon="el-icon-delete"
                plain
              >
                清空输出
              </el-button>
            </div>
          </div>

          <div class="output-content">
            <!-- 错误信息 -->
            <div v-if="executionResult?.error" class="error-output">
              <div class="error-header">
                <i class="el-icon-warning-outline"></i>
                <span class="error-title">错误信息</span>
                <el-tag type="danger" size="mini">执行失败</el-tag>
              </div>
              <pre class="error-detail">{{ executionResult.error }}</pre>
            </div>

            <!-- 标准输出 -->
            <div v-if="executionResult?.output" class="std-output">
              <div class="output-header">
                <i class="el-icon-s-data"></i>
                <span class="output-title">标准输出</span>
              </div>
              <pre class="output-detail">{{ executionResult.output }}</pre>
            </div>

            <!-- 无输出提示 -->
            <div
              v-else-if="executionResult?.status === 'completed'"
              class="no-output"
            >
              <i class="el-icon-chat-dot-round"></i>
              <p>程序执行完成，无输出内容</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表展示区 -->
    <div class="visualization-area" v-if="showVisualizationArea">
      <div class="area-header">
        <div class="header-title">
          <i class="el-icon-picture"></i>
          <h3>图表展示区</h3>
          <div class="charts-info" v-if="hasCharts">
            <el-tag size="small" type="success">
              已生成 {{ executionResult.images.length }} 张图表
            </el-tag>
          </div>
        </div>
        <div class="header-actions">
          <el-button
            size="small"
            @click="clearVisualization"
            :disabled="!hasCharts && !executionResult"
            icon="el-icon-delete"
            plain
          >
            清空图表
          </el-button>
          <el-button
            size="small"
            @click="exportAllCharts"
            :disabled="!hasCharts"
            icon="el-icon-download"
            type="primary"
          >
            导出所有图表
          </el-button>
        </div>
      </div>

      <div class="area-content">
        <!-- 图表展示 -->
        <div v-if="hasCharts" class="charts-display">
          <div class="charts-grid">
            <div
              v-for="(image, index) in executionResult.images"
              :key="index"
              class="chart-item"
            >
              <div class="chart-container">
                <div class="chart-header">
                  <span class="chart-title">图表 {{ index + 1 }}</span>
                  <div class="chart-actions">
                    <el-tooltip content="预览" placement="top">
                      <el-button
                        size="mini"
                        circle
                        @click="previewChart(image)"
                        icon="el-icon-view"
                      />
                    </el-tooltip>
                    <el-tooltip content="下载" placement="top">
                      <el-button
                        size="mini"
                        circle
                        @click="downloadChart(image, index)"
                        icon="el-icon-download"
                      />
                    </el-tooltip>
                    <el-tooltip content="复制链接" placement="top">
                      <el-button
                        size="mini"
                        circle
                        @click="copyChartLink(image)"
                        icon="el-icon-link"
                      />
                    </el-tooltip>
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
                  <span class="chart-index">#{{ index + 1 }}</span>
                  <span class="chart-size">PNG 图像</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 无图表提示 -->
        <div
          v-else-if="executionResult?.status === 'completed'"
          class="no-charts"
        >
          <div class="no-charts-content">
            <i class="el-icon-picture-outline"></i>
            <p>本次执行未生成图表</p>
            <span class="hint">尝试使用matplotlib或seaborn等库生成图表</span>
            <div class="hint-code">
              <code>plt.savefig('output.png') # 保存图表</code>
            </div>
          </div>
        </div>

        <!-- 等待执行提示 -->
        <div v-else class="waiting-execution">
          <div class="waiting-content">
            <i class="el-icon-s-promotion"></i>
            <p>等待代码执行</p>
            <span class="hint">请在代码执行区输入代码并执行</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner">
          <i class="el-icon-loading"></i>
        </div>
        <p class="loading-text">正在生成代码，请稍候...</p>
        <p class="loading-subtext">AI正在分析您的需求并生成代码</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "CodeAssistantNewLayout",
  data() {
    return {
      // 用户输入
      userInput: "",

      // 代码相关
      generatedCode: "",
      language: "python",

      // 执行相关
      executionCode: "",
      executionMode: "async",
      timeout: "60",
      executionId: null,
      executionResult: null,
      executionStatus: "idle", // idle, executing, completed, error

      // 状态标志
      loading: false,
      executing: false,
      checkingStatus: false,

      // 示例
      examples: [
        "两组独立样本的t检验，并绘制箱线图",
        "线性回归分析，展示回归系数和残差图",
        "主成分分析(PCA)并绘制双标图",
        "时间序列的ARIMA模型拟合与预测",
        "K-means聚类分析并可视化结果",
        "生存分析的Kaplan-Meier曲线绘制",
      ],

      // 代码状态
      codeStatus: "empty", // empty, generating, generated

      // 轮询间隔
      pollInterval: null,
    };
  },

  computed: {
    // 代码行数（生成区）
    codeLines() {
      if (!this.generatedCode) return 0;
      return this.generatedCode.split("\n").length;
    },

    // 执行代码行数
    executionCodeLines() {
      if (!this.executionCode) return 0;
      return this.executionCode.split("\n").length;
    },

    // 是否显示图表区域
    showVisualizationArea() {
      return this.executionResult || this.executionStatus !== "idle";
    },

    // 是否有图表
    hasCharts() {
      return (
        this.executionResult?.images && this.executionResult.images.length > 0
      );
    },

    // 是否可以执行
    canExecute() {
      return this.executionCode && this.executionCode.trim() && !this.executing;
    },

    // 是否有执行ID
    hasExecutionId() {
      return this.executionId && this.executionMode === "async";
    },

    // 是否正在执行
    isExecuting() {
      return this.executionStatus === "executing";
    },
  },

  methods: {
    // 生成代码
    async askAssistant() {
      if (!this.userInput.trim()) {
        this.$message.warning("请输入分析需求");
        return;
      }

      this.loading = true;
      this.codeStatus = "generating";

      try {
        // 调用后端API生成代码
        const response = await fetch(
          "http://localhost:8080/api/analysis/assist",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: this.userInput }),
          }
        );

        if (!response.ok) {
          throw new Error("生成代码失败");
        }

        const data = await response.json();
        this.generatedCode = data.code;
        this.codeStatus = "generated";

        this.$message.success("代码生成成功, 可点击复制代码到执行区运行");
      } catch (error) {
        this.$message.error("生成代码失败：" + error.message);
        this.codeStatus = "empty";
      } finally {
        this.loading = false;
      }
    },

    // 清空输入
    clearInput() {
      this.userInput = "";
      this.$message.info("已清空输入");
    },

    // 获取语言标签类型
    getLanguageTagType() {
      return this.language === "python" ? "success" : "primary";
    },

    // 复制生成的代码
    copyGeneratedCode() {
      if (!this.generatedCode) return;

      navigator.clipboard
        .writeText(this.generatedCode)
        .then(() => {
          this.$message.success("代码已复制到剪贴板");
        })
        .catch((err) => {
          this.$message.error("复制失败：" + err.message);
        });
    },

    // 下载生成的代码
    downloadGeneratedCode() {
      if (!this.generatedCode) return;

      const extension = this.language === "python" ? "py" : "R";
      const filename = `generated_code_${Date.now()}.${extension}`;

      const blob = new Blob([this.generatedCode], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      this.$message.success(`代码已下载：${filename}`);
    },

    // 提取代码块内容
    extractCodeFromMarkdown(code) {
      // 匹配 ```python 和 ``` 之间的内容
      const pythonRegex = /```python\n([\s\S]*?)```/;
      // 匹配 ```r 和 ``` 之间的内容
      const rRegex = /```r\n([\s\S]*?)```/;
      // 匹配 ```（不带语言标识）和 ``` 之间的内容
      const genericRegex = /```\n([\s\S]*?)```/;

      let match;

      // 根据当前语言选择匹配模式
      if (this.language === "python") {
        match = pythonRegex.exec(code);
      } else if (this.language === "r") {
        match = rRegex.exec(code);
      }

      // 如果没有匹配到指定语言的代码块，尝试通用匹配
      if (!match && !match?.[1]) {
        match = genericRegex.exec(code);
      }

      // 如果匹配成功，返回代码内容，否则返回原代码
      return match ? match[1].trim() : code;
    },

    // 复制到执行区（修改后的版本）
    copyToExecution() {
      if (!this.generatedCode) return;

      // 提取代码块内容
      const extractedCode = this.extractCodeFromMarkdown(this.generatedCode);
      this.executionCode = extractedCode;

      this.$message.success("代码已提取并复制到执行区");
    },

    // 清空执行代码
    clearExecutionCode() {
      this.executionCode = "";
      this.$message.info("已清空执行代码");
    },

    // 复制执行代码
    copyExecutionCode() {
      if (!this.executionCode) return;

      navigator.clipboard
        .writeText(this.executionCode)
        .then(() => {
          this.$message.success("执行代码已复制");
        })
        .catch((err) => {
          this.$message.error("复制失败：" + err.message);
        });
    },

    // 执行代码变化处理
    onExecutionCodeChange() {
      // 可以在这里添加代码检查或其他逻辑
    },

    // 执行代码
    async executeCode() {
      if (!this.canExecute) return;

      this.executing = true;
      this.executionStatus = "executing";
      this.executionResult = null;

      try {
        const url =
          this.executionMode === "async"
            ? "http://localhost:8080/api/code/execute"
            : "http://localhost:8080/api/code/execute-sync";

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: this.executionCode,
            language: this.language,
            timeout: parseInt(this.timeout),
          }),
        });

        if (this.executionMode === "async") {
          const data = await response.json();
          if (response.ok) {
            this.executionId = data.taskId;
            this.$message.success(`任务已提交，ID: ${data.taskId}`);
            this.startPolling();
          } else {
            throw new Error(data.error || "执行失败");
          }
        } else {
          const result = await response.json();
          this.handleExecutionResult(result);
        }
      } catch (error) {
        this.executionStatus = "error";
        this.$message.error("执行失败：" + error.message);
      } finally {
        this.executing = false;
      }
    },

    // 开始轮询状态
    startPolling() {
      // 清除之前的轮询
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
      }

      // 立即检查一次
      this.checkExecutionStatus();

      // 设置轮询
      this.pollInterval = setInterval(() => {
        if (this.executionId) {
          this.checkExecutionStatus();
        }
      }, 2000);

      // 超时后停止轮询
      const timeoutMs = parseInt(this.timeout) * 1000 + 5000;
      setTimeout(() => {
        if (this.pollInterval) {
          clearInterval(this.pollInterval);
          this.pollInterval = null;
          if (this.executionStatus === "executing") {
            this.$message.warning("执行超时");
            this.executionStatus = "error";
          }
        }
      }, timeoutMs);
    },

    // 检查执行状态
    async checkExecutionStatus() {
      if (!this.executionId) return;

      this.checkingStatus = true;
      try {
        const response = await fetch(
          `http://localhost:8080/api/code/result/${this.executionId}`
        );

        if (response.status === 404) {
          this.$message.warning("任务不存在");
          if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
          }
          return;
        }

        const result = await response.json();
        this.handleExecutionResult(result);
      } catch (error) {
        console.error("检查状态失败:", error);
      } finally {
        this.checkingStatus = false;
      }
    },

    // 处理执行结果
    handleExecutionResult(result) {
      this.executionResult = result;
      this.executionStatus = result.status;

      if (result.status === "completed") {
        if (this.pollInterval) {
          clearInterval(this.pollInterval);
          this.pollInterval = null;
        }
        this.$message.success(`执行成功，耗时${result.executionTime}ms`);
      } else if (result.status === "error") {
        if (this.pollInterval) {
          clearInterval(this.pollInterval);
          this.pollInterval = null;
        }
        this.$message.error("执行出错：" + (result.error || "未知错误"));
      }
    },

    // 停止执行
    stopExecution() {
      this.executionStatus = "idle";
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
      this.$message.info("执行已停止");
    },

    // 复制输出
    copyOutput() {
      if (this.executionResult?.output) {
        navigator.clipboard.writeText(this.executionResult.output);
        this.$message.success("输出已复制");
      }
    },

    // 清空输出
    clearOutput() {
      this.executionResult = null;
      this.executionStatus = "idle";
      this.$message.info("已清空输出");
    },

    // 清空可视化
    clearVisualization() {
      if (this.executionResult) {
        this.executionResult.images = [];
      }
      this.$message.info("已清空图表");
    },

    // 导出所有图表
    exportAllCharts() {
      if (!this.hasCharts) return;

      this.$message.info("图表批量导出功能开发中");
      // 实际实现中，可以打包下载所有图表
    },

    // 预览图表
    previewChart(imageUrl) {
      window.open(imageUrl, "_blank");
    },

    // 下载图表
    downloadChart(imageUrl, index) {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `chart_${index + 1}_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.$message.success(`图表 ${index + 1} 已下载`);
    },

    // 复制图表链接
    copyChartLink(imageUrl) {
      navigator.clipboard.writeText(imageUrl);
      this.$message.success("图表链接已复制");
    },

    // 处理图片加载错误
    handleImageError(event) {
      event.target.src =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik03NSAyNUgyNUwyNSA3NUw3NSA3NUw3NSAyNVoiIGZpbGw9IiNGM0YzRjMiLz4KPHBhdGggZD0iTTQ1IDUwQzQ1IDQ3Ljc5MDkgNDYuNzkwOSA0NiA0OSA0NiA1MS4yMDkxIDQ2IDUzIDQ3Ljc5MDkgNTMgNTAgNTMgNTIuMjA5MSA1MS4yMDkxIDU0IDQ5IDU0IDQ2Ljc5MDkgNTQgNDUgNTIuMjA5MSA0NSA1MFoiIGZpbGw9IiM5MDkzOTkiLz4KPHBhdGggZD0iTTUwIDU3TDM5IDY4SDYxTDUwIDU3WiIgZmlsbD0iIzkwOTM5OSIvPgo8L3N2Zz4=";
    },
  },
};
</script>

<style lang="scss" scoped>
.assistant-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* 通用区域样式 */
[class$="-area"] {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e4e7ed;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }

  .area-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-bottom: 1px solid #e2e8f0;

    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;

      i {
        font-size: 20px;
        color: #409eff;
      }

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #2d3748;
      }

      .code-info {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: 16px;

        .lines-count {
          font-size: 12px;
          color: #718096;
        }
      }

      .execution-status {
        margin-left: 16px;
      }

      .charts-info {
        margin-left: 16px;
      }
    }

    .header-status {
      display: flex;
      align-items: center;
      gap: 8px;
    }

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

/* 代码生成区 */
.generation-area {
  .generation-input ::v-deep .el-textarea__inner {
    border: 1px solid #cbd5e0;
    border-radius: 8px;
    padding: 16px;
    font-size: 14px;
    line-height: 1.5;
    resize: none;
    transition: all 0.3s ease;

    &:focus {
      border-color: #409eff;
      box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
    }
  }

  .quick-examples {
    margin-top: 16px;

    .examples-label {
      display: block;
      font-size: 13px;
      color: #718096;
      margin-bottom: 8px;
    }

    .examples-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .example-btn {
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-1px);
        border-color: #409eff;
        color: #409eff;
      }
    }
  }

  .action-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;

    .generate-btn {
      padding: 10px 28px;
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.3s ease;

      &:hover:not(.is-disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
      }
    }
  }

  .generated-code-section {
    margin-top: 24px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;

        i {
          color: #409eff;
        }

        .section-title {
          font-weight: 500;
          color: #4a5568;
        }
      }

      .header-right {
        display: flex;
        gap: 4px;
      }
    }

    .code-display {
      position: relative;
      max-height: 400px;
      overflow: auto;
      background: #1e1e1e;

      .code-container {
        pre {
          margin: 0;
          padding: 20px;
          font-family: "Consolas", "Monaco", "Courier New", monospace;
          font-size: 13px;
          line-height: 1.5;

          code {
            display: block;
            color: #d4d4d4;
          }
        }
      }

      .readonly-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.95);
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
            font-size: 24px;
            color: #718096;
          }

          span {
            color: #4a5568;
            font-size: 14px;
          }
        }
      }
    }

    .code-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;

      .action-hint {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #718096;

        i {
          color: #409eff;
        }
      }
    }
  }
}

/* 代码执行区 */
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
        gap: 6px;
        font-weight: 500;
        color: #4a5568;

        i {
          color: #409eff;
        }
      }

      .input-info {
        display: flex;
        align-items: center;
        gap: 12px;

        .lines-count {
          font-size: 12px;
          color: #718096;
        }
      }
    }

    .code-editor-container {
      border: 1px solid #cbd5e0;
      border-radius: 8px;
      overflow: hidden;

      .execution-code-editor {
        width: 100%;
        padding: 16px;
        font-family: "Consolas", "Monaco", "Courier New", monospace;
        font-size: 13px;
        line-height: 1.5;
        border: none;
        resize: none;
        outline: none;
        background: #fafafa;
        color: #2d3748;

        &:focus {
          background: white;
        }
      }
    }
  }

  .execution-controls {
    .control-group {
      display: flex;
      gap: 24px;
      margin-bottom: 20px;

      .control-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .control-label {
          font-size: 13px;
          color: #4a5568;
          white-space: nowrap;
        }
      }
    }

    .execution-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .security-notice {
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 8px;
        padding: 12px 16px;

        .notice-content {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #0369a1;
          margin-bottom: 4px;
        }

        .notice-detail {
          font-size: 11px;
          color: #64748b;
        }
      }

      .action-buttons {
        display: flex;
        gap: 12px;

        .execute-btn {
          padding: 10px 24px;
          font-weight: 500;
          transition: all 0.3s ease;

          &:hover:not(.is-disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
          }
        }
      }
    }
  }

  .execution-output-section {
    margin-top: 24px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;

    .output-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;

      .output-title {
        display: flex;
        align-items: center;
        gap: 12px;

        i {
          color: #409eff;
        }

        h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }

        .execution-time,
        .memory-usage {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #718096;
        }
      }

      .output-actions {
        display: flex;
        gap: 8px;
      }
    }

    .output-content {
      max-height: 300px;
      overflow: auto;

      > div {
        margin: 16px;
      }

      .error-output,
      .std-output {
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        overflow: hidden;

        .error-header,
        .output-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;

          i {
            font-size: 14px;
          }

          .error-title,
          .output-title {
            font-size: 13px;
            font-weight: 500;
          }
        }

        .error-header {
          background: #fef2f2;
          border-color: #fecaca;

          i {
            color: #f56c6c;
          }
        }

        .error-detail,
        .output-detail {
          margin: 0;
          padding: 12px;
          font-family: "Consolas", "Monaco", "Courier New", monospace;
          font-size: 12px;
          line-height: 1.4;
          white-space: pre-wrap;
          word-break: break-all;
        }

        .error-detail {
          background: #fef2f2;
          color: #dc2626;
        }

        .output-detail {
          background: white;
          color: #2d3748;
        }
      }

      .no-output {
        text-align: center;
        padding: 40px 20px;
        color: #a0aec0;

        i {
          font-size: 32px;
          margin-bottom: 12px;
          opacity: 0.5;
        }

        p {
          font-size: 14px;
          margin: 0;
          color: #718096;
        }
      }
    }
  }
}

/* 图表展示区 */
.visualization-area {
  .charts-display {
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;

      .chart-item {
        .chart-container {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          background: white;
          transition: all 0.3s ease;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
          }

          .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;

            .chart-title {
              font-size: 13px;
              font-weight: 500;
              color: #4a5568;
            }

            .chart-actions {
              display: flex;
              gap: 4px;
            }
          }

          .chart-content {
            height: 250px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;

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
            padding: 8px 16px;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;

            .chart-index,
            .chart-size {
              font-size: 11px;
              color: #718096;
            }
          }
        }
      }
    }
  }

  .no-charts,
  .waiting-execution {
    text-align: center;
    padding: 60px 20px;
    color: #a0aec0;

    i {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    p {
      font-size: 14px;
      margin: 0 0 8px 0;
      color: #718096;
    }

    .hint {
      font-size: 12px;
      color: #a0aec0;
      display: block;
      margin-bottom: 12px;
    }

    .hint-code {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 8px 12px;
      display: inline-block;

      code {
        font-family: "Consolas", "Monaco", "Courier New", monospace;
        font-size: 12px;
        color: #4a5568;
      }
    }
  }
}

/* 加载状态 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .loading-content {
    text-align: center;

    .loading-spinner {
      i {
        font-size: 40px;
        color: #409eff;
        animation: spin 1s linear infinite;
      }
    }

    .loading-text {
      margin: 16px 0 8px 0;
      font-size: 16px;
      color: #4a5568;
    }

    .loading-subtext {
      font-size: 13px;
      color: #a0aec0;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .assistant-layout {
    padding: 12px;
  }

  [class$="-area"] .area-content {
    padding: 16px;
  }

  .execution-controls .control-group,
  .execution-actions {
    flex-direction: column;
    gap: 12px;
  }

  .charts-grid {
    grid-template-columns: 1fr !important;
  }

  .execution-actions {
    .action-buttons {
      flex-wrap: wrap;
      justify-content: center;
    }
  }
}

/* 代码高亮样式 */
:deep(pre) {
  position: relative;

  &:before {
    content: attr(data-lang);
    position: absolute;
    top: 0;
    right: 0;
    background: #718096;
    color: white;
    padding: 4px 8px;
    font-size: 10px;
    border-radius: 0 0 0 4px;
  }
}
</style>
