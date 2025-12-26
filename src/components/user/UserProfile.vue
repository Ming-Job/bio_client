<!-- UserProfile.vue - 个人信息 -->
<template>
  <div class="user-profile">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>个人中心</h2>
    </div>

    <!-- 主要内容区域 -->
    <div class="profile-main">
      <!-- 左侧信息卡片 -->
      <div class="info-card">
        <!-- 头像区域 -->
        <div class="avatar-section">
          <!-- 头像上传组件 -->
          <div class="avatar-upload-wrapper">
            <el-avatar
              :size="100"
              :src="getUserAvatar(userInfo.avatar)"
              class="avatar"
            />
            <el-upload
              class="avatar-uploader"
              action="javascript:void(0)"
              :show-file-list="false"
              :before-upload="beforeAvatarUpload"
              :http-request="uploadAvatar"
              accept="image/*"
            >
              <div class="avatar-upload-btn">
                <i class="el-icon-camera" v-if="!uploadingAvatar"></i>
                <i class="el-icon-loading avatar-loading" v-else></i>
              </div>
            </el-upload>
          </div>

          <div class="user-meta">
            <h3>{{ userInfo.username }}</h3>
            <el-tag :type="roleType" size="small">
              {{ getRoleDisplayName(userInfo.role) }}
            </el-tag>
            <div class="status">
              <span
                :class="['status-dot', userInfo.status ? 'active' : 'inactive']"
              ></span>
              <span>{{ userInfo.status ? "正常" : "禁用" }}</span>
            </div>
          </div>
        </div>

        <!-- 登录信息 -->
        <div class="login-info">
          <h4>登录信息</h4>
          <div class="info-row">
            <span class="label">最后登录</span>
            <span class="value">{{
              formatTime(userInfo.lastLoginTime) || "从未登录"
            }}</span>
          </div>
          <div class="info-row">
            <span class="label">注册时间</span>
            <span class="value">{{ formatTime(userInfo.createTime) }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧编辑区域 -->
      <div class="edit-card">
        <h3>编辑个人信息</h3>

        <el-form
          ref="basicFormRef"
          :model="formData"
          :rules="formRules"
          label-width="80px"
          class="edit-form"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="formData.username"
              placeholder="请输入用户名"
              clearable
            />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input
              v-model="formData.email"
              placeholder="请输入邮箱"
              clearable
            />
          </el-form-item>
          <el-form-item label="手机号" prop="phone">
            <el-input
              v-model="formData.phone"
              placeholder="请输入手机号"
              clearable
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveUserInfo" :loading="saving">
              保存修改
            </el-button>
            <el-button @click="resetForm"> 重置 </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import { formatDateTime } from "@/utils/date";
import { updateUser, updateUserAvatar } from "@/api/user";
import { getAvatarUrl } from "@/utils/auth";

export default {
  name: "UserProfile",
  data() {
    return {
      saving: false,
      uploadingAvatar: false, // 头像上传加载状态
      formData: {
        id: null,
        username: "",
        email: "",
        phone: "",
      },
      formRules: {
        username: [
          { required: true, message: "请输入用户名", trigger: "blur" },
          {
            min: 3,
            max: 20,
            message: "长度在 3 到 20 个字符",
            trigger: "blur",
          },
        ],
        email: [
          { required: true, message: "请输入邮箱", trigger: "blur" },
          { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" },
        ],
        phone: [
          {
            pattern: /^1[3-9]\d{9}$/,
            message: "请输入正确的手机号",
            trigger: "blur",
          },
        ],
      },
    };
  },

  computed: {
    ...mapState("user", ["userInfo"]),

    roleType() {
      const map = { admin: "danger", teacher: "warning", student: "success" };
      return map[this.userInfo.role] || "info";
    },
  },

  watch: {
    userInfo: {
      handler(newVal) {
        if (newVal) {
          this.initFormData();
        }
      },
      immediate: true,
      deep: true,
    },
  },

  methods: {
    // 初始化表单数据
    initFormData() {
      this.formData = {
        id: this.userInfo.id,
        username: this.userInfo.username || "",
        email: this.userInfo.email || "",
        phone: this.userInfo.phone || "",
      };
    },

    // 获取头像URL
    getUserAvatar(avatar) {
      return getAvatarUrl(avatar);
    },

    // 格式化时间
    formatTime(time) {
      return formatDateTime(time);
    },

    // 获取角色显示名称
    getRoleDisplayName(role) {
      const map = { admin: "管理员", teacher: "教师", student: "学生" };
      return map[role] || "普通用户";
    },

    // 保存用户信息
    async saveUserInfo() {
      try {
        // 表单验证
        await this.$refs.basicFormRef.validate();

        this.saving = true;

        // 调用API更新用户信息
        const response = await updateUser({
          id: this.formData.id,
          username: this.formData.username,
          email: this.formData.email,
          phone: this.formData.phone,
        });

        // 更新Vuex状态
        if (response.data) {
          await this.$store.dispatch("user/updateUserInfo", response.data);
        }

        this.$message.success("个人信息更新成功");
      } catch (error) {
        if (error.name !== "ValidationError") {
          console.error("更新失败:", error);
          this.$message.error(error.message || "更新失败");
        }
      } finally {
        this.saving = false;
      }
    },

    // 重置表单
    resetForm() {
      this.$refs.basicFormRef.resetFields();
      this.initFormData();
    },

    // 头像上传前的校验
    beforeAvatarUpload(file) {
      // 校验文件类型
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        this.$message.error("请上传图片格式的文件！");
        return false;
      }

      // 校验文件大小（限制2MB）
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        this.$message.error("头像大小不能超过 2MB！");
        return false;
      }

      return true;
    },

    async uploadAvatar(options) {
      const file = options.file;
      try {
        this.uploadingAvatar = true;

        // 构建FormData（参数格式不变）
        const formData = new FormData();
        formData.append("avatar", file);
        formData.append("userId", this.userInfo.id);

        // 调用/api/user.js中封装的updateUserAvatar方法
        const response = await updateUserAvatar(formData);
        if (response.code === 200) {
          await this.$store.dispatch("user/updateUserInfo", {
            ...this.userInfo,
            avatar: response.data,
          });
          this.$message.success("头像更新成功！");
        } else {
          this.$message.error(response.message || "头像更新失败");
        }
      } catch (error) {
        console.error("头像上传失败:", error);
        this.$message.error("头像更新失败，请重试");
      } finally {
        this.uploadingAvatar = false;
      }
    },
  },
};
</script>

