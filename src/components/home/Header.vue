<template>
  <header class="header">
    <div class="header-container">
      
      <div class="brand-section" @click="$router.push('/')">
        <img src="@/assets/images/logo.png" alt="Logo" class="logo" />
        <span class="brand-title">生物信息科教平台</span>
      </div>

      <div class="nav-section">
        <el-menu
          :default-active="activePath"
          mode="horizontal"
          router
          background-color="transparent"
          text-color="#ecf0f1"
          active-text-color="#42b983"
        >
          <el-menu-item index="/home">首页</el-menu-item>
          <el-menu-item index="/course">课程中心</el-menu-item>
          <el-menu-item index="/analysis">云端分析</el-menu-item>
          <el-menu-item index="/case">案例广场</el-menu-item>
          <el-menu-item index="/project" v-if="isLoggedIn">我的项目</el-menu-item>
        </el-menu>
      </div>

      <div class="action-section">
        <el-dropdown
          v-if="isLoggedIn"
          @command="handleUserCommand"
          trigger="click"
          placement="bottom-end"
        >
          <div class="user-trigger">
            <el-avatar
              :size="36"
              :src="avatarFullUrl"
              class="avatar-ring"
              @error="handleAvatarError"
            >
              {{ userInitial }}
            </el-avatar>
            <div class="user-meta">
              <span class="username">{{ userInfo.username }}</span>
              <span
                class="role-badge"
                :class="`role-badge--${userInfo.role || 'student'}`"
              >
                {{ userRoleText }}
              </span>
            </div>
            <i class="el-icon-arrow-down"></i>
          </div>

          <el-dropdown-menu slot="dropdown" class="header-dropdown-menu">
            <el-dropdown-item command="profile" icon="el-icon-user">个人中心</el-dropdown-item>
            <el-dropdown-item command="settings" icon="el-icon-setting">账号设置</el-dropdown-item>
            <el-dropdown-item command="logout" icon="el-icon-switch-button" divided>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>

        <el-button
          v-else
          type="primary"
          size="small"
          round
          class="login-btn"
          @click="handleLogin"
        >
          登录 / 注册
        </el-button>
      </div>

    </div>
  </header>
</template>

<script>
import { mapState, mapActions } from "vuex";
import { getAvatarUrl } from "@/utils/auth";
import { getRoleText } from "@/utils/role";

export default {
  name: "HeaderPage",
  data() {
    return {
      avatarLoadError: false,
    };
  },
  computed: {
    ...mapState("user", {
      isLoggedIn: (state) => state.isLoggedIn,
      userInfo: (state) => state.userInfo || {},
    }),

    activePath() {
      const path = this.$route.path;
      if (!path || path === "/" || path === "") {
        return "/home";
      }
      const match = path.match(/^\/[^/]+/);
      return match ? match[0] : "/home";
    },

    userRoleText() {
      return getRoleText(this.userInfo.role);
    },

    userInitial() {
      return this.userInfo.username
        ? this.userInfo.username.charAt(0).toUpperCase()
        : "U";
    },

    avatarFullUrl() {
      if (this.avatarLoadError || !this.userInfo.avatar) {
        return "";
      }
      return getAvatarUrl(this.userInfo.avatar);
    },
  },
  created() {
    this.checkLoginStatus();
  },
  methods: {
    ...mapActions("user", ["checkLoginStatus", "logout"]),

    handleLogin() {
      this.$router.push({ name: "LoginPage" });
    },

    handleUserCommand(command) {
      switch (command) {
        case "profile":
          this.$router.push({ name: "UserProfile" });
          break;
        case "settings":
          this.$router.push({ name: "AccountSetting" });
          break;
        case "logout":
          this.handleLogout();
          break;
      }
    },

    async handleLogout() {
      try {
        await this.$confirm("确定要退出登录吗？", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        });
        await this.logout();
        this.$message.success("退出登录成功!");
        this.$router.push("/");
      } catch (error) {
        // 用户取消退出
      }
    },

    handleAvatarError() {
      this.avatarLoadError = true;
    },
  },
};
</script>

<style lang="scss" scoped>
.header {
  height: 64px;
  background: #242f3e;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  position: sticky;
  top: 0;
  z-index: 1000;

  .header-container {
    max-width: 1440px;
    margin: 0 auto;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px; 
  }

  /* 左侧：品牌区 */
  .brand-section {
    display: flex;
    align-items: center;
    cursor: pointer;
    min-width: 220px;

    .logo {
      height: 32px;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .brand-title {
      margin-left: 12px;
      font-size: 18px;
      font-weight: 600;
      color: #fff;
      white-space: nowrap;
      letter-spacing: 0.5px;
    }

    &:hover .logo {
      transform: scale(1.08) rotate(-5deg); 
    }
  }

  /* 中间：导航区（设置 Flex 1 和居中对齐） */
  .nav-section {
    flex: 1;
    display: flex;
    justify-content: center;

    ::v-deep .el-menu {
      border: none;
      background-color: transparent;

      .el-menu-item {
        height: 64px;
        line-height: 64px;
        font-size: 15px;
        font-weight: 500;
        padding: 0 20px;
        transition: color 0.3s, background-color 0.3s;

        &:hover,
        &.is-active {
          color: #42b983 !important;
          background-color: rgba(255, 255, 255, 0.05) !important;
        }
      }
    }
  }

  /* 右侧：操作区 */
  .action-section {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 220px; /* 与左侧保持大致等宽，确保中间导航绝对居中 */

    .user-trigger {
      display: flex;
      align-items: center;
      cursor: pointer;
      color: #fff;
      padding: 4px 8px;
      border-radius: 8px;
      transition: background 0.3s;

      &:hover {
        background: rgba(255, 255, 255, 0.08);
      }

      .avatar-ring {
        border: 2px solid #42b983;
        background-color: #3b82f6; 
        font-weight: bold;
        color: #fff;
        box-shadow: 0 0 8px rgba(66, 185, 131, 0.4);
      }

      .user-meta {
        margin: 0 12px;
        display: flex;
        flex-direction: column;

        .username {
          font-size: 14px;
          line-height: 1.2;
          font-weight: 500;
        }

        .role-badge {
          font-size: 10px;
          padding: 1px 6px;
          border-radius: 4px;
          margin-top: 2px;
          width: fit-content;
          opacity: 0.9;
          font-family: Consolas, monospace; 

          &--admin {
            background: #e6a23c;
            color: #fff;
          }
          &--teacher {
            background: #67c23a;
            color: #fff;
          }
          &--student {
            background: #3b82f6;
            color: #fff;
          }
          /* 默认样式防错 */
          background: #42b983; 
        }
      }

      i {
        font-size: 12px;
        color: #94a3b8;
        transition: transform 0.3s;
      }

      &[aria-expanded="true"] i {
        transform: rotate(180deg);
      }
    }

    .login-btn {
      padding: 8px 20px;
      font-weight: 500;
      letter-spacing: 0.5px;
      background: linear-gradient(135deg, #42b983, #27ae60);
      border: none;

      &:hover {
        box-shadow: 0 4px 12px rgba(66, 185, 131, 0.4);
        transform: translateY(-1px);
      }
    }
  }
}
</style>