<template>
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
    <!-- 根据当前用户角色显示菜单 -->
    <template v-for="item in menuItems">
      <!-- 有子菜单的情况 -->
      <el-submenu
        v-if="item.children && item.children.length"
        :key="`submenu-${item.index}`"
        :index="item.index"
      >
        <template slot="title">
          <i :class="item.icon" class="menu-icon"></i>
          <span>{{ item.title }}</span>
        </template>
        <el-menu-item
          v-for="child in item.children"
          :key="`child-${child.index}`"
          :index="child.path"
        >
          <span>{{ child.title }}</span>
        </el-menu-item>
      </el-submenu>

      <!-- 无子菜单的情况 -->
      <el-menu-item v-else :key="`item-${item.index}`" :index="item.path">
        <i :class="item.icon" class="menu-icon"></i>
        <span slot="title">{{ item.title }}</span>
      </el-menu-item>
    </template>
  </el-menu>
</template>

<script>
export default {
  name: "SidebarMenu",
  props: {
    sidebarCollapsed: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    activeMenu() {
      return this.$route.path;
    },
    userRole() {
      // 从 Vuex store 或 localStorage 获取用户角色
      return (
        this.$store.state.user.role ||
        localStorage.getItem("userRole") ||
        "student"
      );
    },
    // 根据角色返回对应的菜单配置
    menuItems() {
      const role = this.userRole;

      // 菜单配置定义
      const menuConfigs = {
        admin: [
          {
            title: "仪表盘",
            icon: "el-icon-s-data",
            path: "/admin/dashboard",
            index: "dashboard",
          },
          {
            title: "用户管理",
            icon: "el-icon-user-solid",
            path: "/admin/users",
            index: "users",
          },
          {
            title: "课程管理",
            icon: "el-icon-notebook-2",
            path: "/admin/courses",
            index: "courses",
          },
          {
            title: "数据集管理",
            icon: "el-icon-files",
            path: "/admin/datasets",
            index: "datasets",
          },
          {
            title: "个人中心",
            icon: "el-icon-user",
            path: "/admin/profile",
            index: "profile",
          },
          {
            title: "账号设置",
            icon: "el-icon-setting",
            path: "/admin/account",
            index: "account",
          },
        ],
        teacher: [
          {
            title: "工作台",
            icon: "el-icon-s-data",
            path: "/admin/dashboard",
            index: "dashboard",
          },
          {
            title: "我的课程",
            icon: "el-icon-notebook-2",
            path: "/admin/courses",
            index: "courses",
          },
          {
            title: "学生管理",
            icon: "el-icon-user",
            index: "student-management",
            children: [
              {
                title: "学生列表",
                path: "/admin/students/list",
                index: "students-list",
              },
              {
                title: "学习表现",
                path: "/admin/students/performance",
                index: "students-performance",
              },
            ],
          },
          {
            title: "教学资源",
            icon: "el-icon-files",
            path: "/admin/datasets",
            index: "datasets",
          },
          {
            title: "作业管理",
            icon: "el-icon-tickets",
            index: "tasks",
            children: [
              {
                title: "布置作业",
                path: "/admin/tasks/assign",
                index: "tasks-assign",
              },
              {
                title: "批改作业",
                path: "/admin/tasks/review",
                index: "tasks-review",
              },
            ],
          },
          {
            title: "个人中心",
            icon: "el-icon-user",
            path: "/admin/profile",
            index: "profile",
          },
          {
            title: "账号设置",
            icon: "el-icon-setting",
            path: "/admin/account",
            index: "account",
          },
        ],
        student: [
          {
            title: "学习中心",
            icon: "el-icon-s-data",
            path: "/admin/dashboard",
            index: "dashboard",
          },
          {
            title: "我的课程",
            icon: "el-icon-notebook-2",
            path: "/admin/my-courses",
            index: "my-courses",
          },

          {
            title: "个人中心",
            icon: "el-icon-user",
            path: "/admin/profile",
            index: "profile",
          },
          {
            title: "账号设置",
            icon: "el-icon-setting",
            path: "/admin/account",
            index: "account",
          },
        ],
      };

      // 返回对应角色的菜单，如果没有则返回学生菜单
      return menuConfigs[role] || menuConfigs.student;
    },
  },
};
</script>

<style scoped>
.sidebar-menu {
  height: 100%;
  border-right: none;
}

.menu-icon {
  margin-right: 8px;
  font-size: 18px;
}

/* 侧边栏折叠时的样式调整 */
.sidebar-menu:not(.el-menu--collapse) {
  width: 240px;
}
</style>
