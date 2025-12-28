<template>
  <div class="account-settings">
    <div class="common-section">
      <div class="page-header">
        <h2>账号安全</h2>
      </div>

      <div class="password-change-section">
        <div class="form-card">
          <div class="form-header">
            <h4>修改密码</h4>
            <div class="form-description">
              请确保密码长度至少6位，且包含字母和数字
            </div>
          </div>

          <el-form
            :model="passwordForm"
            :rules="passwordRules"
            ref="passwordForm"
            label-width="100px"
            class="custom-form"
          >
            <!-- 旧密码输入 -->
            <el-form-item
              label="旧密码"
              prop="oldPassword"
              class="form-item-custom"
              :error="oldPasswordError"
            >
              <el-input
                type="password"
                v-model="passwordForm.oldPassword"
                placeholder="请输入当前使用的密码"
                show-password
                class="custom-input"
                @input="clearOldPasswordError"
              >
                <template #prefix>
                  <i class="el-icon-lock input-icon"></i>
                </template>
              </el-input>
            </el-form-item>

            <!-- 新密码输入 -->
            <el-form-item
              label="新密码"
              prop="newPassword"
              class="form-item-custom"
            >
              <el-input
                type="password"
                v-model="passwordForm.newPassword"
                placeholder="请输入6-20位新密码"
                show-password
                class="custom-input"
              >
                <template #prefix>
                  <i class="el-icon-key input-icon"></i>
                </template>
              </el-input>
            </el-form-item>

            <!-- 确认密码输入 -->
            <el-form-item
              label="确认密码"
              prop="confirmPassword"
              class="form-item-custom"
              :error="confirmPasswordError"
            >
              <el-input
                type="password"
                v-model="passwordForm.confirmPassword"
                placeholder="请再次输入新密码"
                show-password
                class="custom-input"
                :class="{
                  'input-success':
                    isPasswordMatch && passwordForm.confirmPassword,
                  'input-error': confirmPasswordError,
                }"
              >
                <template #prefix>
                  <i class="el-icon-check input-icon"></i>
                </template>
                <template #suffix>
                  <i
                    v-if="passwordForm.confirmPassword"
                    :class="
                      isPasswordMatch ? 'el-icon-success' : 'el-icon-error'
                    "
                    :style="{
                      color: isPasswordMatch ? '#67c23a' : '#f56c6c',
                    }"
                  ></i>
                </template>
              </el-input>
            </el-form-item>

            <!-- 错误信息提示区域 -->
            <div v-if="apiErrorMessage" class="api-error-message">
              <i class="el-icon-error"></i>
              <span>{{ apiErrorMessage }}</span>
            </div>

            <el-form-item class="form-actions">
              <el-button
                type="primary"
                @click="submitPasswordChange"
                :loading="loading"
                :disabled="!isFormValid"
                class="submit-button"
              >
                {{ loading ? "修改中..." : "修改密码" }}
              </el-button>
              <el-button
                @click="resetForm"
                :disabled="loading"
                class="reset-button"
              >
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { changePassword } from "@/api/user";
import { mapState } from "vuex";

export default {
  data() {
    return {
      loading: false,
      passwordForm: {
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      },
      oldPasswordError: "", // 单独存储旧密码错误信息
      confirmPasswordError: "", // 单独存储确认密码错误信息
      apiErrorMessage: "", // API返回的错误信息
      passwordRules: {
        oldPassword: [
          { required: true, message: "请输入旧密码", trigger: "blur" },
          { min: 6, message: "密码长度不能少于6位", trigger: "blur" },
        ],
        newPassword: [
          { required: true, message: "请输入新密码", trigger: "blur" },
          { min: 6, message: "密码长度不能少于6位", trigger: "blur" },
          { max: 20, message: "密码长度不能超过20位", trigger: "blur" },
          {
            validator: (rule, value, callback) => {
              if (value && value === this.passwordForm.oldPassword) {
                callback(new Error("新密码不能与旧密码相同"));
              } else {
                callback();
              }
            },
            trigger: "blur",
          },
        ],
        confirmPassword: [
          { required: true, message: "请确认新密码", trigger: "blur" },
          {
            validator: (rule, value, callback) => {
              if (value && value !== this.passwordForm.newPassword) {
                this.confirmPasswordError = "两次输入密码不一致";
                callback(new Error("两次输入密码不一致"));
              } else {
                this.confirmPasswordError = "";
                callback();
              }
            },
            trigger: "blur",
          },
        ],
      },
    };
  },
  computed: {
    ...mapState("user", ["userInfo"]),

    isPasswordMatch() {
      return (
        this.passwordForm.newPassword === this.passwordForm.confirmPassword
      );
    },

    isFormValid() {
      return (
        this.passwordForm.oldPassword &&
        this.passwordForm.newPassword &&
        this.passwordForm.confirmPassword &&
        this.isPasswordMatch &&
        this.passwordForm.newPassword !== this.passwordForm.oldPassword
      );
    },
  },

  methods: {
    // 清除旧密码错误
    clearOldPasswordError() {
      this.oldPasswordError = "";
      this.apiErrorMessage = "";
    },

    async submitPasswordChange() {
      try {
        // 清除之前的错误信息
        this.oldPasswordError = "";
        this.confirmPasswordError = "";
        this.apiErrorMessage = "";

        // 验证表单
        const valid = await this.$refs.passwordForm.validate();
        if (!valid) return;

        this.loading = true;
        const userId = this.userInfo.id;

        if (!userId) {
          this.$message.error("用户信息获取失败，请重新登录");
          this.loading = false;
          return;
        }

        const passwordData = {
          id: userId,
          oldPassword: this.passwordForm.oldPassword,
          newPassword: this.passwordForm.newPassword,
        };

        const response = await changePassword(passwordData);

        if (response && response.success) {
          this.$message.success(response.message || "密码修改成功");

          // 清空表单
          this.resetForm();

          // 延迟提示
          setTimeout(() => {
            // 提示重新登录
            this.$message.info("请使用新密码重新登录");
          }, 1500);

          // 延迟登出
          setTimeout(() => {
            this.$store.dispatch("user/logout");
            this.$router.push("/login");
          }, 1500);
        } else {
          this.$message.error(response.message || "密码修改失败");
        }
      } catch (error) {
        console.error("修改密码失败:", error);

        // 处理不同类型的错误
        if (error.response) {
          const { status, data } = error.response;

          if (status === 401) {
            // 旧密码错误
            this.oldPasswordError = "旧密码错误，请重新输入";
            this.apiErrorMessage = "旧密码错误，请重新输入";
          } else if (status === 400) {
            // 请求参数错误
            this.apiErrorMessage = data.message || "请求参数错误";
          } else if (status === 403) {
            // 权限不足
            this.apiErrorMessage = "您没有权限修改密码";
          } else {
            this.apiErrorMessage = data.message || "密码修改失败，请稍后重试";
          }
        } else {
          this.apiErrorMessage = error.message || "密码修改失败，请稍后重试";
        }
      } finally {
        this.loading = false;
      }
    },

    resetForm() {
      this.passwordForm = {
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      };
      this.oldPasswordError = "";
      this.confirmPasswordError = "";
      this.apiErrorMessage = "";
      this.$refs.passwordForm.resetFields();
    },
  },
};
</script>

