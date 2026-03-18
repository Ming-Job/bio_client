<!-- <template>
  <div class="recent-tasks">
    <div class="tasks-header">
      <h3 class="section-title">
        <i class="el-icon-s-order"></i> 最近任务
        <span class="task-count">({{ tasks.length }})</span>
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
          @click="$emit('refresh')"
          :loading="refreshing"
        ></el-button>
      </div>
    </div>

    <div class="task-list">
      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="task-item"
        :class="`task-${task.status}`"
        @click="$emit('view', task)"
      >
        <div class="task-info">
          <div class="task-title">
            <el-tooltip :content="task.name" placement="top">
              <span class="task-name">{{ task.name }}</span>
            </el-tooltip>

            <el-tag
              v-if="task.projectName && task.projectName !== '未绑定课题'"
              size="mini"
              type="info"
              effect="plain"
              class="project-tag"
            >
              <i class="el-icon-folder-opened"></i> {{ task.projectName }}
            </el-tag>
            <span v-else class="no-project-tag">- 独立任务 -</span>

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
              <i :class="getTaskIcon(task.type)" class="task-type-icon"></i>
              {{ task.type }}
            </span>
            <span class="task-time">{{ formatTime(task.createTime) }}</span>
          </div>
          <div class="task-progress">
            <el-progress
              :percentage="task.progress"
              :status="getProgressStatus(task.status)"
              :stroke-width="6"
              :show-text="false"
            />
            <span
              class="progress-text"
              v-if="task.status === 'failed'"
              style="color: #e74c3c"
              >计算异常</span
            >
            <span
              class="progress-text"
              v-else-if="task.status === 'stopped'"
              style="color: #e6a23c"
              >手动终止</span
            >
            <span class="progress-text" v-else-if="task.status === 'waiting'"
              >排队中</span
            >
            <span class="progress-text" v-else>{{ task.progress }}%</span>
          </div>
        </div>
        <div class="task-actions">
          <el-button
            v-if="task.status === 'running'"
            type="text"
            size="mini"
            icon="el-icon-close"
            @click.stop="$emit('stop', task)"
            class="stop-btn"
          ></el-button>
          <el-button
            v-else-if="task.status === 'completed'"
            type="text"
            size="mini"
            icon="el-icon-download"
            @click.stop="$emit('download', task)"
            class="download-btn"
          ></el-button>
          <el-button
            type="text"
            size="mini"
            icon="el-icon-view"
            @click.stop="$emit('view', task)"
            class="view-btn"
          ></el-button>
        </div>
      </div>

      <div v-if="filteredTasks.length === 0" class="empty-tasks">
        <i class="el-icon-s-opportunity"></i>
        <p>暂无分析任务</p>
        <el-button type="text" @click="$emit('new-analysis')"
          >开始第一个分析</el-button
        >
      </div>

      <div v-if="tasks.length > 5" class="view-all-tasks">
        <el-button type="text" @click="$emit('view-all')">
          查看全部任务 <i class="el-icon-arrow-right"></i>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "RecentTasks",
  props: {
    tasks: { type: Array, required: true },
    refreshing: { type: Boolean, default: false },
  },
  data() {
    return {
      taskFilter: "all",
    };
  },
  computed: {
    filteredTasks() {
      if (this.taskFilter === "all") return this.tasks.slice(0, 5);
      return this.tasks.filter((t) => t.status === this.taskFilter).slice(0, 5);
    },
  },
  methods: {
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
        waiting: "排队中",
        failed: "已失败",
        stopped: "已停止",
      };
      return map[status] || status;
    },
    getProgressStatus(status) {
      if (status === "completed") return "success";
      if (status === "failed") return "exception";
      if (status === "stopped") return "warning";
      return null;
    },
    getTaskIcon(type) {
      const map = {
        "RNA-Seq": "el-icon-data-line",
        WGS: "el-icon-cpu",
        "scRNA-Seq": "el-icon-pie-chart",
        "ChIP-Seq": "el-icon-trend-charts",
      };
      return map[type] || "el-icon-s-operation";
    },
    formatTime(timestamp) {
      const diffMins = Math.floor((new Date() - new Date(timestamp)) / 60000);
      if (diffMins < 60) return `${diffMins}分钟前`;
      return new Date(timestamp).toLocaleDateString();
    },
  },
};
</script>

<style lang="scss" scoped>
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
  }
  .section-title {
    font-size: 18px;
    color: #2c3e50;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }
  .task-count {
    font-size: 14px;
    color: #7f8c8d;
    font-weight: normal;
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

      /* 悬停时的变色效果 */
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
      &.task-stopped {
        border-left: 4px solid #e6a23c;
      }

      .task-info {
        flex: 1;
        .task-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        /* 🌟 把这些样式从 hover 里拿出来，放到正常层级！ */
        .task-name {
          font-weight: 500;
          color: #2c3e50;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .project-tag {
          margin-right: 8px;
          border-color: #e4e7ed;
          color: #7f8c8d;
          background: #f8f9fa;
        }
        .no-project-tag {
          color: #bdc3c7;
          font-size: 12px;
          margin-right: 8px;
        }

        .task-meta {
          display: flex;
          gap: 20px;
          margin-bottom: 12px;
          font-size: 12px;
          color: #7f8c8d;
        }
        .task-progress {
          display: flex;
          align-items: center;
          gap: 12px;
          .progress-text {
            font-size: 12px;
            color: #7f8c8d;
            min-width: 48px;
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
    }
    .view-all-tasks {
      text-align: center;
      padding-top: 16px;
      border-top: 1px solid #e8e8e8;
    }
  }
}
</style> -->
