<template>
  <div class="workspace-container">
    <div class="workspace-main">
      <header class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h2>科研工作空间 (Workspace)</h2>
            <p class="subtitle">管理多组学课题，监控云存储资源与算力调度状态</p>
          </div>
          <div class="action-section">
            <el-input
              v-model="searchQuery"
              placeholder="搜索项目名称或描述..."
              prefix-icon="el-icon-search"
              class="search-input"
              clearable
            />
            <el-button
              type="primary"
              icon="el-icon-plus"
              @click="openCreateDialog"
            >
              新建科研空间
            </el-button>
          </div>
        </div>
      </header>

      <div
        class="dashboard-section"
        v-show="projectList.length > 0 && !loading"
      >
        <el-row :gutter="24">
          <el-col :span="12">
            <div class="chart-card">
              <div class="chart-header">
                <span class="chart-title"
                  ><i class="el-icon-pie-chart"></i> 各课题云存储资源占比</span
                >
              </div>
              <div ref="storageChart" class="echarts-container"></div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="chart-card">
              <div class="chart-header">
                <span class="chart-title"
                  ><i class="el-icon-data-analysis"></i>
                  累计执行分析任务分布</span
                >
              </div>
              <div ref="taskChart" class="echarts-container"></div>
            </div>
          </el-col>
        </el-row>
      </div>

      <div v-if="loading" class="state-container">
        <el-skeleton :rows="6" animated />
      </div>

      <div v-else-if="filteredProjects.length > 0" class="project-grid">
        <div
          v-for="project in filteredProjects"
          :key="project.id"
          class="project-card"
          :class="{ 'is-archived': project.isArchived }"
        >
          <div
            class="card-accent"
            :class="project.isArchived ? 'bg-gray' : 'bg-blue'"
          ></div>

          <div class="card-header">
            <div class="header-left">
              <div class="title-wrapper">
                <i class="el-icon-folder-opened folder-icon"></i>
                <span class="project-name" :title="project.name">{{
                  project.name
                }}</span>
              </div>
              <el-tag
                size="mini"
                :type="project.isArchived ? 'info' : 'primary'"
                :effect="project.isArchived ? 'plain' : 'light'"
                class="status-tag"
              >
                {{ project.isArchived ? "已归档" : "进行中" }}
              </el-tag>
            </div>

            <div class="header-right">
              <el-dropdown
                trigger="click"
                @command="(cmd) => handleCommand(cmd, project)"
              >
                <el-button
                  type="text"
                  icon="el-icon-more"
                  class="more-btn"
                ></el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="edit" icon="el-icon-edit"
                    >编辑课题</el-dropdown-item
                  >
                  <el-dropdown-item command="archive" icon="el-icon-collection">
                    {{ project.isArchived ? "取消归档" : "归档冻结" }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="delete"
                    icon="el-icon-delete"
                    divided
                    class="text-danger"
                  >
                    销毁空间
                  </el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
          </div>

          <div class="card-body">
            <p class="description">
              {{ project.description || "暂无课题描述..." }}
            </p>
          </div>

          <div class="card-stats">
            <div class="stat-item" title="挂载文件数">
              <span class="stat-value">{{ project.fileCount || 0 }}</span>
              <span class="stat-label">文件数</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item" title="占用云存储空间">
              <span class="stat-value">{{
                project.formattedTotalFileSize || "0 B"
              }}</span>
              <span class="stat-label">存储量</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item" title="已执行分析流">
              <span class="stat-value">{{
                project.analysisTaskCount || 0
              }}</span>
              <span class="stat-label">任务数</span>
            </div>
          </div>

          <div class="card-footer">
            <el-tooltip
              effect="dark"
              :content="'项目立项时间: ' + formatTime(project.createdAt)"
              placement="top"
            >
              <span class="time" style="cursor: help">
                <i class="el-icon-time"></i>
                {{ formatTime(project.updatedAt) }} 更新
              </span>
            </el-tooltip>

            <el-button
              type="primary"
              size="small"
              plain
              class="enter-btn"
              @click="enterWorkspace(project)"
            >
              载入大盘 <i class="el-icon-right"></i>
            </el-button>
          </div>
        </div>
      </div>

      <div v-else class="state-container empty-state">
        <img
          src="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
          alt="empty"
          class="empty-img"
        />
        <h3>尚未创建科研课题</h3>
        <p>创建一个工作空间，开始隔离管理您的多组学数据与分析管线。</p>
        <el-button
          type="primary"
          @click="openCreateDialog"
          style="margin-top: 20px"
        >
          立即创建
        </el-button>
      </div>
    </div>

    <el-dialog
      :title="isEdit ? '编辑科研空间' : '初始化科研空间'"
      :visible.sync="dialogVisible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="projectForm"
        :model="form"
        :rules="rules"
        label-position="top"
      >
        <el-form-item label="课题名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="例如：肝癌转录组预处理与比对"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="课题描述" prop="description">
          <el-input
            type="textarea"
            :rows="4"
            v-model="form.description"
            placeholder="简述该项目的研究背景、所用数据源等..."
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">
          {{ isEdit ? "保存更改" : "确认创建" }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import * as echarts from "echarts"; // 🌟 引入 ECharts
import {
  getUserProjects,
  createProject,
  updateProject,
  deleteProject,
  toggleArchiveProject,
} from "@/api/project";

export default {
  name: "ProjectList",
  data() {
    return {
      loading: false,
      searchQuery: "",
      projectList: [],

      // 图表实例
      storageChartInstance: null,
      taskChartInstance: null,

      dialogVisible: false,
      submitLoading: false,
      isEdit: false,
      form: { id: null, name: "", description: "" },
      rules: {
        name: [
          { required: true, message: "科研课题名称不能为空", trigger: "blur" },
        ],
      },
    };
  },
  computed: {
    ...mapState("user", ["isLoggedIn"]),
    ...mapGetters("user", ["userId"]),
    filteredProjects() {
      if (!this.searchQuery) return this.projectList;
      const q = this.searchQuery.toLowerCase();
      return this.projectList.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)),
      );
    },
  },
  mounted() {
    if (this.isLoggedIn && this.userId) {
      this.fetchProjects();
    } else {
      this.$message.warning("请先登录系统");
      this.$router.push("/home");
    }
    // 🌟 监听窗口大小变化，让图表自动缩放
    window.addEventListener("resize", this.resizeCharts);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.resizeCharts);
    if (this.storageChartInstance) this.storageChartInstance.dispose();
    if (this.taskChartInstance) this.taskChartInstance.dispose();
  },
  methods: {
    async fetchProjects() {
      this.loading = true;
      try {
        const res = await getUserProjects(this.userId);
        if (res && res.data) {
          this.projectList = res.data;
          // 🌟 数据拉取成功后，立刻渲染 ECharts 图表
          this.$nextTick(() => {
            if (this.projectList.length > 0) {
              this.initCharts();
            }
          });
        }
      } catch (error) {
        this.$message.error("拉取项目列表失败，请重试");
      } finally {
        this.loading = false;
      }
    },

    // 🌟 核心：初始化并渲染 ECharts 数据看板
    initCharts() {
      // 1. 组装存储容量饼图数据
      const storageData = this.projectList
        .map((p) => ({
          name: p.name,
          value: p.totalFileSizeBytes
            ? (p.totalFileSizeBytes / (1024 * 1024)).toFixed(2)
            : 0, // 转为 MB
        }))
        .filter((item) => item.value > 0); // 过滤掉 0 字节的空项目

      // 如果所有项目都是空的，给个占位数据避免饼图难看
      if (storageData.length === 0)
        storageData.push({ name: "暂无挂载数据", value: 1 });

      const storageChartDom = this.$refs.storageChart;
      if (storageChartDom) {
        this.storageChartInstance = echarts.init(storageChartDom);
        this.storageChartInstance.setOption({
          tooltip: { trigger: "item", formatter: "{b}: {c} MB ({d}%)" },
          color: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"],
          series: [
            {
              name: "存储占用",
              type: "pie",
              radius: ["40%", "70%"],
              avoidLabelOverlap: true,
              itemStyle: {
                borderRadius: 8,
                borderColor: "#fff",
                borderWidth: 2,
              },
              label: { show: false, position: "center" },
              emphasis: {
                label: { show: true, fontSize: 14, fontWeight: "bold" },
              },
              labelLine: { show: false },
              data: storageData,
            },
          ],
        });
      }

      // 2. 组装分析任务柱状图数据
      const projectNames = this.projectList.map((p) => {
        return p.name.length > 6 ? p.name.substring(0, 6) + "..." : p.name; // 名字太长截断
      });
      const taskCounts = this.projectList.map((p) => p.analysisTaskCount || 0);

      const taskChartDom = this.$refs.taskChart;
      if (taskChartDom) {
        this.taskChartInstance = echarts.init(taskChartDom);
        this.taskChartInstance.setOption({
          tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
          grid: {
            left: "3%",
            right: "4%",
            bottom: "3%",
            top: "10%",
            containLabel: true,
          },
          xAxis: [
            {
              type: "category",
              data: projectNames,
              axisTick: { alignWithLabel: true },
              axisLabel: {
                color: "#6b7280",
                fontSize: 11,
                interval: 0,
                rotate: 30,
              },
            },
          ],
          yAxis: [
            {
              type: "value",
              minInterval: 1,
              axisLabel: { color: "#6b7280" },
              splitLine: { lineStyle: { type: "dashed", color: "#e5e7eb" } },
            },
          ],
          series: [
            {
              name: "执行分析次数",
              type: "bar",
              barWidth: "40%",
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "#60a5fa" },
                  { offset: 1, color: "#3b82f6" },
                ]),
                borderRadius: [4, 4, 0, 0],
              },
              data: taskCounts,
            },
          ],
        });
      }
    },

    resizeCharts() {
      if (this.storageChartInstance) this.storageChartInstance.resize();
      if (this.taskChartInstance) this.taskChartInstance.resize();
    },

    formatTime(timeStr) {
      return !timeStr ? "未知时间" : timeStr.substring(0, 10);
    },

    enterWorkspace(project) {
      this.$message.success(`正在进入课题：${project.name}`);
      this.$router.push({
        path: "/analysis",
        query: { projectId: project.id },
      });
    },

    handleCommand(command, project) {
      if (command === "edit") this.openEditDialog(project);
      if (command === "archive") this.handleArchive(project);
      if (command === "delete") this.handleDelete(project);
    },

    openCreateDialog() {
      this.isEdit = false;
      this.form = { id: null, name: "", description: "" };
      this.dialogVisible = true;
      this.$nextTick(() => {
        this.$refs.projectForm.clearValidate();
      });
    },

    openEditDialog(project) {
      this.isEdit = true;
      this.form = {
        id: project.id,
        name: project.name,
        description: project.description,
      };
      this.dialogVisible = true;
    },

    submitForm() {
      this.$refs.projectForm.validate(async (valid) => {
        if (!valid) return;
        this.submitLoading = true;
        try {
          const payload = {
            userId: this.userId,
            name: this.form.name,
            description: this.form.description,
          };
          if (this.isEdit) {
            await updateProject(this.form.id, payload);
            this.$message.success("课题信息更新成功");
          } else {
            await createProject(payload);
            this.$message.success("全新的科研工作空间已建立");
          }
          this.dialogVisible = false;
          this.fetchProjects(); // 拉取完自动重绘 ECharts
        } catch (error) {
          this.$message.error(this.isEdit ? "更新失败" : "创建失败");
        } finally {
          this.submitLoading = false;
        }
      });
    },

    async handleArchive(project) {
      try {
        await toggleArchiveProject(project.id, !project.isArchived);
        this.$message.success(
          `课题已${project.isArchived ? "取消归档" : "冻结归档"}`,
        );
        this.fetchProjects();
      } catch (error) {
        this.$message.error(`操作失败`);
      }
    },

    async handleDelete(project) {
      try {
        await this.$confirm(
          `警告：销毁空间 "${project.name}" 将会导致数据失去关联。是否继续？`,
          "销毁警告",
          {
            confirmButtonText: "强制销毁",
            cancelButtonText: "取消",
            type: "error",
          },
        );
        await deleteProject(project.id);
        this.$message.success("空间已彻底销毁");
        this.fetchProjects();
      } catch (error) {
        // 用户取消或删除失败
      }
    },
  },
};
</script>

