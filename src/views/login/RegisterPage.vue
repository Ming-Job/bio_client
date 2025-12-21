<template>
  <div class="register-container">
    <!-- 背景图片  -->
    <div class="register-bg"></div>
    <!-- 注册框 -->
    <div class="register-box">
      <!-- 头部 -->
      <div class="register-header">
        <div class="logo">
          <img src="@/assets/images/logo.png" alt="生物信息教育平台" />
          <h1>生物信息教育平台</h1>
        </div>
      </div>

      <!-- 注册表单 -->
      <el-form
        ref="registerForm"
        :model="registerForm"
        :rules="registerRules"
        class="register-form"
      >
        <!-- 用户名 -->
        <el-form-item prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名"
            clearable
            @keyup.enter.native="onSubmit"
          >
            <template slot="prepend">
              <i class="el-icon-user"></i>
            </template>
          </el-input>
        </el-form-item>

        <!-- 邮箱 -->
        <el-form-item prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="请输入邮箱"
            clearable
            @keyup.enter.native="onSubmit"
          >
            <template slot="prepend">
              <i class="el-icon-message"></i>
            </template>
          </el-input>
        </el-form-item>

        <!-- 手机号 -->
        <el-form-item prop="phone">
          <el-input
            v-model="registerForm.phone"
            placeholder="请输入手机号"
            clearable
            @keyup.enter.native="onSubmit"
          >
            <template slot="prepend">
              <i class="el-icon-phone"></i>
            </template>
          </el-input>
        </el-form-item>

        <!-- 密码 -->
        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            :type="passwordVisibility ? 'text' : 'password'"
            placeholder="请输入密码"
            clearable
            @keyup.enter.native="onSubmit"
          >
            <template slot="prepend">
              <i class="el-icon-lock"></i>
            </template>
            <template slot="append">
              <i
                :class="
                  passwordVisibility ? 'el-icon-view' : 'el-icon-remove-outline'
                "
                @click="togglePasswordVisibility"
                style="cursor: pointer"
                :title="passwordVisibility ? '隐藏密码' : '显示密码'"
              ></i>
            </template>
          </el-input>
        </el-form-item>

        <!-- 确认密码 -->
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            :type="confirmPasswordVisibility ? 'text' : 'password'"
            placeholder="请确认密码"
            clearable
            @keyup.enter.native="onSubmit"
          >
            <template slot="prepend">
              <i class="el-icon-lock"></i>
            </template>
            <template slot="append">
              <i
                :class="
                  confirmPasswordVisibility
                    ? 'el-icon-view'
                    : 'el-icon-remove-outline'
                "
                @click="toggleConfirmPasswordVisibility"
                style="cursor: pointer"
                :title="confirmPasswordVisibility ? '隐藏密码' : '显示密码'"
              ></i>
            </template>
          </el-input>
        </el-form-item>

        <!-- 角色选择下拉框 -->
        <el-form-item prop="role">
          <el-select
            v-model="registerForm.role"
            placeholder="请选择角色"
            class="role-select"
            @keyup.enter.native="onSubmit"
          >
            <el-option
              v-for="role in roleOptions"
              :key="role.value"
              :label="role.label"
              :value="role.value"
            >
              <span class="role-option-content">
                <i :class="role.icon"></i>
                {{ role.label }}
              </span>
            </el-option>
          </el-select>
        </el-form-item>

        <!-- 提交按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            class="register-btn"
            :loading="loading"
            @click="onSubmit"
          >
            {{ loading ? "注册中..." : "立即注册" }}
          </el-button>
          <div class="login-link">
            已有账号？
            <el-link type="primary" @click="toLogin">去登录</el-link>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import { register } from "@/api/user";
import {
  validateUsername,
  validateEmail,
  validatePhone,
  validatePassword,
  validateConfirmPassword,
} from "@/utils/validate";

