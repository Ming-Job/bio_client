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
            <div
              class="task-status-banner"
              :class="parseTaskStatus(task.status).type || 'info'"
            >
              <div class="banner-left">
                <h3>{{ task.taskName || task.name }}</h3>
                <span
                  >ID: {{ task.id }} | 提交于:
                  {{ formatTime(task.startedAt || task.time) }}</span
                >
              </div>
              <div class="banner-right">
                <el-tag :type="parseTaskStatus(task.status).type" effect="dark">
                  <i
                    v-if="task.status === 'RUNNING'"
                    class="el-icon-loading"
                  ></i>
                  {{ parseTaskStatus(task.status).text }}
                </el-tag>
              </div>
            </div>

            <h4 class="section-title">
              <i class="el-icon-setting"></i> 运算参数 (Parameters)
            </h4>
            <div
              class="params-box"
              v-if="parsedParams && Object.keys(parsedParams).length > 0"
            >
              <div
                class="param-item"
                v-for="(val, key) in parsedParams"
                :key="key"
              >
                <span class="param-key">{{ key }}</span>
                <span class="param-val">{{ val }}</span>
              </div>
            </div>
            <div v-else class="empty-hint">采用默认计算参数</div>

            <h4 class="section-title" style="margin-top: 24px">
              <i class="el-icon-paperclip"></i> 挂载输入源 (Inputs)
            </h4>
            <div
              class="input-files-area custom-scrollbar"
              v-if="inputFiles && inputFiles.length > 0"
            >
              <div class="input-tag" v-for="file in inputFiles" :key="file.id">
                <i class="el-icon-document"></i>
                <span
                  class="filename"
                  :title="file.originalName || file.name"
                  >{{ file.originalName || file.name }}</span
                >
                <span class="filesize">{{
                  formatSize(file.sizeBytes || file.size)
                }}</span>
              </div>
            </div>
            <div v-else class="empty-hint">未挂载输入文件</div>
          </div>

          <div class="top-right">
            <h4 class="section-title">
              <i class="el-icon-monitor"></i> 执行控制台 (Console)
            </h4>
            <div class="terminal-box" ref="terminalBox">
              <div class="terminal-header">
                <div class="header-left">
                  <span class="dot red"></span><span class="dot yellow"></span
                  ><span class="dot green"></span>
                  <span class="terminal-title">bash - bio-worker</span>
                </div>
                <div class="header-right">
                  <i
                    class="el-icon-full-screen expand-icon"
                    @click="openFullScreen"
                    title="全屏"
                  ></i>
                </div>
              </div>
              <div class="terminal-body custom-scrollbar" id="log-container">
                <p v-for="(log, index) in logs" :key="index" class="log-line">
                  <span class="log-time">[{{ log.time }}]</span>
                  <span :class="['log-level', log.level]">{{ log.level }}</span>
                  <span class="log-msg">{{ log.msg }}</span>
                </p>
                <p
                  v-if="task.status === 'RUNNING'"
                  class="log-line typing-cursor"
                >
                  _
                </p>
              </div>
            </div>

            <h4 class="section-title">
              <i class="el-icon-folder-checked"></i> 产出物 (Outputs)
            </h4>
            <div
              v-if="resultFiles && resultFiles.length > 0"
              class="result-files-area custom-scrollbar"
            >
              <div
                class="result-file-item"
                v-for="file in resultFiles"
                :key="file.id"
              >
                <i class="el-icon-document result-icon"></i>
                <div class="result-info">
                  <span :title="file.originalName || file.name">{{
                    file.originalName || file.name
                  }}</span>
                  <small>{{ formatSize(file.sizeBytes || file.size) }}</small>
                </div>
                <el-button
                  type="text"
                  icon="el-icon-download"
                  @click="downloadFile(file)"
                  >下载</el-button
                >
              </div>
            </div>
            <div v-else class="empty-hint">暂无产出物</div>
          </div>
        </div>

        <div class="bottom-visualization" v-if="task.status === 'COMPLETED'">
          <template v-if="isGwasTask">
            <h4 class="section-title" style="margin-top: 24px; font-size: 16px">
              <i class="el-icon-data-analysis" style="color: #8b5cf6"></i>
              全基因组关联分析报告 (GWAS Profiling)
            </h4>
            <manhattan-plot :task-id="activeTaskId" />
          </template>

          <template v-else-if="isRnaTask">
            <h4 class="section-title" style="margin-top: 24px; font-size: 16px">
              <i class="el-icon-pie-chart" style="color: #ef4444"></i>
              DESeq2 差异表达火山图 (Volcano Plot)
            </h4>
            <div
              class="chart-wrapper"
              v-loading="chartLoading"
              element-loading-background="rgba(15, 23, 42, 0.8)"
            >
              <div
                v-if="hasVolcanoData === false && !chartLoading"
                style="text-align: center; color: #64748b; padding: 40px 0"
              >
                <i
                  class="el-icon-warning-outline"
                  style="font-size: 30px; margin-bottom: 10px"
                ></i>
                <p>未提取到有效的 DESeq2 差异分析数据</p>
              </div>
              <div
                v-show="hasVolcanoData"
                ref="volcanoChart"
                class="echarts-container"
              ></div>
            </div>
          </template>
        </div>
      </div>
    </el-drawer>

    <el-dialog
      title="完整执行日志"
      :visible.sync="fullScreenVisible"
      width="80%"
      top="5vh"
      custom-class="bio-dark-dialog"
      append-to-body
      @opened="scrollToBottom"
    >
      <div class="terminal-box full-screen-terminal">
        <div class="terminal-body custom-scrollbar" id="full-log-container">
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
import axios from "axios";
import * as echarts from "echarts";
import ManhattanPlot from "./ManhattanPlot.vue";

