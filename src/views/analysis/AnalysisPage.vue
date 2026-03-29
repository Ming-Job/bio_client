<template>
  <div class="bio-os-container">
    <div class="bio-main">
      <header class="console-header">
        <div class="greeting">
          <h2 class="title">
            <i class="el-icon-cpu"></i> 生信分析工作台 (Bio-Workbench)
            <el-tag
              v-if="currentProjectId"
              type="warning"
              effect="dark"
              style="margin-left: 15px; cursor: pointer"
              @click="exitWorkspace"
            >
              <i class="el-icon-folder-opened"></i> 当前课题 ID:
              {{ currentProjectId }} <i class="el-icon-close"></i>
            </el-tag>
            <span v-if="username" class="user-badge"
              >{{ username }}，欢迎回来</span
            >
          </h2>
        </div>

        <div class="cluster-stats">
          <div class="stat-card">
            <span class="label">累计运行次数</span>
            <span class="value text-blue"
              >{{ stats.totalTasks }} <small>次</small></span
            >
          </div>
          <div class="stat-card">
            <span class="label">累计产出结果</span>
            <span class="value text-emerald"
              >{{ stats.totalOutputs || 0 }} <small>份</small></span
            >
          </div>
          <div class="stat-card">
            <span class="label">本地纳管数据</span>
            <span class="value text-purple"
              >{{ stats.totalFiles || 0 }} <small>份</small></span
            >
          </div>
        </div>
      </header>

      <div class="bento-grid">
        <div class="bento-left">
          <div class="bento-panel action-panel">
            <div class="panel-header">
              <h3><i class="el-icon-s-promotion"></i> 快捷操作区</h3>
              <el-tag size="mini" effect="dark" type="success" class="live-tag"
                >LIVE</el-tag
              >
            </div>

            <div class="action-grid">
              <div class="action-btn" @click="handleUploadData">
                <div class="icon-wrapper upload">
                  <i class="el-icon-upload"></i>
                </div>
                <span>上传数据</span>
              </div>
              <div class="action-btn active-glow" @click="handleNewAnalysis">
                <div class="icon-wrapper launch">
                  <i class="el-icon-video-play"></i>
                </div>
                <span>RNA-Seq 上游分析</span>
              </div>
              <div class="action-btn" @click="$router.push('/analysis/diff')">
                <div class="icon-wrapper template">
                  <i class="el-icon-data-analysis"></i>
                </div>
                <span>差异表达分析</span>
              </div>
              <div class="action-btn" @click="$router.push('/analysis/data')">
                <div class="icon-wrapper data">
                  <i class="el-icon-coin"></i>
                </div>
                <span>数据资源中心</span>
              </div>
              <div class="action-btn" @click="handleAIAssistant">
                <div class="icon-wrapper ai"><i class="el-icon-cpu"></i></div>
                <span>在线分析&绘图</span>
              </div>
              <div class="action-btn" @click="openStructureViewer">
                <div
                  class="icon-wrapper"
                  style="background: linear-gradient(135deg, #14b8a6, #0d9488)"
                >
                  <i class="el-icon-discover"></i>
                </div>
                <span>三维结构预览</span>
              </div>
            </div>
          </div>

          <div class="bento-panel task-panel">
            <div class="panel-header">
              <h3><i class="el-icon-time"></i> 最近分析任务</h3>
              <el-button type="text" size="mini" @click="goToTaskCenter"
                >查看全部</el-button
              >
            </div>
            <div class="static-list">
              <div
                v-for="task in recentTasks"
                :key="task.id"
                class="static-item clickable-task"
                @click="openTaskDetail(task)"
              >
                <div class="item-info">
                  <div class="item-title">
                    <span class="t-name" :title="task.name">{{
                      task.name
                    }}</span>
                    <el-tag
                      v-if="
                        task.projectName && task.projectName !== '未绑定课题'
                      "
                      size="mini"
                      type="info"
                      effect="plain"
                      class="dark-project-tag"
                    >
                      <i class="el-icon-folder-opened"></i>
                      {{ task.projectName }}
                    </el-tag>
                    <span v-else class="dark-no-project">- 独立任务 -</span>
                  </div>
                  <div class="item-meta">{{ task.time }} · {{ task.type }}</div>
                </div>
                <el-tag :type="task.statusType" size="mini" effect="plain">{{
                  task.status
                }}</el-tag>
              </div>

              <div
                v-if="recentTasks.length === 0"
                style="
                  text-align: center;
                  padding: 20px;
                  color: #64748b;
                  font-size: 13px;
                "
              >
                暂无分析任务，点击上方「启动流程」开始
              </div>
            </div>
          </div>

          <AnalysisTemplates
            :templates="pipelineList"
            @use="handleUseTemplate"
            @preview="mockAction"
            @view-all="mockAction('查看全部')"
          />
        </div>

        <div class="bento-right">
          <div class="bento-panel monitor-panel">
            <div class="panel-header">
              <h3><i class="el-icon-odometer"></i> 系统资源监控</h3>
              <el-tooltip content="连接正常" placement="top">
                <div class="status-dot"></div>
              </el-tooltip>
            </div>

            <div class="hardware-stats">
              <div class="hw-item">
                <div class="hw-info">
                  <span class="hw-name">CPU 负载</span>
                  <span class="hw-val">{{ hardware.cpu }}%</span>
                </div>
                <el-progress
                  :percentage="hardware.cpu"
                  :show-text="false"
                  color="#3b82f6"
                  :stroke-width="8"
                ></el-progress>
              </div>
              <div class="hw-item">
                <div class="hw-info">
                  <span class="hw-name">内存使用率</span>
                  <span class="hw-val">{{ hardware.memory }}%</span>
                </div>
                <el-progress
                  :percentage="hardware.memory"
                  :show-text="false"
                  color="#8b5cf6"
                  :stroke-width="8"
                ></el-progress>
              </div>
              <div class="hw-item">
                <div class="hw-info">
                  <span class="hw-name">本地存储占用</span>
                  <span class="hw-val" style="color: #eab308"
                    >{{ hardware.storage }}%</span
                  >
                </div>
                <el-progress
                  :percentage="hardware.storage"
                  :show-text="false"
                  color="#eab308"
                  :stroke-width="8"
                ></el-progress>
              </div>
            </div>
          </div>
          <RecentFiles
            :userId="userId"
            :projectId="currentProjectId"
            @upload-click="handleUploadData"
          />
        </div>
      </div>
    </div>

    <TaskTerminalDrawer ref="terminalDrawer" />

    <el-dialog
      :visible.sync="showUploadDialog"
      width="750px"
      :close-on-click-modal="false"
      custom-class="glass-dialog-wrapper"
      :show-close="false"
    >
      <div class="glass-dialog-close" @click="showUploadDialog = false">
        <i class="el-icon-close"></i>
      </div>
      <FileUploader @upload-complete="handleUploadComplete" />
    </el-dialog>

    <StructureViewer3D
      ref="viewer3DRef"
      :visible.sync="show3DViewer"
      :files="allStructureFiles"
      :userId="userId"
    />
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import AnalysisTemplates from "@/components/analysis/AnalysisTemplates.vue";
import RecentFiles from "@/components/analysis/RecentFiles.vue";
import FileUploader from "@/components/analysis/FileUploader.vue";
import TaskTerminalDrawer from "@/components/analysis/TaskTerminalDrawer.vue";
// 🌟 引入刚写好的 3D 组件
import StructureViewer3D from "@/views/analysis/StructureViewer3D.vue";

