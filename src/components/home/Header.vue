<template>
  <header class="header">
    <div class="container">
      <div class="logo-section">
        <img
          src="@/assets/images/logo.png"
          alt="生物科教平台"
          class="logo"
          v-if="$route.path === '/'"
        />
        <h1>生物科教信息平台</h1>
      </div>
      <el-menu
        :default-active="activeIndex"
        mode="horizontal"
        @select="handleSelect"
        background-color="#2c3e50"
        text-color="#fff"
        active-text-color="#42b983"
      >
        <el-menu-item index="1">首页</el-menu-item>
        <el-submenu index="2">
          <template slot="title">生物分类</template>
          <el-menu-item index="2-1">动物王国</el-menu-item>
          <el-menu-item index="2-2">植物世界</el-menu-item>
          <el-menu-item index="2-3">微生物</el-menu-item>
          <el-menu-item index="2-4">人体生物学</el-menu-item>
        </el-submenu>
        <el-menu-item index="3">课程列表</el-menu-item>
        <el-menu-item index="4">科普视频</el-menu-item>
        <el-menu-item index="5">科研动态</el-menu-item>
      </el-menu>

      <div class="user-section">
        <el-input
          placeholder="搜索生物知识..."
          prefix-icon="el-icon-search"
          v-model="searchKeyword"
          @keyup.enter="handleSearch"
          style="width: 200px; margin-right: 20px"
        />
        <div class="user-info" @click="handleUserClick">
          <!-- 修改头像显示部分 -->
          <div class="avatar-container">
            <!-- 用户已登录：显示用户头像 -->
            <el-avatar
              v-if="isLoggedIn && userInfo.avatar"
              :src="avatarFullUrl"
              :size="40"
              class="user-avatar"
              @error="handleAvatarError"
            />
            <!-- 用户已登录但没有头像：显示用户名首字母 -->
            <el-avatar
              v-else-if="isLoggedIn"
              :size="40"
              class="user-avatar"
              :style="{ backgroundColor: getAvatarColor(userInfo.username) }"
            >
              {{ getUserInitial(userInfo.username) }}
            </el-avatar>
            <!-- 用户未登录：显示默认头像 -->
            <div v-else class="avatar-placeholder">
              <i class="el-icon-user"></i>
            </div>
          </div>
          <div class="login-register">
            <template v-if="isLoggedIn">
              <span class="user-name">{{ userInfo.username }}</span>
              <span class="user-role" :class="getRoleClass(userInfo.role)">
                {{ getRoleText(userInfo.role) }}
              </span>
            </template>
            <el-button v-else type="text" @click.stop="handleLogin"
              >登录/注册</el-button
            >
          </div>
        </div>

        <!-- 用户已登录时的下拉菜单 -->
        <el-dropdown
          v-if="isLoggedIn"
          class="user-dropdown"
          @command="handleUserCommand"
          trigger="click"
        >
          <span class="el-dropdown-link">
            <i class="el-icon-arrow-down el-icon--right"></i>
          </span>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="profile">
              <i class="el-icon-user"></i>个人中心
            </el-dropdown-item>
            <el-dropdown-item command="settings">
              <i class="el-icon-setting"></i>账号设置
            </el-dropdown-item>
            <el-dropdown-item command="logout">
              <i class="el-icon-switch-button"></i>退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </div>
  </header>
</template>

<script>
import { mapState, mapActions } from "vuex";