export default {
  name: "TaskTerminalDrawer",
  components: { ManhattanPlot },
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

      chartInstance: null,
      hasVolcanoData: null, // 标记是否有火山图数据
    };
  },
  computed: {
    isGwasTask() {
      if (!this.task) return false;
      const name = (this.task.taskName || this.task.name || "").toUpperCase();
      return name.includes("GWAS") || name.includes("变异关联");
    },
    // 🌟 新增判断：是否为 RNA 转录组任务
    isRnaTask() {
      if (!this.task) return false;
      const name = (this.task.taskName || this.task.name || "").toUpperCase();
      return (
        name.includes("RNA") ||
        name.includes("转录组") ||
        name.includes("DESEQ2")
      );
    },
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
      this.hasVolcanoData = null;
      this.disposeChart();

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
              this.parsedParams =
                typeof this.task.parameters === "string"
                  ? JSON.parse(this.task.parameters)
                  : this.task.parameters;
            } catch (e) {
              this.parsedParams = { raw: this.task.parameters };
            }
          }

          this.scrollToBottom();

          // 🌟 核心判断：当任务完成时，拉取对应图表数据
          if (
            this.task.status === "COMPLETED" ||
            this.task.status === "FAILED"
          ) {
            this.stopPolling();

            if (this.task.status === "COMPLETED") {
              if (this.isRnaTask && !this.chartInstance) {
                // 如果是 RNA-Seq 端到端，去拉取 DESeq2 结果画火山图
                this.fetchVolcanoData();
              }
            }
          }
        }
      } catch (error) {
        console.error("拉取详情失败:", error);
        this.stopPolling();
      }
    },

    // 🌟 新增：拉取 DESeq2 火山图数据
    async fetchVolcanoData() {
      this.chartLoading = true;
      try {
        // 利用巧妙的复用机制：controlId 和 treatId 都传当前的 taskId
        const res = await axios.get(`/api/analysis/tasks/diff/result`, {
          params: { controlId: this.activeTaskId, treatId: this.activeTaskId },
          headers: { userId: this.activeUserId },
        });

        const diffData = res.data?.data || res.data; // 兼容不同的 axios 拦截器封装
        if (diffData && diffData.length > 0) {
          this.hasVolcanoData = true;
          this.$nextTick(() => {
            this.renderVolcanoPlot(diffData);
          });
        } else {
          this.hasVolcanoData = false;
        }
      } catch (error) {
        console.error("拉取火山图数据失败:", error);
        this.hasVolcanoData = false;
      } finally {
        this.chartLoading = false;
      }
    },

    // 🌟 新增：渲染防弹版 Echarts 火山图
    renderVolcanoPlot(data) {
      if (!this.$refs.volcanoChart) return;
      this.chartInstance = echarts.init(this.$refs.volcanoChart);

      // 🌟 修正后的解析逻辑（防弹版）
      const scatterData = data.map((item) => {
        // 1. 自动适配大小写：先找 pvalue(小写)，找不到再找 pValue(大写)
        let rawP = item.pvalue !== undefined ? item.pvalue : item.pValue || 1.0;
        let pVal = parseFloat(rawP);

        // 2. 这里的 log2FoldChange 看起来是对的，但也建议给个 0 兜底
        const x = parseFloat(item.log2FoldChange || 0);

        // 3. 极端值处理：防止 P=0 导致计算出 Infinity 导致 Echarts 崩溃
        if (pVal <= 0) pVal = 1e-300;
        const y = -Math.log10(pVal);

        // 4. 这里的判断逻辑也需要用刚才拿到的 pVal
        let category = 0;
        if (x >= 1.0 && pVal <= 0.05) category = 1; // 显著上调（红）
        else if (x <= -1.0 && pVal <= 0.05) category = 2; // 显著下调（蓝）

        return [x, y, item.geneId || "Unknown", category];
      });

      const option = {
        backgroundColor: "transparent",
        tooltip: {
          trigger: "item",
          backgroundColor: "rgba(15, 23, 42, 0.9)",
          borderColor: "#334155",
          textStyle: { color: "#f8fafc" },
          formatter: function (params) {
            return `
              <b>Gene:</b> ${params.data[2]} <br/>
              <b>Log2FC:</b> ${params.data[0].toFixed(2)} <br/>
              <b>-Log10(P):</b> ${params.data[1].toFixed(2)}
            `;
          },
        },
        xAxis: {
          name: "Log2 Fold Change",
          nameTextStyle: { color: "#94a3b8" },
          splitLine: {
            show: true,
            lineStyle: { color: "#1e293b", type: "dashed" },
          },
          axisLabel: { color: "#94a3b8" },
        },
        yAxis: {
          name: "-Log10(P-value)",
          nameTextStyle: { color: "#94a3b8" },
          min: -0.5,
          splitLine: {
            show: true,
            lineStyle: { color: "#1e293b", type: "dashed" },
          },
          axisLabel: { color: "#94a3b8" },
        },
        series: [
          {
            type: "scatter",
            symbolSize: 6, // 调整点的大小适应大屏
            data: scatterData,
            itemStyle: {
              color: function (params) {
                const category = params.data[3];
                if (category === 1) return "#ef4444"; // 红色上调
                if (category === 2) return "#3b82f6"; // 蓝色下调
                return "#64748b"; // 灰色不显著
              },
            },
            markLine: {
              silent: true,
              symbol: ["none", "none"],
              lineStyle: {
                color: "#94a3b8",
                type: "dashed",
                width: 1,
                opacity: 0.8,
              },
              data: [
                {
                  xAxis: 1.0,
                  label: {
                    formatter: "FC=2",
                    position: "insideStartTop",
                    color: "#f8fafc",
                  },
                },
                {
                  xAxis: -1.0,
                  label: {
                    formatter: "FC=0.5",
                    position: "insideStartTop",
                    color: "#f8fafc",
                  },
                },
                {
                  yAxis: 1.301,
                  label: {
                    formatter: "P=0.05",
                    position: "insideEndTop",
                    color: "#f8fafc",
                  },
                }, // -log10(0.05) ≈ 1.301
              ],
            },
          },
        ],
      };

      this.chartInstance.setOption(option);
      setTimeout(() => {
        if (this.chartInstance) this.chartInstance.resize();
      }, 300);
    },

    disposeChart() {
      if (this.chartInstance) {
        this.chartInstance.dispose();
        this.chartInstance = null;
      }
    },

    startPolling() {
      this.stopPolling();
      this.pollingTimer = setInterval(() => {
        this.fetchDetails();
      }, 3000);
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
    openFullScreen() {
      this.fullScreenVisible = true;
    },
    parseTaskStatus(status) {
      const map = {
        COMPLETED: { text: "已完成", type: "success" },
        RUNNING: { text: "运算中", type: "primary" },
        PENDING: { text: "排队中", type: "warning" },
        FAILED: { text: "异常中断", type: "danger" },
      };
      return map[status] || { text: status || "未知", type: "info" };
    },
    formatTime(timeStr) {
      return timeStr ? timeStr : "-";
    },
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
        if (container)
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });
      });
    },
  },
};
</script>

