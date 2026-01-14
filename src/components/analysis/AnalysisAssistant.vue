<template>
  <div class="assistant-layout">
    <!-- 代码生成区 -->
    <div class="generation-area">
      <div class="area-header">
        <div class="header-title">
          <i class="el-icon-magic-stick"></i>
          <h3>代码生成区</h3>
        </div>
        <div class="header-status">
          <el-tag size="small" type="success" v-if="codeStatus === 'generated'">
            已生成
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
              清空
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
              {{ loading ? '生成中...' : '生成代码' }}
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 代码显示与编辑区 -->
    <div class="code-area" v-if="showCodeArea">
      <div class="area-header">
        <div class="header-title">
          <i class="el-icon-document"></i>
          <h3>代码区域</h3>
          <div class="code-info">
            <el-tag size="small" :type="getLanguageTagType()">
              {{ language.toUpperCase() }}
            </el-tag>
            <span class="lines-count">{{ codeLines }} 行</span>
          </div>
        </div>
        <div class="header-actions">
          <el-tooltip content="切换编辑模式" placement="top">
            <el-switch
              v-model="editMode"
              active-text="编辑"
              inactive-text="只读"
              active-color="#67C23A"
              size="small"
              style="margin-right: 10px"
            />
          </el-tooltip>

          <el-tooltip content="复制代码" placement="top">
            <el-button
              size="small"
              circle
              @click="copyCode"
              icon="el-icon-document-copy"
            />
          </el-tooltip>

          <el-tooltip content="下载代码" placement="top">
            <el-button
              size="small"
              circle
              @click="downloadCode"
              icon="el-icon-download"
            />
          </el-tooltip>

          <el-tooltip content="重置代码" placement="top" v-if="hasModified">
            <el-button
              size="small"
              circle
              @click="resetCode"
              icon="el-icon-refresh"
              type="warning"
            />
          </el-tooltip>
        </div>
      </div>

      <div class="area-content">
        <!-- 只读模式 -->
        <div v-if="!editMode" class="readonly-code">
          <div class="code-container">
            <div class="code-content">
              <pre v-highlight="modifiedCode || generatedCode">
                <code :class="'language-' + language">{{ modifiedCode || generatedCode }}</code>
              </pre>
            </div>
            <div class="readonly-overlay">
              <div class="overlay-content">
                <i class="el-icon-view"></i>
                <span>只读模式</span>
                <el-button
                  size="mini"
                  @click="editMode = true"
                  type="primary"
                  plain
                  class="edit-btn"
                >
                  点击编辑
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 编辑模式 -->
        <div v-else class="editable-code">
          <div class="editor-header">
            <span class="editor-title">
              <i class="el-icon-edit"></i>
              代码编辑器
              <el-tag v-if="hasModified" size="mini" type="warning">
                已修改
              </el-tag>
            </span>
            <div class="editor-tools">
              <el-button
                size="mini"
                @click="formatCode"
                icon="el-icon-sort"
                plain
              >
                格式化
              </el-button>
              <el-button
                size="mini"
                @click="saveCode"
                icon="el-icon-finished"
                type="success"
                plain
              >
                保存修改
              </el-button>
              <el-button
                size="mini"
                @click="editMode = false"
                icon="el-icon-close"
                plain
              >
                返回只读
              </el-button>
            </div>
          </div>

          <div class="editor-container">
            <textarea
              v-model="modifiedCode"
              class="code-editor"
              :placeholder="'输入' + language + '代码...'"
              spellcheck="false"
              @input="onCodeChange"
            ></textarea>
          </div>

          <div class="editor-footer">
            <div class="modification-info">
              <i class="el-icon-info"></i>
              <span>代码修改后将用于执行，请注意代码安全性</span>
            </div>
            <div class="change-stats" v-if="changeCount > 0">
              <span class="stat-item">
                <i class="el-icon-edit-outline"></i>
                修改 {{ changeCount }} 处
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 代码执行区 -->
    <div class="execution-area" v-if="showCodeArea">
      <div class="area-header">
        <div class="header-title">
          <i class="el-icon-video-play"></i>
          <h3>代码执行区</h3>
        </div>
        <div class="header-status">
          <el-tag size="small" type="info" v-if="executionStatus === 'idle'">
            等待执行
          </el-tag>
          <el-tag size="small" type="warning" v-else-if="executionStatus === 'executing'">
            执行中
          </el-tag>
          <el-tag size="small" type="success" v-else-if="executionStatus === 'completed'">
            执行完成
          </el-tag>
          <el-tag size="small" type="danger" v-else-if="executionStatus === 'error'">
            执行错误
          </el-tag>
        </div>
      </div>

      <div class="area-content">
        <div class="execution-controls">
          <div class="control-group">
            <div class="control-item">
              <label class="control-label">执行语言：</label>
              <el-select
                v-model="language"
                size="small"
                class="language-select"
                @change="onLanguageChange"
              >
                <el-option label="Python" value="python">
                  <span class="language-option">
                    <i class="el-icon-s-data" style="color: #3572A5"></i>
                    Python
                  </span>
                </el-option>
                <el-option label="R" value="r">
                  <span class="language-option">
                    <i class="el-icon-s-data" style="color: #198CE7"></i>
                    R
                  </span>
                </el-option>
              </el-select>
            </div>

            <div class="control-item">
              <label class="control-label">执行模式：</label>
              <el-select
                v-model="executionMode"
                size="small"
                class="mode-select"
              >
                <el-option label="异步执行" value="async">
                  <span class="mode-option">
                    <i class="el-icon-time"></i>
                    异步执行（后台运行）
                  </span>
                </el-option>
                <el-option label="同步执行" value="sync">
                  <span class="mode-option">
                    <i class="el-icon-s-check"></i>
                    同步执行（立即返回）
                  </span>
                </el-option>
              </el-select>
            </div>
          </div>

          <div class="execution-actions">
            <el-button
              type="success"
              @click="executeCode"
              :loading="executing"
              :disabled="!canExecute"
              icon="el-icon-video-play"
              class="execute-btn"
            >
              {{ executing ? '执行中...' : '执行代码' }}
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

          <div class="security-notice">
            <div class="notice-content">
              <i class="el-icon-lock" style="color: #409EFF"></i>
              <span>所有代码均在安全的沙箱环境中执行，保障系统安全</span>
            </div>
            <div class="notice-detail">
              <span>执行超时：10分钟 | 内存限制：512MB | 文件大小：10MB</span>
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
          <div class="execution-info">
            <span class="execution-time" v-if="executionResult?.executionTime">
              <i class="el-icon-time"></i>
              执行耗时：{{ executionResult.executionTime }}ms
            </span>
            <span class="memory-usage" v-if="executionResult?.memoryUsage">
              <i class="el-icon-cpu"></i>
              内存使用：{{ executionResult.memoryUsage }}MB
            </span>
          </div>
        </div>
        <div class="header-actions">
          <el-button
            size="small"
            @click="clearResults"
            icon="el-icon-delete"
            plain
          >
            清空结果
          </el-button>
          <el-button
            size="small"
            @click="exportResults"
            icon="el-icon-download"
            type="primary"
          >
            导出结果
          </el-button>
        </div>
      </div>

      <div class="area-content">
        <div class="results-container">
          <!-- 控制台输出 -->
          <div v-if="executionResult?.output" class="console-output">
            <div class="output-header">
              <div class="output-title">
                <i class="el-icon-monitor"></i>
                <h4>控制台输出</h4>
              </div>
              <el-button
                size="mini"
                @click="copyOutput"
                icon="el-icon-document-copy"
                plain
              >
                复制输出
              </el-button>
            </div>
            <div class="output-content">
              <pre>{{ executionResult.output }}</pre>
            </div>
          </div>

          <!-- 错误信息 -->
          <div v-if="executionResult?.error" class="error-output">
            <div class="error-header">
              <div class="error-title">
                <i class="el-icon-warning-outline"></i>
                <h4>错误信息</h4>
              </div>
              <el-tag type="danger" size="small">执行失败</el-tag>
            </div>
            <div class="error-content">
              <pre>{{ executionResult.error }}</pre>
            </div>
          </div>

          <!-- 图表展示 -->
          <div v-if="hasCharts" class="charts-display">
            <div class="charts-header">
              <div class="charts-title">
                <i class="el-icon-picture-outline"></i>
                <h4>生成图表（{{ executionResult.images.length }}张）</h4>
              </div>
              <el-button
                size="mini"
                @click="exportCharts"
                icon="el-icon-download"
                plain
              >
                导出所有图表
              </el-button>
            </div>
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
            </div>
          </div>

          <!-- 执行结果为空 -->
          <div v-else-if="!executionResult" class="empty-results">
            <div class="empty-content">
              <i class="el-icon-s-data"></i>
              <p>执行结果将在此处显示</p>
              <span class="hint">请先生成并执行代码</span>
            </div>
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
  name: 'CodeAssistantWithEdit',
  data() {
    return {
      // 用户输入
      userInput: '',
      
      // 代码相关
      generatedCode: '',
      modifiedCode: '',
      editMode: false,
      language: 'python',
      
      // 执行相关
      executionMode: 'async',
      executionId: null,
      executionResult: null,
      executionStatus: 'idle', // idle, executing, completed, error
      
      // 状态标志
      loading: false,
      executing: false,
      checkingStatus: false,
      
      // 修改跟踪
      originalCode: '',
      changeCount: 0,
      
      // 示例
      examples: [
        '两组独立样本的t检验，并绘制箱线图',
        '线性回归分析，展示回归系数和残差图',
        '主成分分析(PCA)并绘制双标图',
        '时间序列的ARIMA模型拟合与预测',
        'K-means聚类分析并可视化结果',
        '生存分析的Kaplan-Meier曲线绘制',
      ],
      
      // 代码状态
      codeStatus: 'empty', // empty, generating, generated
    }
  },
  
  computed: {
    // 是否显示代码区域
    showCodeArea() {
      return this.codeStatus === 'generated' && this.generatedCode
    },
    
    // 是否显示图表区域
    showVisualizationArea() {
      return this.executionResult || this.executionStatus !== 'idle'
    },
    
    // 代码行数
    codeLines() {
      const code = this.modifiedCode || this.generatedCode
      if (!code) return 0
      return code.split('\n').length
    },
    
    // 是否有修改
    hasModified() {
      return this.modifiedCode && this.modifiedCode !== this.originalCode
    },
    
    // 是否有图表
    hasCharts() {
      return this.executionResult?.images && this.executionResult.images.length > 0
    },
    
    // 是否可以执行
    canExecute() {
      const code = this.modifiedCode || this.generatedCode
      return code && code.trim() && !this.executing
    },
    
    // 是否有执行ID
    hasExecutionId() {
      return this.executionId && this.executionMode === 'async'
    },
    
    // 是否正在执行
    isExecuting() {
      return this.executionStatus === 'executing'
    }
  },
  
  methods: {
    // 生成代码
    async askAssistant() {
      if (!this.userInput.trim()) {
        this.$message.warning('请输入分析需求')
        return
      }
      
      this.loading = true
      this.codeStatus = 'generating'
      
      try {
        // 调用后端API生成代码
        const response = await fetch('http://localhost:8080/api/analysis/assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: this.userInput })
        })
        
        if (!response.ok) {
          throw new Error('生成代码失败')
        }
        
        const data = await response.json()
        this.generatedCode = data.code
        this.originalCode = data.code
        this.modifiedCode = data.code
        this.codeStatus = 'generated'
        this.editMode = false // 默认只读模式
        
        this.$message.success('代码生成成功')
      } catch (error) {
        this.$message.error('生成代码失败：' + error.message)
        this.codeStatus = 'empty'
      } finally {
        this.loading = false
      }
    },
    
    // 清空输入
    clearInput() {
      this.userInput = ''
      this.$message.info('已清空输入')
    },
    
    // 获取语言标签类型
    getLanguageTagType() {
      return this.language === 'python' ? 'success' : 'primary'
    },
    
    // 复制代码
    copyCode() {
      const code = this.modifiedCode || this.generatedCode
      navigator.clipboard.writeText(code).then(() => {
        this.$message.success('代码已复制到剪贴板')
      }).catch(err => {
        this.$message.error('复制失败：' + err.message)
      })
    },
    
    // 下载代码
    downloadCode() {
      const code = this.modifiedCode || this.generatedCode
      const extension = this.language === 'python' ? 'py' : 'R'
      const filename = `analysis_code_${Date.now()}.${extension}`
      
      const blob = new Blob([code], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      this.$message.success(`代码已下载：${filename}`)
    },
    
    // 重置代码
    resetCode() {
      this.modifiedCode = this.originalCode
      this.changeCount = 0
      this.$message.info('已重置为原始代码')
    },
    
    // 格式化代码
    formatCode() {
      // 这里可以集成代码格式化工具
      // 暂时只做简单的缩进处理
      const lines = this.modifiedCode.split('\n')
      const formatted = lines.map(line => {
        // 简单的缩进处理
        return line.trim() ? '    ' + line.trim() : line
      }).join('\n')
      
      this.modifiedCode = formatted
      this.$message.success('代码已格式化')
    },
    
    // 保存代码修改
    saveCode() {
      this.editMode = false
      this.$message.success('代码修改已保存')
    },
    
    // 代码变化处理
    onCodeChange() {
      if (this.modifiedCode !== this.originalCode) {
        // 简单的修改计数
        const originalLines = this.originalCode.split('\n')
        const modifiedLines = this.modifiedCode.split('\n')
        this.changeCount = Math.abs(originalLines.length - modifiedLines.length)
      } else {
        this.changeCount = 0
      }
    },
    
    // 语言切换
    onLanguageChange() {
      // 如果切换语言，可能需要重新生成代码
      this.$message.info(`已切换为${this.language}语言`)
    },
    
    // 执行代码
    async executeCode() {
      if (!this.canExecute) return
      
      this.executing = true
      this.executionStatus = 'executing'
      this.executionResult = null
      
      try {
        const codeToExecute = this.modifiedCode || this.generatedCode
        const url = this.executionMode === 'async' 
          ? 'http://localhost:8080/api/code/execute'
          : 'http://localhost:8080/api/code/execute-sync'
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: codeToExecute,
            language: this.language
          })
        })
        
        if (this.executionMode === 'async') {
          const data = await response.json()
          if (response.ok) {
            this.executionId = data.taskId
            this.$message.success(`任务已提交，ID: ${data.taskId}`)
            this.startPolling()
          } else {
            throw new Error(data.error || '执行失败')
          }
        } else {
          const result = await response.json()
          this.handleExecutionResult(result)
        }
      } catch (error) {
        this.executionStatus = 'error'
        this.$message.error('执行失败：' + error.message)
      } finally {
        this.executing = false
      }
    },
    
    // 开始轮询状态
    startPolling() {
      // 清除之前的轮询
      if (this.pollInterval) {
        clearInterval(this.pollInterval)
      }
      
      // 立即检查一次
      this.checkExecutionStatus()
      
      // 设置轮询
      this.pollInterval = setInterval(() => {
        if (this.executionId) {
          this.checkExecutionStatus()
        }
      }, 2000)
      
      // 10分钟后停止轮询
      setTimeout(() => {
        if (this.pollInterval) {
          clearInterval(this.pollInterval)
          this.pollInterval = null
          this.$message.warning('执行超时')
        }
      }, 10 * 60 * 1000)
    },
    
    // 检查执行状态
    async checkExecutionStatus() {
      if (!this.executionId) return
      
      this.checkingStatus = true
      try {
        const response = await fetch(`http://localhost:8080/api/code/result/${this.executionId}`)
        
        if (response.status === 404) {
          this.$message.warning('任务不存在')
          if (this.pollInterval) {
            clearInterval(this.pollInterval)
            this.pollInterval = null
          }
          return
        }
        
        const result = await response.json()
        this.handleExecutionResult(result)
      } catch (error) {
        console.error('检查状态失败:', error)
      } finally {
        this.checkingStatus = false
      }
    },
    
    // 处理执行结果
    handleExecutionResult(result) {
      this.executionResult = result
      this.executionStatus = result.status
      
      if (result.status === 'completed') {
        if (this.pollInterval) {
          clearInterval(this.pollInterval)
          this.pollInterval = null
        }
        this.$message.success(`执行成功，耗时${result.executionTime}ms`)
      } else if (result.status === 'error') {
        if (this.pollInterval) {
          clearInterval(this.pollInterval)
          this.pollInterval = null
        }
        this.$message.error('执行出错：' + (result.error || '未知错误'))
      }
    },
    
    // 停止执行
    stopExecution() {
      // 这里可以添加停止执行的API调用
      this.executionStatus = 'idle'
      if (this.pollInterval) {
        clearInterval(this.pollInterval)
        this.pollInterval = null
      }
      this.$message.info('执行已停止')
    },
    
    // 清空结果
    clearResults() {
      this.executionResult = null
      this.executionStatus = 'idle'
      this.executionId = null
      this.$message.info('已清空执行结果')
    },
    
    // 导出结果
    exportResults() {
      // 实现结果导出逻辑
      this.$message.info('导出功能开发中')
    },
    
    // 复制输出
    copyOutput() {
      if (this.executionResult?.output) {
        navigator.clipboard.writeText(this.executionResult.output)
        this.$message.success('输出已复制')
      }
    },
    
    // 预览图表
    previewChart(imageUrl) {
      // 可以使用图片预览组件
      window.open(imageUrl, '_blank')
    },
    
    // 下载图表
    downloadChart(imageUrl, index) {
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `chart_${index + 1}_${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      this.$message.success(`图表 ${index + 1} 已下载`)
    },
    
    // 导出图表
    exportCharts() {
      this.$message.info('图表批量导出功能开发中')
    },
    
    // 处理图片加载错误
    handleImageError(event) {
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik03NSAyNUgyNUwyNSA3NUw3NSA3NUw3NSAyNVoiIGZpbGw9IiNGM0YzRjMiLz4KPHBhdGggZD0iTTQ1IDUwQzQ1IDQ3Ljc5MDkgNDYuNzkwOSA0NiA0OSA0NiA1MS4yMDkxIDQ2IDUzIDQ3Ljc5MDkgNTMgNTAgNTMgNTIuMjA5MSA1MS4yMDkxIDU0IDQ5IDU0IDQ2Ljc5MDkgNTQgNDUgNTIuMjA5MSA0NSA1MFoiIGZpbGw9IiM5MDkzOTkiLz4KPHBhdGggZD0iTTUwIDU3TDM5IDY4SDYxTDUwIDU3WiIgZmlsbD0iIzkwOTM5OSIvPgo8L3N2Zz4='
    }
  }
}
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

      .execution-info {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-left: 20px;

        span {
          font-size: 12px;
          color: #718096;
          display: flex;
          align-items: center;
          gap: 4px;
        }
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
}

/* 代码区域 */
.code-area {
  .readonly-code {
    position: relative;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;

    .code-container {
      max-height: 400px;
      overflow: auto;
      background: #1e1e1e;

      .code-content {
        pre {
          margin: 0;
          padding: 20px;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.5;

          code {
            display: block;
            color: #d4d4d4;
          }
        }
      }
    }

    .readonly-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.92);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;

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

        .edit-btn {
          padding: 6px 16px;
        }
      }
    }
  }

  .editable-code {
    .editor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .editor-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
        color: #2d3748;
      }

      .editor-tools {
        display: flex;
        gap: 8px;
      }
    }

    .editor-container {
      border: 1px solid #cbd5e0;
      border-radius: 8px;
      overflow: hidden;

      .code-editor {
        width: 100%;
        min-height: 300px;
        padding: 16px;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
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

    .editor-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 12px;

      .modification-info {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #718096;

        i {
          color: #e6a23c;
        }
      }

      .change-stats {
        .stat-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #e6a23c;
        }
      }
    }
  }
}

/* 代码执行区 */
.execution-area {
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

        .language-select,
        .mode-select {
          width: 200px;

          .language-option,
          .mode-option {
            display: flex;
            align-items: center;
            gap: 8px;
          }
        }
      }
    }

    .execution-actions {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;

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
  }
}

/* 图表展示区 */
.visualization-area {
  .results-container {
    > div {
      margin-bottom: 24px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .output-header,
    .error-header,
    .charts-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .output-content,
    .error-content {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      max-height: 200px;
      overflow: auto;

      pre {
        margin: 0;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.4;
        white-space: pre-wrap;
        word-break: break-all;
      }
    }

    .error-content {
      background: #fef2f2;
      border-color: #fecaca;
      color: #dc2626;
    }

    .charts-display {
      .charts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;

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
          }
        }
      }
    }

    .no-charts,
    .empty-results {
      text-align: center;
      padding: 40px 20px;
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
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .assistant-layout {
    padding: 12px;
  }

  [class$="-area"] .area-content {
    padding: 16px;
  }

  .execution-controls .control-group {
    flex-direction: column;
    gap: 12px;
  }

  .charts-grid {
    grid-template-columns: 1fr !important;
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