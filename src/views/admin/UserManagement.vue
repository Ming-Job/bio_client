<template>
  <div class="user-management">
    <div class="page-header">
      <h2>用户管理</h2>
    </div>

    <div class="filter-toolbar">
      <div class="toolbar-left">
        <el-select
          v-model="filterForm.role"
          placeholder="全部角色"
          size="small"
          clearable
          @change="handleFilterChange"
          class="filter-item"
          style="width: 120px"
        >
          <el-option label="全部角色" value=""></el-option>
          <el-option label="管理员" value="admin"></el-option>
          <el-option label="普通用户" value="user"></el-option>
        </el-select>

        <el-select
          v-model="filterForm.status"
          placeholder="全部状态"
          size="small"
          clearable
          @change="handleFilterChange"
          class="filter-item"
          style="width: 110px"
        >
          <el-option label="全部状态" value=""></el-option>
          <el-option label="正常" value="1"></el-option>
          <el-option label="封禁" value="0"></el-option>
        </el-select>

        <el-input
          v-model="filterForm.username"
          placeholder="搜索用户名..."
          size="small"
          clearable
          @keyup.enter.native="handleFilterChange"
          @clear="handleFilterChange"
          class="filter-item search-input"
          style="width: 260px"
        >
          <el-button
            slot="append"
            icon="el-icon-search"
            @click="handleFilterChange"
          ></el-button>
        </el-input>

        <el-button
          size="small"
          @click="handleResetFilter"
          icon="el-icon-refresh-left"
          class="filter-item"
          >重置</el-button
        >
      </div>

      <div class="toolbar-right">
        <el-button
          type="primary"
          size="small"
          @click="handleAdd"
          icon="el-icon-plus"
          >新增用户</el-button
        >
      </div>
    </div>

    <div v-if="selectedUsers.length > 0" class="batch-toolbar">
      <div class="batch-content">
        <div class="batch-left">
          <i class="el-icon-info batch-icon"></i>
          <span class="batch-info"
            >已选择 <strong>{{ selectedUsers.length }}</strong> 项非管理员账户</span
          >
          <el-button type="text" size="small" @click="clearSelection"
            >取消选择</el-button
          >
        </div>
        <div class="batch-actions">
          <el-button
            size="small"
            @click="handleBatchEnable"
            :loading="batchLoading"
            plain
          >
            批量解封
          </el-button>
          <el-button
            size="small"
            @click="handleBatchDisable"
            :loading="batchLoading"
            plain
          >
            批量封禁
          </el-button>
          <el-button
            type="danger"
            size="small"
            @click="handleBatchDelete"
            :loading="batchLoading"
            plain
          >
            批量删除
          </el-button>
        </div>
      </div>
    </div>

    <el-table
      ref="userTable"
      :data="userList"
      style="width: 100%; margin-top: 16px"
      class="user-table"
      @selection-change="handleSelectionChange"
      v-loading="loading"
    >
      <el-table-column
        type="selection"
        width="50"
        align="center"
        :selectable="isSelectable"
      ></el-table-column>

      <el-table-column
        type="index"
        label="序号"
        width="60"
        align="center"
        :index="calculateIndex"
      ></el-table-column>

      <el-table-column prop="avatar" label="头像" width="70" align="center">
        <template slot-scope="scope">
          <el-avatar
            :size="28"
            :src="getRealAvatarUrl(scope.row.avatar)"
            :alt="scope.row.username"
            style="border: 1px solid #ebeef5;"
          ></el-avatar>
        </template>
      </el-table-column>

      <el-table-column
        prop="username"
        label="用户名"
        min-width="140"
        show-overflow-tooltip
      >
        <template slot-scope="scope">
          <span style="font-weight: 500; color: #303133;">
            {{ scope.row.username }}
            <i v-if="scope.row.role === 'admin'" class="el-icon-user-solid admin-flag" title="系统管理员"></i>
          </span>
        </template>
      </el-table-column>

      <el-table-column prop="status" label="状态" width="100">
        <template slot-scope="scope">
          <div
            class="status-indicator"
            :class="
              scope.row.status === '1' || scope.row.status === 1
                ? 'status-active'
                : 'status-disabled'
            "
          >
            <span class="dot"></span>
            {{
              scope.row.status === "1" || scope.row.status === 1
                ? "正常"
                : "已封禁"
            }}
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="role" label="角色" width="100">
        <template slot-scope="scope">
          <span :style="{ color: scope.row.role === 'admin' ? '#F56C6C' : '#606266' }">
            {{ getRoleDisplayName(scope.row.role) }}
          </span>
        </template>
      </el-table-column>

      <el-table-column
        prop="email"
        label="邮箱"
        min-width="180"
        show-overflow-tooltip
      ></el-table-column>
      
      <el-table-column
        prop="phone"
        label="手机号"
        width="120"
      ></el-table-column>

      <el-table-column prop="lastLoginTime" label="最后登录" width="160">
        <template slot-scope="scope">
          <span style="color: #909399; font-size: 13px;">
            {{ scope.row.lastLoginTime || "-" }}
          </span>
        </template>
      </el-table-column>

      <el-table-column
        prop="createTime"
        label="注册时间"
        width="160"
      >
        <template slot-scope="scope">
          <span style="color: #909399; font-size: 13px;">
            {{ scope.row.createTime ? scope.row.createTime.substring(0, 16) : "-" }}
          </span>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="160" fixed="right" align="center">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="handleViewDetail(scope.row)">
            详情
          </el-button>
          
          <el-divider direction="vertical"></el-divider>

          <span v-if="scope.row.role === 'admin'" class="protected-flag" title="该账号受安全保护，不可在此封禁或删除">不可操作</span>

          <el-dropdown
            v-else
            @command="cmd => handleRowCommand(cmd, scope.row)"
            trigger="click"
            placement="bottom-end"
          >
            <span class="el-dropdown-link" style="color: #409EFF; cursor: pointer; font-size: 12px; user-select: none;">
              管理<i class="el-icon-arrow-down el-icon--right"></i>
            </span>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="edit">编辑资料</el-dropdown-item>
              <el-dropdown-item command="toggleStatus">
                {{ (scope.row.status === '1' || scope.row.status === 1) ? '封禁账号' : '解封账号' }}
              </el-dropdown-item>
              <el-dropdown-item command="delete" divided style="color: #F56C6C;">
                删除账号
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        background
        layout="total, prev, pager, next, jumper" :current-page="pagination.current"
        :page-size="6" :total="pagination.total"
        @current-change="handleCurrentChange"
      />
    </div>

    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="550px"
      @close="resetForm"
      custom-class="clean-dialog"
      :close-on-click-modal="false"
    >
      <el-form
        :model="formData"
        :rules="formRules"
        ref="userForm"
        label-width="90px"
        label-position="right"
      >
        <el-form-item label="用户头像" prop="avatar" v-if="!isAddMode">
          <el-upload
            class="avatar-uploader"
            action="javascript:void(0)"
            :show-file-list="false"
            :before-upload="beforeAvatarUpload"
            :http-request="handleAvatarUpload"
            :disabled="submitting || uploadingAvatar"
          >
            <div class="avatar-container">
              <img v-if="avatarUrl" :src="avatarUrl" class="avatar" />
              <i v-else class="el-icon-plus avatar-uploader-icon"></i>
              <div class="avatar-tip" v-if="!submitting && !uploadingAvatar">
                <i class="el-icon-camera"></i>
              </div>
            </div>
            <div slot="tip" class="el-upload__tip">
              支持 JPG/PNG，限 2MB
            </div>
          </el-upload>
        </el-form-item>

        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" placeholder="请输入系统登录名"></el-input>
        </el-form-item>

        <el-form-item label="角色" prop="role">
          <el-select v-model="formData.role" placeholder="选择系统角色" style="width: 100%">
            <el-option label="系统管理员" value="admin"></el-option>
            <el-option label="普通研究员" value="user"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="example@domain.com"></el-input>
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formData.phone" placeholder="11位手机号"></el-input>
        </el-form-item>

        <div class="password-zone" v-if="isAddMode">
          <el-form-item label="初始密码" prop="password">
            <el-input v-model="formData.password" type="password" placeholder="至少6个字符" show-password></el-input>
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input v-model="formData.confirmPassword" type="password" placeholder="请再次输入密码确认" show-password></el-input>
          </el-form-item>
        </div>

        <el-form-item label="账户状态" prop="status">
          <el-switch
            v-model="formData.status"
            active-value="1"
            inactive-value="0"
            active-color="#13ce66"
            inactive-color="#ff4949"
            active-text="正常"
            inactive-text="封禁">
          </el-switch>
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false" size="small">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting" size="small">
          确定保存
        </el-button>
      </span>
    </el-dialog>

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
  updateUserAvatar
} from "@/api/user";
import { getAvatarUrl, getUserInfo, clearAuth } from "@/utils/auth";
import UserDetailDialog from "@/components/user/UserDetailDialog.vue";