<style lang="scss" scoped>
/* =========== 这里是核心修改区 =========== */

/* 自定义极客风暗黑滚动条 */
.custom-scrollbar {
  /* 假设单个文件 item 大概是 45px，5 个大约是 225px。留出稍微多一点余量 */
  max-height: 240px;
  overflow-y: auto;
  padding-right: 6px; /* 留出滚动条呼吸空间 */
}
/* Webkit 浏览器的滚动条样式 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #475569;
}

/* 控制一下输出面板，因为通常会多一点，给个 300px 高度 */
.result-files-area.custom-scrollbar {
  max-height: 280px;
}

/* ======================================= */

.drawer-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

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
.terminal-box .terminal-body {
  height: 240px;
}

.task-status-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  background: #1e293b;
  border-left: 4px solid #64748b;
}
.task-status-banner.success {
  border-left-color: #10b981;
}
.task-status-banner.danger {
  border-left-color: #ef4444;
}
.task-status-banner.primary {
  border-left-color: #3b82f6;
}
.task-status-banner.warning {
  border-left-color: #f59e0b;
}
.task-status-banner .banner-left h3 {
  margin: 0 0 4px 0;
  color: #f8fafc;
  font-size: 16px;
}
.task-status-banner .banner-left span {
  color: #94a3b8;
  font-size: 12px;
  font-family: Consolas, monospace;
}