export default {
  name: "HeaderPage",
  data() {
    return {
      activeIndex: "3",
      searchKeyword: "",
      avatarLoadError: false,
    };
  },
  computed: {
    // 修复：从Vuex的user模块获取状态
    ...mapState("user", {
      isLoggedIn: (state) => state.isLoggedIn,
      userInfo: (state) => state.userInfo,
    }),

    // 计算属性：获取完整头像URL
    avatarFullUrl() {
      // 检查Vuex状态是否已加载
      if (
        !this.isLoggedIn ||
        !this.userInfo ||
        !this.userInfo.avatar ||
        this.avatarLoadError
      ) {
        console.log("头像条件不满足:", {
          isLoggedIn: this.isLoggedIn,
          userInfo: this.userInfo,
          avatar: this.userInfo?.avatar,
          avatarLoadError: this.avatarLoadError,
        });
        return "";
      }

      const url = this.getAvatarUrl(this.userInfo.avatar);
      console.log("头像URL:", url);
      return url;
    },
  },
  created() {
    console.log("Header组件创建，检查登录状态");

    // 页面加载时检查用户登录状态
    this.checkLoginStatus();

    // 调试：检查Vuex状态
    setTimeout(() => {
      console.log("Vuex状态检查:", {
        store: this.$store,
        userModule: this.$store.state.user,
        isLoggedIn: this.isLoggedIn,
        userInfo: this.userInfo,
      });
    }, 100);
  },
  methods: {
    // 修复：映射user模块的actions
    ...mapActions("user", ["checkLoginStatus", "logout", "setUserInfo"]),

    // 获取头像URL
    getAvatarUrl(avatarPath) {
      if (!avatarPath) {
        console.log("无头像路径，返回默认");
        return "https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png";
      }

      console.log("处理头像路径:", avatarPath);

      // 如果已经是完整URL，直接返回
      if (avatarPath.startsWith("http")) {
        return avatarPath;
      }

      // 使用环境变量或默认的后端地址
      const baseUrl = process.env.VUE_APP_API_URL || "http://localhost:8080";
      return `${baseUrl}${avatarPath}`;
    },

    handleSearch() {
      // 搜索逻辑...
    },

    handleLogin() {
      this.$router.push({ name: "LoginPage" });
    },

    handleUserClick() {
      if (this.isLoggedIn && this.userInfo) {
        this.$router.push({ name: "UserProfile" });
      } else {
        this.handleLogin();
      }
    },

    handleUserCommand(command) {
      switch (command) {
        case "profile":
          this.$router.push({ name: "UserProfile" });
          break;
        case "settings":
          this.$router.push({ name: "AccountSettings" });
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

        // 调用Vuex action退出登录
        await this.logout();

        this.$message({
          type: "success",
          message: "退出登录成功!",
        });

        // 跳转到首页
        this.$router.push({ path: "/" });
      } catch (error) {
        console.log("用户取消退出登录");
      }
    },

    getUserInitial(username) {
      if (!username) return "U";
      return username.charAt(0).toUpperCase();
    },

    getAvatarColor(username) {
      const colors = [
        "#f56a00",
        "#7265e6",
        "#ffbf00",
        "#00a2ae",
        "#42b983",
        "#1890ff",
        "#f759ab",
        "#52c41a",
      ];
      if (!username) return colors[0];

      let hash = 0;
      for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash % colors.length);
      return colors[index];
    },

    getRoleText(role) {
      const roleMap = {
        student: "学生",
        teacher: "教师",
        admin: "管理员",
      };
      return roleMap[role] || role;
    },

    getRoleClass(role) {
      return `role-${role}`;
    },

    handleAvatarError() {
      console.warn("头像加载失败");
      this.avatarLoadError = true;

      // 尝试加载默认头像
      const defaultAvatar =
        "https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png";
      const img = new Image();
      img.src = defaultAvatar;
    },
  },

  watch: {
    $route(to) {
      // 当路由变化时，重新检查登录状态
      if (to.name === "LoginPage" || to.name === "Logout") {
        this.checkLoginStatus();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.header {
  background-color: #2c3e50;
  color: white;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  .container {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
  }

  .logo-section {
    display: flex;
    align-items: center;

    .logo {
      height: 50px;
      margin-right: 15px;
    }

    h1 {
      font-size: 1.5rem;
      color: white;
    }
  }

  .user-section {
    display: flex;
    align-items: center;
    position: relative;

    .user-info {
      display: flex;
      align-items: center;
      cursor: pointer;
      padding: 5px 10px;
      border-radius: 20px;
      transition: background-color 0.3s;

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }

      .avatar-container {
        margin-right: 10px;

        .avatar-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: #42b983;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
        }

        .user-avatar {
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
      }

      .login-register {
        display: flex;
        flex-direction: column;
        align-items: flex-start;

        .user-name {
          color: white;
          font-size: 14px;
          font-weight: 500;
          line-height: 1.2;
        }

        .user-role {
          font-size: 12px;
          padding: 2px 6px;
          border-radius: 10px;
          margin-top: 2px;

          &.role-student {
            background-color: #67c23a;
            color: white;
          }

          &.role-teacher {
            background-color: #409eff;
            color: white;
          }

          &.role-admin {
            background-color: #f56c6c;
            color: white;
          }
        }

        .el-button {
          color: white;
          font-size: 14px;
          padding: 0;

          &:hover {
            color: #42b983;
          }
        }
      }
    }

    .user-dropdown {
      margin-left: 5px;
      cursor: pointer;

      .el-dropdown-link {
        color: white;
        font-size: 16px;

        &:hover {
          color: #42b983;
        }
      }
    }
  }

  ::v-deep .el-menu {
    flex: 1;
    margin: 0 40px;

    &.el-menu--horizontal {
      border-bottom: none;
    }
  }

  ::v-deep .el-dropdown-menu {
    min-width: 150px;

    .el-dropdown-menu__item {
      display: flex;
      align-items: center;

      i {
        margin-right: 8px;
      }
    }
  }
}
</style>