export default {
  name: "RegisterPage",
  data() {
    return {
      registerForm: {
        username: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        role: "", // 默认不选择，让用户必须选择
      },
      registerRules: {
        username: [{ validator: validateUsername, trigger: "blur" }],
        email: [{ validator: validateEmail, trigger: "blur" }],
        phone: [{ validator: validatePhone, trigger: "blur" }],
        password: [{ validator: validatePassword, trigger: "blur" }],
        confirmPassword: [
          {
            validator: (rule, value, callback) =>
              validateConfirmPassword(rule, value, callback, this.registerForm),
            trigger: "blur",
          },
        ],
        role: [{ required: true, message: "请选择角色", trigger: "change" }],
      },

      // 角色选项
      roleOptions: [
        {
          value: "student",
          label: "学生",
          icon: "el-icon-user",
          color: "#67c23a",
        },
        {
          value: "teacher",
          label: "教师",
          icon: "el-icon-s-custom",
          color: "#e6a23c",
        },
        {
          value: "admin",
          label: "管理员",
          icon: "el-icon-s-tools",
          color: "#f56c6c",
        },
      ],

      // 控制变量
      passwordVisibility: false, // 控制密码可见性
      confirmPasswordVisibility: false, // 控制确认密码可见性
      loading: false, // 加载状态
    };
  },
  mounted() {
    // 在组件挂载后添加全局样式
    this.addGlobalStyles();
  },
  methods: {
    // 跳转到登录页
    toLogin() {
      this.$router.push({ name: "LoginPage" });
    },

    // 切换密码的可见性
    togglePasswordVisibility() {
      this.passwordVisibility = !this.passwordVisibility;
    },

    toggleConfirmPasswordVisibility() {
      this.confirmPasswordVisibility = !this.confirmPasswordVisibility;
    },

    // 添加全局样式
    addGlobalStyles() {
      // 创建样式元素
      const style = document.createElement("style");
      style.type = "text/css";

      // 样式内容
      const css = `
        /* 学生选项样式 */
        .el-select-dropdown__item:nth-child(1) .role-option-content {
          color: #67c23a !important;
        }
        .el-select-dropdown__item:nth-child(1) .role-option-content i {
          color: #67c23a !important;
        }
        
        /* 教师选项样式 */
        .el-select-dropdown__item:nth-child(2) .role-option-content {
          color: #e6a23c !important;
        }
        .el-select-dropdown__item:nth-child(2) .role-option-content i {
          color: #e6a23c !important;
        }
        
        /* 管理员选项样式 */
        .el-select-dropdown__item:nth-child(3) .role-option-content {
          color: #f56c6c !important;
        }
        .el-select-dropdown__item:nth-child(3) .role-option-content i {
          color: #f56c6c !important;
        }
        
        /* 选中状态的背景色 */
        .el-select-dropdown__item.selected {
          background-color: #f5f7fa;
        }
        
        /* 输入框根据选择的角色显示不同颜色 */
        .role-select.role-student .el-input__inner {
          border-left: 4px solid #67c23a !important;
        }
        .role-select.role-teacher .el-input__inner {
          border-left: 4px solid #e6a23c !important;
        }
        .role-select.role-admin .el-input__inner {
          border-left: 4px solid #f56c6c !important;
        }
      `;

      style.textContent = css;
      document.head.appendChild(style);
    },

    // 提交注册表单
    onSubmit() {
      this.$refs.registerForm.validate(async (valid) => {
        if (!valid) return;
        this.loading = true;
        try {
          const payload = {
            username: this.registerForm.username,
            email: this.registerForm.email,
            phone: this.registerForm.phone,
            password: this.registerForm.password,
            confirmPassword: this.registerForm.confirmPassword,
            role: this.registerForm.role,
          };
          const res = await register(payload);
          this.$message.success(
            res && res.message ? res.message : "注册成功，请登录"
          );
          this.$router.push({ name: "LoginPage" });
        } catch (err) {
          const msg = err && err.message ? err.message : "注册失败，请重试";
          this.$message.error(msg);
        } finally {
          this.loading = false;
        }
      });
    },
  },
  watch: {
    // 监听角色变化，动态添加类名到下拉框
    "registerForm.role": function (newVal) {
      // 移除所有角色类名
      const select = document.querySelector(".role-select");
      if (select) {
        select.classList.remove("role-student", "role-teacher", "role-admin");
        // 添加当前角色的类名
        if (newVal) {
          select.classList.add(`role-${newVal}`);
        }
      }
    },
  },
};
</script>

<style scoped lang="scss">
.register-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  .register-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: url("~@/assets/images/login-bg.png") no-repeat center center;
    background-size: cover;
    opacity: 0.5;
  }

  .register-box {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 420px; // 恢复原来的宽度
    padding: 40px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 10px;
    box-shadow: 0 15px 35px rgba(50, 50, 93, 0.1),
      0 5px 15px rgba(0, 0, 0, 0.07);

    .register-header {
      text-align: center;
      margin-bottom: 30px;

      .logo {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 10px;

        img {
          width: 40px;
          height: 40px;
          margin-right: 10px;
        }

        h1 {
          margin: 0;
          font-size: 24px;
          color: #333;
          font-weight: 600;
        }
      }

      .welcome {
        margin: 0;
        color: #666;
        font-size: 16px;
      }
    }

    .register-form {
      // 下拉框样式
      .role-select {
        width: 100%;

        ::v-deep .el-input__inner {
          padding-left: 10px;
          transition: all 0.3s;
        }
      }

      // 角色选项内容样式
      .role-option-content {
        display: flex;
        align-items: center;

        i {
          margin-right: 8px;
          font-size: 16px;
        }
      }
    }
  }
}

.register-btn {
  width: 100%;
  height: 45px;
  font-size: 16px;
  border-radius: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;

  &:hover {
    opacity: 0.9;
  }
}

.login-link {
  text-align: center;
  margin-top: 20px;
  color: #666;

  .el-link {
    margin-left: 5px;
  }
}
</style>
