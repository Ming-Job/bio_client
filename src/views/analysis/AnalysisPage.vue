<template>
  <div class="bio-os-container">
    <div class="bio-main">
      <header class="console-header">
        <div class="greeting">
          <h2 class="title">
            <i class="el-icon-cpu"></i> 生信工作台 Bio-workplace
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
            <span class="label">累计 Pipeline</span>
            <span class="value text-blue"
              >{{ stats.totalTasks }} <small>次</small></span
            >
          </div>
          <div class="stat-card">
            <span class="label">解析成功率</span>
            <span class="value text-emerald">{{ stats.successRate }}%</span>
          </div>
          <div class="stat-card">
            <span class="label">在线计算节点</span>
            <span class="value text-purple"
              >{{ stats.activeNodes }} <small>Nodes</small></span
            >
          </div>
        </div>
      </header>

      <div class="bento-grid">
        <div class="bento-left">
          <div class="bento-panel action-panel">
            <div class="panel-header">
              <h3><i class="el-icon-s-promotion"></i> 核心指令舱</h3>
              <el-tag size="mini" effect="dark" type="success" class="live-tag"
                >LIVE</el-tag
              >
            </div>

            <div class="action-grid">
              <div class="action-btn" @click="handleUploadData">
                <div class="icon-wrapper upload">
                  <i class="el-icon-upload"></i>
                </div>
                <span>序列挂载</span>
              </div>
              <div class="action-btn active-glow" @click="handleNewAnalysis">
                <div class="icon-wrapper launch">
                  <i class="el-icon-video-play"></i>
                </div>
                <span>启动 Pipeline</span>
              </div>
              <div
                class="action-btn"
                @click="$router.push('/analysis/pipelines')"
              >
                <div class="icon-wrapper template">
                  <i class="el-icon-magic-stick"></i>
                </div>
                <span>分析流库</span>
              </div>
              <div class="action-btn" @click="$router.push('/analysis/data')">
                <div class="icon-wrapper data">
                  <i class="el-icon-coin"></i>
                </div>
                <span>云端数据舱</span>
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
                <span>三维结构洞察</span>
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
                暂无分析任务，点击上方「启动 Pipeline」发射
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
              <h3><i class="el-icon-odometer"></i> 算力集群监控</h3>
              <el-tooltip content="连接正常" placement="top">
                <div class="status-dot"></div>
              </el-tooltip>
            </div>

            <div class="hardware-stats">
              <div class="hw-item">
                <div class="hw-info">
                  <span class="hw-name">CPU 负载 (128 Cores)</span>
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
                  <span class="hw-name">内存分配 (512 GB)</span>
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
                  <span class="hw-name">OSS 存储 (可用 5TB)</span>
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

    <el-drawer
      title="配置并启动分析任务"
      :visible.sync="drawerVisible"
      direction="rtl"
      size="450px"
      custom-class="bio-dark-drawer"
      :wrapperClosable="false"
    >
      <div class="drawer-content" v-if="selectedPipeline">
        <div class="pipeline-summary">
          <div class="pl-icon"><i class="el-icon-cpu"></i></div>
          <div class="pl-info">
            <h4>{{ selectedPipeline.name || "未命名流程" }}</h4>
            <p>ID: {{ selectedPipeline.id }} | 请确认分析参数与挂载数据</p>
          </div>
          <el-tag size="mini" effect="dark" type="success" class="live-tag"
            >READY</el-tag
          >
        </div>

        <el-form :model="taskForm" label-position="top" class="bio-dark-form">
          <el-form-item label="归属科研空间 (Workspace)" prop="projectId">
            <el-select
              v-model="taskForm.projectId"
              placeholder="请选择本次任务归属的课题"
              style="width: 100%"
              popper-class="bio-dark-select-dropdown"
              @change="handleProjectChange"
            >
              <el-option
                v-for="proj in projectList"
                :key="proj.id"
                :label="proj.name"
                :value="proj.id"
              >
                <span style="float: left"
                  ><i class="el-icon-folder"></i> {{ proj.name }}</span
                >
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item
            label="挂载输入数据 (Fastq/BAM/FASTA/SDF)"
            prop="fileIds"
          >
            <el-select
              v-model="taskForm.fileIds"
              multiple
              :disabled="!taskForm.projectId"
              :placeholder="
                taskForm.projectId
                  ? '请选择该空间下的数据文件'
                  : '请先在上方选择归属空间'
              "
              style="width: 100%"
              popper-class="bio-dark-select-dropdown"
            >
              <el-option
                v-for="file in filteredProjectFiles"
                :key="file.id"
                :label="file.originalName || file.name"
                :value="file.id"
              >
                <span style="float: left"
                  ><i class="el-icon-document"></i>
                  {{ file.originalName || file.name }}</span
                >
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="分析参数设定 (JSON格式)">
            <el-input
              type="textarea"
              :rows="8"
              placeholder="请输入 JSON 格式的参数"
              v-model="taskForm.params"
              class="code-textarea"
            ></el-input>
          </el-form-item>
        </el-form>

        <div class="drawer-footer">
          <el-button
            plain
            @click="drawerVisible = false"
            class="dark-btn-cancel"
            >取消中止</el-button
          >
          <el-button
            type="primary"
            @click="submitTask"
            :loading="submitting"
            class="dark-btn-submit"
          >
            <i class="el-icon-video-play"></i>
            {{ submitting ? "发射中..." : "确认发射 (Launch)" }}
          </el-button>
        </div>
      </div>
    </el-drawer>

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

    <el-dialog
      title="三维分子构象洞察 (3D Structure Viewer)"
      :visible.sync="show3DViewer"
      width="800px"
      custom-class="bio-dark-dialog"
      append-to-body
      :close-on-click-modal="false"
    >
      <div
        class="structure-viewer-container"
        v-loading="loading3D"
        element-loading-background="rgba(11, 15, 25, 0.9)"
        element-loading-text="解析分子拓扑并初始化 WebGL 引擎..."
      >
        <div class="viewer-controls">
          <el-select
            v-model="selectedStructure"
            placeholder="从云端数据舱选择结构文件 (PDB/SDF)"
            size="small"
            class="dark-select"
            style="width: 350px"
            @change="loadStructure"
            popper-class="bio-dark-select-dropdown"
          >
            <el-option
              v-for="file in structureFiles"
              :key="file.id"
              :label="file.originalName || file.name"
              :value="file.id"
            >
              <span style="float: left"
                ><i class="el-icon-help" style="color: #14b8a6"></i>
                {{ file.originalName || file.name }}</span
              >
            </el-option>
          </el-select>

          <div class="render-tools" v-if="selectedStructure">
            <el-radio-group
              v-model="renderStyle"
              size="mini"
              class="dark-radio-group"
              @change="updateRenderStyle"
            >
              <el-radio-button label="cartoon">Cartoon</el-radio-button>
              <el-radio-button label="stick">Stick</el-radio-button>
              <el-radio-button label="sphere">Sphere</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <div class="viewer-stage" id="3d-stage">
          <div v-if="!selectedStructure" class="empty-stage">
            <i class="el-icon-discover empty-icon"></i>
            <p>请挂载结构文件以启动全息渲染引擎</p>
            <span class="support-text">支持格式：.pdb, .sdf, .mol2</span>
          </div>
          <div v-else class="stage-overlay">
            <div class="overlay-info">
              <span class="info-item"
                ><i class="el-icon-cpu"></i> WebGL Render Active</span
              >
              <span class="info-item"
                ><i class="el-icon-aim"></i> Auto Focused</span
              >
            </div>
            <div
              id="glcontainer"
              style="
                width: 100%;
                height: 100%;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
              "
            ></div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import AnalysisTemplates from "@/components/analysis/AnalysisTemplates.vue";
