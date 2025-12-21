<template>
  <div class="login-container">
    <!-- 背景图片 -->
    <div class="login-bg"></div>

    <!-- 登录框 -->
    <div class="login-box">
      <!-- 头部 -->
      <div class="login-header">
        <div class="logo">
          <img src="@/assets/images/logo.png" alt="生物信息教育平台" />
          <h1>生物信息教育平台</h1>
        </div>
      </div>

      <!-- 登录表单 -->
      <el-form
        ref="loginForm"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.native.prevent
      >
        <!-- 用户名 -->
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            clearable
            @keyup.enter.native="handleLogin"
          >
            <template slot="prepend">
              <i class="el-icon-user"></i>
            </template>
          </el-input>
        </el-form-item>

        <!-- 密码 -->
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            :type="passwordFieldType"
            placeholder="请输入密码"
            clearable
            @keyup.enter.native="handleLogin"
          >
            <template slot="prepend">
              <i class="el-icon-lock"></i>
            </template>
            <template slot="append">
              <i
                :class="
                  passwordVisible ? 'el-icon-view' : 'el-icon-remove-outline'
                "
                @click="togglePasswordVisibility"
                style="cursor: pointer"
                :title="passwordVisible ? '隐藏密码' : '显示密码'"
              ></i>
            </template>
          </el-input>
        </el-form-item>

        <!-- 记住我和忘记密码 -->
        <div class="login-options">
          <el-checkbox v-model="rememberMe">记住我</el-checkbox>
          <el-link type="primary" @click="handleForgetPassword"
            >忘记密码?</el-link
          >
        </div>

        <!-- 登录按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleLogin"
            class="login-btn"
          >
            {{ loading ? "登录中..." : "登录" }}
          </el-button>
        </el-form-item>

        <!-- 注册链接 -->
        <div class="register-link">
          还没有账号?
          <el-link type="primary" @click="goToRegister">立即注册</el-link>
        </div>
      </el-form>
    </div>

    <!-- 忘记密码对话框 -->
    <el-dialog
      title="忘记密码"
      :visible.sync="forgetDialogVisible"
      width="30%"
      @close="handleForgetClose"
      :close-on-click-modal="false"
    >
      <div v-if="forgetStep === 1">
        <el-alert
          title="请输入您的用户名和注册邮箱进行身份认证"
          type="info"
          show-icon
          :closable="false"
          style="margin-bottom: 20px"
        />
        <el-form
          ref="forgetForm1"
          :model="forgetForm1"
          :rules="forgetRules1"
          label-width="80px"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="forgetForm1.username"
              placeholder="请输入用户名"
            ></el-input>
          </el-form-item>

          <el-form-item label="邮箱" prop="email">
            <el-input
              v-model="forgetForm1.email"
              placeholder="请输入注册邮箱"
            ></el-input>
          </el-form-item>
        </el-form>
      </div>

      <!-- 第二步： 设置新密码 -->
      <div v-else-if="forgetStep === 2">
        <el-alert
          title="请设置您的新密码"
          type="warning"
          show-icon
          :closable="false"
          style="margin-bottom: 20px"
        />
        <el-form
          ref="forgetForm2"
          :model="forgetForm2"
          :rules="forgetRules2"
          label-width="100px"
        >
          <el-form-item label="新密码" prop="newPassword">
            <el-input
              v-model="forgetForm2.newPassword"
              :type="newPasswordFieldType"
              placeholder="请输入新密码"
            >
              <template slot="append">
                <i
                  :class="
                    newPasswordVisible
                      ? 'el-icon-view'
                      : 'el-icon-remove-outline'
                  "
                  @click="toggleNewPasswordVisibility"
                  style="cursor: pointer"
                  :title="newPasswordVisible ? '隐藏密码' : '显示密码'"
                ></i>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="forgetForm2.confirmPassword"
              :type="confirmPasswordFieldType"
              placeholder="请再次输入新密码"
            >
              <template slot="append">
                <i
                  :class="
                    confirmPasswordVisible
                      ? 'el-icon-view'
                      : 'el-icon-remove-outline'
                  "
                  @click="toggleConfirmPasswordVisibility"
                  style="cursor: pointer"
                  :title="confirmPasswordVisible ? '隐藏密码' : '显示密码'"
                ></i>
              </template>
            </el-input>
          </el-form-item>
        </el-form>
      </div>

      <!-- 第三步：重置成功 -->
      <div v-else-if="forgetStep === 3" style="text-align: center">
        <div style="margin-bottom: 20px">
          <i
            class="el-icon-success"
            style="color: #67c23a; font-size: 60px"
          ></i>
        </div>
        <h3 style="color: #67c23a; margin-bottom: 10px">密码重置成功！</h3>
        <p style="color: #666">您的新密码已设置成功，请使用新密码登录。</p>
        <p style="color: #999; font-size: 12px; margin-top: 10px">
          将在
          <span style="color: #f56c6c">{{ countdown }}</span>
          秒后自动跳转到登录页
        </p>
      </div>

      <span slot="footer" class="dialog-footer">
        <!-- 第一步按钮 -->
        <template v-if="forgetStep === 1">
          <el-button @click="forgetDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="handleForgetStep1"
            :loading="verifying"
          >
            下一步
          </el-button>
        </template>

        <!-- 第二步按钮 -->
        <template v-else-if="forgetStep === 2">
          <el-button @click="forgetStep = 1">上一步</el-button>
          <el-button
            type="primary"
            @click="handleForgetStep2"
            :loading="resetting"
          >
            重置密码
          </el-button>
        </template>

        <!-- 第三步按钮 -->
        <template v-else-if="forgetStep === 3">
          <el-button type="primary" @click="handleForgetComplete"
            >立即登录</el-button
          >
        </template>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { login, verifyIdentity, forgetPassword } from "@/api/user";