<style scoped lang="scss">
// 全局变量
$primary-color: #409eff;
$success-color: #67c23a;
$warning-color: #e6a23c;
$danger-color: #f56c6c;
$text-primary: #1e293b;
$text-secondary: #64748b;
$text-tertiary: #94a3b8;
$bg-primary: #ffffff;
$bg-secondary: #f8fafc;
$border-color: #e2e8f0;
$shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
$shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08),
  0 2px 4px -1px rgba(0, 0, 0, 0.04);
$shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
  0 4px 6px -2px rgba(0, 0, 0, 0.05);
$radius-sm: 6px;
$radius-md: 10px;
$radius-lg: 16px;
$transition-base: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

.user-profile {
  padding: 30px;
  min-height: 100%;
  background-color: $bg-secondary;
  font-family: "Inter", "PingFang SC", "Microsoft YaHei", sans-serif;
}

.page-header {
  margin-bottom: 32px;

  h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: $text-primary;
    position: relative;
    padding-bottom: 12px;

    &::after {
      content: "";
      position: absolute;
      left: 0;
      bottom: 0;
      width: 40px;
      height: 3px;
      background-color: $primary-color;
      border-radius: $radius-sm;
    }
  }
}

.profile-main {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 30px;
  align-items: start;
}

.info-card {
  background: $bg-primary;
  border-radius: $radius-lg;
  padding: 30px;
  box-shadow: $shadow-md;
  border: 1px solid $border-color;
  transition: $transition-base;

  &:hover {
    box-shadow: $shadow-lg;
    transform: translateY(-2px);
  }

  .avatar-section {
    display: flex;
    align-items: center;
    margin-bottom: 30px;
    padding-bottom: 24px;
    border-bottom: 1px solid $border-color;
    position: relative;

    &::after {
      content: "";
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 60px;
      height: 1px;
      background-color: $primary-color;
    }

    .avatar-upload-wrapper {
      position: relative;
      margin-right: 20px;

      .avatar {
        border: 4px solid $bg-secondary;
        box-shadow: $shadow-md;
        transition: $transition-base;
      }

      .avatar-uploader {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 32px;
        height: 32px;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        cursor: pointer;
        opacity: 0;
        transition: $transition-base;

        .avatar-upload-btn {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;

          i {
            font-size: 16px;
            margin: 0;
          }
        }
      }

      &:hover .avatar {
        transform: scale(1.05);
      }

      &:hover .avatar-uploader {
        opacity: 1;
      }
    }

    .user-meta {
      flex: 1;

      h3 {
        margin: 0 0 10px;
        font-size: 20px;
        color: $text-primary;
        font-weight: 600;
      }

      .el-tag {
        margin-bottom: 8px;
        font-weight: 500;
      }

      .status {
        display: flex;
        align-items: center;
        margin-top: 10px;
        font-size: 14px;
        color: $text-secondary;

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 8px;
          box-shadow: 0 0 0 2px rgba($success-color, 0.2);
          transition: $transition-base;

          &.active {
            background-color: $success-color;
            &:hover {
              box-shadow: 0 0 0 4px rgba($success-color, 0.3);
            }
          }

          &.inactive {
            background-color: $danger-color;
            box-shadow: 0 0 0 2px rgba($danger-color, 0.2);
            &:hover {
              box-shadow: 0 0 0 4px rgba($danger-color, 0.3);
            }
          }
        }
      }
    }
  }

  .login-info {
    h4 {
      margin: 0 0 20px;
      font-size: 16px;
      color: $text-primary;
      font-weight: 600;
      display: flex;
      align-items: center;

      &::before {
        content: "";
        display: inline-block;
        width: 4px;
        height: 16px;
        background-color: $primary-color;
        margin-right: 8px;
        border-radius: $radius-sm;
      }
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 16px;
      font-size: 14px;
      padding: 8px 0;
      border-bottom: 1px solid rgba($border-color, 0.5);
      transition: $transition-base;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background-color: $bg-secondary;
        padding-left: 8px;
        border-radius: $radius-sm;
      }

      .label {
        color: $text-tertiary;
        font-weight: 500;
      }

      .value {
        color: $text-secondary;
        font-weight: 500;
        font-family: "Courier New", monospace;
      }
    }
  }
}

