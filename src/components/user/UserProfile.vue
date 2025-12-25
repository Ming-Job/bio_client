<!-- UserProfile.vue - 账号设置组件 -->
<template>
  <div class="user-profile">
    <!-- 公共部分 -->
    <div class="common-section">
      <h2>个人中心</h2>
    </div>

    <!-- 主要内容 -->
    <div class="profile-container">
      <!-- 左侧头像和信息概览 -->
      <div class="profile-sidebar">
        <div class="avatar-section">
          <div class="avatar-wrapper">
            <el-avatar
              :size="120"
              :src="userInfo.avatar || defaultAvatar"
              class="avatar"
            />
            <el-upload
              class="avatar-uploader"
              action="/api/upload/avatar"
              :show-file-list="false"
              :on-success="handleAvatarSuccess"
              :before-upload="beforeAvatarUpload"
            >
              <el-button size="small" type="primary" icon="el-icon-upload"
                >更换头像</el-button
              >
            </el-upload>
          </div>
          <div class="user-basic-info">
            <h3>{{ userInfo.username }}</h3>
            <p class="user-role">
              <el-tag :type="roleType">{{
                userInfo.role || "普通用户"
              }}</el-tag>
            </p>
            <p class="user-status">
              <span
                :class="['status-dot', userInfo.status ? 'active' : 'inactive']"
              ></span>
              {{ userInfo.status ? "正常" : "禁用" }}
            </p>
          </div>
        </div>

        <div class="login-info">
          <h4>登录信息</h4>
          <div class="info-item">
            <span class="label">最后登录时间:</span>
            <span class="value">{{
              formatTime(userInfo.lastLoginTime) || "从未登录"
            }}</span>
          </div>
          <div class="info-item">
            <span class="label">注册时间:</span>
            <span class="value">{{ formatTime(userInfo.createTime) }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧编辑表单 -->
      <div class="profile-content">
        <el-tabs v-model="activeTab" type="card">
          <!-- 基本信息 -->
          <el-tab-pane label="基本信息" name="basic">
            <el-form
              ref="basicForm"
              :model="userInfo"
              :rules="basicRules"
              label-width="100px"
              class="profile-form"
            >
              <el-form-item label="用户名" prop="username">
                <el-input
                  v-model="userInfo.username"
                  placeholder="请输入用户名"
                  maxlength="50"
                />
              </el-form-item>

              <el-form-item label="邮箱" prop="email">
                <el-input
                  v-model="userInfo.email"
                  placeholder="请输入邮箱"
                  maxlength="100"
                />
              </el-form-item>

              <el-form-item label="手机号" prop="phone">
                <el-input
                  v-model="userInfo.phone"
                  placeholder="请输入手机号"
                  maxlength="20"
                />
              </el-form-item>

              <el-form-item label="用户角色" prop="role">
                <el-select
                  v-model="userInfo.role"
                  placeholder="请选择角色"
                  style="width: 100%"
                >
                  <el-option label="管理员" value="admin" />
                  <el-option label="教师" value="teacher" />
                  <el-option label="学生" value="student" />
                </el-select>
              </el-form-item>

              <el-form-item>
                <el-button
                  type="primary"
                  @click="saveBasicInfo"
                  :loading="saving"
                >
                  保存修改
                </el-button>
                <el-button @click="resetBasicInfo">重置</el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import { formatDateTime } from "@/utils/date";
import { updateUser } from "@/api/user";

export default {
  name: "UserProfile",
  data() {
    const validatePassword = (rule, value, callback) => {
      if (value !== this.passwordForm.newPassword) {
        callback(new Error("两次输入密码不一致!"));
      } else {
        callback();
      }
    };

    return {
      activeTab: "basic",
      saving: false,
      changingPassword: false,
      defaultAvatar:
        "https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png",

      passwordForm: {
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      },

      basicRules: {
        username: [
          { required: true, message: "请输入用户名", trigger: "blur" },
          {
            min: 3,
            max: 50,
            message: "长度在 3 到 50 个字符",
            trigger: "blur",
          },
        ],
        email: [
          { required: true, message: "请输入邮箱地址", trigger: "blur" },
          {
            type: "email",
            message: "请输入正确的邮箱地址",
            trigger: ["blur", "change"],
          },
        ],
        phone: [
          {
            pattern: /^1[3-9]\d{9}$/,
            message: "请输入正确的手机号码",
            trigger: "blur",
          },
        ],
      },

      passwordRules: {
        oldPassword: [
          { required: true, message: "请输入当前密码", trigger: "blur" },
        ],
        newPassword: [
          { required: true, message: "请输入新密码", trigger: "blur" },
          {
            min: 8,
            max: 32,
            message: "长度在 8 到 32 个字符",
            trigger: "blur",
          },
        ],
        confirmPassword: [
          { required: true, message: "请确认密码", trigger: "blur" },
          { validator: validatePassword, trigger: "blur" },
        ],
      },
    };
  },

  computed: {
    // 修复：从Vuex的user模块获取状态
    ...mapState("user", {
      isLoggedIn: (state) => state.isLoggedIn,
      userInfo: (state) => state.userInfo,
    }),
    roleType() {
      const roleMap = {
        admin: "danger",
        user: "info",
        editor: "warning",
        guest: "success",
      };
      return roleMap[this.userInfo.role] || "info";
    },
  },

  methods: {
    // 格式化时间显示
    formatTime(time) {
      return formatDateTime(time);
    },

    // 头像上传成功
    handleAvatarSuccess(res) {
      this.userInfo.avatar = res.data.url;
      this.$message.success("头像上传成功");
    },

    // 头像上传前验证
    beforeAvatarUpload(file) {
      const isJPG = file.type === "image/jpeg";
      const isPNG = file.type === "image/png";
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isJPG && !isPNG) {
        this.$message.error("上传头像图片只能是 JPG/PNG 格式!");
      }
      if (!isLt2M) {
        this.$message.error("上传头像图片大小不能超过 2MB!");
      }
      return (isJPG || isPNG) && isLt2M;
    },

    // 保存基本信息
    saveBasicInfo() {
      this.$refs.basicForm.validate((valid) => {
        if (valid) {
          this.saving = true;

          // 准备提交数据
          const submitData = {
            username: this.basicForm.username,
            role: this.basicForm.role,
            email: this.basicForm.email,
            phone: this.basicForm.phone,
          };

          console.log("准备提交的数据:", submitData);

          updateUser(submitData)
            .then((response) => {
              console.log("API响应的数据：", response);
              this.$message.success("个人信息更新成功");
            })
            .catch((error) => {
              console.error("操作失败:", error);
            })
            .finally(() => {
              this.saving = false;
            });
        } else {
          console.log("表单验证失败");
          return false;
        }
      });
    },

    // 重置基本信息
    resetBasicInfo() {
      this.$refs.basicForm.resetFields();
    },

    // 修改密码
    changePassword() {
      this.$refs.passwordForm.validate((valid) => {
        if (valid) {
          this.changingPassword = true;
          // 模拟API调用
          setTimeout(() => {
            this.$message.success("密码修改成功");
            this.resetPasswordForm();
            this.changingPassword = false;
          }, 1000);
        }
      });
    },

    // 重置密码表单
    resetPasswordForm() {
      this.$refs.passwordForm.resetFields();
    },
  },
};
</script>

