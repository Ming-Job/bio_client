<template>
  <div>
    <el-drawer
      title="分析任务数据大屏"
      :visible.sync="visible"
      direction="rtl"
      size="850px"
      custom-class="bio-dark-drawer"
      append-to-body
      @closed="handleClosed"
    >
      <div
        class="drawer-content"
        v-if="task"
        v-loading="loading"
        element-loading-background="rgba(11, 15, 25, 0.8)"
      >
        <div class="top-layout">
          <div class="top-left">
            <div class="task-status-banner" :class="parseTaskStatus(task.status).type || 'info'">
              <div class="banner-left">
                <h3>{{ task.taskName || task.name }}</h3>
                <span>ID: {{ task.id }} | 提交于: {{ formatTime(task.startedAt || task.time) }}</span>
              </div>
              <div class="banner-right">
                <el-tag :type="parseTaskStatus(task.status).type" effect="dark">
                  <i v-if="task.status === 'RUNNING'" class="el-icon-loading"></i>
                  {{ parseTaskStatus(task.status).text }}
                </el-tag>
              </div>
            </div>

            <h4 class="section-title"><i class="el-icon-setting"></i> 运算参数 (Parameters)</h4>
            <div class="params-box" v-if="parsedParams && Object.keys(parsedParams).length > 0">
              <div class="param-item" v-for="(val, key) in parsedParams" :key="key">
                <span class="param-key">{{ key }}</span>
                <span class="param-val">{{ val }}</span>
              </div>
            </div>
            <div v-else class="empty-hint">采用默认计算参数</div>

            <h4 class="section-title" style="margin-top: 24px"><i class="el-icon-paperclip"></i> 挂载输入源 (Inputs)</h4>
            <div class="input-files-area" v-if="inputFiles && inputFiles.length > 0">
              <div class="input-tag" v-for="file in inputFiles" :key="file.id">
                <i class="el-icon-document"></i>
                <span class="filename" :title="file.originalName || file.name">{{ file.originalName || file.name }}</span>
                <span class="filesize">{{ formatSize(file.sizeBytes || file.size) }}</span>
              </div>
            </div>
            <div v-else class="empty-hint">未挂载输入文件</div>
          </div>

          <div class="top-right">
            <h4 class="section-title"><i class="el-icon-monitor"></i> 执行控制台 (Console)</h4>
            <div class="terminal-box" ref="terminalBox">
              <div class="terminal-header">
                <div class="header-left">
                  <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
                  <span class="terminal-title">bash - bio-worker</span>
                </div>
                <div class="header-right">
                  <i class="el-icon-full-screen expand-icon" @click="openFullScreen" title="全屏"></i>
                </div>
              </div>
              <div class="terminal-body" id="log-container">
                <p v-for="(log, index) in logs" :key="index" class="log-line">
                  <span class="log-time">[{{ log.time }}]</span>
                  <span :class="['log-level', log.level]">{{ log.level }}</span>
                  <span class="log-msg">{{ log.msg }}</span>
                </p>
                <p v-if="task.status === 'RUNNING'" class="log-line typing-cursor">_</p>
              </div>
            </div>

            <h4 class="section-title"><i class="el-icon-folder-checked"></i> 产出物 (Outputs)</h4>
            <div v-if="resultFiles && resultFiles.length > 0" class="result-files-area">
              <div class="result-file-item" v-for="file in resultFiles" :key="file.id">
                <i class="el-icon-document result-icon"></i>
                <div class="result-info">
                  <span :title="file.originalName || file.name">{{ file.originalName || file.name }}</span>
                  <small>{{ formatSize(file.sizeBytes || file.size) }}</small>
                </div>
                <el-button type="text" icon="el-icon-download" @click="downloadFile(file)">下载</el-button>
              </div>
            </div>
            <div v-else class="empty-hint">暂无产出物</div>
          </div>
        </div>

        <div class="bottom-visualization" v-if="task.status === 'COMPLETED'">
          <h4 class="section-title" style="margin-top: 24px; font-size: 16px;">
            <i class="el-icon-pie-chart" style="color: #10b981;"></i> 基因表达量分析报告 (Expression Profiling)
          </h4>
          <div class="chart-wrapper" v-loading="chartLoading" element-loading-background="rgba(15, 23, 42, 0.8)">
            <div ref="exprChart" class="echarts-container"></div>
          </div>
        </div>

      </div>
    </el-drawer>

    <el-dialog title="完整执行日志" :visible.sync="fullScreenVisible" width="80%" top="5vh" custom-class="bio-dark-dialog" append-to-body @opened="scrollToBottom">
      <div class="terminal-box full-screen-terminal">
        <div class="terminal-body" id="full-log-container">
          <p v-for="(log, index) in logs" :key="'fs-' + index" class="log-line">
            <span class="log-time">[{{ log.time }}]</span>
            <span :class="['log-level', log.level]">{{ log.level }}</span>
            <span class="log-msg">{{ log.msg }}</span>
          </p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getTaskDetails } from "@/api/analysis";
