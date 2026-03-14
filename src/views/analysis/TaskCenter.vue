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
      <el-table
        :data="taskList"
        style="width: 100%"
        class="bio-dark-table"
        :row-class-name="tableRowClassName"
      >
        <el-table-column
          prop="name"
          label="任务名称"
          min-width="250"
          show-overflow-tooltip
        >
          <template slot-scope="scope">
            <span class="task-name-text">{{ scope.row.taskName }}</span>
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
    TaskTerminalDrawer, // 注册它
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
        // 组装发送给后端的参数
        const params = {
          page: this.queryParams.page,
          size: this.queryParams.size,
          keyword: this.queryParams.keyword,
          status: this.queryParams.status,
        };

        // 发起真实请求 (假设你封装了 getTaskPage)
        const res = await getTaskPage(params, this.userId); // 如果 axios 里统一加了 header，就不需要传 userId

        if (res && res.code === 200) {
          // 赋值真实数据
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
      return timeStr;
    },

    // 操作
    handleViewDetail(row) {
      // 🚀 核心魔法：直接调用子组件的 open 方法，把真实的 taskId 和 userId 传过去！
      this.$refs.terminalDrawer.open(row.id, this.userId);
    },

    handleKillTask() {
      this.$confirm("强行终止任务可能导致数据丢失，是否继续？", "警告", {
        type: "warning",
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
  background-color: #0b0f19; /* 全局极暗背景 */
  min-height: calc(100vh - 60px);
  color: #e2e8f0;
}
/* 进度条与文字的终极排版 */
.progress-cell {
  display: flex;
  align-items: center; /* 保证进度条和百分比文字在同一水平线上垂直居中 */
  width: 100%;
}

.matrix-progress {
  flex: 1; /* 🚀 核心魔法 1：让进度条自动弹开，霸占所有剩余空间 */
  margin-right: 12px; /* 和右边的文字留出舒适的间距 */
}

.progress-text {
  flex-shrink: 0; /* 🚀 核心魔法 2：打死也不允许文字被挤压换行 */
  width: 36px; /* 固定宽度，这样即使是 5% 和 100%，整个列也能保持完美对齐，不会左右乱跳 */
  text-align: right;
  color: #94a3b8;
  font-family: Consolas, monospace; /* 极客代码字体 */
  font-size: 12px;
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

    /* 输入框暗黑改造 */
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
  background: #0b0f19; /* 和整个网页的最深底色融为一体 */
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
}

/* 2. el-table 彻底扒皮黑化 */
::v-deep .bio-dark-table.el-table,
::v-deep .bio-dark-table .el-table__expanded-cell {
  background-color: transparent !important;
  color: #e2e8f0;
  border: none !important;

  /* 杀掉所有自带的包裹层白底 */
  .el-table__header-wrapper,
  .el-table__body-wrapper,
  .el-table__footer-wrapper {
    background-color: transparent !important;
  }

  /* 杀掉最外层的两条恶心亮色伪线 */
  &::before,
  &::after {
    display: none !important;
  }

  /* 表头：稍微提亮一点做区分，边框改为暗色 */
  th.el-table__cell {
    background-color: #1e293b !important;
    border-bottom: 1px solid #334155 !important;
    border-right: 1px solid #1f2937 !important; /* 🌟 新增：表头竖线 */
    color: #94a3b8;
    font-weight: 600;
  }

  /* 行与单元格：全透，边框极暗 */
  tr,
  td.el-table__cell {
    background-color: transparent !important;
    border-bottom: 1px solid #1f2937 !important;
    border-right: 1px solid #1f2937 !important; /* 🌟 新增：数据单元格竖线 */
  }

  /* 🌟 新增：杀掉最后一列的竖线，防止和外层容器的边框重叠变粗 */
  th.el-table__cell:last-child,
  td.el-table__cell:last-child {
    border-right: none !important;
  }

  /* 悬浮高亮当前行：丝滑的幽幽蓝光 */
  .el-table__body tr:hover > td.el-table__cell {
    background-color: #1e293b !important;
  }

  /* 固定列的彻底暗黑适配 */
  .el-table__fixed-right::before,
  .el-table__fixed::before {
    display: none !important;
  }
  .el-table__fixed-right,
  .el-table__fixed {
    background-color: #0b0f19 !important;
  }

  /* 暂无数据时的兜底 */
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
  /* 上一页/下一页按钮去白底 */
  .btn-prev,
  .btn-next,
  button:disabled {
    background-color: transparent !important;
    color: #64748b !important;
  }
  /* 页码按钮去白底 */
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
  /* 跳转输入框去白底 */
  .el-input__inner {
    background-color: #1e293b !important;
    border: 1px solid #334155 !important;
    color: #f8fafc !important;
  }
}
</style>
