<template>
  <div>
    <el-drawer
      title="分析任务监控大屏"
      :visible.sync="visible"
      direction="rtl"
      size="550px"
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
              <i v-if="task.status === 'RUNNING'" class="el-icon-loading"></i>
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
          <div class="param-item" v-for="(val, key) in parsedParams" :key="key">
            <span class="param-key">{{ key }}</span>
            <span class="param-val">{{ val }}</span>
          </div>
        </div>
        <div v-else class="empty-hint">采用默认计算参数</div>

        <h4 class="section-title" style="margin-top: 24px">
          <i class="el-icon-paperclip"></i> 挂载输入源 (Inputs)
        </h4>
        <div
          class="input-files-area"
          v-if="inputFiles && inputFiles.length > 0"
        >
          <div class="input-tag" v-for="file in inputFiles" :key="file.id">
            <i class="el-icon-document"></i>
            <span class="filename" :title="file.originalName || file.name">{{
              file.originalName || file.name
            }}</span>
            <span class="filesize">{{
              formatSize(file.sizeBytes || file.size)
            }}</span>
          </div>
        </div>
        <div v-else class="empty-hint">未挂载输入文件</div>

        <h4 class="section-title" style="margin-top: 24px">
          <i class="el-icon-monitor"></i> 执行控制台 (Console)
        </h4>
        <div class="terminal-box" ref="terminalBox">
          <div class="terminal-header">
            <div class="header-left">
              <span class="dot red"></span><span class="dot yellow"></span
              ><span class="dot green"></span>
              <span class="terminal-title">bash - bio-os-worker</span>
            </div>
            <div class="header-right">
              <el-tooltip
                content="全屏展开日志"
                placement="top"
                :open-delay="300"
              >
                <i
                  class="el-icon-full-screen expand-icon"
                  @click="openFullScreen"
                ></i>
              </el-tooltip>
            </div>
          </div>
          <div class="terminal-body" id="log-container">
            <p v-for="(log, index) in logs" :key="index" class="log-line">
              <span class="log-time">[{{ log.time }}]</span>
              <span :class="['log-level', log.level]">{{ log.level }}</span>
              <span class="log-msg">{{ log.msg }}</span>
            </p>
            <p v-if="task.status === 'RUNNING'" class="log-line typing-cursor">
              _
            </p>
          </div>
        </div>

        <div
          v-if="resultFiles && resultFiles.length > 0"
          class="result-files-area"
        >
          <h4 class="section-title">
            <i class="el-icon-folder-checked"></i> 产出物 (Outputs)
          </h4>
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
        <div
          v-else-if="task.status === 'COMPLETED'"
          class="result-files-area empty-hint"
          style="margin-top: 24px"
        >
          分析完成，但未生成可视化产出物。
        </div>
      </div>
    </el-drawer>

    <el-dialog
      title="完整执行日志 (Console Logs)"
      :visible.sync="fullScreenVisible"
      width="80%"
      top="5vh"
      custom-class="bio-dark-dialog"
      append-to-body
      @opened="scrollToBottom"
    >
      <div class="terminal-box full-screen-terminal">
        <div class="terminal-header">
          <div class="header-left">
            <span class="dot red"></span><span class="dot yellow"></span
            ><span class="dot green"></span>
            <span class="terminal-title">bash - bio-os-worker (全屏模式)</span>
          </div>
        </div>
        <div class="terminal-body" id="full-log-container">
          <p v-for="(log, index) in logs" :key="'fs-' + index" class="log-line">
            <span class="log-time">[{{ log.time }}]</span>
            <span :class="['log-level', log.level]">{{ log.level }}</span>
            <span class="log-msg">{{ log.msg }}</span>
          </p>
          <p
            v-if="task && task.status === 'RUNNING'"
            class="log-line typing-cursor"
          >
            _
          </p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getTaskDetails } from "@/api/analysis";

