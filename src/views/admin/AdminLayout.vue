<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <div class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="logo">
        <img src="@/assets/images/logo.png" alt="Logo" />
        <transition name="fade">
          <span v-if="!sidebarCollapsed" class="logo-text"
            >生物信息管理平台</span
          >
        </transition>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="sidebarCollapsed"
        router
        class="sidebar-menu"
        :unique-opened="true"
        background-color="#1e293b"
        text-color="#cbd5e1"
        active-text-color="#3b82f6"
      >
        <el-menu-item index="/admin/dashboard">
          <i class="el-icon-s-data menu-icon"></i>
          <span slot="title">仪表盘</span>
        </el-menu-item>

        <el-menu-item index="/admin/users">
          <i class="el-icon-user menu-icon"></i>
          <span slot="title">用户管理</span>
        </el-menu-item>

        <el-menu-item index="/admin/courses">
          <i class="el-icon-notebook-2 menu-icon"></i>
          <span slot="title">课程管理</span>
        </el-menu-item>

        <el-menu-item index="/admin/datasets">
          <i class="el-icon-files menu-icon"></i>
          <span slot="title">数据集管理</span>
        </el-menu-item>
      </el-menu>

      <!-- 侧边栏底部 -->
      <div class="sidebar-footer" v-if="!sidebarCollapsed">
        <div class="version-info">
          <i class="el-icon-info"></i>
          <span>v1.0.0</span>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content" :class="{ expanded: sidebarCollapsed }">
      <!-- 顶部导航 -->
      <div class="header">
        <div class="header-left">
          <el-tooltip
            :content="sidebarCollapsed ? '展开菜单' : '折叠菜单'"
            placement="bottom"
          >
            <i
              class="el-icon-s-fold toggle-btn"
              @click="toggleSidebar"
              :class="{ rotated: sidebarCollapsed }"
            ></i>
          </el-tooltip>
          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item>{{ pageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <!-- 通知 -->
          <el-badge :value="3" class="notification-badge">
            <i class="el-icon-bell notification-icon"></i>
          </el-badge>

          <!-- 搜索 -->
          <el-input
            v-model="searchText"
            placeholder="搜索..."
            class="search-input"
            clearable
            size="small"
          >
            <i slot="prefix" class="el-icon-search"></i>
          </el-input>

          <!-- 用户信息 -->
          <el-dropdown @command="handleCommand" class="user-dropdown">
            <div class="user-info">
              <el-avatar
                :size="36"
                :src="userAvatar"
                class="user-avatar"
                :style="{
                  background:
                    userInfo.role === 'admin'
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : '#409eff',
                }"
              >
                <span v-if="!userAvatar" class="avatar-text">
                  {{
                    userInfo.username
                      ? userInfo.username.charAt(0).toUpperCase()
                      : "A"
                  }}
                </span>
              </el-avatar>

              <div class="user-details" v-if="!sidebarCollapsed">
                <span class="username">{{
                  userInfo.username || "管理员"
                }}</span>
                <span class="user-role">
                  <el-tag
                    size="mini"
                    :type="userInfo.role === 'admin' ? 'danger' : 'primary'"
                  >
                    {{
                      userInfo.role === "admin" ? "管理员" : userInfo.role
                    }}
                  </el-tag>
                </span>
              </div>
              <i class="el-icon-arrow-down dropdown-arrow"></i>
            </div>
            <el-dropdown-menu slot="dropdown" class="user-dropdown-menu">
              <el-dropdown-item command="profile" class="dropdown-item">
                <i class="el-icon-user"></i>个人中心
              </el-dropdown-item>
              <el-dropdown-item command="settings" class="dropdown-item">
                <i class="el-icon-setting"></i>系统设置
              </el-dropdown-item>
              <el-dropdown-item command="help" class="dropdown-item">
                <i class="el-icon-question"></i>帮助中心
              </el-dropdown-item>
              <el-divider></el-divider>
              <el-dropdown-item command="logout" class="dropdown-item logout">
                <i class="el-icon-switch-button"></i>退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </div>

      <!-- 页面内容 -->
      <div class="content">
        <el-card class="content-card" shadow="never">
          <router-view></router-view>
        </el-card>
      </div>

      <!-- 页脚 -->
      <div class="footer">
        <div class="footer-content">
          <p>© 2025 生物信息科教平台 | 管理员系统</p>
          <p class="footer-links">
            <a href="#">隐私政策</a> · <a href="#">使用条款</a> ·
            <a href="#">帮助中心</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from "vuex";

export default {
  name: "AdminLayout",
  data() {
    return {
      sidebarCollapsed: false,
      activeMenu: "",
      searchText: "",
    };
  },
  computed: {
    ...mapState("user", {
      isLoggedIn: (state) => state.isLoggedIn,
      userInfo: (state) => state.userInfo,
    }),

    pageTitle() {
      return this.$route.meta.title || "管理员后台";
    },

    userAvatar() {
      const url = this.getAvatarUrl(this.userInfo.avatar);
      return url;
    },
  },
  watch: {
    $route() {
      this.activeMenu = this.$route.path;
    },
  },
  mounted() {
    this.activeMenu = this.$route.path;
  },
  methods: {
    ...mapActions("user", ["checkLoginStatus", "logout", "setUserInfo"]),

    getAvatarUrl(avatarPath) {
      if (!avatarPath) {
        return "";
      }
      if (avatarPath.startsWith("http")) {
        return avatarPath;
      }
      const baseUrl = "http://localhost:8080";
      return `${baseUrl}${avatarPath}`;
    },

    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },

    handleCommand(command) {
      if (command === "logout") {
        this.$confirm("确定要退出登录吗？", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
          customClass: "logout-confirm",
        }).then(() => {
          this.logout();
          localStorage.removeItem("user");
          this.$router.push("/login");
        });
      } else if (command === "profile") {
        this.$router.push("/admin/profile");
      } else if (command === "settings") {
        this.$message.info("系统设置功能开发中");
      } else if (command === "help") {
        this.$message.info("帮助中心功能开发中");
      }
    },
  },
};
</script>

