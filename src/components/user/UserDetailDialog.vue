<!-- views/admin/components/UserDetailDialog.vue -->
<!-- 用户详情框 被用于：userManagement.vue -->

<template>
  <el-dialog
    title="用户详情"
    :visible="visible"
    width="500px"
    @close="handleClose"
    custom-class="user-detail-dialog"
    :modal-append-to-body="false"
    :show-close="false"
  >
    <div v-if="user" class="user-info-container">
      <!-- 用户概览区域 -->
      <div class="user-overview">
        <el-avatar
          :size="60"
          :src="getRealUrl(user.avatar)"
          class="user-avatar"
        >
          <span class="avatar-fallback">{{
            getAvatarFallback(user.username)
          }}</span>
        </el-avatar>
        <div class="basic-info">
          <h3 class="username">{{ user.username }}</h3>
          <div class="info-row">
            <el-tag
              :type="getRoleTagType(user.role)"
              size="small"
              class="role-tag"
            >
              {{ getRoleName(user.role) }}
            </el-tag>
            <span class="user-id">ID: {{ user.id }}</span>
          </div>
          <div class="info-row">
            <span class="status-badge" :class="statusClass">
              <i :class="statusIcon"></i>
              {{ user.status === 1 ? "启用" : "禁用" }}
            </span>
          </div>
        </div>
      </div>

      <!-- 详细信息区域 -->
      <div class="detail-section">
        <div class="info-item">
          <span class="info-label">
            <i class="el-icon-message"></i>
            <span>邮箱</span>
          </span>
          <span class="info-value">{{ user.email || "未设置" }}</span>
        </div>

        <div class="info-item">
          <span class="info-label">
            <i class="el-icon-phone"></i>
            <span>手机号</span>
          </span>
          <span class="info-value">{{ user.phone || "未设置" }}</span>
        </div>
      </div>

      <div class="detail-section">
        <div class="info-item">
          <span class="info-label">
            <i class="el-icon-date"></i>
            <span>注册时间</span>
          </span>
          <span class="info-value">{{ formatDateTime(user.createTime) }}</span>
        </div>

        <div class="info-item">
          <span class="info-label">
            <i class="el-icon-refresh"></i>
            <span>更新时间</span>
          </span>
          <span class="info-value">{{ formatDateTime(user.updateTime) }}</span>
        </div>

        <div class="info-item">
          <span class="info-label">
            <i class="el-icon-time"></i>
            <span>最后登录</span>
          </span>
          <span class="info-value">
            {{
              user.lastLoginTime
                ? formatDateTime(user.lastLoginTime)
                : "从未登录"
            }}
          </span>
        </div>
      </div>
    </div>

    <div v-else class="no-data">
      <el-empty description="用户信息不存在" :image-size="60"></el-empty>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" size="small" @click="handleClose">
          关闭
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { getAvatarUrl } from "@/utils/auth";
export default {
  name: "UserDetailDialog",
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    user: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    statusClass() {
      return {
        "status-enabled": this.user?.status === 1,
        "status-disabled": this.user?.status === 0,
      };
    },
    statusIcon() {
      return this.user?.status === 1 ? "el-icon-success" : "el-icon-error";
    },
  },
  methods: {
    // 获取头像URL
    getRealUrl(avatar) {
      return getAvatarUrl(avatar);
    },

    // 获取头像占位符
    getAvatarFallback(username) {
      if (!username) return "U";
      return username.charAt(0).toUpperCase();
    },

    // 格式化日期时间
    formatDateTime(dateTime) {
      if (!dateTime) return "";
      try {
        const date = new Date(dateTime);
        return date
          .toLocaleString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
          .replace(/\//g, "-");
      } catch (e) {
        return dateTime;
      }
    },

    // 获取角色名称
    getRoleName(role) {
      const roleNames = {
        admin: "管理员",
        teacher: "教师",
        student: "学生",
      };
      return roleNames[role] || role;
    },

    // 获取角色标签类型
    getRoleTagType(role) {
      const roleTypes = {
        admin: "danger",
        teacher: "warning",
        student: "success",
        user: "primary",
      };
      return roleTypes[role] || "info";
    },

    // 关闭对话框
    handleClose() {
      this.$emit("close");
    },
  },
};
</script>

<style scoped>
.user-info-container {
  padding: 0;
}

/* 用户概览区域 */
.user-overview {
  display: flex;
  align-items: center;
  padding: 24px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.user-avatar {
  margin-right: 16px;
  border: 3px solid #e2e8f0;
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
}

.avatar-fallback {
  font-size: 20px;
  color: white;
  font-weight: 600;
}

.basic-info {
  flex: 1;
}

.username {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  gap: 10px;
}

.role-tag {
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.user-id {
  font-size: 13px;
  color: #64748b;
  background: #f1f5f9;
  padding: 3px 10px;
  border-radius: 10px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge i {
  font-size: 12px;
}

.status-enabled {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.status-disabled {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

/* 详情区域 */
.detail-section {
  margin: 0;
  padding: 0 24px;
  background: white;
}

.detail-section:first-of-type {
  padding-top: 20px;
}

.detail-section:last-of-type {
  padding-bottom: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 14px 0;
  min-height: 32px;
}

.info-item:not(:last-child) {
  border-bottom: 1px solid #f1f5f9;
}

.info-label {
  display: flex;
  align-items: center;
  width: 90px;
  flex-shrink: 0;
  color: #475569;
  font-size: 13px;
  font-weight: 500;
  gap: 8px;
}

.info-label i {
  color: #94a3b8;
  font-size: 14px;
  width: 16px;
}

.info-value {
  flex: 1;
  color: #1e293b;
  font-size: 13px;
  word-break: break-word;
}

.no-data {
  padding: 60px 20px;
  text-align: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
}

/* 对话框整体样式 */
:deep(.user-detail-dialog) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

:deep(.user-detail-dialog .el-dialog__header) {
  padding: 16px 24px;
  border-bottom: 1px solid #f1f5f9;
  background: white;
}

:deep(.user-detail-dialog .el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

:deep(.user-detail-dialog .el-dialog__body) {
  padding: 0;
  max-height: 460px;
  overflow-y: auto;
}

/* 自定义滚动条 */
:deep(.user-detail-dialog .el-dialog__body::-webkit-scrollbar) {
  width: 4px;
}

:deep(.user-detail-dialog .el-dialog__body::-webkit-scrollbar-thumb) {
  background: #cbd5e1;
  border-radius: 2px;
}

:deep(.user-detail-dialog .el-dialog__body::-webkit-scrollbar-track) {
  background: #f8fafc;
}

/* 按钮样式优化 */
:deep(.el-button--small) {
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

:deep(.el-button--small:hover) {
  background: #2563eb;
  border-color: #2563eb;
}

:deep(.el-button--small:active) {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .user-overview {
    padding: 20px;
    flex-direction: column;
    text-align: center;
  }

  .user-avatar {
    margin-right: 0;
    margin-bottom: 12px;
  }

  .info-row {
    justify-content: center;
    flex-wrap: wrap;
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .info-label {
    width: 100%;
  }

  .info-value {
    width: 100%;
  }
}
</style>
