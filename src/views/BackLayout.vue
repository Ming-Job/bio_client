<template>
  <div class="back-layout">
    <!-- 侧边栏 -->
    <div class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="logo">
        <img src="@/assets/images/logo.png" alt="Logo" />
        <transition name="fade">
          <span v-if="!sidebarCollapsed" class="logo-text">
            {{ platformName }}
          </span>
        </transition>
      </div>

      <!-- 用户角色信息 -->
      <div class="user-role-info" v-if="!sidebarCollapsed">
        <el-tag :type="roleTagType" size="small" class="role-tag">
          {{ userRoleText }}
        </el-tag>
        <div class="welcome-text">
          欢迎回来，{{ userInfo.username || "用户" }}
        </div>
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
        <!-- 管理员菜单 -->
        <template v-if="isAdmin">
          <el-menu-item index="/back/admin/dashboard">
            <i class="el-icon-s-data menu-icon"></i>
            <span slot="title">仪表盘</span>
          </el-menu-item>

          <el-menu-item index="/back/admin/users">
            <i class="el-icon-user-solid menu-icon"></i>
            <span slot="title">用户管理</span>
          </el-menu-item>

          <el-menu-item index="/back/admin/courses">
            <i class="el-icon-notebook-2 menu-icon"></i>
            <span slot="title">课程管理</span>
          </el-menu-item>

          <el-menu-item index="/back/admin/datasets">
            <i class="el-icon-files menu-icon"></i>
            <span slot="title">数据集管理</span>
          </el-menu-item>
        </template>

        <!-- 教师菜单 -->
        <template v-else-if="isTeacher">
          <el-menu-item index="/back/teacher/dashboard">
            <i class="el-icon-s-platform menu-icon"></i>
            <span slot="title">仪表盘</span>
          </el-menu-item>

          <el-menu-item index="/back/teacher/courses">
            <i class="el-icon-notebook-1 menu-icon"></i>
            <span slot="title">授课管理</span>
          </el-menu-item>

          <el-menu-item index="/back/teacher/students">
            <i class="el-icon-user menu-icon"></i>
            <span slot="title">学生管理</span>
          </el-menu-item>

          <el-menu-item index="/back/teacher/tasks">
            <i class="el-icon-tickets menu-icon"></i>
            <span slot="title">作业管理</span>
          </el-menu-item>
        </template>

        <!-- 学生菜单 -->
        <template v-else-if="isStudent">
          <el-menu-item index="/back/student/dashboard">
            <i class="el-icon-s-opportunity menu-icon"></i>
            <span slot="title">仪表盘</span>
          </el-menu-item>

          <el-menu-item index="/back/student/learning-center">
            <i class="el-icon-school menu-icon"></i>
            <span slot="title">学习中心</span>
          </el-menu-item>

          <el-menu-item index="/back/student/courses">
            <i class="el-icon-collection menu-icon"></i>
            <span slot="title">我的课程</span>
          </el-menu-item>
        </template>

        <!-- 公共个人设置菜单 -->
        <el-submenu
          index="settings"
          :class="{ 'hidden-submenu': sidebarCollapsed }"
        >
          <template slot="title">
            <i class="el-icon-setting menu-icon"></i>
            <span>个人设置</span>
          </template>
          <el-menu-item index="/back/profile">
            <i class="el-icon-user submenu-icon"></i>
            <span>个人中心</span>
          </el-menu-item>
          <el-menu-item index="/back/account">
            <i class="el-icon-s-tools submenu-icon"></i>
            <span>账号设置</span>
          </el-menu-item>
        </el-submenu>
      </el-menu>

      <!-- 侧边栏底部 -->
      <div class="sidebar-footer" v-if="!sidebarCollapsed">
        <div class="quick-actions">
          <el-tooltip content="切换主题" placement="right">
            <i class="el-icon-moon" @click="toggleTheme"></i>
          </el-tooltip>
          <el-tooltip content="系统设置" placement="right">
            <i class="el-icon-s-tools" @click="showSettings"></i>
          </el-tooltip>
        </div>
        <div class="version-info">
          <i class="el-icon-info"></i>
          <span>{{ userRoleText }}端 v1.0.0</span>
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

          <!-- 面包屑导航 -->
          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item :to="{ path: getDashboardPath }">
              {{ userRoleText }}首页
            </el-breadcrumb-item>
            <el-breadcrumb-item
              v-for="(item, index) in breadcrumbs"
              :key="index"
              :to="item.path ? { path: item.path } : null"
            >
              {{ item.name }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <!-- 全局搜索 -->
          <el-autocomplete
            v-model="searchText"
            :fetch-suggestions="querySearch"
            placeholder="搜索功能、内容..."
            class="global-search"
            size="small"
            @select="handleSelect"
          >
            <i slot="prefix" class="el-icon-search search-icon"></i>
            <template slot-scope="{ item }">
              <div class="search-result-item">
                <i :class="item.icon"></i>
                <span class="title">{{ item.title }}</span>
                <span class="type">{{ item.type }}</span>
              </div>
            </template>
          </el-autocomplete>

          <!-- 快捷操作 全屏/刷新 -->
          <div class="quick-actions-header">
            <el-tooltip content="全屏" placement="bottom">
              <i class="el-icon-full-screen" @click="toggleFullscreen"></i>
            </el-tooltip>
            <el-tooltip content="刷新" placement="bottom">
              <i class="el-icon-refresh" @click="refreshPage"></i>
            </el-tooltip>
          </div>

          <!-- 通知中心 -->
          <el-popover placement="bottom" width="300" trigger="click">
            <div class="notification-panel">
              <div class="notification-header">
                <h4>通知中心</h4>
                <el-button type="text" size="mini" @click="markAllAsRead">
                  全部已读
                </el-button>
              </div>
              <div class="notification-list">
                <div
                  v-for="(notification, index) in notifications"
                  :key="index"
                  class="notification-item"
                  :class="{ unread: !notification.read }"
                >
                  <div class="notification-icon">
                    <i :class="notification.icon"></i>
                  </div>
                  <div class="notification-content">
                    <div class="notification-title">
                      {{ notification.title }}
                    </div>
                    <div class="notification-time">{{ notification.time }}</div>
                  </div>
                </div>
              </div>
            </div>
            <el-badge
              :value="unreadCount"
              class="notification-badge"
              slot="reference"
            >
              <i class="el-icon-bell notification-icon"></i>
            </el-badge>
          </el-popover>

          <!-- 用户信息 -->
          <el-dropdown @command="handleCommand" class="user-dropdown">
            <div class="user-info">
              <el-avatar
                :size="36"
                :src="userAvatar"
                class="user-avatar"
                :style="{
                  background: avatarGradient,
                }"
              >
                <span v-if="!userAvatar" class="avatar-text">
                  {{
                    userInfo.username
                      ? userInfo.username.charAt(0).toUpperCase()
                      : "U"
                  }}
                </span>
              </el-avatar>

              <div class="user-details">
                <span class="username">{{
                  userInfo.username || userRoleText
                }}</span>
                <span class="user-status">
                  <i
                    class="el-icon-circle-check"
                    :style="{ color: '#10b981' }"
                  ></i>
                  <span>在线</span>
                </span>
              </div>
              <i class="el-icon-arrow-down dropdown-arrow"></i>
            </div>
            <el-dropdown-menu slot="dropdown" class="user-dropdown-menu">

              <!-- 返回首页按钮（根据角色显示） -->
              <el-dropdown-item
                command="home"
                class="dropdown-item"
                v-if="userRole !== 'admin'"
              >
                <i class="el-icon-s-home"></i>返回首页
              </el-dropdown-item>

              <el-dropdown-item command="profile" class="dropdown-item">
                <i class="el-icon-user"></i>个人中心
              </el-dropdown-item>
              <el-dropdown-item command="account" class="dropdown-item">
                <i class="el-icon-setting"></i>账号设置
              </el-dropdown-item>
              <el-divider></el-divider>
              <el-dropdown-item command="help" class="dropdown-item">
                <i class="el-icon-question"></i>帮助中心
              </el-dropdown-item>
              <el-dropdown-item command="feedback" class="dropdown-item">
                <i class="el-icon-chat-dot-round"></i>意见反馈
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
        <!-- 路由视图 -->
        <div class="router-view-container">
          <router-view></router-view>
        </div>
      </div>

      <!-- 页脚 -->
      <div class="footer">
        <div class="footer-content">
          <p>© 2025 生物信息科教平台 | {{ userRoleText }}系统</p>
          <p class="footer-links">
            <a href="#" @click.prevent="showHelp">帮助中心</a> ·
            <a href="#" @click.prevent="showFeedback">意见反馈</a> ·
            <a href="#" @click.prevent="showAbout">关于我们</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from "vuex";