<style scoped lang="scss">
.admin-layout {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
  font-family: "Helvetica Neue", Arial, sans-serif;
}

.sidebar {
  width: 240px;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;

  &.collapsed {
    width: 64px;
  }
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 20px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s;

  img {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    transition: all 0.3s;
  }

  .logo-text {
    margin-left: 12px;
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
    white-space: nowrap;
    overflow: hidden;
    opacity: 1;
    transition: opacity 0.3s;
  }

  &.collapsed .logo-text {
    opacity: 0;
    width: 0;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.sidebar-menu {
  flex: 1;
  border: none;
  padding: 16px 0;

  :deep(.el-menu-item) {
    height: 48px;
    line-height: 48px;
    margin: 4px 12px;
    border-radius: 8px;
    transition: all 0.3s;

    &.is-active {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
      box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);

      .menu-icon,
      span {
        color: #ffffff !important;
      }
    }

    &:hover {
      background: rgba(59, 130, 246, 0.1);
      transform: translateX(4px);
    }
  }

  .menu-icon {
    font-size: 18px;
    margin-right: 10px;
    vertical-align: middle;
  }
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  .version-info {
    display: flex;
    align-items: center;
    color: #94a3b8;
    font-size: 12px;

    i {
      margin-right: 8px;
      font-size: 14px;
    }
  }
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.expanded {
    margin-left: 0;
  }
}

.header {
  height: 64px;
  background: #ffffff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  z-index: 100;

  .header-left {
    display: flex;
    align-items: center;
    gap: 20px;

    .toggle-btn {
      font-size: 20px;
      color: #64748b;
      cursor: pointer;
      transition: all 0.3s;
      padding: 8px;
      border-radius: 6px;

      &:hover {
        color: #3b82f6;
        background: #f1f5f9;
        transform: rotate(180deg);
      }

      &.rotated {
        transform: rotate(180deg);

        &:hover {
          transform: rotate(0deg);
        }
      }
    }

    .breadcrumb {
      :deep(.el-breadcrumb__inner) {
        font-weight: 500;
        color: #64748b;

        &.is-link {
          color: #3b82f6;

          &:hover {
            color: #1d4ed8;
          }
        }
      }

      :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
        color: #1e293b;
        font-weight: 600;
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 20px;

    .notification-badge {
      :deep(.el-badge__content) {
        background-image: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        border: 2px solid #ffffff;
        cursor: pointer;
      }

      .notification-icon {
        font-size: 20px;
        color: #64748b;
        cursor: pointer;
        transition: color 0.3s;

        &:hover {
          color: #3b82f6;
        }
      }
    }

    .search-input {
      width: 200px;

      :deep(.el-input__inner) {
        border-radius: 20px;
        border: 1px solid #e2e8f0;
        background: #f8fafc;
        transition: all 0.3s;

        &:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          width: 220px;
        }
      }

      :deep(.el-input__prefix) {
        left: 10px;
        top: 9px;
      }
    }

    .user-dropdown {
      cursor: pointer;

      .user-info {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        border-radius: 12px;
        transition: all 0.3s;

        &:hover {
          background: #f1f5f9;

          .username {
            color: #1e293b;
          }
        }

        .user-avatar {
          border: 2px solid #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

          .avatar-text {
            font-weight: 600;
            color: white;
          }
        }

        .user-details {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .username {
            font-weight: 600;
            color: #334155;
            font-size: 14px;
            line-height: 1;
          }

          .user-role {
            :deep(.el-tag) {
              height: 20px;
              line-height: 18px;
              padding: 0 6px;
              font-size: 11px;
              font-weight: 600;
            }
          }
        }

        .dropdown-arrow {
          color: #94a3b8;
          font-size: 12px;
          transition: transform 0.3s;
        }
      }

      &:hover .dropdown-arrow {
        transform: rotate(180deg);
      }
    }
  }
}

.user-dropdown-menu {
  min-width: 160px;

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 6px;

    i {
      width: 16px;
      text-align: center;
    }

    &:hover {
      background: #f1f5f9;
      color: #3b82f6;
    }

    &.logout {
      color: #ef4444;

      &:hover {
        background: #fef2f2;
      }
    }
  }

  :deep(.el-divider) {
    margin: 8px 0;
  }
}

.content {
  flex: 1;
  padding: 18px 20px;
  overflow: hidden;

  .content-card {
    height: 100%;
    border: none;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);

    :deep(.el-card__body) {
      height: 100%;
      padding: 6px;
    }
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e2e8f0;

    .page-title {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 12px;

      .page-icon {
        color: #3b82f6;
        font-size: 20px;
      }
    }

    .page-actions {
      display: flex;
      gap: 12px;
    }
  }
}

.footer {
  background: #ffffff;
  padding: 0px 16px;
  border-top: 1px solid #e2e8f0;

  .footer-content {
    text-align: center;

    p {
      margin: 4px 0;
      color: #64748b;
      font-size: 10px;
    }

    .footer-links {
      a {
        color: #64748b;
        text-decoration: none;
        transition: color 0.3s;

        &:hover {
          color: #3b82f6;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -240px;
    z-index: 2000;

    &.collapsed {
      left: 0;
      width: 240px;
    }
  }

  .main-content {
    margin-left: 0;
  }

  .header-right .search-input {
    display: none;
  }
}

.logout-confirm {
  :deep(.el-message-box__title) {
    color: #ef4444;
  }
}
</style>