<style scoped lang="scss">
.user-profile {
  padding: 20px 20px 5px 20px;
  height: 100%;

  .common-section {
    margin-bottom: 10px;
    padding-bottom: 10px;

    h3 {
      margin: 0;
      color: #303133;
      font-size: 20px;
    }
  }

  .profile-container {
    display: flex;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    overflow: hidden;

    .profile-sidebar {
      width: 280px;
      background: #fafbfc;
      border-right: 1px solid #e6ebf5;
      padding: 30px 20px;

      .avatar-section {
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 30px;
        border-bottom: 1px solid #e6ebf5;

        .avatar-wrapper {
          margin-bottom: 20px;

          .avatar {
            margin-bottom: 15px;
            border: 4px solid #fff;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
        }

        .user-basic-info {
          h3 {
            margin: 15px 0 10px;
            font-size: 18px;
            color: #303133;
          }

          .user-role {
            margin: 10px 0;
          }

          .user-status {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: #909399;

            .status-dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;

              &.active {
                background-color: #67c23a;
              }

              &.inactive {
                background-color: #f56c6c;
              }
            }
          }
        }
      }

      .login-info {
        padding: 15px 0;

        h4 {
          margin-bottom: 15px;
          color: #303133;
          font-size: 16px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 14px;

          .label {
            color: #909399;
          }

          .value {
            color: #606266;
            font-weight: 500;
          }
        }
      }
    }

    .profile-content {
      flex: 1;
      padding: 30px;

      .profile-form {
        max-width: 500px;
        margin-top: 20px;
      }

      ::v-deep .el-tabs__header {
        margin-bottom: 30px;
      }
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    .profile-container {
      flex-direction: column;

      .profile-sidebar {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid #e6ebf5;
      }

      .profile-content {
        padding: 20px;
      }
    }
  }
}
</style>