import { getAvatarUrl } from "@/utils/auth";

export default {
  name: "BackLayout",
  data() {
    return {
      sidebarCollapsed: false,
      activeMenu: "",
      searchText: "",
      notifications: [
        {
          id: 1,
          title: "新用户注册",
          time: "5分钟前",
          icon: "el-icon-user",
          read: false,
        },
      ],
      searchOptions: [
        {
          value: "用户管理",
          path: "/back/admin/users",
          icon: "el-icon-user",
          type: "功能",
        },
        {
          value: "课程管理",
          path: "/back/admin/courses",
          icon: "el-icon-notebook-2",
          type: "功能",
        },
        {
          value: "学习中心",
          path: "/back/student/learning-center",
          icon: "el-icon-school",
          type: "页面",
        },
      ],
      isDarkTheme: false,
      isFullscreen: false,
    };
  },
  computed: {
    ...mapState("user", {
      isLoggedIn: (state) => state.isLoggedIn,
      userInfo: (state) => state.userInfo,
    }),

    // 用户角色相关
    isAdmin() {
      return this.userInfo.role === "admin";
    },
    isTeacher() {
      return this.userInfo.role === "teacher";
    },
    isStudent() {
      return this.userInfo.role === "student";
    },

    userRoleText() {
      const roles = {
        admin: "管理员",
        teacher: "教师",
        student: "学生",
      };
      return roles[this.userInfo.role] || "用户";
    },

    roleTagType() {
      return this.isAdmin ? "danger" : this.isTeacher ? "warning" : "success";
    },

    platformName() {
      return this.isAdmin
        ? "管理后台"
        : this.isTeacher
        ? "教师平台"
        : "学习平台";
    },

    // 获取当前角色的仪表盘路径
    getDashboardPath() {
      if (this.isAdmin) return "/back/admin/dashboard";
      if (this.isTeacher) return "/back/teacher/dashboard";
      if (this.isStudent) return "/back/student/dashboard";
      return "/back/profile";
    },

    // 页面标题
    pageTitle() {
      return this.$route.meta?.title || this.userRoleText + "后台";
    },

    pageIcon() {
      const routeIcons = {
        "/back/admin/dashboard": "el-icon-s-data",
        "/back/admin/users": "el-icon-user-solid",
        "/back/admin/courses": "el-icon-notebook-2",
        "/back/admin/datasets": "el-icon-files",
        "/back/teacher/dashboard": "el-icon-s-platform",
        "/back/teacher/courses": "el-icon-notebook-1",
        "/back/teacher/students": "el-icon-user",
        "/back/teacher/tasks": "el-icon-tickets",
        "/back/student/dashboard": "el-icon-s-opportunity",
        "/back/student/learning-center": "el-icon-school",
        "/back/student/courses": "el-icon-collection",
        "/back/profile": "el-icon-user",
        "/back/account": "el-icon-setting",
      };
      return routeIcons[this.$route.path] || "el-icon-folder";
    },

    pageSubtitle() {
      return this.$route.meta?.subtitle || "";
    },

    // 面包屑导航
    breadcrumbs() {
      const breadcrumbs = [];
      const matched = this.$route.matched;

      matched.forEach((route) => {
        if (
          route.meta &&
          route.meta.title &&
          route.meta.title !== this.pageTitle
        ) {
          breadcrumbs.push({
            name: route.meta.title,
            path: route.path,
          });
        }
      });

      return breadcrumbs;
    },

    userAvatar() {
      return getAvatarUrl(this.userInfo.avatar);
    },

    avatarGradient() {
      if (this.isAdmin)
        return "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
      if (this.isTeacher)
        return "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)";
      return "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)";
    },

    // 未读通知数量
    unreadCount() {
      return this.notifications.filter((n) => !n.read).length;
    },
  },
  watch: {
    $route: {
      immediate: true,
      handler(to) {
        this.activeMenu = to.path;
      },
    },
  },
  mounted() {
    this.activeMenu = this.$route.path;
    this.initFullscreenListener();
  },
  beforeDestroy() {
    this.removeFullscreenListener();
  },
  methods: {
    ...mapActions("user", ["checkLoginStatus", "logout", "setUserInfo"]),

    // 控制侧边栏的展开和折叠
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },

    // 处理用户下拉菜单命令
    handleCommand(command) {
      switch (command) {
        case "logout":
          this.handleLogout();
          break;
        case "profile":
          this.$router.push("/back/profile");
          break;
        case "account":
          this.$router.push("/back/account");
          break;
        case "help":
          this.showHelp();
          break;
        case "feedback":
          this.showFeedback();
          break;
        case "home":
          this.$router.push("/home");
      }
    },
    // 返回首页功能
    goToHomePage() {
      const homeRoute = this.getHomeRoute()
      // 如果当前已经在首页，则不跳转
      if (this.$route.path === homeRoute) {
        this.$message.info('您已经在首页')
        return
      }
      this.$router.push(homeRoute)
    },

    // 退出登录
    handleLogout() {
      this.$confirm("确定要退出登录吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.logout();
          localStorage.removeItem("user");
          this.$router.push("/login");
          this.$message.success("已退出登录");
        })
        .catch(() => {});
    },

    // 搜索相关
    querySearch(queryString, cb) {
      const results = queryString
        ? this.searchOptions.filter((option) =>
            option.value.toLowerCase().includes(queryString.toLowerCase())
          )
        : this.searchOptions;
      cb(results);
    },

    handleSelect(item) {
      this.$router.push(item.path);
      this.searchText = "";
    },

    // 通知相关
    markAllAsRead() {
      this.notifications.forEach((n) => (n.read = true));
      this.$message.success("已标记所有通知为已读");
    },

    // 主题切换
    toggleTheme() {
      this.isDarkTheme = !this.isDarkTheme;
      document.body.classList.toggle("dark-theme", this.isDarkTheme);
      this.$message.success(
        `已切换至${this.isDarkTheme ? "深色" : "浅色"}主题`
      );
    },

    // 全屏功能
    toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.error(`全屏请求失败: ${err.message}`);
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    },

    initFullscreenListener() {
      document.addEventListener(
        "fullscreenchange",
        this.handleFullscreenChange
      );
    },

    removeFullscreenListener() {
      document.removeEventListener(
        "fullscreenchange",
        this.handleFullscreenChange
      );
    },

    handleFullscreenChange() {
      this.isFullscreen = !!document.fullscreenElement;
    },

    // 刷新页面
    refreshPage() {
      this.$router.go(0);
    },

    // 系统设置
    showSettings() {
      this.$message.info("系统设置功能开发中...");
    },

    // 帮助中心
    showHelp() {
      this.$message.info("帮助中心功能开发中...");
    },

    showFeedback() {
      this.$message.info("意见反馈功能开发中...");
    },

    showAbout() {
      this.$message.info("关于我们功能开发中...");
    },
  },
};
</script>

