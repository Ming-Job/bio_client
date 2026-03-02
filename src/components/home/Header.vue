<template>
  <header class="header">
    <div class="header-container">
      <!-- 品牌区 -->
      <div class="brand-section" @click="$router.push('/')">
        <img src="@/assets/images/logo.png" alt="Logo" class="logo" />
        <span class="brand-title">生物信息科教平台</span>
      </div>

      <!-- 导航菜单 -->
      <div class="nav-section">
        <el-menu
          :default-active="activeIndex"
          mode="horizontal"
          @select="handleSelect"
          background-color="transparent"
          text-color="#ecf0f1"
          active-text-color="#42b983"
        >
          <el-menu-item index="1">首页</el-menu-item>
          <el-menu-item index="2">课程中心</el-menu-item>
          <el-menu-item index="3">分析中心</el-menu-item>
          <el-menu-item index="4">教学案例库</el-menu-item>
          <el-menu-item index="5">我的项目</el-menu-item>
          <el-menu-item index="6">帮助中心</el-menu-item>
        </el-menu>
      </div>

      <!-- 操作区 -->
      <div class="action-section">
        <el-input
          v-model="searchKeyword"
          size="small"
          placeholder="搜索知识..."
          prefix-icon="el-icon-search"
          class="header-search"
          @keyup.enter="handleSearch"
          aria-label="搜索知识"
        />

        <el-dropdown
          v-if="isLoggedIn"
          @command="handleUserCommand"
          trigger="click"
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

          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="profile" icon="el-icon-user"
              >个人中心</el-dropdown-item
            >
            <el-dropdown-item command="settings" icon="el-icon-setting"
              >账号设置</el-dropdown-item
            >
            <el-dropdown-item
              command="logout"
              icon="el-icon-switch-button"
              divided
              >退出登录</el-dropdown-item
            >
          </el-dropdown-menu>
        </el-dropdown>

        <el-button
          v-else
          type="primary"
          size="small"
          round
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

// 菜单索引与路由的映射关系（用于跳转）
const MENU_ROUTE_MAP = {
  1: { name: "HomePage" },
  2: { name: "CoursePage" },
  3: { name: "AnalysisPage" },
  4: { name: "TeachingCase" },
  5: { name: "MyProject" },
  6: { name: "HelpCenter" },
};

// 路径前缀到菜单索引的映射（用于高亮）
const PATH_TO_MENU = [
  { prefix: "/my-course", index: "" },

  { prefix: "/analysis", index: "3" },
  { prefix: "/course", index: "2" },
  { prefix: "/case", index: "4" },
  { prefix: "/project", index: "5" },
  { prefix: "/help", index: "6" },
  { prefix: "/", index: "1" }, // 根路径放最后，避免覆盖其他
];

export default {
  name: "HeaderPage",
  data() {
    return {
      activeIndex: "1",
      searchKeyword: "",
      avatarLoadError: false,
    };
  },
  computed: {
    ...mapState("user", {
      isLoggedIn: (state) => state.isLoggedIn,
      userInfo: (state) => state.userInfo || {},
    }),

    // 用户角色文本
    userRoleText() {
      return getRoleText(this.userInfo.role);
    },

    // 用户头像首字母
    userInitial() {
      return this.userInfo.username
        ? this.userInfo.username.charAt(0).toUpperCase()
        : "U";
    },

    // 完整的头像URL（支持错误回退）
    avatarFullUrl() {
      if (this.avatarLoadError) {
        return "https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png";
      }
      return getAvatarUrl(this.userInfo.avatar);
    },
  },
  created() {
    this.checkLoginStatus();
    this.updateActiveIndexByRoute(this.$route);
  },
  methods: {
    ...mapActions("user", ["checkLoginStatus", "logout"]),

    // 根据当前路由更新菜单高亮
    updateActiveIndexByRoute(route) {
      const path = route.path;

      // 🌟 针对首页做精确匹配：只有路径完全等于 "/" 或者 "/home" 时，才高亮首页
      if (path === "/" || path === "/home") {
        this.activeIndex = "1";
        return;
      }

      // 遍历前缀匹配其他模块
      for (const item of PATH_TO_MENU) {
        if (path.startsWith(item.prefix)) {
          this.activeIndex = item.index;
          return;
        }
      }

      // 如果都没匹配上，说明是不在导航栏里的独立页面，取消高亮
      this.activeIndex = "";
    },

    // 菜单选择事件
    handleSelect(index) {
      const targetRoute = MENU_ROUTE_MAP[index];
      if (targetRoute) {
        this.$router.push(targetRoute);
        // 路由变化后会触发 watch $route 自动更新高亮，此处无需手动设置
      }
    },

    // 搜索
    handleSearch() {
      if (this.searchKeyword.trim()) {
        this.$router.push({
          name: "SearchResult",
          query: { q: this.searchKeyword.trim() },
        });
      } else {
        this.$message.info("请输入搜索关键词");
      }
    },

    // 登录跳转
    handleLogin() {
      this.$router.push({ name: "LoginPage" });
    },

    // 下拉菜单命令
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

    // 退出登录
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
        // 用户取消
      }
    },

    // 头像加载失败
    handleAvatarError() {
      this.avatarLoadError = true;
    },
  },
  watch: {
    $route: {
      handler(newRoute) {
        this.updateActiveIndexByRoute(newRoute);
      },
      immediate: true, // 确保初始加载时执行
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
    max-width: 1400px;
    margin: 0 auto;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
  }

  /* 品牌区 */
  .brand-section {
    display: flex;
    align-items: center;
    cursor: pointer;
    min-width: 200px;

    .logo {
      height: 32px;
      transition: transform 0.3s;
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
      transform: scale(1.05);
    }
  }

  /* 导航区 */
  .nav-section {
    flex: 1;
    display: flex;
    justify-content: center;

    ::v-deep .el-menu {
      border: none;

      .el-menu-item,
      .el-submenu__title {
        height: 64px;
        line-height: 64px;
        font-size: 15px;
        padding: 0 15px;
      }
    }
  }

  /* 操作区 */
  .action-section {
    display: flex;
    align-items: center;
    gap: 20px;

    .header-search {
      width: 180px;
      transition: width 0.3s;

      ::v-deep .el-input__inner {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: #fff;
        border-radius: 20px;
      }

      &:focus-within {
        width: 240px;
      }
    }

    .user-trigger {
      display: flex;
      align-items: center;
      cursor: pointer;
      color: #fff;

      .avatar-ring {
        border: 2px solid #42b983;
        box-shadow: 0 0 8px rgba(66, 185, 131, 0.4);
      }

      .user-meta {
        margin: 0 10px;
        display: flex;
        flex-direction: column;

        .username {
          font-size: 14px;
          line-height: 1.2;
        }

        .role-badge {
          font-size: 10px;
          padding: 1px 6px;
          border-radius: 4px;
          margin-top: 2px;
          width: fit-content;
          opacity: 0.9;

          &--admin {
            background: #e6a23c;
          }
          &--teacher {
            background: #67c23a;
          }
          &--student {
            background: #409eff;
          }
          // 默认样式
          background: #42b983;
        }
      }

      i {
        font-size: 12px;
        color: #bdc3c7;
      }
    }
  }

  /* 简单响应式处理 */
  @media (max-width: 768px) {
    .brand-title {
      display: none;
    }

    .nav-section {
      ::v-deep .el-menu-item {
        padding: 0 10px;
        font-size: 13px;
      }
    }

    .user-meta {
      display: none !important;
    }

    .header-search {
      width: 140px;
    }
  }
}
</style>