import axios from "axios"; // 引入 axios 用于请求表达量接口
import * as echarts from "echarts"; // 引入 Echarts

export default {
  name: "TaskTerminalDrawer",
  data() {
    return {
      visible: false,
      fullScreenVisible: false,
      loading: false,
      chartLoading: false,

      task: null,
      parsedParams: null,
      inputFiles: [],
      logs: [],
      resultFiles: [],

      pollingTimer: null,
      activeTaskId: null,
      activeUserId: null,
      
      chartInstance: null, // 存储图表实例
    };
  },
  beforeDestroy() {
    this.stopPolling();
    this.disposeChart();
  },
  methods: {
    async open(taskId, userId) {
      this.visible = true;
      this.activeTaskId = taskId;
      this.activeUserId = userId;
      this.loading = true;
      
      this.task = null;
      this.inputFiles = [];
      this.logs = [];
      this.resultFiles = [];
      this.disposeChart(); // 每次打开清理旧图表

      await this.fetchDetails();
      this.loading = false;

      if (this.task && this.task.status === "RUNNING") {
        this.startPolling();
      }
    },

    async fetchDetails() {
      if (!this.activeTaskId) return;
      try {
        const res = await getTaskDetails(this.activeTaskId, this.activeUserId);
        if (res && res.code === 200) {
          this.task = res.data.task;
          this.logs = res.data.logs || [];
          this.resultFiles = res.data.resultFiles || [];
          this.inputFiles = res.data.inputFiles || [];

          if (this.task && this.task.parameters) {
            try {
              this.parsedParams = typeof this.task.parameters === "string" ? JSON.parse(this.task.parameters) : this.task.parameters;
            } catch (e) {
              this.parsedParams = { raw: this.task.parameters };
            }
          }

          this.scrollToBottom();

          // 🌟 修改点 3：任务完成时，除了停止轮询，还要触发图表渲染
          if (this.task.status === "COMPLETED" || this.task.status === "FAILED") {
            this.stopPolling();
            if (this.task.status === "COMPLETED" && !this.chartInstance) {
              this.fetchAndRenderChart();
            }
          }
        }
      } catch (error) {
        console.error("拉取详情失败:", error);
        this.stopPolling();
      }
    },

    // 🌟 修改点 4：拉取后端数据并渲染 Echarts
    async fetchAndRenderChart() {
      this.chartLoading = true;
      try {
        // 请求我们刚刚写好的 Java 接口 (注意根据你的实际路径调整 baseURL)
        const response = await axios.get(`/api/task/result/expression/${this.activeTaskId}`);
        const exprData = response.data; // 预期拿到那 10 条数据数组
        
        if (exprData && exprData.length > 0) {
          this.$nextTick(() => {
            this.initChart(exprData);
          });
        }
      } catch (error) {
        console.error("拉取表达量数据失败:", error);
      } finally {
        this.chartLoading = false;
      }
    },

    initChart(data) {
      if (!this.$refs.exprChart) return;
      
      this.chartInstance = echarts.init(this.$refs.exprChart);
      
      // 提取 X 轴和 Y 轴数据
      const xAxisData = data.map(item => item.geneId);
      const yAxisData = data.map(item => item.readCount);

      const option = {
        backgroundColor: '#0f172a',
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' }
        },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'category',
          data: xAxisData,
          axisLine: { lineStyle: { color: '#64748b' } },
          axisLabel: { color: '#94a3b8', rotate: 30 } // 倾斜标签防止重叠
        },
        yAxis: {
          type: 'value',
          name: 'Read Count (表达量)',
          nameTextStyle: { color: '#64748b' },
          splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
          axisLabel: { color: '#94a3b8' }
        },
        series: [
          {
            name: '表达量',
            type: 'bar',
            barWidth: '40%',
            data: yAxisData,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#3b82f6' }, // 顶部浅蓝
                { offset: 1, color: '#1d4ed8' }  // 底部深蓝
              ]),
              borderRadius: [4, 4, 0, 0]
            }
          }
        ]
      };
      this.chartInstance.setOption(option);
    },

    disposeChart() {
      if (this.chartInstance) {
        this.chartInstance.dispose();
        this.chartInstance = null;
      }
    },

    startPolling() {
      this.stopPolling();
      this.pollingTimer = setInterval(() => { this.fetchDetails(); }, 3000);
    },
    stopPolling() {
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer);
        this.pollingTimer = null;
      }
    },
    handleClosed() {
      this.stopPolling();
      this.disposeChart();
    },
    openFullScreen() { this.fullScreenVisible = true; },
    parseTaskStatus(status) {
      const map = {
        COMPLETED: { text: "已完成", type: "success" },
        RUNNING: { text: "运算中", type: "primary" },
        PENDING: { text: "排队中", type: "warning" },
        FAILED: { text: "异常中断", type: "danger" },
      };
      return map[status] || { text: status || "未知", type: "info" };
    },
    formatTime(timeStr) { return timeStr ? timeStr : "-"; },
    formatSize(bytes) {
      if (!bytes) return "未知大小";
      return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    },
    downloadFile(file) {
      const downloadUrl = `/api/files/download/${file.id}?userId=${this.activeUserId}`;
      const link = document.createElement("a");
      link.style.display = "none";
      link.href = downloadUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.$message.success(`已开始下载: ${file.originalName || file.name}`);
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$el.querySelector("#log-container");
        if (container) container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      });
    }
  }
};
</script>