.section-title {
  color: #e2e8f0;
  font-size: 14px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  i {
    color: #3b82f6;
  }
}
.params-box {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  background: #1e293b;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid #334155;
}
.params-box .param-item {
  display: flex;
  flex-direction: column;
}
.params-box .param-item .param-key {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
  text-transform: uppercase;
}
.params-box .param-item .param-val {
  font-size: 14px;
  color: #a7f3d0;
  font-family: Consolas, monospace;
  font-weight: bold;
}

.input-files-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.input-files-area .input-tag {
  display: flex;
  align-items: center;
  background: #0f172a;
  border: 1px solid #334155;
  padding: 10px 16px;
  border-radius: 8px;
  color: #f8fafc;
  font-size: 13px;
}
.input-files-area .input-tag i {
  color: #94a3b8;
  margin-right: 10px;
  font-size: 16px;
}
.input-files-area .input-tag .filename {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.input-files-area .input-tag .filesize {
  color: #64748b;
  font-size: 12px;
  margin-left: 10px;
}

.empty-hint {
  color: #64748b;
  font-size: 13px;
  text-align: center;
  padding: 16px;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 8px;
  border: 1px dashed #334155;
}

.terminal-box {
  background: #000000;
  border-radius: 10px;
  border: 1px solid #334155;
  overflow: hidden;
  margin-bottom: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}
.terminal-box .terminal-header {
  background: #1e293b;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #334155;
}
.terminal-box .terminal-header .header-left {
  display: flex;
  align-items: center;
}
.terminal-box .terminal-header .header-left .dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 6px;
}
.terminal-box .terminal-header .header-left .dot.red {
  background: #ff5f56;
}
.terminal-box .terminal-header .header-left .dot.yellow {
  background: #ffbd2e;
}
.terminal-box .terminal-header .header-left .dot.green {
  background: #27c93f;
}
.terminal-box .terminal-header .header-left .terminal-title {
  margin-left: 10px;
  color: #94a3b8;
  font-family: Consolas, monospace;
  font-size: 12px;
}
.terminal-box .terminal-header .header-right .expand-icon {
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}
.terminal-box .terminal-header .header-right .expand-icon:hover {
  color: #f8fafc;
  transform: scale(1.1);
}
.terminal-box .terminal-body {
  padding: 16px;
  overflow-y: auto;
  font-family: "Courier New", Courier, monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}
