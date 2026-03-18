<template>
  <div class="bio-task-center">
    <div class="page-header">
      <div class="header-left">
        <h2><i class="el-icon-menu"></i> 任务调度中心 (Task Matrix)</h2>
        <p>全量监控与管理您的云端生信分析流水线</p>
      </div>
      <div class="header-right">
        <el-input
          v-model="queryParams.keyword"
          placeholder="搜索任务名称..."
          prefix-icon="el-icon-search"
          class="dark-input"
          clearable
          @clear="fetchTaskList"
          @keyup.enter.native="fetchTaskList"
        ></el-input>

        <el-select
          v-model="queryParams.status"
          placeholder="全部状态"
          class="dark-select"
          clearable
          @change="fetchTaskList"
          popper-class="bio-dark-select-dropdown"
        >
          <el-option label="运行中" value="RUNNING"></el-option>
          <el-option label="已完成" value="COMPLETED"></el-option>
          <el-option label="异常报错" value="FAILED"></el-option>
          <el-option label="排队中" value="PENDING"></el-option>
        </el-select>

        <el-button
          type="primary"
          icon="el-icon-refresh"
          class="dark-btn-refresh"
          @click="fetchTaskList"
          >刷新</el-button
        >
      </div>
    </div>

    <div
      class="table-container"
      v-loading="loading"
      element-loading-background="rgba(11, 15, 25, 0.8)"
    >
      <el-table :data="taskList" style="width: 100%" class="bio-dark-table">
        <el-table-column
          prop="name"
          label="任务名称"
          min-width="320"
          show-overflow-tooltip
        >
          <template slot-scope="scope">
            <div style="display: flex; align-items: center; gap: 8px">
              <span class="task-name-text">{{ scope.row.taskName }}</span>

              <el-tag
                v-if="
                  scope.row.projectName &&
                  scope.row.projectName !== '未绑定课题'
                "
                size="mini"
                type="info"
                effect="plain"
                class="dark-project-tag"
              >
                <i class="el-icon-folder-opened"></i>
                {{ scope.row.projectName }}
              </el-tag>
              <span v-else class="dark-no-project">- 独立任务 -</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="120" align="center">
          <template slot-scope="scope">
            <el-tag
              :type="parseTaskStatus(scope.row.status).type"
              size="small"
              effect="dark"
              class="status-tag"
            >
              <i :class="parseTaskStatus(scope.row.status).icon"></i>
              {{ parseTaskStatus(scope.row.status).text }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="分析进度" min-width="200">
          <template slot-scope="scope">
            <div class="progress-cell">
              <el-progress
                :percentage="scope.row.progress || 0"
                :color="getProgressColor(scope.row.status)"
                :stroke-width="8"
                :show-text="false"
                class="matrix-progress"
              ></el-progress>
              <span class="progress-text">{{ scope.row.progress || 0 }}%</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="startedAt" label="启动时间" width="180">
          <template slot-scope="scope">
            <span class="text-gray"
              ><i class="el-icon-time"></i>
              {{ formatTime(scope.row.startedAt) }}</span
            >
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button
              type="text"
              class="action-btn view"
              icon="el-icon-monitor"
              @click="handleViewDetail(scope.row)"
              >终端大屏</el-button
            >
            <el-button
              v-if="scope.row.status === 'RUNNING'"
              type="text"
              class="action-btn kill"
              icon="el-icon-video-pause"
              @click="handleKillTask(scope.row)"
              >终止</el-button
            >
          </template>
        </el-table-column>

        <template slot="empty">
          <el-empty
            description="调度矩阵内空空如也"
            :image-size="80"
          ></el-empty>
        </template>
      </el-table>
    </div>

    <div class="pagination-container">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="queryParams.page"
        :page-sizes="[10, 20, 50]"
        :page-size="queryParams.size"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        class="bio-dark-pagination"
      >
      </el-pagination>
    </div>

    <TaskTerminalDrawer ref="terminalDrawer" />
  </div>
</template>

<script>
import { getTaskPage } from "@/api/analysis";
import { mapGetters } from "vuex";
import TaskTerminalDrawer from "@/components/analysis/TaskTerminalDrawer.vue";

export default {
  name: "TaskCenter",
  components: {
    TaskTerminalDrawer,
  },
  data() {
    return {
      loading: false,
      taskList: [],
      total: 0,
      queryParams: {
        page: 1,
        size: 10,
        keyword: "",
        status: "",
      },
    };
  },
  computed: {
    ...mapGetters("user", ["userId"]),
  },
  mounted() {
    this.fetchTaskList();
  },
  methods: {
    // 请求后端真实分页列表
    async fetchTaskList() {
      this.loading = true;
      try {
        const params = {
          page: this.queryParams.page,
          size: this.queryParams.size,
          keyword: this.queryParams.keyword,
          status: this.queryParams.status,
        };

        const res = await getTaskPage(params, this.userId);

        if (res && res.code === 200) {
          // 赋值真实数据（后端已经加入了 projectName）
          this.taskList = res.data.records;
          this.total = res.data.total;
        } else {
          this.$message.error(res.message || "获取任务列表失败");
        }
      } catch (error) {
        console.error("加载任务列表失败", error);
        this.$message.error("网络异常，无法连接到调度引擎");
      } finally {
        this.loading = false;
      }
    },

    // 状态解析
    parseTaskStatus(status) {
      const map = {
        COMPLETED: {
          text: "已完成",
          type: "success",
          icon: "el-icon-circle-check",
        },
        RUNNING: { text: "运行中", type: "", icon: "el-icon-loading" },
        PENDING: { text: "排队中", type: "info", icon: "el-icon-time" },
        FAILED: { text: "异常中断", type: "danger", icon: "el-icon-error" },
      };
      return (
        map[status] || {
          text: status || "未知",
          type: "info",
          icon: "el-icon-question",
        }
      );
    },

    // 进度条颜色动态化
    getProgressColor(status) {
      if (status === "COMPLETED") return "#10b981";
      if (status === "FAILED") return "#ef4444";
      if (status === "PENDING") return "#64748b";
      return "#3b82f6";
    },

    // 格式化时间
    formatTime(timeStr) {
      if (!timeStr) return "-";
      return typeof timeStr === "string"
        ? timeStr.substring(0, 16).replace("T", " ")
        : "-";
    },

    // 操作
    handleViewDetail(row) {
      this.$refs.terminalDrawer.open(row.id, this.userId);
    },

    handleKillTask() {
      this.$confirm("强行终止任务可能导致数据丢失，是否继续？", "警告", {
        type: "warning",
        customClass: "bio-dark-message-box",
      })
        .then(() => {
          this.$message.success("终止指令已发送");
        })
        .catch(() => {});
    },

    // 分页处理
    handleSizeChange(val) {
      this.queryParams.size = val;
      this.fetchTaskList();
    },
    handleCurrentChange(val) {
      this.queryParams.page = val;
      this.fetchTaskList();
    },
  },
};
</script>

<style lang="scss" scoped>
.bio-task-center {
  padding: 30px;
  background-color: #0b0f19;
  min-height: calc(100vh - 60px);
  color: #e2e8f0;
}

/* 顶部操作区 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;

  .header-left {
    h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      color: #f8fafc;
      i {
        color: #3b82f6;
      }
    }
    p {
      margin: 0;
      font-size: 14px;
      color: #64748b;
    }
  }

  .header-right {
    display: flex;
    gap: 16px;
    align-items: center;

    ::v-deep .dark-input .el-input__inner {
      background-color: #1e293b;
      border: 1px solid #334155;
      color: #f8fafc;
      &:focus {
        border-color: #3b82f6;
      }
    }
    ::v-deep .dark-select .el-input__inner {
      background-color: #1e293b;
      border: 1px solid #334155;
      color: #f8fafc;
    }
    .dark-btn-refresh {
      background: #1e293b;
      border: 1px solid #334155;
      color: #e2e8f0;
      &:hover {
        background: #3b82f6;
        border-color: #3b82f6;
        color: #fff;
      }
    }
  }
}

/* 1. 表格外层容器 */
.table-container {
  background: #0b0f19;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
}

/* 🌟 项目归属标签专属暗黑样式 */
.dark-project-tag {
  background: transparent !important;
  border-color: #374151 !important;
  color: #94a3b8 !important;
}
.dark-no-project {
  color: #4b5563;
  font-size: 12px;
}
.task-name-text {
  font-weight: 500;
  color: #f8fafc;
}

/* 进度条排版 */
.progress-cell {
  display: flex;
  align-items: center;
  width: 100%;
}
.matrix-progress {
  flex: 1;
  margin-right: 12px;
}
.progress-text {
  flex-shrink: 0;
  width: 36px;
  text-align: right;
  color: #94a3b8;
  font-family: Consolas, monospace;
  font-size: 12px;
}
.text-gray {
  color: #64748b;
  font-family: Consolas, monospace;
  font-size: 13px;
}
.action-btn {
  font-size: 13px;
  &.view {
    color: #3b82f6;
  }
  &.kill {
    color: #ef4444;
  }
  &:hover {
    opacity: 0.8;
  }
}

/* 2. el-table 彻底扒皮黑化 */
::v-deep .bio-dark-table.el-table,
::v-deep .bio-dark-table .el-table__expanded-cell {
  background-color: transparent !important;
  color: #e2e8f0;
  border: none !important;

  .el-table__header-wrapper,
  .el-table__body-wrapper,
  .el-table__footer-wrapper {
    background-color: transparent !important;
  }

  &::before,
  &::after {
    display: none !important;
  }

  th.el-table__cell {
    background-color: #1e293b !important;
    border-bottom: 1px solid #334155 !important;
    border-right: 1px solid #1f2937 !important;
    color: #94a3b8;
    font-weight: 600;
  }

  tr,
  td.el-table__cell {
    background-color: transparent !important;
    border-bottom: 1px solid #1f2937 !important;
    border-right: 1px solid #1f2937 !important;
  }

  th.el-table__cell:last-child,
  td.el-table__cell:last-child {
    border-right: none !important;
  }

  .el-table__body tr:hover > td.el-table__cell {
    background-color: #1e293b !important;
  }

  .el-table__fixed-right::before,
  .el-table__fixed::before {
    display: none !important;
  }
  .el-table__fixed-right,
  .el-table__fixed {
    background-color: #0b0f19 !important;
  }

  .el-table__empty-block {
    background-color: transparent !important;
    border-top: 1px solid #1f2937 !important;
  }
  .el-table__empty-text {
    color: #64748b !important;
  }
}

/* 3. 分页器彻底扒皮黑化 */
.pagination-container {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}
::v-deep .bio-dark-pagination {
  .el-pagination__total,
  .el-pagination__jump {
    color: #64748b;
  }
  .btn-prev,
  .btn-next,
  button:disabled {
    background-color: transparent !important;
    color: #64748b !important;
  }
  .el-pager li {
    background-color: transparent !important;
    color: #94a3b8;
    border: none;

    &.active {
      color: #3b82f6 !important;
      font-weight: bold;
    }
    &:hover:not(.active) {
      color: #60a5fa !important;
    }
  }
  .el-input__inner {
    background-color: #1e293b !important;
    border: 1px solid #334155 !important;
    color: #f8fafc !important;
  }
}
</style>

<style>
/* 弹窗下拉框适配暗黑 */
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
</style>