import { getUserProjects } from "@/api/project";
import { getPipelines, getDashboard, getRecentFiles } from "@/api/analysis";
// 在原有的引入下面加上这行
import { getAllFileList } from "@/api/file";

export default {
  name: "AnalysisPage",
  components: {
    AnalysisTemplates,
    RecentFiles,
    FileUploader,
    TaskTerminalDrawer,
    StructureViewer3D, // 🌟 注册组件
  },
  data() {
    return {
      showUploadDialog: false,
      pipelineList: [],
      pollingTimer: null,

      stats: { totalTasks: 0, successRate: 0, activeTasks: 0 },
      hardware: { cpu: 0, memory: 0, storage: 0 },
      recentTasks: [],

      drawerVisible: false,
      selectedPipeline: null,
      availableFiles: [],
      projectList: [],

      show3DViewer: false, // 只需要这一个状态控制弹窗即可
      currentProjectId: null,
      allStructureFiles: [], // 🌟 新增：专门用于存储全量 3D 结构文件
    };
  },

  created() {
    if (this.$route.query.projectId) {
      this.currentProjectId = this.$route.query.projectId;
    }
  },

  computed: {
    ...mapState("user", ["isLoggedIn", "userInfo"]),
    ...mapGetters("user", ["userId", "username", "userRole"]),

    // 计算属性保留，传给子组件用作下拉列表
    structureFiles() {
      return this.availableFiles.filter((f) => {
        const fileName = (f.originalName || f.name || "").toLowerCase();
        return (
          fileName.endsWith(".pdb") ||
          fileName.endsWith(".sdf") ||
          fileName.endsWith(".mol2") ||
          fileName.endsWith(".mol")
        );
      });
    },
  },
  watch: {
    isLoggedIn(newVal) {
      if (newVal) this.startDashboardPolling();
      else this.stopDashboardPolling();
    },
  },
  mounted() {
    if (this.currentProjectId) {
      this.$message.success("已进入专属课题工作台");
    }

    this.fetchPipelineData();
    if (this.isLoggedIn) {
      this.startDashboardPolling();
      this.fetchAvailableFiles();
      this.fetchUserProjects();
    }
    this.checkAutoLaunch();
    this.checkUrlParams(); // 🌟 新增：检查是不是从案例页带参数跳过来的3d
  },
  beforeDestroy() {
    this.stopDashboardPolling();
    // 3D 清理逻辑已移交子组件
  },
  methods: {
    async fetchPipelineData() {
      try {
        const res = await getPipelines();
        if (res && res.data) {
          this.pipelineList = res.data;
        }
      } catch (error) {
        this.$message.error("无法拉取模板数据，请检查网络");
      }
    },

    handleUploadData() {
      if (!this.isLoggedIn) {
        this.$message.warning("提示：请先登录后再操作数据");
        return;
      }
      this.showUploadDialog = true;
    },

    handleUploadComplete(result) {
      if (result.error === 0) {
        setTimeout(() => {
          this.showUploadDialog = false;
          this.fetchAvailableFiles();
        }, 1200);
      } else {
        this.$message.warning("部分文件上传遇到问题，请检查列表");
      }
    },

    async fetchDashboardData() {
      if (!this.userId) return;
      try {
        const res = await getDashboard(this.userId, this.currentProjectId);
        const dashData = res.data?.data || res.data;
        if (dashData) {
          if (dashData.stats) this.stats = dashData.stats;
          if (dashData.recentTasks && Array.isArray(dashData.recentTasks)) {
            this.recentTasks = dashData.recentTasks.map((task) => {
              const statusInfo = this.parseTaskStatus(task.status);
              return {
                id: task.id,
                name: task.taskName,
                time: task.startedAt
                  ? task.startedAt.substring(11, 16)
                  : "刚刚",
                type: task.taskName.split(" ")[0] || "分析流",
                status: statusInfo.text,
                statusType: statusInfo.type,
                progress: task.progress,
                projectName: task.projectName || "未绑定课题",
              };
            });
          }
          this.hardware = dashData.hardware;
        }
      } catch (error) {
        console.error("大盘数据拉取失败:", error);
      }
    },

    parseTaskStatus(backendStatus) {
      const statusMap = {
        COMPLETED: { text: "已完成", type: "success" },
        RUNNING: { text: "运行中", type: "" },
        PENDING: { text: "排队中", type: "info" },
        FAILED: { text: "异常报错", type: "danger" },
        CANCELED: { text: "已取消", type: "warning" },
      };
      return (
        statusMap[backendStatus] || {
          text: backendStatus || "未知",
          type: "info",
        }
      );
    },

    startDashboardPolling() {
      this.fetchDashboardData();
      this.pollingTimer = setInterval(() => {
        this.fetchDashboardData();
      }, 5000);
    },

    stopDashboardPolling() {
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer);
        this.pollingTimer = null;
      }
    },

    handleUseTemplate(template) {
      if (!this.isLoggedIn) {
        this.$message.warning("提示：请先登录");
        return;
      }
      this.$router.push({
        path: "/analysis/new",
        query: { pipelineId: template.id },
      });
    },

    async fetchAvailableFiles() {
      if (!this.userId) return;
      try {
        const res = await getRecentFiles(this.userId, this.currentProjectId);
        if (res && res.data) {
          this.availableFiles = res.data;
        }
      } catch (error) {
        console.error("拉取可选文件失败:", error);
      }
    },

    handleNewAnalysis() {
      if (!this.isLoggedIn) {
        this.$message.warning("提示：请先登录");
        return;
      }
      this.$router.push("/analysis/new");
    },

    mockAction(actionName) {
      this.$message.info(`静态演示模式：触发了「${actionName}」功能`);
    },

    handleAIAssistant() {
      this.$router.push({ name: "AnalysisAssistant" });
    },

    openTaskDetail(task) {
      this.$refs.terminalDrawer.open(task.id, this.userId);
    },

    goToTaskCenter() {
      this.$router.push("/analysis/tasks");
    },

    async checkAutoLaunch() {
      const launchId = this.$route.query.autoLaunchPipelineId;
      if (launchId) {
        if (this.pipelineList.length === 0) {
          await this.fetchPipelineData();
        }
        const targetTemplate = this.pipelineList.find((p) => p.id == launchId);
        if (targetTemplate) {
          this.handleUseTemplate(targetTemplate);
          this.$router.replace({ query: null });
        }
      }
    },

    async fetchUserProjects() {
      try {
        const res = await getUserProjects(this.userId);
        if (res && res.data) {
          this.projectList = res.data;
        }
      } catch (error) {
        console.error("拉取项目列表失败", error);
      }
    },

    exitWorkspace() {
      this.currentProjectId = null;
      this.$router.replace({ query: {} }).catch(() => {});
      this.$message.info("已退出专属课题，恢复全局视角");

      this.fetchAvailableFiles();
      this.fetchDashboardData();
    },

    // 🌟 新增：处理跨页面跳转带来的弹窗渲染参数
    async checkUrlParams() {
      const query = this.$route.query;

      // 检查指令：是不是要求打开 3D 弹窗，且带了文件标识
      if (query.action === "open_3d_viewer" && query.file_id) {
        // 1. 复用你原来的方法：它会去拉取文件列表并把 show3DViewer 设为 true
        await this.openStructureViewer();

        // 2. 匹配真实的 file.id (因为 query.file_id 传过来的是 '1A3N.pdb')
        const targetFile = this.allStructureFiles.find(
          (f) =>
            (f.originalName || f.name) === query.file_id ||
            f.id == query.file_id,
        );

        if (targetFile) {
          // 3. 找到文件了，等弹窗渲染出来后，遥控子组件加载结构
          this.$nextTick(() => {
            if (this.$refs.viewer3DRef) {
              this.$refs.viewer3DRef.selectedStructure = targetFile.id;
              this.$refs.viewer3DRef.loadStructure(targetFile.id);
            }
          });
        } else {
          // 没找到文件，给用户一个友好的提示
          this.$message.warning(
            `未在您的文件库中找到：${query.file_id}，请先点击"上传数据"将该文件加入工作区。`,
          );
        }

        // 4. “过河拆桥”：清空 URL 参数，防止刷新页面时重复弹窗
        this.$router
          .replace({ path: this.$route.path, query: {} })
          .catch(() => {});
      }
    },

    // 🌟3d
    async openStructureViewer() {
      if (!this.isLoggedIn) {
        this.$message.warning("提示：请先登录");
        return;
      }

      try {
        // 1. 强制拉取用户所有的文件 (而不是最近文件)
        const res = await getAllFileList({ userId: this.userId });
        const dataList = res.data || res;

        if (Array.isArray(dataList)) {
          // 2. 精准过滤出合法的 3D 结构文件
          this.allStructureFiles = dataList.filter((f) => {
            const fileName = (f.originalName || f.name || "").toLowerCase();
            return (
              fileName.endsWith(".pdb") ||
              fileName.endsWith(".sdf") ||
              fileName.endsWith(".mol2") ||
              fileName.endsWith(".mol")
            );
          });
        }
      } catch (error) {
        console.error("拉取结构文件失败:", error);
      }

      // 3. 唤醒 3D 组件弹窗
      this.show3DViewer = true;
    },
  },
};
</script>

