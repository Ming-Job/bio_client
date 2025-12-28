<template>
  <div class="user-management">
    <h2>用户管理</h2>

    <!-- 筛选工具栏 用户角色 用户状态 姓名 -->
    <div class="filter-toolbar">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="角色筛选">
          <el-select
            v-model="filterForm.role"
            placeholder="请选择角色"
            clearable
            @change="handleFilterChange"
          >
            <el-option label="全部" value=""></el-option>
            <el-option label="管理员" value="admin"></el-option>
            <el-option label="教师" value="teacher"></el-option>
            <el-option label="学生" value="student"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="状态筛选">
          <el-select
            v-model="filterForm.status"
            placeholder="请选择状态"
            clearable
            @change="handleFilterChange"
          >
            <el-option label="全部" value=""></el-option>
            <el-option label="启用" value="1"></el-option>
            <el-option label="禁用" value="0"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="用户名">
          <el-input
            v-model="filterForm.username"
            placeholder="请输入用户名"
            clearable
            @keyup.enter.native="handleFilterChange"
            @clear="handleFilterChange"
          >
            <el-button
              slot="append"
              icon="el-icon-search"
              @click="handleFilterChange"
            ></el-button>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button @click="handleResetFilter">重置</el-button>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleAdd"> 新增 </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 批量操作工具栏 批量删除 批量启用 批量禁用 -->
    <div v-if="selectedUsers.length > 0" class="batch-toolbar">
      <div class="batch-content">
        <div class="batch-left">
          <i class="el-icon-check batch-icon"></i>
          <span class="batch-info"
            >已选择 <strong>{{ selectedUsers.length }}</strong> 个用户</span
          >
        </div>
        <div class="batch-actions">
          <el-button
            type="danger"
            size="small"
            @click="handleBatchDelete"
            :loading="batchLoading"
            :disabled="batchLoading"
            plain
            icon="el-icon-delete"
          >
            批量删除
          </el-button>
          <el-button
            type="success"
            size="small"
            @click="handleBatchEnable"
            :loading="batchLoading"
            :disabled="batchLoading"
            plain
            icon="el-icon-check"
          >
            批量启用
          </el-button>
          <el-button
            type="warning"
            size="small"
            @click="handleBatchDisable"
            :loading="batchLoading"
            :disabled="batchLoading"
            plain
            icon="el-icon-close"
          >
            批量禁用
          </el-button>
          <el-button
            size="small"
            @click="clearSelection"
            :disabled="batchLoading"
            plain
            icon="el-icon-close"
          >
            取消选择
          </el-button>
        </div>
      </div>
    </div>

    <!-- 用户表格 -->
    <el-table
      ref="userTable"
      :data="userList"
      style="width: 100%; margin-top: 10px"
      border
      height="calc(100vh - 280px)"
      class="user-table"
      @selection-change="handleSelectionChange"
    >
      <!-- 添加选框列 -->
      <el-table-column
        type="selection"
        width="55"
        align="center"
        :selectable="isSelectable"
      >
      </el-table-column>

      <el-table-column
        type="index"
        label="序号"
        width="80"
        :index="calculateIndex"
      >
      </el-table-column>

      <el-table-column prop="avatar" label="头像" width="100" align="center">
        <template slot-scope="scope">
          <div style="display: flex; justify-content: center">
            <el-avatar
              :size="40"
              :src="getRealAvatarUrl(scope.row.avatar)"
              :alt="scope.row.username"
            ></el-avatar>
          </div>
        </template>
      </el-table-column>

      <el-table-column
        prop="username"
        label="用户名"
        min-width="150"
      ></el-table-column>
      <el-table-column prop="role" label="角色" width="120">
        <template slot-scope="scope">
          <el-tag :type="getRoleTagType(scope.row.role)">
            {{ getRoleDisplayName(scope.row.role) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="email"
        label="邮箱"
        min-width="200"
      ></el-table-column>
      <el-table-column
        prop="phone"
        label="手机号"
        width="120"
      ></el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template slot-scope="scope">
          <el-tag
            :type="
              scope.row.status === '1' || scope.row.status === 1
                ? 'success'
                : 'danger'
            "
          >
            {{
              scope.row.status === "1" || scope.row.status === 1
                ? "启用"
                : "禁用"
            }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="createTime"
        label="创建时间"
        width="180"
      ></el-table-column>
      <el-table-column prop="lastLoginTime" label="最后登录" width="180">
        <template slot-scope="scope">
          {{ scope.row.lastLoginTime || "从未登录" }}
        </template>
      </el-table-column>
      <el-table-column
        prop="updateTime"
        label="更新时间"
        width="180"
      ></el-table-column>

      <!-- 操作列 - 这里包含编辑和删除按钮 -->
      <el-table-column label="操作" width="150" fixed="right" align="center">
        <template slot-scope="scope">
          <!-- 详情按钮 -->
          <el-button
            type="success"
            size="mini"
            icon="el-icon-view"
            circle
            @click="handleViewDetail(scope.row)"
            title="详情"
          >
          </el-button>

          <!-- 编辑按钮 -->
          <el-button
            type="primary"
            size="mini"
            icon="el-icon-edit"
            circle
            @click="handleEdit(scope.row)"
            title="编辑"
          >
          </el-button>

          <!-- 删除按钮 -->
          <el-button
            type="danger"
            size="mini"
            icon="el-icon-delete"
            circle
            @click="handleDelete(scope.row)"
            title="删除"
          >
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <div style="margin-top: 20px; display: flex; justify-content: flex-end">
      <el-pagination
        layout="total, sizes, prev, pager, next, jumper"
        :current-page="pagination.current"
        :page-size="pagination.size"
        :page-sizes="[10, 20, 30, 50]"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="600px"
      @close="resetForm"
    >
      <el-form
        :model="formData"
        :rules="formRules"
        ref="userForm"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="formData.username"
            placeholder="请输入用户名"
          ></el-input>
        </el-form-item>

        <!-- ========== 只在编辑模式下显示头像上传 ========== -->
        <el-form-item label="用户头像" prop="avatar" v-if="!isAddMode">
          <el-upload
            class="avatar-uploader"
            action="javascript:void(0)"
            :show-file-list="false"
            :before-upload="beforeAvatarUpload"
            :http-request="handleAvatarUpload"
            :disabled="submitting || uploadingAvatar"
          >
            <!-- 头像容器（新增提示层） -->
            <div class="avatar-container">
              <img v-if="avatarUrl" :src="avatarUrl" class="avatar" />
              <i v-else class="el-icon-plus avatar-uploader-icon"></i>
              <!-- 鼠标hover时显示的+提示 -->
              <div class="avatar-tip" v-if="!submitting && !uploadingAvatar">
                <i class="el-icon-plus"></i>
              </div>
            </div>
            <div slot="tip" class="el-upload__tip">
              只能上传jpg/png文件，且不超过2MB
            </div>
          </el-upload>
        </el-form-item>

        <!-- 密码字段 - 新增模式显示 -->
        <el-form-item label="密码" prop="password" v-if="isAddMode">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            show-password
          ></el-input>
        </el-form-item>

        <!-- 确认密码字段 - 只在新增模式显示 -->
        <el-form-item label="确认密码" prop="confirmPassword" v-if="isAddMode">
          <el-input
            v-model="formData.confirmPassword"
            type="password"
            placeholder="请确认密码"
            show-password
          ></el-input>
        </el-form-item>

        <!-- 密码字段 - 编辑模式显示（可选修改） -->
        <el-form-item label="密码" prop="editPassword" v-if="!isAddMode">
          <el-input
            v-model="formData.editPassword"
            type="password"
            placeholder="如不修改密码请留空"
            show-password
          ></el-input>
        </el-form-item>

        <el-form-item label="角色" prop="role">
          <el-select
            v-model="formData.role"
            placeholder="请选择角色"
            style="width: 100%"
          >
            <el-option label="管理员" value="admin"></el-option>
            <el-option label="教师" value="teacher"></el-option>
            <el-option label="学生" value="student"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="formData.email"
            placeholder="请输入邮箱"
          ></el-input>
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="formData.phone"
            placeholder="请输入手机号"
          ></el-input>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio label="1">启用</el-radio>
            <el-radio label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </span>
    </el-dialog>

    <!-- 用户详情对话框 -->
    <UserDetailDialog
      :visible.sync="detailDialogVisible"
      :user="currentDetailUser"
      @close="detailDialogVisible = false"
    />
  </div>
</template>

<script>
import {
  getUserPage,
  addUser,
  updateUser,
  deleteUser,
  batchDeleteUsers,
  batchUpdateUserStatus,
} from "@/api/user";
// 导入头像上传接口
import { updateUserAvatar } from "@/api/user";
// 导入认证工具
import { getAvatarUrl, getUserInfo, getUserId, clearAuth } from "@/utils/auth";
// 导入用户详情组件
import UserDetailDialog from "@/components/user/UserDetailDialog.vue";

export default {
  name: "UserManagement",
  components: {
    UserDetailDialog,
  },
  data() {
    // 密码验证规则
    const passwordValidator = (rule, value, callback) => {
      // 新增模式下，密码必须填写且至少6位
      if (this.isAddMode) {
        if (!value || value.trim() === "") {
          callback(new Error("请输入密码"));
        } else if (value.length < 6) {
          callback(new Error("密码长度至少6个字符"));
        } else {
          callback();
        }
      } else {
        // 编辑模式下，密码可以为空，但如果填写了则必须至少6位
        if (value && value.trim() !== "" && value.length < 6) {
          callback(new Error("密码长度至少6个字符"));
        } else {
          callback();
        }
      }
    };

    // 确认密码验证规则
    const confirmPasswordValidator = (rule, value, callback) => {
      if (this.isAddMode) {
        if (!value || value.trim() === "") {
          callback(new Error("请确认密码"));
        } else if (value !== this.formData.password) {
          callback(new Error("两次输入的密码不一致"));
        } else {
          callback();
        }
      } else {
        callback();
      }
    };

    return {
      userList: [],
      dialogVisible: false,
      detailDialogVisible: false,
      dialogTitle: "新增用户",
      isAddMode: true,
      submitting: false,
      selectedUsers: [], // 多选用户列表
      batchLoading: false, // 批量操作加载状态
      currentDetailUser: null, // 当前查看详情的用户
      // 筛选相关
      filterForm: {
        role: "",
        status: "",
        username: "",
        email: "",
        phone: "",
        createTimeRange: [],
      },
      isAdvancedFilter: false,
      pagination: {
        current: 1,
        size: 10,
        total: 0,
      },
      formData: {
        id: null,
        username: "",
        password: "", // 新增模式密码
        confirmPassword: "", // 新增模式确认密码
        editPassword: "", // 编辑模式密码（可选修改）
        role: "",
        email: "",
        phone: "",
        status: "1",
        avatar: "", // 头像路径
      },
      formRules: {
        username: [
          { required: true, message: "请输入用户名", trigger: "blur" },
          {
            min: 3,
            max: 20,
            message: "用户名长度在3到20个字符之间",
            trigger: "blur",
          },
        ],
        password: [
          {
            required: true,
            message: "请输入密码",
            trigger: "blur",
            validator: passwordValidator,
          },
        ],
        confirmPassword: [
          {
            required: true,
            message: "请确认密码",
            trigger: "blur",
            validator: confirmPasswordValidator,
          },
        ],
        editPassword: [
          {
            required: false,
            trigger: "blur",
            validator: passwordValidator,
          },
        ],
        role: [{ required: true, message: "请选择角色", trigger: "change" }],
        email: [
          { required: true, message: "请输入邮箱地址", trigger: "blur" },
          { type: "email", message: "请输入正确的邮箱地址", trigger: "blur" },
        ],
        phone: [
          { required: true, message: "请输入手机号", trigger: "blur" },
          {
            pattern: /^1[3-9]\d{9}$/,
            message: "请输入正确的手机号",
            trigger: "blur",
          },
        ],
        avatar: [{ required: false }],
      },
      currentUser: null,
      // 头像相关变量（只在编辑模式使用）
      avatarUrl: "", // 头像预览URL
      uploadingAvatar: false, // 头像上传加载状态
    };
  },
  mounted() {
    console.log("开始加载...");
    this.fetchUsers();
    this.localCurrentUserInfo();
  },
  methods: {
    // 当前登录的用户信息
    localCurrentUserInfo() {
      this.currentUser = getUserInfo();
      console.log("当前登录的用户: ", this.currentUser);
    },

    // 获取用户数据（带筛选）
    fetchUsers() {
      const params = {
        pageNum: this.pagination.current,
        pageSize: this.pagination.size,
        ...this.buildFilterParams(),
      };

      console.log("请求参数:", params);

      getUserPage(params)
        .then((response) => {
          console.log("API返回数据:", response);
          this.userList = response.records || [];
          this.pagination.total = response.total || 0;
        })
        .catch((error) => {
          console.error("获取用户列表失败:", error);
          this.$message.error("获取用户列表失败");
        });
    },

    // 构建筛选参数
    buildFilterParams() {
      const params = {};

      // 角色筛选
      if (this.filterForm.role) {
        params.role = this.filterForm.role;
      }

      // 状态筛选
      if (this.filterForm.status !== "") {
        params.status = this.filterForm.status;
      }

      // 用户名筛选
      if (this.filterForm.username) {
        params.username = this.filterForm.username;
      }

      return params;
    },

    // 筛选条件变化处理
    handleFilterChange() {
      // 重置到第一页
      this.pagination.current = 1;
      // 重新加载数据
      this.fetchUsers();
    },

    // 重置筛选条件
    handleResetFilter() {
      this.filterForm = {
        role: "",
        status: "",
        username: "",
        email: "",
        phone: "",
        createTimeRange: [],
      };
      this.isAdvancedFilter = false;
      // 重置到第一页并重新加载
      this.pagination.current = 1;
      this.fetchUsers();
    },

    // 计算序号
    calculateIndex(index) {
      return (this.pagination.current - 1) * this.pagination.size + index + 1;
    },

    // 获取头像完整URL
    getRealAvatarUrl(avatar) {
      return getAvatarUrl(avatar);
    },

    // 获取角色显示名称
    getRoleDisplayName(role) {
      const roleMap = {
        admin: "管理员",
        teacher: "教师",
        student: "学生",
      };
      return roleMap[role] || role;
    },

    // 获取角色标签类型
    getRoleTagType(role) {
      const typeMap = {
        admin: "danger",
        teacher: "warning",
        student: "success",
      };
      return typeMap[role] || "info";
    },

    // 分页事件处理
    handleSizeChange(size) {
      this.pagination.size = size;
      this.pagination.current = 1;
      this.fetchUsers();
    },

    // 页码变化处理
    handleCurrentChange(current) {
      this.pagination.current = current;
      this.fetchUsers();
    },

    // 查看用户详情
    handleViewDetail(row) {
      console.log("查看用户详情:", row);
      this.currentDetailUser = { ...row }; // 创建副本避免数据污染
      this.detailDialogVisible = true;
    },

    // 新增用户
    handleAdd() {
      this.dialogTitle = "新增用户";
      this.isAddMode = true;
      this.dialogVisible = true;
      this.resetForm();

      // 清除验证状态
      this.$nextTick(() => {
        if (this.$refs.userForm) {
          this.$refs.userForm.clearValidate();
        }
      });
    },

    // 编辑用户
    handleEdit(row) {
      this.dialogTitle = "编辑用户";
      this.isAddMode = false;
      this.dialogVisible = true;

      console.log("编辑行数据：", row);

      // 确保正确映射后端返回的字段
      this.formData = {
        id: row.id || null,
        username: row.username || "",
        password: "", // 新增模式字段，编辑模式不需要
        confirmPassword: "", // 新增模式字段，编辑模式不需要
        editPassword: "", // 编辑模式密码字段，默认为空
        role: row.role || "",
        email: row.email || "",
        phone: row.phone || "",
        status: row.status != null ? `${row.status}` : "1",
        avatar: row.avatar || "", // 加载用户现有头像
      };

      // 加载头像预览（只在编辑模式）
      this.avatarUrl = this.getRealAvatarUrl(row.avatar);

      console.log("表单数据: ", this.formData);

      // 清除表单验证状态
      this.$nextTick(() => {
        if (this.$refs.userForm) {
          this.$refs.userForm.clearValidate();
        }
      });
    },

    // 删除用户
    handleDelete(row) {
      console.log("删除用户:", row);

      // 检查是否删除当前登录用户
      const currentUserId = getUserId();
      const isSelf = row.id === currentUserId;

      let message = "确定要删除该用户吗？";
      if (isSelf) {
        message =
          "警告：您正在删除自己的账户！删除后将无法登录，确定要继续吗？";
      }

      this.$confirm(message, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: isSelf ? "error" : "warning",
        confirmButtonClass: isSelf ? "delete-self-confirm" : "",
        cancelButtonClass: isSelf ? "delete-self-cancel" : "",
      })
        .then(() => {
          // 调用删除API
          deleteUser(row.id)
            .then((response) => {
              console.log("删除成功:", response);
              this.$message.success("删除成功");

              // 删除成功后的处理
              if (isSelf) {
                // 如果删除的是当前用户自己，强制退出登录
                this.$alert("您的账户已被删除，系统将退出登录", "账户已删除", {
                  confirmButtonText: "确定",
                  showCancelButton: false,
                  closeOnClickModal: false,
                  closeOnPressEscape: false,
                  type: "warning",
                  callback: () => {
                    this.forceLogout();
                  },
                });
              } else {
                // 重新加载用户列表
                this.fetchUsers();
              }
            })
            .catch((error) => {
              console.error("删除失败:", error);

              // 显示详细的错误信息
              let errorMessage = "删除失败";
              if (
                error.response &&
                error.response.data &&
                error.response.data.message
              ) {
                errorMessage = error.response.data.message;
              } else if (error.message) {
                errorMessage = error.message;
              }

              this.$message.error(errorMessage);
            });
        })
        .catch(() => {
          // 用户取消删除
          this.$message.info("已取消删除");
        });
    },

    // 头像上传前置校验
    beforeAvatarUpload(file) {
      const isJPG = file.type === "image/jpeg" || file.type === "image/png";
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isJPG) {
        this.$message.error("头像图片只能是 JPG/PNG 格式!");
        return false;
      }
      if (!isLt2M) {
        this.$message.error("头像图片大小不能超过 2MB!");
        return false;
      }

      return true;
    },

    // 处理头像上传（只在编辑模式使用）
    handleAvatarUpload(options) {
      const file = options.file;
      this.uploadingAvatar = true;

      // 构建FormData
      const formData = new FormData();
      formData.append("avatar", file);
      formData.append("userId", this.formData.id); // 使用当前编辑的用户ID

      updateUserAvatar(formData)
        .then((response) => {
          if (response.code === 200) {
            this.avatarUrl = this.getRealAvatarUrl(response.data);
            this.formData.avatar = response.data;
            this.$message.success("头像上传成功！");
          } else {
            this.$message.error(response.message || "头像上传失败");
          }
        })
        .catch((error) => {
          console.error("头像上传失败:", error);
          this.$message.error("头像上传失败，请重试");
        })
        .finally(() => {
          this.uploadingAvatar = false;
        });
    },

    // 提交表单（新增/编辑）
    handleSubmit() {
      this.$refs.userForm.validate((valid) => {
        if (valid) {
          this.submitting = true;

          // 准备提交数据
          const submitData = {
            username: this.formData.username,
            role: this.formData.role,
            email: this.formData.email,
            phone: this.formData.phone,
            status: this.formData.status,
          };

          let isCurrentUserPasswordChange = false;

          if (this.isAddMode) {
            // 新增模式：添加密码
            submitData.password = this.formData.password;
            // 新增模式不需要上传头像
          } else {
            // 编辑模式：添加ID和头像
            submitData.id = this.formData.id;
            submitData.avatar = this.formData.avatar; // 包含头像路径

            // 如果有填写新密码，则添加
            if (
              this.formData.editPassword &&
              this.formData.editPassword.trim() !== ""
            ) {
              submitData.password = this.formData.editPassword;

              //判断是否为当前登录的账户
              const currentUserId = getUserId();
              if (currentUserId && this.formData.id === currentUserId) {
                isCurrentUserPasswordChange = true;
              }
            }
          }

          console.log("准备提交的数据:", submitData);

          // 根据模式调用不同的API
          const apiCall = this.isAddMode
            ? addUser(submitData)
            : updateUser(submitData);

          apiCall
            .then((response) => {
              console.log("API响应的数据：", response);

              this.$message.success(this.isAddMode ? "新增成功" : "更新成功");
              this.dialogVisible = false;

              // 如果是新增，重置到第一页显示最新的数据
              if (this.isAddMode) {
                this.pagination.current = 1;
              }

              // 重新加载用户列表
              this.fetchUsers();

              // 如果是当前用户修改了密码，强制重新登录
              if (isCurrentUserPasswordChange) {
                this.$alert(
                  "您的密码已修改，为了账户安全，请重新登录！",
                  "密码已修改",
                  {
                    confirmButtonText: "重新登录",
                    showCancelButton: false,
                    closeOnClickModal: false,
                    closeOnPressEscape: false,
                    callback: () => {
                      this.forceLogout();
                    },
                  }
                );
              }
            })
            .catch((error) => {
              console.error("操作失败:", error);
              // 显示更详细的错误信息
              if (
                error.response &&
                error.response.data &&
                error.response.data.message
              ) {
                this.$message.error(error.response.data.message);
              } else if (error.message) {
                this.$message.error(error.message);
              } else {
                this.$message.error("操作失败");
              }
            })
            .finally(() => {
              this.submitting = false;
            });
        } else {
          console.log("表单验证失败");
          return false;
        }
      });
    },

    // 强制退出登录
    forceLogout() {
      // 清除所有认证信息
      clearAuth();

      // 如果使用Vuex，清除用户状态
      if (this.$store && this.$store.commit) {
        this.$store.commit("user/SET_TOKEN", "");
        this.$store.commit("user/SET_USER_INFO", null);
      }

      // 跳转到登录页面
      this.$router.push("/login");

      // 显示提示信息
      this.$message({
        type: "info",
        message: "请使用新密码重新登录",
      });
    },

    // 重置表单
    resetForm() {
      if (this.$refs.userForm) {
        this.$refs.userForm.resetFields();
      }
      this.formData = {
        id: null,
        username: "",
        password: "", // 新增模式密码
        confirmPassword: "", // 新增模式确认密码
        editPassword: "", // 编辑模式密码（可选修改）
        role: "",
        email: "",
        phone: "",
        status: "1",
        avatar: "", // 重置头像路径
      };

      // 重置头像相关变量
      this.avatarUrl = "";
      this.uploadingAvatar = false;
    },

    // 多选框选择变化事件
    handleSelectionChange(selection) {
      this.selectedUsers = selection;
      console.log("选中的用户：", this.selectedUsers);
    },

    // 检查用户是否可选（防止选择当前登录用户）
    isSelectable(row) {
      const currentUserId = getUserId();
      // 如果用户是当前登录用户，则不可选（防止删除，禁用自己）
      return row.id !== currentUserId;
    },

    // 批量启用
    handleBatchEnable() {
      this.batchUpdateStatus("1", "启用");
    },

    // 批量禁用
    handleBatchDisable() {
      this.batchUpdateStatus("0", "禁用");
    },

    // 清空选择方法优化
    clearSelection() {
      if (this.$refs.userTable) {
        this.$refs.userTable.clearSelection();
      }
      this.selectedUsers = [];
    },

    // 批量更新用户状态
    batchUpdateStatus(status, statusText) {
      if (this.selectedUsers.length === 0) {
        this.$message.warning("请先选择用户");
        return;
      }

      // 检查是否包含当前用户
      const currentUserId = getUserId();
      const containsSelf = this.selectedUsers.some(
        (user) => user.id === currentUserId
      );

      if (containsSelf && status === "0") {
        this.$message.warning("不能禁用当前登录的用户，请先取消选择");
        return;
      }

      const userIds = this.selectedUsers.map((user) => user.id);
      const usernames = this.selectedUsers
        .map((user) => user.username)
        .join("、");

      const dialogType = status === "1" ? "success" : "warning";
      const icon = status === "1" ? "el-icon-success" : "el-icon-warning";

      this.$confirm(
        `<div>
      <p style="font-size: 16px; margin-bottom: 8px; color: ${
        status === "1" ? "#67c23a" : "#e6a23c"
      };">
        <el-icon><${icon} /></el-icon>
        确定要${statusText}选中的 ${this.selectedUsers.length} 个用户吗？
      </p>
      <p style="color: #606266; margin-bottom: 10px;">${statusText}以下用户：</p>
      <div style="background: #f5f7fa; padding: 10px; border-radius: 4px; max-height: 150px; overflow-y: auto;">
        ${usernames}
      </div>
    </div>`,
        `批量${statusText}确认`,
        {
          confirmButtonText: `确定${statusText}`,
          cancelButtonText: "取消",
          type: dialogType,
          dangerouslyUseHTMLString: true,
          customClass: `batch-${statusText}-dialog`,
          confirmButtonClass: `batch-${statusText}-confirm`,
        }
      )
        .then(() => {
          this.batchLoading = true;

          // 调用批量更新API - 注意这里传递的是 params 而不是 data
          batchUpdateUserStatus({
            ids: userIds, // 数组形式
            status: status, // 注意：后端接收的是 Integer，这里传数字类型
          })
            .then((response) => {
              // 根据后端返回的数据结构调整
              const successMessage =
                response.data?.message || `批量${statusText}成功`;
              this.$message.success({
                message: successMessage,
                duration: 2000,
              });
              this.fetchUsers();
              this.clearSelection();
            })
            .catch((error) => {
              console.error(`批量${statusText}失败:`, error);
              let errorMessage = `批量${statusText}失败`;
              if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
              }
              this.$message.error(errorMessage);
            })
            .finally(() => {
              this.batchLoading = false;
            });
        })
        .catch(() => {
          this.$message.info(`已取消批量${statusText}`);
        });
    },

    // 批量删除用户
    handleBatchDelete() {
      if (this.selectedUsers.length === 0) {
        this.$message.warning("请选择用户");
        return;
      }

      // 检查是否包含当前用户
      const currentUserId = getUserId();
      const containsSelf = this.selectedUsers.some(
        (user) => user.id === currentUserId
      );

      if (containsSelf) {
        this.$message.warning("不能删除当前登录的用户，请先取消选择");
        return;
      }

      const userIds = this.selectedUsers.map((user) => user.id);
      const usernames = this.selectedUsers
        .map((user) => user.username)
        .join("、");

      this.$confirm(
        `<div>
          <p style="font-size: 16px; margin-bottom: 8px; color: #f56c6c;">
            <el-icon><el-icon-warning /></el-icon>
            确定要删除选中的 ${this.selectedUsers.length} 个用户吗？
          </p>
          <p style="color: #606266; margin-bottom: 10px;">这将永久删除以下用户：</p>
          <div style="background: #f5f7fa; padding: 10px; border-radius: 4px; max-height: 150px; overflow-y: auto;">
            ${usernames}
          </div>
        </div>`,
        "批量删除确认",
        {
          confirmButtonText: "确定删除",
          cancelButtonText: "取消",
          type: "warning",
          dangerouslyUseHTMLString: true,
          customClass: "batch-delete-dialog",
          confirmButtonClass: "batch-delete-confirm",
          cancelButtonClass: "batch-delete-cancel",
        }
      )
        .then(() => {
          this.batchLoading = true;

          // 调用批量删除API
          batchDeleteUsers({ ids: userIds })
            .then(() => {
              this.$message.success({
                message: `成功删除 ${this.selectedUsers.length} 个用户`,
                duration: 2000,
              });
              this.fetchUsers();
              this.clearSelection();
            })
            .catch((error) => {
              console.error("批量删除失败:", error);
              let errorMessage = "批量删除失败";
              if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
              }
              this.$message.error(errorMessage);
            })
            .finally(() => {
              this.batchLoading = false;
            });
        })
        .catch(() => {
          this.$message.info("已取消批量删除");
        });
    },
  },
};
</script>