.terminal-box .terminal-body .log-line {
  margin: 0 0 4px 0;
  color: #e2e8f0;
}
.terminal-box .terminal-body .log-line .log-time {
  color: #64748b;
  margin-right: 8px;
}
.terminal-box .terminal-body .log-line .log-level {
  margin-right: 8px;
  font-weight: bold;
}
.terminal-box .terminal-body .log-line .log-level.INFO {
  color: #3b82f6;
}
.terminal-box .terminal-body .log-line .log-level.WARN {
  color: #f59e0b;
}
.terminal-box .terminal-body .log-line .log-level.SUCCESS {
  color: #10b981;
}
.terminal-box .terminal-body .log-line .log-level.ERROR {
  color: #ef4444;
}
.terminal-box .terminal-body .log-line .log-msg {
  color: #a7f3d0;
}
.terminal-box .terminal-body .typing-cursor {
  color: #10b981;
  animation: blink 1s step-end infinite;
}
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.result-files-area {
  background: #1e293b;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #334155;
}
.result-files-area .result-file-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #0f172a;
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid #334155;
}
.result-files-area .result-file-item:last-child {
  margin-bottom: 0;
}
.result-files-area .result-file-item .result-icon {
  font-size: 24px;
  color: #10b981;
  margin-right: 12px;
}
.result-files-area .result-file-item .result-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.result-files-area .result-file-item .result-info span {
  color: #f8fafc;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.result-files-area .result-file-item .result-info small {
  color: #64748b;
  font-size: 11px;
}

::v-deep .bio-dark-drawer {
  background-color: #0f172a !important;
  border-left: 1px solid #1e293b;
}
::v-deep .bio-dark-drawer .el-drawer__header {
  color: #f8fafc;
  font-weight: 600;
  font-size: 18px;
  padding: 20px 24px;
  margin-bottom: 0;
  border-bottom: 1px solid #1e293b;
}
::v-deep .bio-dark-drawer .el-drawer__body {
  height: calc(100% - 65px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.full-screen-terminal {
  margin-bottom: 0 !important;
  box-shadow: none !important;
  border: none !important;
}
.full-screen-terminal .terminal-body {
  height: 65vh !important;
}

::v-deep .bio-dark-dialog {
  background-color: #0f172a !important;
  border: 1px solid #1e293b;
  border-radius: 12px;
}
::v-deep .bio-dark-dialog .el-dialog__title {
  color: #f8fafc;
  font-weight: 600;
  font-family: Consolas, monospace;
}
::v-deep .bio-dark-dialog .el-dialog__header {
  border-bottom: 1px solid #1e293b;
  padding: 16px 20px;
}
::v-deep .bio-dark-dialog .el-dialog__body {
  padding: 20px;
  background: #0b0f19;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}
::v-deep .bio-dark-dialog .el-dialog__headerbtn .el-dialog__close {
  color: #94a3b8;
}
::v-deep .bio-dark-dialog .el-dialog__headerbtn .el-dialog__close:hover {
  color: #ef4444;
  transform: scale(1.2);
  transition: 0.3s;
}
</style>