.edit-card {
  background: $bg-primary;
  border-radius: $radius-lg;
  padding: 30px;
  box-shadow: $shadow-md;
  border: 1px solid $border-color;
  transition: $transition-base;

  &:hover {
    box-shadow: $shadow-lg;
    transform: translateY(-2px);
  }

  h3 {
    margin: 0 0 28px;
    font-size: 20px;
    font-weight: 600;
    color: $text-primary;
    position: relative;
    padding-bottom: 12px;

    &::after {
      content: "";
      position: absolute;
      left: 0;
      bottom: 0;
      width: 40px;
      height: 3px;
      background-color: $primary-color;
      border-radius: $radius-sm;
    }
  }

  .edit-form {
    max-width: 450px;

    ::v-deep .el-form-item {
      margin-bottom: 20px;
    }

    ::v-deep .el-form-item__label {
      font-weight: 500;
      color: $text-secondary;
      font-size: 14px;
    }

    ::v-deep .el-input {
      .el-input__inner {
        border-radius: $radius-sm;
        box-shadow: $shadow-sm;
        border: 1px solid $border-color;
        transition: $transition-base;

        &:hover {
          border-color: $primary-color;
          box-shadow: 0 0 0 2px rgba($primary-color, 0.1);
        }

        &:focus {
          border-color: $primary-color;
          box-shadow: 0 0 0 2px rgba($primary-color, 0.2);
          outline: none;
        }
      }
    }

    ::v-deep .el-button {
      padding: 10px 24px;
      border-radius: $radius-sm;
      font-weight: 500;
      transition: $transition-base;

      &.el-button--primary {
        background-color: $primary-color;
        border-color: $primary-color;

        &:hover {
          background-color: #3399ff;
          border-color: #3399ff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba($primary-color, 0.3);
        }
      }

      &.el-button--default {
        &:hover {
          color: $primary-color;
          border-color: $primary-color;
          transform: translateY(-2px);
        }
      }
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .user-profile {
    padding: 20px 15px;
  }

  .profile-main {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .info-card,
  .edit-card {
    padding: 20px;
  }

  .avatar-section {
    flex-direction: column;
    text-align: center;

    .avatar-upload-wrapper {
      margin-right: 0;
      margin-bottom: 16px;
    }

    .user-meta {
      width: 100%;
    }

    .status {
      justify-content: center;
    }
  }

  .edit-form {
    max-width: 100% !important;
  }
}

// 深色模式适配（可选）
@media (prefers-color-scheme: dark) {
  :root {
    $text-primary: #f8fafc;
    $text-secondary: #e2e8f0;
    $text-tertiary: #94a3b8;
    $bg-primary: #0f172a;
    $bg-secondary: #1e293b;
    $border-color: #334155;
  }
}
</style>