<style lang="scss" scoped>
/* ================= 现代化企业级亮色风格 ================= */
.workspace-container {
  min-height: calc(100vh - 64px);
  background-color: #f4f6f8;
  padding: 32px 20px;
  color: #333639;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
}

.workspace-main {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px 32px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .title-section {
    h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
    }
    .subtitle {
      margin: 0;
      font-size: 14px;
      color: #6b7280;
    }
  }
  .action-section {
    display: flex;
    gap: 16px;
    align-items: center;
    .search-input {
      width: 260px;
      ::v-deep .el-input__inner {
        border-radius: 20px;
        background-color: #f9fafb;
        border-color: #e5e7eb;
        &:focus {
          background-color: #ffffff;
          border-color: #3b82f6;
        }
      }
    }
  }
}

/* 🌟 新增：数据看板样式 */
.dashboard-section {
  margin-bottom: 24px;

  .chart-card {
    background: #ffffff;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    border: 1px solid #e5e7eb;

    .chart-header {
      margin-bottom: 16px;
      .chart-title {
        font-size: 15px;
        font-weight: 600;
        color: #374151;
        display: flex;
        align-items: center;
        gap: 8px;
        i {
          color: #3b82f6;
          font-size: 18px;
        }
      }
    }

    .echarts-container {
      width: 100%;
      height: 220px; /* 图表高度 */
    }
  }
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.project-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
    border-color: #d1d5db;
  }
  &.is-archived {
    opacity: 0.7;
    background: #f9fafb;
    .folder-icon {
      color: #9ca3af !important;
    }
  }
  .card-accent {
    height: 4px;
    width: 100%;
    &.bg-blue {
      background: linear-gradient(90deg, #3b82f6, #60a5fa);
    }
    &.bg-gray {
      background: #d1d5db;
    }
  }
  .card-header {
    padding: 20px 24px 0;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    .header-left {
      flex: 1;
      min-width: 0;
      .title-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        .folder-icon {
          font-size: 20px;
          color: #3b82f6;
        }
        .project-name {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
      .status-tag {
        border-radius: 12px;
      }
    }
    .header-right {
      margin-left: 12px;
      .more-btn {
        padding: 4px;
        color: #9ca3af;
        font-size: 18px;
        &:hover {
          color: #4b5563;
        }
      }
    }
  }
  .card-body {
    padding: 16px 24px;
    flex: 1;
    .description {
      margin: 0;
      font-size: 13px;
      color: #6b7280;
      line-height: 1.6;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
  .card-stats {
    display: flex;
    align-items: center;
    background: #f9fafb;
    padding: 12px 24px;
    border-top: 1px solid #f3f4f6;
    border-bottom: 1px solid #f3f4f6;
    .stat-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      .stat-value {
        font-size: 15px;
        font-weight: 600;
        color: #1f2937;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          monospace;
      }
      .stat-label {
        font-size: 11px;
        color: #6b7280;
      }
    }
    .stat-divider {
      width: 1px;
      height: 24px;
      background-color: #e5e7eb;
    }
  }
  .card-footer {
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #ffffff;
    .time {
      font-size: 12px;
      color: #9ca3af;
    }
    .enter-btn {
      border-radius: 16px;
      padding: 6px 16px;
    }
  }
}

.state-container {
  background: #ffffff;
  border-radius: 12px;
  padding: 60px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.empty-state {
  text-align: center;
  color: #6b7280;
  .empty-img {
    width: 160px;
    margin-bottom: 16px;
    opacity: 0.8;
  }
  h3 {
    margin: 0 0 8px;
    color: #374151;
    font-size: 18px;
  }
  p {
    margin: 0;
    font-size: 14px;
  }
}
.text-danger {
  color: #ef4444 !important;
}
</style>