import RecentFiles from "@/components/analysis/RecentFiles.vue";
import FileUploader from "@/components/analysis/FileUploader.vue";
import TaskTerminalDrawer from "@/components/analysis/TaskTerminalDrawer.vue";
import { getUserProjects } from "@/api/project";
import {
  getPipelines,
  getDashboard,
  getRecentFiles,
  submitAnalysisTask,
} from "@/api/analysis";

export default {
  name: "AnalysisPage",
  components: {
    AnalysisTemplates,
    RecentFiles,
    FileUploader,
    TaskTerminalDrawer,
  },
  data() {
    return {
      showUploadDialog: false,
      pipelineList: [],
      pollingTimer: null,

      stats: { totalTasks: 0, successRate: 0, activeNodes: 0 },
      hardware: { cpu: 0, memory: 0, storage: 0 },
      recentTasks: [],

      // --- 发射任务抽屉状态 ---
      drawerVisible: false,
      submitting: false,
      selectedPipeline: null,
      availableFiles: [],
      projectList: [],
      taskForm: {
        projectId: null,
        fileIds: [],
        params: '{\n  "genome": "hg38",\n  "pvalue": 0.05,\n  "threads": 8\n}',
      },
      rules: {
        projectId: [
          {
            required: true,
            message: "为了保证数据溯源，必须选择归属的科研空间",
            trigger: "change",
          },
        ],
        fileIds: [
          {
            required: true,
            message: "请至少挂载一个输入数据文件",
            trigger: "change",
          },
        ],
      },

      // --- 3D 渲染舱专属状态 ---
      show3DViewer: false,
      loading3D: false,
      selectedStructure: "",
      renderStyle: "cartoon",
      viewer3D: null,
      currentMolData: "",

      currentProjectId: null,
    };
  },
  computed: {
    ...mapState("user", ["isLoggedIn", "userInfo"]),
    ...mapGetters("user", ["userId", "username", "userRole"]),

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

    filteredProjectFiles() {
      if (!this.taskForm.projectId) {
        return [];
      }
      return this.availableFiles.filter(
        (file) => file.projectId === this.taskForm.projectId,
      );
    },
  },
  watch: {
    isLoggedIn(newVal) {
      if (newVal) this.startDashboardPolling();
      else this.stopDashboardPolling();
    },
  },
  mounted() {
    if (this.$route.query.projectId) {
      this.currentProjectId = this.$route.query.projectId;
      this.$message.success("已进入专属课题工作台");
    }

    this.fetchPipelineData();
    if (this.isLoggedIn) {
      this.startDashboardPolling();
      this.fetchAvailableFiles();
      this.fetchUserProjects();
    }
    this.checkAutoLaunch();
  },
  beforeDestroy() {
    this.stopDashboardPolling();
    if (this.viewer3D) {
      this.viewer3D.clear();
      this.viewer3D = null;
    }
  },
  methods: {
    async fetchPipelineData() {
      try {
        const res = await getPipelines();
        if (res && res.data) {
          this.pipelineList = res.data;
        }
      } catch (error) {
        this.$message.error("无法连接到云端拉取模板数据");
      }
    },

    handleUploadData() {
      if (!this.isLoggedIn) {
        this.$message.warning("请先验证研究员身份 (登录) 后再挂载数据");
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
            // 🌟 核心修改：在映射数据时，把后端传的 projectName 也接过来
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
                projectName: task.projectName || "未绑定课题", // 接收项目名
              };
            });
          }
          this.hardware = dashData.hardware;
        }
      } catch (error) {
        console.error("大盘数据轮询失败:", error);
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
        this.$message.warning("请先验证研究员身份 (登录)");
        return;
      }
      this.selectedPipeline = template;
      this.taskForm.fileIds = [];
      this.taskForm.params =
        '{\n  "genome": "hg38",\n  "pvalue": 0.05,\n  "threads": 8\n}';
      this.drawerVisible = true;
      this.fetchAvailableFiles();
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

    async submitTask() {
      if (this.taskForm.fileIds.length === 0) {
        this.$message.warning("指令错误：请至少挂载一个输入数据文件！");
        return;
      }
      if (!this.taskForm.projectId) {
        this.$message.warning("发射失败：请先选择任务归属的科研空间！");
        return;
      }

      let validJsonString = "{}";
      if (this.taskForm.params && this.taskForm.params.trim() !== "") {
        try {
          JSON.parse(this.taskForm.params);
          validJsonString = this.taskForm.params;
        } catch (err) {
          this.$message.error(
            "参数校验失败：请输入合法的 JSON 格式（注意引号和逗号）！",
          );
          return;
        }
      }

      this.submitting = true;
      try {
        const dto = {
          projectId: this.taskForm.projectId,
          pipelineId: this.selectedPipeline.id,
          fileIds: this.taskForm.fileIds,
          params: validJsonString,
        };

        const res = await submitAnalysisTask(dto, this.userId);

        if (res && res.code === 200) {
          this.$message.success(
            `任务发射成功！计算节点已接管 (TaskID: ${res.data.taskId})`,
          );
          this.drawerVisible = false;
          this.fetchDashboardData();
        } else {
          this.$message.error(res.message || "任务发射失败，被拦截");
        }
      } catch (error) {
        this.$message.error("无法连接到调度引擎");
      } finally {
        this.submitting = false;
      }
    },

    handleNewAnalysis() {
      if (!this.isLoggedIn) {
        this.$message.warning("请先验证研究员身份 (登录)");
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

    handleProjectChange() {
      this.taskForm.fileIds = [];
      this.$message.info("已切换空间，请重新挂载对应的数据文件");
    },

    exitWorkspace() {
      this.currentProjectId = null;
      this.$router.replace({ query: {} }).catch(() => {});
      this.$message.info("已退出专属空间，恢复全局视角");

      this.fetchAvailableFiles();
      this.fetchDashboardData();
    },

    async openStructureViewer() {
      if (!this.isLoggedIn) {
        this.$message.warning("请先验证研究员身份 (登录)");
        return;
      }
      this.show3DViewer = true;
      this.selectedStructure = "";

      await this.fetchAvailableFiles();

      if (this.viewer3D) {
        this.viewer3D.clear();
      }
    },

    async loadStructure(fileId) {
      if (!fileId) return;
      this.loading3D = true;

      try {
        const fileUrl = `/api/files/download/${fileId}?userId=${this.userId}`;
        const response = await fetch(fileUrl);

        if (!response.ok) {
          throw new Error("文件流获取失败");
        }

        this.currentMolData = await response.text();

        if (
          this.currentMolData.includes("【Bio-OS 系统提示】") ||
          this.currentMolData.includes("<!DOCTYPE html>")
        ) {
          this.$message.warning(
            "渲染拦截：当前选中的是云端模拟数据，真实的物理 PDB/SDF 文件尚未落盘。",
          );
          this.loading3D = false;
          return;
        }

        this.$nextTick(() => {
          let element = document.getElementById("glcontainer");

          if (!this.viewer3D) {
            element.innerHTML = "";
            this.viewer3D = window.$3Dmol.createViewer(element, {
              backgroundColor: "black",
            });
          }

          this.viewer3D.clear();

          const fileObj = this.structureFiles.find((f) => f.id === fileId);
          const format = (fileObj.originalName || fileObj.name)
            .toLowerCase()
            .endsWith("sdf")
            ? "sdf"
            : "pdb";

          this.viewer3D.addModel(this.currentMolData, format);

          this.updateRenderStyle();
          this.viewer3D.zoomTo();

          this.$message.success("结构拓扑解析完毕，WebGL 渲染引擎已就绪");
        });
      } catch (error) {
        console.error("3D 渲染失败:", error);
        this.$message.error("无法读取结构文件流，渲染引擎启动失败");
      } finally {
        this.loading3D = false;
      }
    },

    updateRenderStyle() {
      if (!this.viewer3D) return;

      this.viewer3D.removeAllLabels();
      this.viewer3D.setStyle({}, {});

      if (this.renderStyle === "cartoon") {
        this.viewer3D.setStyle({}, { cartoon: { color: "spectrum" } });
      } else if (this.renderStyle === "stick") {
        this.viewer3D.setStyle({}, { stick: { radius: 0.15 } });
      } else if (this.renderStyle === "sphere") {
        this.viewer3D.setStyle({}, { sphere: { radius: 1.0 } });
      }

      this.viewer3D.render();
      this.$message.info(
        `底层渲染模式已切换至: ${this.renderStyle.toUpperCase()}`,
      );
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

/* ================= 4. 动态任务列表样式 (核心修改) ================= */
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
  /* 🌟 这里是改过的 CSS 样式，包含超出隐藏和标签美化 */
  .item-info {
    flex: 1;
    overflow: hidden; /* 防止溢出 */
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
        max-width: 140px; /* 给右边的项目标签留出空间 */
      }
      /* 专属暗黑标签样式 */
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

/* ================= 5. 算力监控面板 ================= */
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

/* ================= 7. 极客暗黑抽屉样式 ================= */
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
  .el-drawer__body {
    padding: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
}
.drawer-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  flex: 1;
  .pipeline-summary {
    display: flex;
    align-items: center;
    background: #1e293b;
    padding: 16px;
    border-radius: 12px;
    margin-bottom: 24px;
    border: 1px solid #334155;
    .pl-icon {
      width: 40px;
      height: 40px;
      background: rgba(59, 130, 246, 0.2);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      i {
        color: #3b82f6;
        font-size: 20px;
      }
    }
    .pl-info {
      flex: 1;
      h4 {
        margin: 0 0 4px 0;
        color: #f8fafc;
        font-size: 15px;
      }
      p {
        margin: 0;
        color: #64748b;
        font-size: 12px;
        font-family: Consolas, monospace;
      }
    }
  }
  ::v-deep .bio-dark-form {
    .el-form-item__label {
      color: #94a3b8;
      padding-bottom: 8px;
      font-weight: 500;
    }
    .el-input__inner,
    .el-textarea__inner {
      background-color: #1e293b;
      border: 1px solid #334155;
      color: #f8fafc;
      font-family: Consolas, monospace;
      &:focus {
        border-color: #3b82f6;
      }
    }
    .el-select .el-tag {
      background-color: rgba(59, 130, 246, 0.2);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #60a5fa;
    }
  }
  .drawer-footer {
    margin-top: auto;
    padding-top: 24px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    border-top: 1px solid #1e293b;
    .dark-btn-cancel {
      background: transparent;
      border: 1px solid #475569;
      color: #94a3b8;
      &:hover {
        border-color: #f8fafc;
        color: #f8fafc;
      }
    }
    .dark-btn-submit {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      border: none;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      &:hover {
        transform: translateY(-1px);
      }
    }
  }
}

/* ================= 8. 🌟 3D 渲染舱专属样式 ================= */
.structure-viewer-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 10px 0;
}
.viewer-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #0f172a;
  border: 1px solid #1f2937;
  border-radius: 8px;
}
.viewer-stage {
  height: 480px;
  background: #000000;
  border: 1px solid #1f2937;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 60px rgba(20, 184, 166, 0.05);
}
.empty-stage {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #64748b;
  .empty-icon {
    font-size: 54px;
    margin-bottom: 16px;
    opacity: 0.5;
    color: #14b8a6;
  }
  p {
    margin: 0 0 8px 0;
    font-size: 15px;
    color: #94a3b8;
    font-weight: 500;
  }
  .support-text {
    font-size: 12px;
    font-family: Consolas, monospace;
  }
}
.stage-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  .overlay-info {
    position: absolute;
    top: 16px;
    left: 16px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
    .info-item {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid #1e293b;
      color: #2dd4bf;
      font-size: 11px;
      padding: 6px 10px;
      border-radius: 4px;
      font-family: Consolas, monospace;
      backdrop-filter: blur(4px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    }
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

/* 修复下拉框白底问题和暗黑单选按钮样式 */
<style>
.bio-dark-select-dropdown {
  background-color: #1e293b !important;
  border: 1px solid #334155 !important;
}
.bio-dark-select-dropdown .el-select-dropdown__item {
  color: #94a3b8 !important;
}
.bio-dark-select-dropdown .el-select-dropdown__item.hover,
.bio-dark-select-dropdown .el-select-dropdown__item:hover {
  background-color: #0f172a !important;
  color: #f8fafc !important;
}
.bio-dark-dialog {
  background-color: #0f172a !important;
  border: 1px solid #1e293b;
  border-radius: 12px;
}
.bio-dark-dialog .el-dialog__title {
  color: #f8fafc;
  font-weight: 600;
  font-family: Consolas, monospace;
}
.bio-dark-dialog .el-dialog__header {
  border-bottom: 1px solid #1e293b;
  padding: 16px 20px;
}
.bio-dark-dialog .el-dialog__body {
  padding: 20px;
  background: #0b0f19;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}
.dark-radio-group .el-radio-button__inner {
  background: #1e293b;
  border-color: #334155;
  color: #94a3b8;
  box-shadow: none !important;
}
.dark-radio-group
  .el-radio-button__orig-radio:checked
  + .el-radio-button__inner {
  background-color: #14b8a6;
  border-color: #14b8a6;
  color: white;
}
</style>
