<template>
  <div class="analysis-center-container">
    <!-- 分析中心主内容 -->
    <div class="analysis-main">
      <!-- 欢迎横幅 -->
      <div class="welcome-banner">
        <div class="banner-content">
          <h2>生物信息分析中心</h2>
          <p>
            专业的高通量测序数据分析平台，支持RNA-Seq、WGS、scRNA-Seq等多种分析流程
          </p>
          <div class="banner-stats">
            <div class="stat-item">
              <span class="stat-number">{{ stats.totalTasks }}</span>
              <span class="stat-label">分析任务</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ stats.completedTasks }}</span>
              <span class="stat-label">已完成</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ stats.successRate }}%</span>
              <span class="stat-label">成功率</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ stats.activeUsers }}</span>
              <span class="stat-label">活跃用户</span>
            </div>
          </div>
        </div>
        <div class="banner-actions">
          <el-button
            type="primary"
            icon="el-icon-video-play"
            @click="handleQuickStart"
          >
            快速开始
          </el-button>
          <el-button icon="el-icon-guide" @click="handleTutorial">
            新手引导
          </el-button>
        </div>
      </div>

      <!-- 快速操作区域 -->
      <div class="quick-actions">
        <div class="actions-header">
          <h3 class="section-title">
            <i class="el-icon-s-operation"></i> 快速操作
          </h3>
          <div class="action-tips">
            <el-tag type="info" size="small">常用功能一键直达</el-tag>
          </div>
        </div>
        <div class="action-buttons">
          <div class="action-btn-item" @click="handleUploadData">
            <div class="action-btn-icon upload">
              <i class="el-icon-upload"></i>
            </div>
            <span class="action-btn-label">上传数据</span>
          </div>
          <div class="action-btn-item" @click="handleNewAnalysis">
            <div class="action-btn-icon analysis">
              <i class="el-icon-video-play"></i>
            </div>
            <span class="action-btn-label">新建分析</span>
          </div>
          <div class="action-btn-item" @click="handleExportReports">
            <div class="action-btn-icon export">
              <i class="el-icon-download"></i>
            </div>
            <span class="action-btn-label">导出报告</span>
          </div>
          <div class="action-btn-item" @click="handleAIAssistant">
            <div class="action-btn-icon ai">
              <i class="el-icon-setting"></i>
            </div>
            <span class="action-btn-label">AI助手</span>
          </div>
          <div class="action-btn-item" @click="handleViewTemplates">
            <div class="action-btn-icon template">
              <i class="el-icon-magic-stick"></i>
            </div>
            <span class="action-btn-label">流程模板</span>
          </div>
          <div class="action-btn-item" @click="handleDataManagement">
            <div class="action-btn-icon data">
              <i class="el-icon-folder"></i>
            </div>
            <span class="action-btn-label">数据管理</span>
          </div>
        </div>
      </div>

      <!-- 两栏布局 -->
      <div class="main-content">
        <!-- 左侧：最近任务和分析模板 -->
        <div class="content-left">
          <!-- 最近任务列表 -->
          <div class="recent-tasks">
            <div class="tasks-header">
              <h3 class="section-title">
                <i class="el-icon-s-order"></i> 最近任务
                <span class="task-count">({{ recentTasks.length }})</span>
              </h3>
              <div class="tasks-filter">
                <el-select
                  v-model="taskFilter"
                  placeholder="筛选任务"
                  size="mini"
                  style="width: 120px"
                >
                  <el-option label="全部" value="all"></el-option>
                  <el-option label="进行中" value="running"></el-option>
                  <el-option label="已完成" value="completed"></el-option>
                  <el-option label="失败" value="failed"></el-option>
                </el-select>
                <el-button
                  type="text"
                  icon="el-icon-refresh"
                  size="mini"
                  @click="refreshTasks"
                  :loading="refreshing"
                ></el-button>
              </div>
            </div>

            <div class="task-list">
              <div
                v-for="task in filteredTasks"
                :key="task.id"
                class="task-item"
                :class="{
                  'task-running': task.status === 'running',
                  'task-completed': task.status === 'completed',
                  'task-failed': task.status === 'failed',
                }"
                @click="viewTask(task)"
              >
                <div class="task-info">
                  <div class="task-title">
                    <el-tooltip :content="task.name" placement="top">
                      <span class="task-name">{{ task.name }}</span>
                    </el-tooltip>
                    <el-tag
                      size="mini"
                      :type="getStatusType(task.status)"
                      class="task-status-tag"
                    >
                      {{ getStatusText(task.status) }}
                    </el-tag>
                  </div>
                  <div class="task-meta">
                    <span class="task-type">
                      <i
                        :class="getTaskIcon(task.type)"
                        class="task-type-icon"
                      ></i>
                      {{ task.type }}
                    </span>
                    <span class="task-time">{{
                      formatTime(task.createTime)
                    }}</span>
                  </div>
                  <div class="task-progress">
                    <el-progress
                      :percentage="task.progress"
                      :status="getProgressStatus(task.status)"
                      :stroke-width="6"
                      :show-text="false"
                    />
                    <span class="progress-text">{{ task.progress }}%</span>
                  </div>
                </div>
                <div class="task-actions">
                  <el-button
                    v-if="task.status === 'running'"
                    type="text"
                    size="mini"
                    icon="el-icon-close"
                    @click.stop="stopTask(task)"
                    class="stop-btn"
                  ></el-button>
                  <el-button
                    v-else-if="task.status === 'completed'"
                    type="text"
                    size="mini"
                    icon="el-icon-download"
                    @click.stop="downloadResult(task)"
                    class="download-btn"
                  ></el-button>
                  <el-button
                    type="text"
                    size="mini"
                    icon="el-icon-view"
                    @click.stop="viewTask(task)"
                    class="view-btn"
                  ></el-button>
                </div>
              </div>

              <div v-if="filteredTasks.length === 0" class="empty-tasks">
                <i class="el-icon-s-opportunity"></i>
                <p>暂无分析任务</p>
                <el-button type="text" @click="handleNewAnalysis"
                  >开始第一个分析</el-button
                >
              </div>

              <div v-if="recentTasks.length > 3" class="view-all-tasks">
                <el-button type="text" @click="goToTaskManagement">
                  查看全部任务 <i class="el-icon-arrow-right"></i>
                </el-button>
              </div>
            </div>
          </div>

          <!-- 分析流程模板 -->
          <div class="analysis-templates">
            <div class="templates-header">
              <h3 class="section-title">
                <i class="el-icon-magic-stick"></i> 分析流程模板
              </h3>
              <el-button type="text" size="mini" @click="viewAllTemplates">
                更多 <i class="el-icon-more"></i>
              </el-button>
            </div>

            <div class="template-grid">
              <el-card
                v-for="template in analysisTemplates"
                :key="template.id"
                class="template-card"
                shadow="hover"
                @click.native="useTemplate(template)"
              >
                <div slot="header" class="template-card-header">
                  <div
                    class="template-icon-wrapper"
                    :style="{ background: template.color }"
                  >
                    <i :class="template.icon"></i>
                  </div>
                  <div class="template-title">
                    <h4>{{ template.name }}</h4>
                    <el-rate
                      v-model="template.rating"
                      disabled
                      show-score
                      text-color="#ff9900"
                      score-template="{value}分"
                      class="template-rating"
                    />
                  </div>
                </div>
                <div class="template-content">
                  <p class="template-description">{{ template.description }}</p>
                  <div class="template-tags">
                    <el-tag
                      v-for="tag in template.tags"
                      :key="tag"
                      size="mini"
                      :type="getTagType(tag)"
                    >
                      {{ tag }}
                    </el-tag>
                  </div>
                  <div class="template-meta">
                    <span>
                      <i class="el-icon-time"></i>
                      {{ template.duration }}分钟
                    </span>
                    <span>
                      <i class="el-icon-user"></i>
                      {{ template.usedCount }}次使用
                    </span>
                  </div>
                </div>
                <div class="template-footer">
                  <el-button
                    type="primary"
                    size="small"
                    plain
                    @click.stop="useTemplate(template)"
                  >
                    使用模板
                  </el-button>
                  <el-button
                    type="text"
                    size="small"
                    @click.stop="previewTemplate(template)"
                  >
                    预览
                  </el-button>
                </div>
              </el-card>
            </div>
          </div>
        </div>

        <!-- 右侧：数据文件和推荐资源 -->
        <div class="content-right">
          <!-- 最近上传文件组件 -->
          <recent-files
            :user-id="UserId"
            @upload-click="handleUploadData"
            @file-click="viewFile"
            @file-download="downloadFile"
            @file-delete="deleteFile"
            ref="recentFiles"
          />

          <!-- 学习资源推荐 -->
          <div class="learning-resources" v-if="userRole === 'student'">
            <div class="resources-header">
              <h3 class="section-title">
                <i class="el-icon-reading"></i> 学习推荐
              </h3>
              <el-button type="text" size="mini" @click="goToLearningCenter">
                更多 <i class="el-icon-arrow-right"></i>
              </el-button>
            </div>

            <div class="resource-list">
              <div
                v-for="resource in learningResources"
                :key="resource.id"
                class="resource-item"
                :style="{ background: resource.bgColor }"
                @click="startLearning(resource)"
              >
                <div class="resource-content">
                  <h4>{{ resource.title }}</h4>
                  <p>{{ resource.description }}</p>
                  <div class="resource-tags">
                    <span class="resource-duration"
                      >{{ resource.duration }}分钟</span
                    >
                    <span class="resource-level">{{ resource.level }}</span>
                  </div>
                </div>
                <div class="resource-icon">
                  <i :class="resource.icon"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- 系统公告 -->
          <div class="system-announcements">
            <div class="announcements-header">
              <h3 class="section-title">
                <i class="el-icon-mic"></i> 系统公告
              </h3>
            </div>
            <div class="announcement-list">
              <div
                v-for="announcement in announcements"
                :key="announcement.id"
                class="announcement-item"
              >
                <div class="announcement-badge" v-if="announcement.isNew">
                  <el-tag size="mini" type="danger">NEW</el-tag>
                </div>
                <div class="announcement-content">
                  <h5>{{ announcement.title }}</h5>
                  <p>{{ announcement.content }}</p>
                  <span class="announcement-time">{{ announcement.time }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建分析对话框 -->
    <el-dialog
      title="新建分析任务"
      :visible.sync="showCreateDialog"
      width="800px"
      @close="closeCreateDialog"
    >
      <new-analysis-form
        :templates="analysisTemplates"
        :files="getRecentUploadFiles"
        @submit="createAnalysis"
        @cancel="closeCreateDialog"
      />
    </el-dialog>

    <!-- 数据上传对话框 -->
    <el-dialog
      title="上传数据文件"
      :visible.sync="showUploadDialog"
      width="600px"
    >
      <file-uploader
        @success="handleUploadSuccess"
        @cancel="closeUploadDialog"
      />
    </el-dialog>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import FileUploader from "@/components/analysis/FileUploader.vue";
import RecentFiles from "@/components/analysis/RecentFiles.vue";

export default {
  name: "AnalysisPage",

  components: {
    FileUploader,
    RecentFiles,
  },

  data() {
    return {
      stats: {
        totalTasks: 156,
        completedTasks: 132,
        successRate: 94.5,
        activeUsers: 42,
      },

      recentTasks: [
        {
          id: 1,
          name: "实验一：RNA-Seq差异表达分析",
          type: "RNA-Seq",
          status: "completed",
          progress: 100,
          createTime: "2023-10-15T14:30:00",
        },
        {
          id: 2,
          name: "作业：WGS变异检测",
          type: "WGS",
          status: "running",
          progress: 65,
          createTime: "2023-10-16T09:15:00",
        },
        {
          id: 3,
          name: "单细胞测序细胞分型",
          type: "scRNA-Seq",
          status: "waiting",
          progress: 0,
          createTime: "2023-10-16T10:20:00",
        },
        {
          id: 4,
          name: "ChIP-Seq峰识别分析",
          type: "ChIP-Seq",
          status: "failed",
          progress: 30,
          createTime: "2023-10-15T16:45:00",
        },
      ],

      analysisTemplates: [
        {
          id: 1,
          name: "RNA-Seq标准流程",
          description:
            "转录组测序标准分析流程，包括质控、比对、定量和差异表达分析",
          icon: "el-icon-data-line",
          color: "#3498db",
          tags: ["基础", "教学", "自动化"],
          rating: 4.7,
          duration: 45,
          usedCount: 128,
        },
        {
          id: 2,
          name: "单细胞分析流程",
          description: "单细胞RNA测序分析，包括质控、归一化、降维和聚类分析",
          icon: "el-icon-pie-chart",
          color: "#9b59b6",
          tags: ["高级", "科研", "可视化"],
          rating: 4.9,
          duration: 60,
          usedCount: 86,
        },
        {
          id: 3,
          name: "WGS变异检测",
          description: "全基因组测序变异检测流程，包括SNP、InDel和结构变异检测",
          icon: "el-icon-cpu",
          color: "#2ecc71",
          tags: ["中级", "临床", "精准医疗"],
          rating: 4.5,
          duration: 75,
          usedCount: 92,
        },
        {
          id: 4,
          name: "ChIP-Seq分析",
          description: "染色质免疫沉淀测序分析，包括质量控制、峰识别和富集分析",
          icon: "el-icon-trend-charts",
          color: "#e74c3c",
          tags: ["高级", "表观遗传", "转录调控"],
          rating: 4.3,
          duration: 50,
          usedCount: 64,
        },
      ],

      learningResources: [
        {
          id: 1,
          title: "RNA-Seq数据分析入门",
          description: "掌握RNA-Seq数据处理的基本原理和方法",
          bgColor: "linear-gradient(135deg, #3498db, #2ecc71)",
          icon: "el-icon-data-line",
          duration: 30,
          level: "初级",
        },
        {
          id: 2,
          title: "单细胞测序技术详解",
          description: "深入了解单细胞测序的原理和应用场景",
          bgColor: "linear-gradient(135deg, #9b59b6, #3498db)",
          icon: "el-icon-pie-chart",
          duration: 45,
          level: "中级",
        },
      ],

      announcements: [
        {
          id: 1,
          title: "系统维护通知",
          content: "本周六凌晨2:00-4:00进行系统维护",
          time: "2023-10-16 10:00",
          isNew: true,
        },
        {
          id: 2,
          title: "新增分析模块",
          content: "新增ATAC-Seq分析流程，欢迎使用",
          time: "2023-10-15 09:30",
          isNew: false,
        },
      ],
      taskFilter: "all",
      refreshing: false,
      showCreateDialog: false,
      showUploadDialog: false,
    };
  },

  computed: {
    ...mapState("user", {
      isLoggedIn: (state) => state.isLoggedIn,
      userInfo: (state) => state.userInfo,
    }),

    ...mapGetters("user", ["UserId", "Name", "userRole"]),

    filteredTasks() {
      if (this.taskFilter === "all") {
        return this.recentTasks.slice(0, 5);
      }
      return this.recentTasks
        .filter((task) => task.status === this.taskFilter)
        .slice(0, 5);
    },

    // 获取最近上传的文件（用于新建分析对话框）
    getRecentUploadFiles() {
      return this.$refs.recentFiles ? 
        this.$refs.recentFiles.files.filter(file => 
          ['fasta', 'fastq', 'bam', 'vcf', 'csv'].includes(file.type)
        ) : [];
    }
  },

  created() {
    if (!this.isLoggedIn) {
      this.$message.warning("请先登录");
      this.$router.push("/login");
      return;
    }

    console.log("当前用户信息:", this.userInfo);
    console.log("用户ID:", this.UserId);
    console.log("用户名:", this.Name);
  },

  methods: {
    // 处理上传数据按钮点击
    handleUploadData() {
      if (!this.isLoggedIn) {
        this.$message.warning("请先登录");
        this.$router.push("/login");
        return;
      }

      this.showUploadDialog = true;
    },

    // 处理上传成功
    handleUploadSuccess(result) {
      this.closeUploadDialog();

      this.$message({
        message: `成功上传 ${result.success}/${result.total} 个文件`,
        type: "success",
        duration: 3000,
      });

      // 刷新文件列表
      this.$refs.recentFiles.refresh();
    },

    // 关闭上传对话框
    closeUploadDialog() {
      this.showUploadDialog = false;
    },

    // 查看文件
    viewFile(file) {
      this.$message.info(`查看文件: ${file.name}`);
    },

    // 下载文件
    downloadFile(file) {
      if (file.downloadUrl) {
        window.open(file.downloadUrl, '_blank');
        this.$message.success(`开始下载: ${file.name}`);
      } else {
        this.$message.warning('文件下载链接不可用');
      }
    },

    // 删除文件
    async deleteFile(file) {
      try {
        // 调用API删除文件
        await this.$axios.delete(`/api/files/${file.id}`);
        this.$message.success('文件已删除');
      } catch (error) {
        console.error('删除文件失败:', error);
        this.$message.error('删除文件失败');
      }
    },

    // 其他方法保持不变...
    handleNewAnalysis() {
      this.showCreateDialog = true;
    },

    handleExportReports() {
      this.$message({
        message: "开始导出分析报告",
        type: "info",
      });
    },

    handleAIAssistant() {
      this.$router.push({ name: "AnalysisAssistant" });
    },

    handleQuickStart() {
      this.$router.push({ name: "QuickStartGuide" });
    },

    handleTutorial() {
      this.$router.push({ name: "Tutorial" });
    },

    handleViewTemplates() {
      this.$router.push({ name: "TemplateLibrary" });
    },

    handleDataManagement() {
      this.$router.push({ name: "DataManagement" });
    },

    getStatusType(status) {
      const map = {
        completed: "success",
        running: "primary",
        waiting: "info",
        failed: "danger",
        stopped: "warning",
      };
      return map[status] || "info";
    },

    getStatusText(status) {
      const map = {
        completed: "已完成",
        running: "进行中",
        waiting: "等待中",
        failed: "失败",
        stopped: "已停止",
      };
      return map[status] || status;
    },

    getProgressStatus(status) {
      return status === "failed"
        ? "exception"
        : status === "completed"
        ? "success"
        : "";
    },

    viewTask(task) {
      this.$router.push({
        name: "TaskDetail",
        params: { id: task.id },
      });
    },

    stopTask() {
      this.$confirm("确定要停止这个任务吗？", "提示", {
        type: "warning",
      }).then(() => {
        this.$message.success("任务已停止");
      });
    },

    downloadResult(task) {
      this.$message.success(`开始下载 ${task.name} 的结果`);
    },

    refreshTasks() {
      this.refreshing = true;
      setTimeout(() => {
        this.refreshing = false;
        this.$message.success("任务列表已刷新");
      }, 1000);
    },

    useTemplate(template) {
      this.$router.push({
        name: "NewAnalysis",
        query: { templateId: template.id },
      });
    },

    previewTemplate(template) {
      this.$router.push({
        name: "TemplatePreview",
        params: { id: template.id },
      });
    },

    viewAllTemplates() {
      this.$router.push({ name: "TemplateLibrary" });
    },

    getTagType(tag) {
      const tagMap = {
        基础: "success",
        中级: "warning",
        高级: "danger",
        教学: "info",
        科研: "",
        临床: "danger",
        自动化: "success",
        可视化: "warning",
        表观遗传: "info",
        转录调控: "",
      };
      return tagMap[tag] || "info";
    },

    getFileIcon(fileType) {
      const iconMap = {
        fastq: "el-icon-document",
        fasta: "el-icon-files",
        csv: "el-icon-s-data",
        bam: "el-icon-coin",
        vcf: "el-icon-s-flag",
        txt: "el-icon-tickets",
      };
      return iconMap[fileType] || "el-icon-document";
    },

    getTaskIcon(taskType) {
      const iconMap = {
        "RNA-Seq": "el-icon-data-line",
        WGS: "el-icon-cpu",
        "scRNA-Seq": "el-icon-pie-chart",
        "ChIP-Seq": "el-icon-trend-charts",
      };
      return iconMap[taskType] || "el-icon-s-operation";
    },

    startLearning(resource) {
      this.$router.push({
        name: "LearningDetail",
        params: { id: resource.id },
      });
    },

    goToLearningCenter() {
      this.$router.push({ name: "LearningCenter" });
    },

    goToTaskManagement() {
      this.$router.push({ name: "TaskManagement" });
    },

    closeCreateDialog() {
      this.showCreateDialog = false;
    },

    createAnalysis(formData) {
      console.log("创建分析任务:", formData);
      this.closeCreateDialog();
      this.$message.success("分析任务已创建");

      this.recentTasks.unshift({
        id: Date.now(),
        name: formData.name || "新分析任务",
        type: formData.type || "RNA-Seq",
        status: "waiting",
        progress: 0,
        createTime: new Date().toISOString(),
      });
    },

    formatTime(timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 60) {
        return `${diffMins}分钟前`;
      } else if (diffHours < 24) {
        return `${diffHours}小时前`;
      } else if (diffDays < 7) {
        return `${diffDays}天前`;
      } else {
        return date.toLocaleDateString();
      }
    },

    formatFileSize(bytes) {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    },
  },

  watch: {
    isLoggedIn(newVal) {
      if (newVal) {
        // 登录后刷新数据
        if (this.$refs.recentFiles) {
          this.$refs.recentFiles.refresh();
        }
        this.refreshTasks();
      } else {
        // 登出后清空数据
        this.recentTasks = [];
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.analysis-center-container {
  min-height: calc(100vh - 60px);
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 20px;
}

.analysis-main {
  max-width: 1400px;
  margin: 0 auto;
}

// 欢迎横幅样式
.welcome-banner {
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  border-radius: 16px;
  padding: 30px;
  color: white;
  margin-bottom: 24px;
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: -50%;
    right: -50%;
    width: 300px;
    height: 300px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
  }

  .banner-content {
    flex: 1;
    z-index: 1;

    h2 {
      font-size: 32px;
      margin-bottom: 12px;
      font-weight: 700;
    }

    p {
      font-size: 16px;
      opacity: 0.95;
      margin-bottom: 24px;
      max-width: 700px;
      line-height: 1.6;
    }
  }

  .banner-stats {
    display: flex;
    gap: 48px;

    .stat-item {
      text-align: center;

      .stat-number {
        display: block;
        font-size: 36px;
        font-weight: 700;
        margin-bottom: 6px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .stat-label {
        font-size: 14px;
        opacity: 0.9;
        letter-spacing: 1px;
      }
    }
  }

  .banner-actions {
    z-index: 1;
    display: flex;
    gap: 12px;
  }
}

// 快速操作区域
.quick-actions {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  .actions-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .section-title {
      font-size: 20px;
      color: #2c3e50;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
    }
  }

  .action-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;

    .action-btn-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px 12px;
      border-radius: 8px;
      background: #f8fafc;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: #e8f4fe;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .action-btn-icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;

        &.upload {
          background: linear-gradient(135deg, #3498db, #2ecc71);
        }
        &.analysis {
          background: linear-gradient(135deg, #9b59b6, #3498db);
        }
        &.export {
          background: linear-gradient(135deg, #f39c12, #e74c3c);
        }
        &.ai {
          background: linear-gradient(135deg, #34495e, #2c3e50);
        }
        &.template {
          background: linear-gradient(135deg, #1abc9c, #16a085);
        }
        &.data {
          background: linear-gradient(135deg, #e67e22, #d35400);
        }

        i {
          font-size: 24px;
          color: white;
        }
      }

      .action-btn-label {
        font-size: 14px;
        font-weight: 500;
        color: #2c3e50;
      }
    }
  }
}

// 主内容布局
.main-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
}

.content-left {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-right {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

// 最近任务样式
.recent-tasks {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  .tasks-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .section-title {
      font-size: 18px;
      color: #2c3e50;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;

      .task-count {
        font-size: 14px;
        color: #7f8c8d;
        font-weight: normal;
      }
    }
  }

  .task-list {
    .task-item {
      display: flex;
      align-items: center;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #e8e8e8;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        border-color: #3498db;
        background: #f8fafc;

        .task-name {
          color: #3498db;
        }
      }

      &.task-running {
        border-left: 4px solid #3498db;
      }

      &.task-completed {
        border-left: 4px solid #2ecc71;
      }

      &.task-failed {
        border-left: 4px solid #e74c3c;
      }

      .task-info {
        flex: 1;

        .task-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;

          .task-name {
            font-weight: 500;
            color: #2c3e50;
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }

        .task-meta {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 12px;
          font-size: 12px;
          color: #7f8c8d;

          .task-type {
            display: flex;
            align-items: center;
            gap: 4px;

            .task-type-icon {
              font-size: 14px;
            }
          }
        }

        .task-progress {
          display: flex;
          align-items: center;
          gap: 12px;

          .progress-text {
            font-size: 12px;
            color: #7f8c8d;
            min-width: 40px;
          }
        }
      }

      .task-actions {
        display: flex;
        gap: 4px;

        .el-button {
          padding: 6px;
        }

        .stop-btn {
          color: #e74c3c;

          &:hover {
            background: #fdeaea;
          }
        }

        .download-btn {
          color: #3498db;

          &:hover {
            background: #e8f4fe;
          }
        }

        .view-btn {
          color: #7f8c8d;

          &:hover {
            background: #f5f5f5;
          }
        }
      }
    }

    .empty-tasks {
      text-align: center;
      padding: 40px 20px;
      color: #bdc3c7;

      i {
        font-size: 48px;
        margin-bottom: 16px;
      }

      p {
        margin-bottom: 12px;
        font-size: 14px;
      }
    }

    .view-all-tasks {
      text-align: center;
      padding-top: 16px;
      border-top: 1px solid #e8e8e8;
    }
  }
}

// 分析模板样式
.analysis-templates {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  .templates-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .template-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;

    .template-card {
      border: none;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-4px);
      }

      ::v-deep .el-card__header {
        border-bottom: none;
        padding-bottom: 0;
      }

      .template-card-header {
        display: flex;
        align-items: center;
        gap: 16px;

        .template-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;

          i {
            font-size: 24px;
            color: white;
          }
        }

        .template-title {
          flex: 1;

          h4 {
            margin: 0 0 8px 0;
            font-size: 16px;
            color: #2c3e50;
          }
        }
      }

      .template-content {
        .template-description {
          font-size: 14px;
          color: #7f8c8d;
          line-height: 1.5;
          margin-bottom: 16px;
          height: 42px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .template-tags {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .template-meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #95a5a6;

          span {
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }
      }

      .template-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 16px;
        border-top: 1px solid #f5f5f5;
      }
    }
  }
}

// 学习资源样式
.learning-resources {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  .resources-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .resource-list {
    .resource-item {
      display: flex;
      align-items: center;
      padding: 20px;
      border-radius: 12px;
      color: white;
      margin-bottom: 16px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateX(4px);
      }

      .resource-content {
        flex: 1;

        h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
        }

        p {
          margin: 0 0 12px 0;
          font-size: 14px;
          opacity: 0.9;
          line-height: 1.4;
        }

        .resource-tags {
          display: flex;
          gap: 12px;
          font-size: 12px;

          .resource-duration,
          .resource-level {
            background: rgba(255, 255, 255, 0.2);
            padding: 4px 8px;
            border-radius: 4px;
          }
        }
      }

      .resource-icon {
        i {
          font-size: 40px;
          opacity: 0.2;
        }
      }
    }
  }
}