<style lang="scss" scoped>
.user-management {
  padding: 20px 20px 5px 20px;
  height: 100%;
  display: flex;
  flex-direction: column;

  h2 {
    margin: 0 0 16px 0;
    padding: 0;
    font-size: 24px;
    font-weight: 600;
    color: #303133;
    position: relative;

    &::after {
      content: "";
      position: absolute;
      bottom: -8px;
      left: 0;
      width: 47px;
      height: 4px;
      background: linear-gradient(135deg, #409eff 0%, #1890ff 100%);
      border-radius: 2px;
    }
  }
}

/* 筛选工具栏样式 */
.filter-toolbar {
  margin-top: 20px;
  padding: 16px;
  border-radius: 8px;
  background: linear-gradient(135deg, #f6f9ff 0%, #f0f7ff 100%);
  border: 1px solid #e1e9ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  .filter-form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;

    .el-form-item {
      margin-bottom: 0;

      .el-input,
      .el-select {
        width: 200px;

        .el-input__inner {
          border-radius: 6px;
          border: 1px solid #dcdfe6;
          transition: all 0.3s;

          &:hover {
            border-color: #c0c4cc;
          }

          &:focus {
            border-color: #409eff;
            box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
          }
        }
      }

      .el-button {
        border-radius: 6px;
        font-weight: 500;
        transition: all 0.3s;
        padding: 10px 16px;

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        &:active {
          transform: translateY(0);
        }

        &[type="primary"] {
          background: linear-gradient(135deg, #409eff 0%, #1890ff 100%);
          border: none;

          &:hover {
            background: linear-gradient(135deg, #66b1ff 0%, #409eff 100%);
            box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
          }
        }
      }
    }
  }
}

/* 批量操作工具栏样式 */
.batch-toolbar {
  margin: 15px 0 10px 0;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f0f4ff 0%, #e8f4ff 100%);
  border: 1px solid #d0e3ff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
  animation: slideDown 0.3s ease-out;

  .batch-content {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .batch-left {
      display: flex;
      align-items: center;
      gap: 10px;

      .batch-icon {
        color: #409eff;
        font-size: 18px;
        background: white;
        padding: 4px;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(64, 158, 255, 0.2);
      }

      .batch-info {
        font-size: 14px;
        color: #409eff;

        strong {
          color: #1890ff;
          font-weight: 600;
          margin: 0 3px;
        }
      }
    }

    .batch-actions {
      display: flex;
      gap: 8px;

      .el-button {
        border-radius: 6px;
        font-weight: 500;
        transition: all 0.3s;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        &:active {
          transform: translateY(0);
        }

        .el-icon {
          margin-right: 4px;
        }
      }
    }
  }
}

/* 确保表格滚动正常工作 */
.user-table {
  margin-top: 16px;
}

/* 表格样式 - 修复 :deep() 语法错误 */
::v-deep .user-table .el-table {
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

::v-deep .user-table .el-table__header-wrapper {
  position: sticky;
  top: 0;
  z-index: 2;
  background: linear-gradient(135deg, #f8faff 0%, #f0f7ff 100%);
}

::v-deep .user-table .el-table__header-wrapper th {
  background: transparent;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #409eff;
}

::v-deep .user-table .el-table__header-wrapper .cell {
  color: #2c3e50;
  font-weight: 600;
}

::v-deep .user-table .el-table__body-wrapper {
  overflow-y: auto;
  overflow-x: auto;
}

::v-deep .user-table .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::v-deep .user-table .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::v-deep .user-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::v-deep .user-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

::v-deep .user-table .el-table__body {
  min-width: 100%;
}

::v-deep .user-table .el-table__body tr {
  transition: background-color 0.2s;
}

::v-deep .user-table .el-table__body tr:hover {
  background-color: #f5f9ff !important;
}

::v-deep .user-table .el-table__body tr.current-row {
  background-color: #e8f4ff !important;
}

::v-deep .user-table .el-table__body td .cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 操作按钮样式 */
::v-deep .el-button--mini.is-circle {
  width: 28px;
  height: 28px;
  transition: all 0.3s;
}

::v-deep .el-button--mini.is-circle:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 角色标签样式 */
::v-deep .el-tag {
  margin: 2px;
  border-radius: 4px;
}

/* 分页组件样式 */
.el-pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

::v-deep .el-pagination {
  padding: 16px 0;
}

::v-deep .el-pagination .el-pager li {
  border-radius: 4px;
  margin: 0 4px;
}

::v-deep .el-pagination .el-pager li.active {
  background: linear-gradient(135deg, #409eff 0%, #1890ff 100%);
  color: white;
}

::v-deep .el-pagination .el-pager li:not(.active):hover {
  color: #409eff;
}

::v-deep .el-pagination .el-pagination__jump .el-input__inner {
  border-radius: 4px;
}

::v-deep .el-pagination .el-pagination__jump .el-input__inner:focus {
  border-color: #409eff;
}

/* 对话框样式 */
::v-deep .el-dialog {
  border-radius: 8px;
}

::v-deep .el-dialog .el-dialog__header {
  padding: 20px 20px 10px;
  border-bottom: 1px solid #e8eaec;
}

::v-deep .el-dialog .el-dialog__header .el-dialog__title {
  font-weight: 600;
  color: #303133;
}

::v-deep .el-dialog .el-dialog__body {
  padding: 20px;
}

::v-deep .el-dialog .el-dialog__footer {
  padding: 10px 20px 20px;
  border-top: 1px solid #e8eaec;
}

/* 添加删除确认对话框的样式 */
::v-deep .delete-self-confirm {
  background-color: #f56c6c;
  border-color: #f56c6c;
  color: white;
}

::v-deep .delete-self-confirm:hover {
  background-color: #e64c4c;
  border-color: #e64c4c;
}

::v-deep .delete-self-cancel {
  color: #f56c6c;
  border-color: #f56c6c;
}

::v-deep .delete-self-cancel:hover {
  background-color: #fef0f0;
  color: #e64c4c;
}

/* 批量操作对话框样式 */
::v-deep .batch-delete-dialog .el-message-box__title {
  color: #f56c6c;
  font-weight: 600;
}

::v-deep .batch-delete-dialog .batch-delete-confirm {
  background: linear-gradient(135deg, #f56c6c 0%, #e64c4c 100%);
  border: none;
  color: white;
}

::v-deep .batch-delete-dialog .batch-delete-confirm:hover {
  background: linear-gradient(135deg, #e64c4c 0%, #d43838 100%);
}

::v-deep .batch-delete-dialog .batch-delete-cancel:hover {
  color: #f56c6c;
  border-color: #f56c6c;
  background-color: #fef0f0;
}

::v-deep .batch-启用-dialog .batch-启用-confirm {
  background: linear-gradient(135deg, #67c23a 0%, #5daf34 100%);
  border: none;
  color: white;
}

::v-deep .batch-启用-dialog .batch-启用-confirm:hover {
  background: linear-gradient(135deg, #5daf34 0%, #529b2e 100%);
}

::v-deep .batch-禁用-dialog .batch-禁用-confirm {
  background: linear-gradient(135deg, #e6a23c 0%, #d9902b 100%);
  border: none;
  color: white;
}

::v-deep .batch-禁用-dialog .batch-禁用-confirm:hover {
  background: linear-gradient(135deg, #d9902b 0%, #c87f22 100%);
}

/* 动画效果 */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========== 头像上传样式 ========== */
.avatar-uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 5px;
}

/* 头像容器（用于包裹头像和提示层） */
.avatar-container {
  position: relative;
  cursor: pointer;
  height: 100px;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e8eaec;
  transition: all 0.3s;
}

/* 鼠标hover时头像效果 */
.avatar-container:hover .avatar {
  border-color: #409eff;
  box-shadow: 0 0 12px rgba(64, 158, 255, 0.3);
  opacity: 0.8; /* 头像轻微透明，突出提示 */
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  line-height: 100px;
  text-align: center;
  border: 1px dashed #d9d9d9;
  border-radius: 50%;
  cursor: pointer;
  background-color: #fbfbfb;
  transition: all 0.3s;
}

.avatar-container:hover .avatar-uploader-icon {
  color: #409eff;
  border-color: #409eff;
  background-color: #f5f7fa;
}

/* 头像hover提示（+号） */
.avatar-tip {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0; /* 默认隐藏 */
  transition: opacity 0.3s;
  pointer-events: none; /* 不影响点击事件 */
}

.avatar-tip i {
  font-size: 24px;
  color: white;
  background: rgba(64, 158, 255, 0.8);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* 鼠标hover时显示提示 */
.avatar-container:hover .avatar-tip {
  opacity: 1;
}

/* 禁用状态下隐藏提示 */
.el-upload.is-disabled .avatar-tip {
  display: none;
}

.el-upload__tip {
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
}

/* 响应式调整 */
@media screen and (max-width: 1200px) {
  .filter-toolbar {
    padding: 12px;

    .filter-form {
      .el-form-item {
        .el-input,
        .el-select {
          width: 180px;
        }
      }
    }
  }

  .batch-toolbar {
    .batch-content {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;

      .batch-actions {
        width: 100%;
        overflow-x: auto;
        padding-bottom: 4px;

        .el-button {
          flex-shrink: 0;
        }
      }
    }
  }
}

@media screen and (max-width: 768px) {
  .user-management {
    padding: 15px;

    h2 {
      font-size: 20px;
    }
  }

  .filter-toolbar {
    .filter-form {
      flex-direction: column;
      align-items: flex-start;

      .el-form-item {
        width: 100%;
        margin-right: 0;

        .el-input,
        .el-select {
          width: 100%;
        }

        .el-form-item__content {
          width: 100%;
        }
      }
    }
  }

  ::v-deep .el-table {
    font-size: 12px;
  }

  ::v-deep .el-table__header-wrapper .cell {
    font-size: 12px;
  }
}
</style>