<style lang="scss" scoped>
/* ================= 极客暗黑风全局设定 ================= */
.bio-os-container {
  min-height: calc(100vh - 60px);
  background-color: #0b0f19;
  padding: 30px 20px;
  color: #e2e8f0;
  font-family: "Inter", -apple-system, sans-serif;
}
.bio-main {
  max-width: 1440px;
  margin: 0 auto;
}

/* ================= 1. 顶部控制台头部 ================= */
.console-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 30px;
  .greeting {
    .title {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 600;
      color: #f8fafc;
      display: flex;
      align-items: center;
      gap: 10px;
      i {
        color: #3b82f6;
      }
      .user-badge {
        font-size: 16px;
        color: #10b981;
        font-weight: normal;
        margin-left: 8px;
      }
    }
  }
  .cluster-stats {
    display: flex;
    gap: 16px;
    .stat-card {
      background: #111827;
      border: 1px solid #1f2937;
      padding: 12px 24px;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      min-width: 130px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      .label {
        font-size: 12px;
        color: #94a3b8;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .value {
        font-size: 24px;
        font-weight: 700;
        font-family: "Consolas", monospace;
        small {
          font-size: 12px;
          font-weight: normal;
          opacity: 0.7;
        }
      }
      .text-blue {
        color: #3b82f6;
      }
      .text-emerald {
        color: #10b981;
      }
      .text-purple {
        color: #8b5cf6;
      }
    }
  }
}