export default {
  name: "TaskTerminalDrawer",
  data() {
    return {
      // 抽屉与弹窗控制
      visible: false,
      fullScreenVisible: false,
      loading: false,

      // 数据承载
      task: null,
      parsedParams: null,
      inputFiles: [],
      logs: [],
      resultFiles: [],

      // 轮询相关的状态记录
      pollingTimer: null,
      activeTaskId: null,
      activeUserId: null,
    };
  },
  beforeDestroy() {
    // 组件销毁前务必清理定时器，防止内存泄漏
    this.stopPolling();
  },
  methods: {
    // 外部调用的入口方法
    async open(taskId, userId) {
      this.visible = true;
      this.activeTaskId = taskId;
      this.activeUserId = userId;

      // 状态初始化，防闪烁
      this.loading = true;
      this.task = null;
      this.parsedParams = null;
      this.inputFiles = [];
      this.logs = [];
      this.resultFiles = [];

      await this.fetchDetails();

      this.loading = false;

      // 如果任务还在运行中，立刻开启轮询！
      if (this.task && this.task.status === "RUNNING") {
        this.startPolling();
      }
    },

    // 打开全屏弹窗
    openFullScreen() {
      this.fullScreenVisible = true;
    },

    // 🌟 核心抽离：单次拉取后端详情数据的方法
    async fetchDetails() {
      if (!this.activeTaskId) return;

      try {
        const res = await getTaskDetails(this.activeTaskId, this.activeUserId);
        if (res && res.code === 200) {
          this.task = res.data.task;
          this.logs = res.data.logs || [];
          this.resultFiles = res.data.resultFiles || [];
          this.inputFiles = res.data.inputFiles || [];

          // 解析 JSON 参数
          if (this.task && this.task.parameters) {
            try {
              this.parsedParams =
                typeof this.task.parameters === "string"
                  ? JSON.parse(this.task.parameters)
                  : this.task.parameters;
            } catch (e) {
              console.warn("参数解析失败，采用原始展示", e);
              this.parsedParams = { raw: this.task.parameters };
            }
          }

          this.scrollToBottom();

          // 如果轮询过程中发现任务已经终止（完成或失败），停止轮询
          if (
            this.task.status === "COMPLETED" ||
            this.task.status === "FAILED" ||
            this.task.status === "CANCELED"
          ) {
            this.stopPolling();
          }
        }
      } catch (error) {
        console.error("拉取任务详情失败:", error);
        this.stopPolling(); // 报错也停掉，防止一直疯狂请求死循环
      }
    },

    // 🌟 轮询控制台
    startPolling() {
      this.stopPolling(); // 开启前先清空，防止出现多个定时器叠加
      this.pollingTimer = setInterval(() => {
        this.fetchDetails();
      }, 3000); // 每 3 秒拉取一次最新状态和日志
    },
    stopPolling() {
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer);
        this.pollingTimer = null;
      }
    },

    // 监听抽屉关闭事件，关掉抽屉就不偷偷请求后端了
    handleClosed() {
      this.stopPolling();
    },

    // 状态与格式化工具函数
    parseTaskStatus(status) {
      const map = {
        COMPLETED: { text: "已完成", type: "success" },
        RUNNING: { text: "运算中", type: "primary" }, // 运行中给个醒目的蓝色
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
      const mb = bytes / (1024 * 1024);
      return mb.toFixed(2) + " MB";
    },
    downloadFile(file) {
      // 1. 拼接下载接口的 URL（注意这里复用抽屉组件里的 this.activeUserId）
      // 如果你配置了代理，它会自动转发到后端的 /api/files/download
      const downloadUrl = `/api/files/download/${file.id}?userId=${this.activeUserId}`;

      // 2. 动态创建隐藏的 a 标签
      const link = document.createElement("a");
      link.style.display = "none";
      link.href = downloadUrl;

      // 3. 挂载到 DOM 并模拟点击触发下载
      document.body.appendChild(link);
      link.click();

      // 4. 清理 DOM 节点
      document.body.removeChild(link);

      this.$message.success(
        `已开始下载: ${file.originalName || file.name}，请查看浏览器的下载任务`,
      );
    },

    // 🌟 滚动条自动触底（同时照顾抽屉和全屏弹窗）
    scrollToBottom() {
      this.$nextTick(() => {
        // 1. 滚动抽屉内的控制台
        const container = this.$el.querySelector("#log-container");
        if (container) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });
        }

        // 2. 滚动全屏弹窗内的控制台 (挂载在 body 上，需用 document 获取)
        const fullContainer = document.getElementById("full-log-container");
        if (fullContainer) {
          fullContainer.scrollTo({
            top: fullContainer.scrollHeight,
            behavior: "smooth",
          });
        }
      });
    },
  },
};
</script>

<style lang="scss" scoped>
/* ================= 全局布局与滚动修复 ================= */
.drawer-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

/* ================= 状态横幅 ================= */
.task-status-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  background: #1e293b;
  border-left: 4px solid #64748b;
  &.success {
    border-left-color: #10b981;
  }
  &.danger {
    border-left-color: #ef4444;
  }
  &.primary {
    border-left-color: #3b82f6;
  }
  &.warning {
    border-left-color: #f59e0b;
  }

  .banner-left h3 {
    margin: 0 0 4px 0;
    color: #f8fafc;
    font-size: 16px;
  }
  .banner-left span {
    color: #94a3b8;
    font-size: 12px;
    font-family: Consolas, monospace;
  }
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