<style scoped lang="scss">
.back-layout {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
  font-family: "Helvetica Neue", Arial, sans-serif;
  overflow: hidden;
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

.user-role-info {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  .role-tag {
    margin-bottom: 8px;
  }

  .welcome-text {
    color: #94a3b8;
    font-size: 12px;
    line-height: 1.4;
  }
}

.sidebar-menu {
  flex: 1;
  border: none;
  padding: 16px 0;
  overflow-y: auto;
  overflow-x: hidden;

  .menu-icon {
    font-size: 18px;
    margin-right: 10px;
    vertical-align: middle;
  }

  .submenu-icon {
    font-size: 16px;
    margin-right: 8px;
  }

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
      .submenu-icon,
      span {
        color: #ffffff !important;
      }
    }

    &:hover {
      background: rgba(59, 130, 246, 0.1);
      transform: translateX(4px);
    }
  }

  :deep(.el-submenu__title) {
    height: 48px;
    line-height: 48px;
    margin: 4px 12px;
    border-radius: 8px;

    &:hover {
      background: rgba(59, 130, 246, 0.1);
    }
  }
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  .quick-actions {
    display: flex;
    justify-content: space-around;
    margin-bottom: 12px;

    i {
      color: #94a3b8;
      font-size: 18px;
      cursor: pointer;
      transition: color 0.3s;

      &:hover {
        color: #3b82f6;
      }
    }
  }

  .version-info {
    display: flex;
    align-items: center;
    justify-content: center;
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
      }

      &.rotated {
        transform: rotate(180deg);
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

    .global-search {
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

      .search-icon {
        color: #64748b;
        margin-left: 5px;
      }
    }

    .search-result-item {
      display: flex;
      align-items: center;
      padding: 8px;

      i {
        margin-right: 10px;
        color: #3b82f6;
      }

      .title {
        flex: 1;
        font-size: 14px;
      }

      .type {
        font-size: 12px;
        color: #94a3b8;
        background: #f1f5f9;
        padding: 2px 6px;
        border-radius: 4px;
      }
    }

    .quick-actions-header {
      display: flex;
      gap: 16px;

      i {
        font-size: 18px;
        color: #64748b;
        cursor: pointer;
        transition: color 0.3s;

        &:hover {
          color: #3b82f6;
        }
      }
    }

    .notification-badge {
      cursor: pointer;

      :deep(.el-badge__content) {
        background-image: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        border: 2px solid #ffffff;
      }

      .notification-icon {
        font-size: 20px;
        color: #64748b;
        transition: color 0.3s;

        &:hover {
          color: #3b82f6;
        }
      }
    }

    .notification-panel {
      .notification-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e2e8f0;

        h4 {
          margin: 0;
          font-size: 16px;
          color: #1e293b;
        }
      }

      .notification-list {
        max-height: 300px;
        overflow-y: auto;

        .notification-item {
          display: flex;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.3s;

          &:hover {
            background: #f8fafc;
          }

          &.unread {
            background: #f0f9ff;
          }

          .notification-icon {
            margin-right: 12px;

            i {
              font-size: 18px;
              color: #3b82f6;
            }
          }

          .notification-content {
            flex: 1;

            .notification-title {
              font-size: 14px;
              color: #1e293b;
              margin-bottom: 4px;
            }

            .notification-time {
              font-size: 12px;
              color: #94a3b8;
            }
          }
        }
      }
    }

    .user-dropdown {
      cursor: pointer;
      margin-left: 8px;

      .user-info {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        border-radius: 12px;
        transition: all 0.3s;

        &:hover {
          background: #f1f5f9;
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

          .user-status {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: #64748b;

            i {
              font-size: 8px;
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
  min-width: 140px;

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
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
  padding: 20px;
  overflow: auto;
  display: flex;
  flex-direction: column;

  .router-view-container {
    flex: 1;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    padding: 24px;
    overflow: auto;
  }
}

.footer {
  background: #ffffff;
  padding: 16px;
  border-top: 1px solid #e2e8f0;

  .footer-content {
    text-align: center;

    p {
      margin: 4px 0;
      color: #64748b;
      font-size: 12px;
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

  .header-right .global-search {
    display: none;
  }

  .quick-actions-header {
    display: none !important;
  }
}

// 深色主题
.dark-theme {
  .main-content {
    background: #0f172a;
  }

  .header {
    background: #1e293b;
    color: #cbd5e1;
  }

  .content {
    background: #0f172a;

    .page-header {
      border-bottom-color: #334155;

      .page-title {
        color: #f1f5f9;
      }
    }
  }

  .footer {
    background: #1e293b;
    border-top-color: #334155;

    .footer-content {
      color: #cbd5e1;
    }
  }
}
</style>