<style lang="scss" scoped>
/* 保持原有的样式基本不变，新增左右布局和图表样式 */
.drawer-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

/* 🌟 新增：上层两列布局，充分利用 850px 宽度 */
.top-layout {
  display: flex;
  gap: 24px;
  .top-left {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .top-right {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
}

/* 图表容器样式 */
.chart-wrapper {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 16px;
  margin-top: 12px;
}
.echarts-container {
  width: 100%;
  height: 350px;
}

/* 压缩一点控制台高度，给下图让位 */
.terminal-box .terminal-body {
  height: 240px; 
}

/* 其他原有样式省略，建议直接保留你之前的其余 CSS，这里不再赘述重复部分... */
.task-status-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  background: #1e293b;
  border-left: 4px solid #64748b;
  &.success { border-left-color: #10b981; }
  &.danger { border-left-color: #ef4444; }
  &.primary { border-left-color: #3b82f6; }
  &.warning { border-left-color: #f59e0b; }
  .banner-left h3 { margin: 0 0 4px 0; color: #f8fafc; font-size: 16px; }
  .banner-left span { color: #94a3b8; font-size: 12px; font-family: Consolas, monospace; }
}
.section-title { color: #e2e8f0; font-size: 14px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; i { color: #3b82f6; } }
.params-box { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; background: #1e293b; padding: 16px; border-radius: 10px; border: 1px solid #334155; }
.params-box .param-item { display: flex; flex-direction: column; }
.params-box .param-item .param-key { font-size: 12px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; }
.params-box .param-item .param-val { font-size: 14px; color: #a7f3d0; font-family: Consolas, monospace; font-weight: bold; }
.input-files-area { display: flex; flex-direction: column; gap: 8px; }
.input-files-area .input-tag { display: flex; align-items: center; background: #0f172a; border: 1px solid #334155; padding: 10px 16px; border-radius: 8px; color: #f8fafc; font-size: 13px; }
.input-files-area .input-tag i { color: #94a3b8; margin-right: 10px; font-size: 16px; }
.input-files-area .input-tag .filename { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.input-files-area .input-tag .filesize { color: #64748b; font-size: 12px; margin-left: 10px; }
.empty-hint { color: #64748b; font-size: 13px; text-align: center; padding: 16px; background: rgba(30, 41, 59, 0.5); border-radius: 8px; border: 1px dashed #334155; }
.terminal-box { background: #000000; border-radius: 10px; border: 1px solid #334155; overflow: hidden; margin-bottom: 24px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); }
.terminal-box .terminal-header { background: #1e293b; padding: 8px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155; }
.terminal-box .terminal-header .header-left { display: flex; align-items: center; }
.terminal-box .terminal-header .header-left .dot { width: 12px; height: 12px; border-radius: 50%; margin-right: 6px; }
.terminal-box .terminal-header .header-left .dot.red { background: #ff5f56; }
.terminal-box .terminal-header .header-left .dot.yellow { background: #ffbd2e; }
.terminal-box .terminal-header .header-left .dot.green { background: #27c93f; }
.terminal-box .terminal-header .header-left .terminal-title { margin-left: 10px; color: #94a3b8; font-family: Consolas, monospace; font-size: 12px; }
.terminal-box .terminal-header .header-right .expand-icon { color: #94a3b8; font-size: 16px; cursor: pointer; transition: all 0.3s; }
.terminal-box .terminal-header .header-right .expand-icon:hover { color: #f8fafc; transform: scale(1.1); }
.terminal-box .terminal-body { padding: 16px; overflow-y: auto; font-family: "Courier New", Courier, monospace; font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-break: break-all; }
.terminal-box .terminal-body .log-line { margin: 0 0 4px 0; color: #e2e8f0; }
.terminal-box .terminal-body .log-line .log-time { color: #64748b; margin-right: 8px; }
.terminal-box .terminal-body .log-line .log-level { margin-right: 8px; font-weight: bold; }
.terminal-box .terminal-body .log-line .log-level.INFO { color: #3b82f6; }
.terminal-box .terminal-body .log-line .log-level.WARN { color: #f59e0b; }
.terminal-box .terminal-body .log-line .log-level.SUCCESS { color: #10b981; }
.terminal-box .terminal-body .log-line .log-level.ERROR { color: #ef4444; }
.terminal-box .terminal-body .log-line .log-msg { color: #a7f3d0; }
.terminal-box .terminal-body .typing-cursor { color: #10b981; animation: blink 1s step-end infinite; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
.result-files-area { background: #1e293b; padding: 16px; border-radius: 12px; border: 1px solid #334155; }
.result-files-area .result-file-item { display: flex; align-items: center; padding: 12px; background: #0f172a; border-radius: 8px; margin-bottom: 8px; border: 1px solid #334155; }
.result-files-area .result-file-item:last-child { margin-bottom: 0; }
.result-files-area .result-file-item .result-icon { font-size: 24px; color: #10b981; margin-right: 12px; }
.result-files-area .result-file-item .result-info { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.result-files-area .result-file-item .result-info span { color: #f8fafc; font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.result-files-area .result-file-item .result-info small { color: #64748b; font-size: 11px; }
::v-deep .bio-dark-drawer { background-color: #0f172a !important; border-left: 1px solid #1e293b; }
::v-deep .bio-dark-drawer .el-drawer__header { color: #f8fafc; font-weight: 600; font-size: 18px; padding: 20px 24px; margin-bottom: 0; border-bottom: 1px solid #1e293b; }
::v-deep .bio-dark-drawer .el-drawer__body { height: calc(100% - 65px); overflow: hidden; display: flex; flex-direction: column; }
.full-screen-terminal { margin-bottom: 0 !important; box-shadow: none !important; border: none !important; }
.full-screen-terminal .terminal-body { height: 65vh !important; }
::v-deep .bio-dark-dialog { background-color: #0f172a !important; border: 1px solid #1e293b; border-radius: 12px; }
::v-deep .bio-dark-dialog .el-dialog__title { color: #f8fafc; font-weight: 600; font-family: Consolas, monospace; }
::v-deep .bio-dark-dialog .el-dialog__header { border-bottom: 1px solid #1e293b; padding: 16px 20px; }
::v-deep .bio-dark-dialog .el-dialog__body { padding: 20px; background: #0b0f19; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; }
::v-deep .bio-dark-dialog .el-dialog__headerbtn .el-dialog__close { color: #94a3b8; }
::v-deep .bio-dark-dialog .el-dialog__headerbtn .el-dialog__close:hover { color: #ef4444; transform: scale(1.2); transition: 0.3s; }
</style>