/* ================= 2. 便当盒布局 ================= */
.bento-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
}
.bento-left {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.bento-right {
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: sticky;
  top: 20px;
  align-self: flex-start;
  height: calc(100vh - 120px);
}

.bento-panel {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    h3 {
      margin: 0;
      font-size: 16px;
      color: #f8fafc;
      display: flex;
      align-items: center;
      gap: 8px;
      i {
        color: #3b82f6;
      }
    }
  }
}

/* ================= 3. 核心指令舱 ================= */
.action-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  .action-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #1f2937;
    border: 1px solid #374151;
    padding: 16px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    &:hover {
      background: #374151;
      transform: translateY(-2px);
      border-color: #4b5563;
    }
    &.active-glow {
      border-color: rgba(59, 130, 246, 0.5);
      background: rgba(59, 130, 246, 0.1);
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
      &:hover {
        background: rgba(59, 130, 246, 0.2);
      }
    }
    .icon-wrapper {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      i {
        font-size: 20px;
        color: white;
      }
      &.upload {
        background: linear-gradient(135deg, #10b981, #059669);
      }
      &.launch {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
      }
      &.template {
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      }
      &.data {
        background: linear-gradient(135deg, #f59e0b, #d97706);
      }
      &.ai {
        background: linear-gradient(135deg, #ec4899, #db2777);
      }
    }
    span {
      font-size: 14px;
      font-weight: 500;
      color: #e2e8f0;
    }
  }
}

/* ================= 4. 动态任务列表样式 ================= */
.static-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.static-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 10px;
  transition: 0.2s;
  &:hover {
    border-color: #4b5563;
    background: #262f3f;
    cursor: pointer;
  }
  .item-info {
    flex: 1;
    overflow: hidden;
    .item-title {
      display: flex;
      align-items: center;
      margin-bottom: 6px;
      .t-name {
        font-size: 14px;
        color: #f8fafc;
        font-weight: 500;
        margin-right: 10px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 140px;
      }
      .dark-project-tag {
        background: transparent;
        border-color: #374151;
        color: #94a3b8;
      }
      .dark-no-project {
        color: #4b5563;
        font-size: 12px;
      }
    }
    .item-meta {
      font-size: 12px;
      color: #64748b;
    }
  }
}