<style scoped lang="scss">
.account-settings {
  padding: 30px;
  background: #f8fafc;
  min-height: 100%;
}

.common-section {
  max-width: 100%;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;

  h2 {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 700;
    color: #1a1a1a;
    position: relative;
    padding-bottom: 12px;

    &::after {
      content: "";
      position: absolute;
      left: 0;
      bottom: 0;
      width: 47px;
      height: 4px;
      background: #409eff;
      border-radius: 2px;
    }
  }
}

.password-change-section {
  .form-card {
    background: white;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    border: 1px solid #e5e7eb;
  }

  .form-header {
    margin-bottom: 32px;
    padding-bottom: 20px;
    border-bottom: 1px solid #f0f0f0;

    h4 {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 600;
      color: #333;
    }

    .form-description {
      color: #666;
      font-size: 13px;
    }
  }
}

.custom-form {
  .form-item-custom {
    margin-bottom: 32px;

    :deep(.el-form-item__label) {
      font-weight: 500;
      color: #333;
      padding-right: 20px;
      font-size: 14px;
    }

    :deep(.el-form-item__error) {
      margin-top: 6px;
      font-size: 12px;
      padding-left: 8px;
      color: #f56c6c;
    }
  }

  .custom-input {
    :deep(.el-input__inner) {
      height: 44px;
      line-height: 44px;
      border: 1px solid #dcdfe6;
      border-radius: 8px;
      padding-left: 40px;
      padding-right: 40px;
      font-size: 14px;
      transition: all 0.3s ease;
      background: #fafbfc;

      &:hover {
        border-color: #c0c4cc;
        background: white;
      }

      &:focus {
        border-color: #409eff;
        box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
        background: white;
      }

      &::placeholder {
        color: #999;
      }
    }

    &.input-success {
      :deep(.el-input__inner) {
        border-color: #67c23a;
      }
    }

    &.input-error {
      :deep(.el-input__inner) {
        border-color: #f56c6c;
      }
    }

    .input-icon {
      color: #909399;
      font-size: 16px;
      margin-left: 10px;
    }
  }

  // API错误信息样式
  .api-error-message {
    margin: -20px 0 20px 0;
    padding: 10px 16px;
    background-color: #fef0f0;
    border: 1px solid #fde2e2;
    border-radius: 4px;
    color: #f56c6c;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: fadeIn 0.3s ease;

    i {
      font-size: 16px;
    }
  }

  .form-actions {
    margin-top: 40px;
    padding-top: 30px;
    border-top: 1px solid #f0f0f0;

    :deep(.el-form-item__content) {
      display: flex;
      gap: 16px;
    }

    .submit-button {
      height: 44px;
      padding: 0 32px;
      font-weight: 500;
      border-radius: 8px;
      background: #409eff;
      border: none;
      transition: all 0.3s ease;

      &:hover {
        background: #66b1ff;
      }

      &:active {
        background: #3a8ee6;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .reset-button {
      height: 44px;
      padding: 0 28px;
      border-radius: 8px;
      border: 1px solid #dcdfe6;
      background: white;
      color: #606266;

      &:hover {
        border-color: #409eff;
        color: #409eff;
      }
    }
  }
}

// 错误动画
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .account-settings {
    padding: 20px;
  }

  .password-change-section .form-card {
    padding: 24px;
  }

  .custom-form {
    .form-item-custom {
      margin-bottom: 28px;

      :deep(.el-form-item__label) {
        padding-bottom: 8px;
        margin-bottom: 4px;
        float: none;
        text-align: left;
        display: block;
        width: 100% !important;
      }

      :deep(.el-form-item__content) {
        margin-left: 0 !important;
      }
    }

    .custom-input {
      :deep(.el-input__inner) {
        height: 42px;
        line-height: 42px;
      }
    }

    .form-actions {
      :deep(.el-form-item__content) {
        flex-direction: column;
      }

      .submit-button,
      .reset-button {
        width: 100%;
      }
    }
  }
}
</style>