/* ================= 参数展示区 ================= */
.params-box {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  background: #1e293b;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid #334155;
  grid-auto-flow: column;
  .param-item {
    display: flex;
    flex-direction: column;
    .param-key {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .param-val {
      font-size: 14px;
      color: #a7f3d0;
      font-family: Consolas, monospace;
      font-weight: bold;
    }
  }
}

/* ================= 输入文件区 ================= */
.input-files-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
  .input-tag {
    display: flex;
    align-items: center;
    background: #0f172a;
    border: 1px solid #334155;
    padding: 10px 16px;
    border-radius: 8px;
    color: #f8fafc;
    font-size: 13px;
    i {
      color: #94a3b8;
      margin-right: 10px;
      font-size: 16px;
    }
    .filename {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .filesize {
      color: #64748b;
      font-size: 12px;
      font-family: Consolas, monospace;
      margin-left: 10px;
    }
  }
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

/* ================= 终端控制台区 ================= */
.terminal-box {
  background: #000000;
  border-radius: 10px;
  border: 1px solid #334155;
  overflow: hidden;
  margin-bottom: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);

  .terminal-header {
    background: #1e293b;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #334155;
    .header-left {
      display: flex;
      align-items: center;
      .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-right: 6px;
        &.red {
          background: #ff5f56;
        }
        &.yellow {
          background: #ffbd2e;
        }
        &.green {
          background: #27c93f;
        }
      }
      .terminal-title {
        margin-left: 10px;
        color: #94a3b8;
        font-family: Consolas, monospace;
        font-size: 12px;
      }
    }
    .header-right .expand-icon {
      color: #94a3b8;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s;
      &:hover {
        color: #f8fafc;
        transform: scale(1.1);
      }
    }
  }

  .terminal-body {
    padding: 16px;
    height: 300px;
    overflow-y: auto;
    font-family: "Courier New", Courier, monospace;
    font-size: 13px;
    line-height: 1.6;

    /* 🌟 核心修复：允许长日志自动换行，防止水平截断！ */
    white-space: pre-wrap;
    word-break: break-all;

    .log-line {
      margin: 0 0 4px 0;
      color: #e2e8f0;
      .log-time {
        color: #64748b;
        margin-right: 8px;
      }
      .log-level {
        margin-right: 8px;
        font-weight: bold;
        &.INFO {
          color: #3b82f6;
        }
        &.WARN {
          color: #f59e0b;
        }
        &.SUCCESS {
          color: #10b981;
        }
        &.ERROR {
          color: #ef4444;
        }
      }
      .log-msg {
        color: #a7f3d0;
      }
    }
    .typing-cursor {
      color: #10b981;
      animation: blink 1s step-end infinite;
    }
  }
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

/* ================= 结果文件区 ================= */
.result-files-area {
  background: #1e293b;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #334155;
  .result-file-item {
    display: flex;
    align-items: center;
    padding: 12px;
    background: #0f172a;
    border-radius: 8px;
    margin-bottom: 8px;
    border: 1px solid #334155;
    &:last-child {
      margin-bottom: 0;
    }
    .result-icon {
      font-size: 24px;
      color: #10b981;
      margin-right: 12px;
    }
    .result-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      span {
        color: #f8fafc;
        font-size: 13px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      small {
        color: #64748b;
        font-size: 11px;
      }
    }
  }
}

/* ================= 🌟 抽屉样式覆盖 ================= */
::v-deep .bio-dark-drawer {
  background-color: #0f172a !important;
  border-left: 1px solid #1e293b;

  .el-drawer__header {
    color: #f8fafc;
    font-weight: 600;
    font-size: 18px;
    padding: 20px 24px;
    margin-bottom: 0;
    border-bottom: 1px solid #1e293b;
  }

  /* 强制接管高度 */
  .el-drawer__body {
    height: calc(100% - 65px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
}

/* ================= 🌟 全屏弹窗专属样式 ================= */
.full-screen-terminal {
  margin-bottom: 0 !important;
  box-shadow: none !important;
  border: none !important;
  .terminal-body {
    height: 65vh !important; /* 全屏模式下高度拉满 */
  }
}

::v-deep .bio-dark-dialog {
  background-color: #0f172a !important;
  border: 1px solid #1e293b;
  border-radius: 12px;

  .el-dialog__title {
    color: #f8fafc;
    font-weight: 600;
    font-family: Consolas, monospace;
  }
  .el-dialog__header {
    border-bottom: 1px solid #1e293b;
    padding: 16px 20px;
  }
  .el-dialog__body {
    padding: 20px;
    background: #0b0f19;
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
  }
  .el-dialog__headerbtn .el-dialog__close {
    color: #94a3b8;
    &:hover {
      color: #ef4444;
      transform: scale(1.2);
      transition: 0.3s;
    }
  }
}
</style>