export default {
  name: "UserManagement",
  components: {
    UserDetailDialog,
  },
  data() {
    const passwordValidator = (rule, value, callback) => {
      if (this.isAddMode) {
        if (!value || value.trim() === "") {
          callback(new Error("请输入密码"));
        } else if (value.length < 6) {
          callback(new Error("密码长度至少6个字符"));
        } else {
          callback();
        }
      } else {
        callback();
      }
    };

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
      loading: false, 
      userList: [],
      dialogVisible: false,
      detailDialogVisible: false,
      dialogTitle: "新增用户",
      isAddMode: true,
      submitting: false,
      selectedUsers: [], 
      batchLoading: false, 
      currentDetailUser: null, 
      
      filterForm: {
        role: "",
        status: "",
        username: "",
        email: "",
        phone: "",
      },
      pagination: {
        current: 1,
        size: 6,
        total: 0,
      },
      formData: {
        id: null,
        username: "",
        password: "", 
        confirmPassword: "", 
        role: "",
        email: "",
        phone: "",
        status: "1",
        avatar: "", 
      },
      formRules: {
        username: [
          { required: true, message: "请输入用户名", trigger: "blur" },
          { min: 3, max: 20, message: "长度在3到20个字符", trigger: "blur" },
        ],
        password: [
          { required: true, validator: passwordValidator, trigger: "blur" },
        ],
        confirmPassword: [
          { required: true, validator: confirmPasswordValidator, trigger: "blur" },
        ],
        role: [{ required: true, message: "请选择角色", trigger: "change" }],
        email: [
          { required: true, message: "请输入邮箱", trigger: "blur" },
          { type: "email", message: "邮箱格式不正确", trigger: "blur" },
        ],
        phone: [
          { required: true, message: "请输入手机号", trigger: "blur" },
          { pattern: /^1[3-9]\d{9}$/, message: "手机号格式不正确", trigger: "blur" },
        ],
      },
      currentUser: null,
      avatarUrl: "", 
      uploadingAvatar: false, 
    };
  },
  watch: {
    'formData.password': function() {
      if (this.isAddMode && this.formData.confirmPassword) {
        this.$refs.userForm.validateField('confirmPassword');
      }
    }
  },
  mounted() {
    this.localCurrentUserInfo();
    this.fetchUsers();
  },
  methods: {
    localCurrentUserInfo() {
      this.currentUser = getUserInfo();
    },

    fetchUsers() {
      this.loading = true;
      const params = {
        pageNum: this.pagination.current,
        pageSize: this.pagination.size,
        ...this.filterForm,
      };

      getUserPage(params)
        .then((response) => {
          this.userList = response.records || [];
          this.pagination.total = response.total || 0;
        })
        .catch((error) => {
          console.error("获取数据失败:", error);
          this.$message.error("系统数据获取中断，请刷新");
        })
        .finally(() => {
          this.loading = false;
        });
    },

    handleFilterChange() {
      this.pagination.current = 1;
      this.fetchUsers();
    },

    handleResetFilter() {
      this.filterForm = {
        role: "",
        status: "",
        username: "",
        email: "",
        phone: "",
      };
      this.pagination.current = 1;
      this.fetchUsers();
    },

    calculateIndex(index) {
      return (this.pagination.current - 1) * this.pagination.size + index + 1;
    },

    // 🌟 修复：提供 Element UI 默认占位图防破图
    getRealAvatarUrl(avatar) {
      if (!avatar) {
        return 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'; 
      }
      return getAvatarUrl(avatar);
    },

    getRoleDisplayName(role) {
      const roleMap = { admin: "管理员", user: "普通用户" };
      return roleMap[role] || role;
    },

    handleSizeChange(size) {
      this.pagination.size = size;
      this.pagination.current = 1;
      this.fetchUsers();
    },

    handleCurrentChange(current) {
      this.pagination.current = current;
      this.fetchUsers();
    },

    handleViewDetail(row) {
      this.currentDetailUser = { ...row }; 
      this.detailDialogVisible = true;
    },

    handleAdd() {
      this.dialogTitle = "新增系统用户";
      this.isAddMode = true;
      this.dialogVisible = true;
      this.resetForm();
      this.$nextTick(() => {
        if (this.$refs.userForm) this.$refs.userForm.clearValidate();
      });
    },

    // 🌟 核心修改：处理行内“管理”下拉菜单事件
    handleRowCommand(command, row) {
      if (command === 'edit') {
        this.handleEdit(row); // 把编辑移到这里
      } else if (command === 'delete') {
        this.handleDelete(row);
      } else if (command === 'toggleStatus') {
        this.toggleSingleStatus(row);
      }
    },

    // 🌟 核心：为防止越权，这里也加一层 role !== 'admin' 的判定
    handleEdit(row) {
      if (row.role === 'admin') {
         this.$message.warning("为了系统安全，高级管理员账户不可在此编辑资料。");
         return;
      }

      this.dialogTitle = "编辑资料";
      this.isAddMode = false;
      this.dialogVisible = true;

      this.formData = {
        id: row.id || null,
        username: row.username || "",
        confirmPassword: "", 
        role: row.role || "",
        email: row.email || "",
        phone: row.phone || "",
        status: row.status != null ? `${row.status}` : "1",
        avatar: row.avatar || "", 
      };

      this.avatarUrl = this.getRealAvatarUrl(row.avatar);

      this.$nextTick(() => {
        if (this.$refs.userForm) this.$refs.userForm.clearValidate();
      });
    },

    // 快捷封禁/解封单个普通用户
    toggleSingleStatus(row) {
      // 🌟 方案 B：拦截对管理员的封禁
      if (row.role === 'admin') {
         this.$message.warning("金钟罩系统保护中：管理员账户不可被直接封禁。");
         return;
      }
      
      const newStatus = (row.status === '1' || row.status === 1) ? '0' : '1';
      const actionText = newStatus === '1' ? '解封' : '封禁';

      this.$confirm(`确定要${actionText}账户 [${row.username}] 的访问权限吗？`, "操作确认", {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        batchUpdateUserStatus({ ids: [row.id], status: newStatus })
          .then(() => {
            this.$message.success(`账户已${actionText}`);
            this.fetchUsers();
          })
          .catch(() => this.$message.error(`${actionText}失败`));
      }).catch(() => {});
    },

    handleDelete(row) {
      // 🌟 方案 B：金钟罩绝对保护管理员
      if (row.role === 'admin') {
        this.$message.error("拒绝操作：您无权在当前列表中销毁管理员账号！");
        return;
      }

      const message = `确定要永久删除账户 [${row.username}] 吗？此操作不可逆！`;

      this.$confirm(message, "彻底删除确认", {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "error",
      }).then(() => {
          deleteUser(row.id)
            .then(() => {
              this.$message.success("账号已永久删除");
              this.fetchUsers();
            })
            .catch((error) => {
              this.$message.error(error.response?.data?.message || "系统拒绝了删除请求");
            });
        }).catch(() => {});
    },

    beforeAvatarUpload(file) {
      const isJPG = file.type === "image/jpeg" || file.type === "image/png";
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isJPG) {
        this.$message.error("仅支持 JPG/PNG 格式");
        return false;
      }
      if (!isLt2M) {
        this.$message.error("图片限 2MB 以内");
        return false;
      }
      return true;
    },

    handleAvatarUpload(options) {
      const file = options.file;
      this.uploadingAvatar = true;

      const formData = new FormData();
      formData.append("avatar", file);
      formData.append("userId", this.formData.id); 

      updateUserAvatar(formData)
        .then((response) => {
          if (response.code === 200) {
            this.avatarUrl = this.getRealAvatarUrl(response.data);
            this.formData.avatar = response.data;
            this.$message.success("新头像已同步");
          } else {
            this.$message.error(response.message || "同步失败");
          }
        })
        .catch(() => this.$message.error("网络卡顿，上传中断"))
        .finally(() => {
          this.uploadingAvatar = false;
        });
    },

    handleSubmit() {
      this.$refs.userForm.validate((valid) => {
        if (!valid) return false;
        
        this.submitting = true;
        const submitData = {
          username: this.formData.username,
          role: this.formData.role,
          email: this.formData.email,
          phone: this.formData.phone,
          status: this.formData.status,
        };

        if (this.isAddMode) {
          submitData.password = this.formData.password;
        } else {
          submitData.id = this.formData.id;
          submitData.avatar = this.formData.avatar; 
        }

        const apiCall = this.isAddMode ? addUser(submitData) : updateUser(submitData);

        apiCall
          .then(() => {
            this.$message.success(this.isAddMode ? "系统新账户创建成功" : "资料保存成功");
            this.dialogVisible = false;
            
            if (this.isAddMode) this.pagination.current = 1;
            this.fetchUsers();
          })
          .catch((error) => {
            console.error("操作失败:", error);
            this.$message.error(error.response?.data?.message || "系统内部错误，保存中断");
          })
          .finally(() => {
            this.submitting = false;
          });
      });
    },

    forceLogout() {
      clearAuth();
      if (this.$store && this.$store.commit) {
        this.$store.commit("user/SET_TOKEN", "");
        this.$store.commit("user/SET_USER_INFO", null);
      }
      this.$router.push("/login");
    },

    resetForm() {
      if (this.$refs.userForm) this.$refs.userForm.resetFields();
      this.formData = {
        id: null,
        username: "",
        password: "", 
        confirmPassword: "", 
        role: "",
        email: "",
        phone: "",
        status: "1",
        avatar: "", 
      };
      this.avatarUrl = "";
      this.uploadingAvatar = false;
    },

    handleSelectionChange(selection) {
      this.selectedUsers = selection;
    },

    // 🌟 核心实现：拦截管理员的批量复选
    isSelectable(row) {
      // 拒绝选中任何管理员账户，防止批量越权误操作
      return row.role !== 'admin';
    },

    handleBatchEnable() {
      this.batchUpdateStatus("1", "解封");
    },
    handleBatchDisable() {
      this.batchUpdateStatus("0", "封禁");
    },

    clearSelection() {
      if (this.$refs.userTable) {
        this.$refs.userTable.clearSelection();
      }
      this.selectedUsers = [];
    },

    batchUpdateStatus(status, statusText) {
      if (this.selectedUsers.length === 0) return;

      const userIds = this.selectedUsers.map((user) => user.id);
      
      // 🌟 XSS 防护
      const escapeHtml = (str) => (str || '').replace(/[&<"'>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m]);
      
      const usernames = this.selectedUsers
        .map((user) => escapeHtml(user.username))
        .join("、");

      this.$confirm(
        `<div>
          <p style="font-size: 15px; margin-bottom: 8px;">
            系统将对以下 <b>${this.selectedUsers.length}</b> 个非管理员账户执行批量${statusText}：
          </p>
          <div style="background: #f4f4f5; padding: 10px; border-radius: 4px; font-size: 13px; max-height: 100px; overflow-y: auto; color: #606266;">
            ${usernames}
          </div>
        </div>`,
        `批量${statusText}指令发出`,
        {
          confirmButtonText: `确定`,
          cancelButtonText: "取消",
          type: status === '1' ? 'success' : 'warning',
          dangerouslyUseHTMLString: true,
        }
      ).then(() => {
          this.batchLoading = true;
          batchUpdateUserStatus({ ids: userIds, status: status })
            .then(() => {
              this.$message.success(`批量${statusText}完成`);
              this.fetchUsers();
              this.clearSelection();
            })
            .catch((error) => this.$message.error(error.response?.data?.message || "指令执行中断"))
            .finally(() => { this.batchLoading = false; });
        }).catch(() => {});
    },

    handleBatchDelete() {
      if (this.selectedUsers.length === 0) return;

      const userIds = this.selectedUsers.map((user) => user.id);
      
      // 🌟 XSS 防护
      const escapeHtml = (str) => (str || '').replace(/[&<"'>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m]);
      
      const usernames = this.selectedUsers
        .map((user) => escapeHtml(user.username))
        .join("、");

      this.$confirm(
        `<div>
          <p style="font-size: 15px; margin-bottom: 8px; color: #F56C6C; font-weight: bold;">
            ⚠️ 拒绝误误误操作！将永久彻底销毁以下 ${this.selectedUsers.length} 个非管理员账户：
          </p>
          <div style="background: #fef0f0; padding: 10px; border-radius: 4px; font-size: 13px; max-height: 100px; overflow-y: auto; color: #F56C6C;">
            ${usernames}
          </div>
        </div>`,
        "危险！彻底删除确认",
        {
          confirmButtonText: "强制销毁",
          cancelButtonText: "取消",
          type: "error",
          dangerouslyUseHTMLString: true,
        }
      ).then(() => {
          this.batchLoading = true;
          batchDeleteUsers({ ids: userIds })
            .then(() => {
              this.$message.success(`成功强制销毁 ${this.selectedUsers.length} 个账户`);
              this.fetchUsers();
              this.clearSelection();
            })
            .catch((error) => this.$message.error(error.response?.data?.message || "销毁中断"))
            .finally(() => { this.batchLoading = false; });
        }).catch(() => {});
    },
  },
};
</script>

<style lang="scss" scoped>
.user-management {
  padding: 24px;
  background-color: #f4f6f8;
  min-height: calc(100vh - 100px);

  .page-header {
    margin-bottom: 20px;
    h2 {
      margin: 0 0 8px 0;
      font-size: 22px;
      color: #1f2937;
      font-weight: 600;
    }
  }
}

.filter-toolbar {
  background: #ffffff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #e5e7eb;

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.batch-toolbar {
  margin-top: 16px;
  padding: 12px 20px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  
  .batch-content {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .batch-left {
      font-size: 14px;
      color: #1d4ed8;
      display: flex;
      align-items: center;
      gap: 12px;
      .batch-icon {
        color: #3b82f6;
      }
      strong {
        font-weight: 600;
        margin: 0 4px;
      }
    }

    .batch-actions {
      display: flex;
      gap: 10px;
    }
  }
}

::v-deep .user-table {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  
  th.el-table__cell {
    background-color: #f9fafb !important;
    color: #4b5563;
    font-weight: 600;
    height: 48px;
  }
  td.el-table__cell {
    border-bottom: 1px solid #f3f4f6;
  }
  .el-table__row:hover > td.el-table__cell {
    background-color: #f0fdf4 !important;
  }
}

/* 🌟 管理员标识小图标 */
.admin-flag {
  color: #F56C6C;
  font-size: 12px;
  margin-left: 5px;
  position: relative;
  bottom: 1px;
}

/* 圆点 */
.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  
  &.status-active {
    color: #10b981;
    .dot {
      background-color: #10b981;
      box-shadow: 0 0 6px rgba(16, 185, 129, 0.4);
    }
  }
  &.status-disabled {
    color: #ef4444;
    .dot {
      background-color: #ef4444;
    }
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }
}

/* 🌟 方案 B：操作列保护盾样式 */
.protected-flag {
  font-size: 12px;
  color: #c0c4cc;
  background-color: #f4f4f5;
  padding: 4px 10px;
  border-radius: 4px;
  user-select: none;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  background: #fff;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border: 1px solid #e5e7eb;
}

::v-deep .clean-dialog {
  border-radius: 12px;
  .el-dialog__header {
    border-bottom: 1px solid #f3f4f6;
    padding: 20px 24px;
    .el-dialog__title {
      font-weight: 600;
      color: #1f2937;
    }
  }
  .el-dialog__body {
    padding: 30px 40px 10px 20px;
  }
  .el-dialog__footer {
    border-top: 1px solid #f3f4f6;
    padding: 15px 24px;
  }
}

.avatar-uploader {
  .avatar-container {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    position: relative;
    cursor: pointer;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    
    .avatar {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .avatar-uploader-icon {
      font-size: 24px;
      color: #9ca3af;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f9fafb;
    }
    
    .avatar-tip {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      opacity: 0;
      transition: 0.2s;
      i { font-size: 20px; }
    }
    
    &:hover .avatar-tip {
      opacity: 1;
    }
  }
}
</style>