/* ================= 5. 系统资源监控面板 ================= */
.monitor-panel {
  background: linear-gradient(180deg, #111827 0%, #0f172a 100%);
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  .status-dot {
    width: 10px;
    height: 10px;
    background-color: #10b981;
    border-radius: 50%;
    box-shadow: 0 0 10px #10b981;
    animation: blink 2s infinite;
  }
  .hw-item {
    margin-bottom: 24px;
    &:last-child {
      margin-bottom: 0;
    }
    .hw-info {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: #94a3b8;
      margin-bottom: 8px;
    }
    .hw-name {
      font-family: "Consolas", monospace;
    }
    .hw-val {
      font-weight: bold;
      color: #f8fafc;
    }
    ::v-deep .el-progress-bar__outer {
      background-color: #1f2937 !important;
    }
  }
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
.live-tag {
  animation: blink 2s infinite;
}

/* ================= 6. 弹窗隐身魔法 ================= */
::v-deep .glass-dialog-wrapper {
  background: transparent !important;
  box-shadow: none !important;
  .el-dialog__header {
    display: none;
  }
  .el-dialog__body {
    padding: 0 !important;
    position: relative;
  }
}
.glass-dialog-close {
  position: absolute;
  top: -40px;
  right: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 100;
  &:hover {
    background: rgba(255, 59, 48, 0.8);
    transform: rotate(90deg) scale(1.1);
  }
}

@media (max-width: 1200px) {
  .bento-grid {
    grid-template-columns: 1fr;
  }
  .console-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
}
@media (max-width: 768px) {
  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .cluster-stats {
    flex-wrap: wrap;
    .stat-card {
      flex: 1;
    }
  }
}
</style>