// 系统公告样式
.system-announcements {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  .announcements-header {
    margin-bottom: 20px;
  }

  .announcement-list {
    .announcement-item {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #e8e8e8;
      margin-bottom: 12px;
      transition: all 0.3s ease;

      &:hover {
        border-color: #3498db;
        background: #f8fafc;
      }

      .announcement-badge {
        margin-right: 12px;
      }

      .announcement-content {
        flex: 1;

        h5 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: #2c3e50;
        }

        p {
          margin: 0 0 8px 0;
          font-size: 13px;
          color: #7f8c8d;
          line-height: 1.4;
        }

        .announcement-time {
          font-size: 12px;
          color: #95a5a6;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .content-right {
    grid-row: 1;
  }
}

@media (max-width: 768px) {
  .welcome-banner {
    flex-direction: column;
    align-items: flex-start;

    .banner-stats {
      flex-wrap: wrap;
      gap: 24px;
    }

    .banner-actions {
      margin-top: 20px;
    }
  }

  .action-buttons {
    grid-template-columns: repeat(2, 1fr);
  }

  .template-grid {
    grid-template-columns: 1fr !important;
  }

  .analysis-main {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .welcome-banner .banner-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;

    .stat-item {
      text-align: left;
    }
  }

  .action-buttons {
    grid-template-columns: 1fr;
  }
}
</style>