import { prepareLoginData, setToken, setUserInfo } from "@/utils/auth";
import { validateUsername, validatePassword } from "@/utils/validate";

export default {
  name: "LoginPage",
  data() {
    // 确认密码验证规则
    const validateConfirmPassword = (rule, value, callback) => {
      if (value === "") {
        callback(new Error("请再次输入密码"));
      } else if (value !== this.forgetForm2.newPassword) {
        callback(new Error("两次输入的密码不一致"));
      } else {
        callback();
      }
    };

    return {
      // 登录表单数据
      loginForm: {
        username: "",
        password: "",
      },

      // 表单验证规则
      loginRules: {
        username: [
          { required: true, validator: validateUsername, trigger: "blur" },
        ],
        password: [
          { required: true, validator: validatePassword, trigger: "blur" },
        ],
      },

      // 忘记密码相关数据
      // 1:验证身份, 2:设置新密码, 3:完成
      forgetStep: 1,
      forgetDialogVisible: false,
      forgetForm1: {
        username: "",
        email: "",
      },
      forgetForm2: {
        newPassword: "",
        confirmPassword: "",
      },

      // 忘记密码表单验证规则
      forgetRules1: {
        username: [
          { required: true, message: "请输入用户名", trigger: "blur" },
        ],
        email: [
          { required: true, message: "请输入邮箱", trigger: "blur" },
          {
            type: "email",
            message: "请输入正确的邮箱地址",
            trigger: ["blur", "change"],
          },
        ],
      },
      forgetRules2: {
        newPassword: [
          { required: true, validator: validatePassword, trigger: "blur" },
        ],
        confirmPassword: [
          {
            required: true,
            validator: validateConfirmPassword,
            trigger: "blur", // 失去焦点时触发验证
          },
        ],
      },

      // 控制变量
      passwordVisible: false, // 密码是否可见
      newPasswordVisible: false, // 新密码是否可见
      confirmPasswordVisible: false, // 确认密码是否可见
      rememberMe: false, // 记住我选项
      loading: false, // 登录按钮加载状态
      verifying: false, // 身份验证中
      resetting: false, // 重置密码中
      countdown: 0,
      countdownInterval: null,
    };
  },

  computed: {
    // 计算属性，动态设置密码框类型
    passwordFieldType() {
      return this.passwordVisible ? "text" : "password";
    },
    newPasswordFieldType() {
      return this.newPasswordVisible ? "text" : "password";
    },
    confirmPasswordFieldType() {
      return this.confirmPasswordVisible ? "text" : "password";
    },

    // 对话框标题
    forgetDialogTitle() {
      const titles = {
        1: "验证身份",
        2: "设置新密码",
        3: "密码重置成功",
      };
      return titles[this.forgetStep];
    },
  },

  created() {
    // 检查是否有记住的用户名
    const savedUsername = localStorage.getItem("rememberedUsername");
    if (savedUsername) {
      this.loginForm.username = savedUsername;
      this.rememberMe = true;
    }

    // 检查URL中是否有重定向参数
    this.checkRedirect();
  },

  beforeDestroy() {
    // 清理倒计时
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  },

  methods: {
    // 切换密码可见性
    togglePasswordVisibility() {
      this.passwordVisible = !this.passwordVisible;
    },

    toggleNewPasswordVisibility() {
      this.newPasswordVisible = !this.newPasswordVisible;
    },

    toggleConfirmPasswordVisibility() {
      this.confirmPasswordVisible = !this.confirmPasswordVisible;
    },

    // 处理登录
    handleLogin() {
      this.$refs.loginForm.validate((valid) => {
        if (valid) {
          this.loading = true;

          // 准备登录数据
          const loginData = prepareLoginData(
            this.loginForm.username,
            this.loginForm.password
          );

          console.log("登录请求数据:", {
            username: loginData.username,
            password: loginData.password,
          });

          // 调用登录API
          login(loginData)
            .then((response) => {
              console.log("登录响应:", response);

              if (response.success) {
                this.$message({
                  message: "登录成功",
                  type: "success",
                  duration: 2000,
                });

                // 保存token和用户信息
                if (response.token) {
                  setToken(response.token);
                }

                // 保存用户信息到Vuex和localStorage
                if (response.user) {
                  console.log("登录成功，保存用户信息:", response.user);

                  // 方法1：直接调用Vuex mutation
                  this.$store.commit("user/SET_USER_INFO", response.user);

                  // 同时保存到utils/auth.js（如果使用的话）
                  if (setUserInfo) {
                    setUserInfo(response.user);
                  }
                }
                // 如果选择了"记住我"，保存用户名
                if (this.rememberMe) {
                  localStorage.setItem(
                    "rememberedUsername",
                    this.loginForm.username
                  );
                } else {
                  localStorage.removeItem("rememberedUsername");
                }

                // 跳转到首页或重定向页面
                this.redirectToTarget(response.user);
              } else {
                this.$message({
                  message: response.message || "登录失败",
                  type: "error",
                  duration: 3000,
                });
              }
            })
            .catch((error) => {
              console.error("登录错误:", error);

              this.$message({
                message:
                  error.response?.data?.message || "密码重置失败，请稍后重试",
                type: "error",
                duration: 3000,
              });
            })
            .finally(() => {
              this.loading = false;
            });
        } else {
          this.$message({
            message: "请填写正确的登录信息",
            type: "warning",
          });
          return false;
        }
      });
    },

    // 跳转到注册页面
    goToRegister() {
      this.$router.push("/register");
    },

    // 处理忘记密码
    handleForgetPassword() {
      this.forgetDialogVisible = true;
      this.forgetStep = 1;
    },
    // 忘记密码对话框关闭
    handleForgetClose() {
      // 重置所有表单和状态
      this.forgetStep = 1;
      this.forgetForm1 = { username: "", email: "" };
      this.forgetForm2 = { newPassword: "", confirmPassword: "" };
      this.verifying = false;
      this.resetting = false;
      this.countdown = 0;

      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }

      // 清除表单验证
      if (this.$refs.forgetForm1) {
        this.$refs.forgetForm1.clearValidate();
      }
      if (this.$refs.forgetForm2) {
        this.$refs.forgetForm2.clearValidate();
      }
    },

    // 步骤1：验证身份
    handleForgetStep1() {
      this.$refs.forgetForm1.validate((valid) => {
        if (valid) {
          this.verifying = true;

          // 调用API验证身份
          verifyIdentity({
            username: this.forgetForm1.username,
            email: this.forgetForm1.email,
          })
            .then((response) => {
              if (response.success) {
                this.$message({
                  message: "身份验证成功",
                  type: "success",
                  duration: 2000,
                });

                // 进入下一步
                this.forgetStep = 2;
              } else {
                this.$message({
                  message:
                    response.message || "用户名和邮箱不匹配，请检查后重试",
                  type: "error",
                  duration: 3000,
                });
              }
            })
            .catch((error) => {
              console.error("验证身份错误:", error);
              this.$message({
                message: "身份验证失败，请稍后重试",
                type: "error",
                duration: 3000,
              });
            })
            .finally(() => {
              this.verifying = false;
            });
        }
      });
    },

    // 步骤2：重置密码
    handleForgetStep2() {
      this.$refs.forgetForm2.validate((valid) => {
        if (valid) {
          this.resetting = true;

          // 准备请求数据
          const requestData = {
            username: this.forgetForm1.username,
            email: this.forgetForm1.email,
            newPassword: this.forgetForm2.newPassword,
          };
          console.log("忘记密码请求数据:", requestData);
          // 调用API重置密码
          forgetPassword(requestData)
            .then((response) => {
              if (response.success) {
                // 进入完成步骤
                this.forgetStep = 3;

                // 开始自动跳转倒计时
                this.countdown = 3;
                this.startCountdownForRedirect();
              } else {
                this.$message({
                  message: response.message || "密码重置失败",
                  type: "error",
                  duration: 3000,
                });
              }
            })
            .catch((error) => {
              console.error("重置密码错误:", error);

              this.$message({
                message: "密码重置失败，请稍后重试",
                type: "error",
                duration: 3000,
              });
            })
            .finally(() => {
              this.resetting = false;
            });
        }
      });
    },

    // 开始自动跳转倒计时
    startCountdownForRedirect() {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }

      this.countdownInterval = setInterval(() => {
        if (this.countdown <= 1) {
          clearInterval(this.countdownInterval);
          this.countdownInterval = null;
          this.handleForgetComplete();
        } else {
          this.countdown--;
        }
      }, 1000);
    },

    // 完成重置，跳转到登录
    handleForgetComplete() {
      this.forgetDialogVisible = false;
      this.$message({
        message: "密码重置成功，请使用新密码登录",
        type: "success",
        duration: 3000,
      });

      // 清空登录表单的密码
      this.loginForm.password = "";

      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
    },

    // 检查重定向
    checkRedirect() {
      const redirect = this.$route.query.redirect;
      if (redirect && redirect !== "/login") {
        this.$message({
          message: "请先登录",
          type: "warning",
        });
      }
    },

    // 跳转特定角色页面
    redirectToTarget(user) {
      let redirectPath = "";

      // 根据用户角色决定跳转路径
      if (user.role === "admin") {
        redirectPath = "/admin";
      } else {
        redirectPath = "/home";
      }

      console.log(`用户角色: ${user.role}, 跳转到: ${redirectPath}`);

      // 这里要实际执行跳转
      this.$router.push(redirectPath).catch(() => {
        // 如果路由跳转失败，刷新页面
        window.location.href = redirectPath;
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.login-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  .login-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: url("~@/assets/images/login-bg.png") no-repeat center center;
    background-size: cover;
    opacity: 0.5;
  }

  .login-box {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 420px;
    padding: 40px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 10px;
    box-shadow: 0 15px 35px rgba(50, 50, 93, 0.1),
      0 5px 15px rgba(0, 0, 0, 0.07);

    .login-header {
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

    .login-form {
      .login-options {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;

        ::v-deep .el-checkbox__label {
          color: #666;
        }
      }

      .login-btn {
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

      .register-link {
        text-align: center;
        margin-top: 20px;
        color: #666;

        .el-link {
          margin-left: 5px;
        }
      }
    }
  }
}

// 响应式设计
@media screen and (max-width: 768px) {
  .login-container {
    .login-box {
      width: 90%;
      padding: 30px 20px;

      .login-header {
        .logo {
          h1 {
            font-size: 20px;
          }
        }
      }
    }
  }
}

// 动画效果
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
