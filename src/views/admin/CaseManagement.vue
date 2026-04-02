<template>
  <div class="case-management">
    <div class="page-container">
      <div class="page-header-simple">
        <div class="header-left">
          <h2>案例管理</h2>
        </div>
        <el-button
          type="primary"
          icon="el-icon-plus"
          class="deploy-btn"
          @click="handleAdd"
        >
          新建案例
        </el-button>
      </div>

      <div class="toolbar">
        <div class="search-group">
          <el-input
            v-model="queryParams.searchKey"
            placeholder="搜索案例标题或描述"
            prefix-icon="el-icon-search"
            class="custom-input"
            clearable
            @keyup.enter.native="handleSearch"
          ></el-input>

          <el-select
            v-model="queryParams.category"
            placeholder="筛选案例类别"
            class="custom-select"
            clearable
            @change="handleSearch"
          >
            <el-option
              label="智能分析流 (Pipeline)"
              value="pipeline"
            ></el-option>
            <el-option
              label="三维洞察 (Structure)"
              value="structure"
            ></el-option>
            <el-option label="极客副驾 (Copilot)" value="copilot"></el-option>
          </el-select>
        </div>

        <el-button plain icon="el-icon-refresh" @click="handleSearch"
          >刷新</el-button
        >
      </div>

      <el-table
        v-loading="loading"
        :data="caseList"
        style="width: 100%"
        class="custom-table"
        :header-cell-class-name="'table-header-cell'"
      >
        <el-table-column
          label="序号"
          type="index"
          width="60"
          align="center"
          :index="indexMethod"
        ></el-table-column>

        <el-table-column label="封面" width="110" align="center">
          <template slot-scope="scope">
            <el-image
              style="
                width: 80px;
                height: 45px;
                border-radius: 4px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              "
              :src="getRealCoverUrl(scope.row.imageUrl)"
              fit="cover"
              :preview-src-list="
                scope.row.imageUrl ? [getRealCoverUrl(scope.row.imageUrl)] : []
              "
            >
              <div
                slot="error"
                class="image-slot"
                style="
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  width: 100%;
                  height: 100%;
                  background: #f5f7fa;
                  color: #909399;
                  font-size: 14px;
                "
              >
                <i class="el-icon-picture-outline"></i>
              </div>
            </el-image>
          </template>
        </el-table-column>

        <el-table-column
          prop="title"
          label="案例名称"
          min-width="220"
          show-overflow-tooltip
        >
          <template slot-scope="scope">
            <span class="case-title-text">{{ scope.row.title }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="category" label="案例类别" width="160">
          <template slot-scope="scope">
            <el-tag
              :type="getCategoryType(scope.row.category)"
              size="small"
              class="category-tag"
            >
              {{ getCategoryName(scope.row.category) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          prop="difficulty"
          label="难度评级"
          width="120"
          align="center"
        >
          <template slot-scope="scope">
            <span :class="['diff-badge', `diff-${scope.row.difficulty}`]">
              {{ scope.row.difficulty.toUpperCase() }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
          prop="dataset"
          label="关联数据文件"
          width="180"
          show-overflow-tooltip
        >
          <template slot-scope="scope">
            <span v-if="scope.row.dataset" class="dataset-text">
              <i class="el-icon-document"></i> {{ scope.row.dataset }}
            </span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template slot-scope="scope">
            <div class="row-action-wrapper">
              <el-button
                type="text"
                class="action-btn edit-btn"
                @click="handleEdit(scope.row)"
              >
                <i class="el-icon-edit"></i>
                <span class="btn-text">编辑</span>
              </el-button>

              <el-button
                type="text"
                class="action-btn delete-btn"
                @click="handleDelete(scope.row)"
              >
                <i class="el-icon-delete"></i>
                <span class="btn-text">删除</span>
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="queryParams.pageNum"
          :page-sizes="[10, 20, 50]"
          :page-size="queryParams.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          background
        ></el-pagination>
      </div>
    </div>

    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="800px"
      top="6vh"
      custom-class="modern-dialog"
      :close-on-click-modal="false"
    >
      <el-form
        ref="caseForm"
        :model="form"
        :rules="rules"
        label-width="110px"
        label-position="left"
      >
        <div class="form-section">
          <h4 class="section-title">基础数据</h4>
          <el-row :gutter="24">
            <el-col :span="14">
              <el-form-item label="案例标题" prop="title">
                <el-input
                  v-model="form.title"
                  placeholder="请输入案例显示名称"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="10">
              <el-form-item label="案例类别" prop="category">
                <el-select v-model="form.category" style="width: 100%">
                  <el-option
                    label="智能分析流 (Pipeline)"
                    value="pipeline"
                  ></el-option>
                  <el-option
                    label="三维洞察 (Structure)"
                    value="structure"
                  ></el-option>
                  <el-option
                    label="极客副驾 (Copilot)"
                    value="copilot"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="24">
            <el-col :span="10">
              <el-form-item label="难度评级">
                <el-select v-model="form.difficulty" style="width: 100%">
                  <el-option label="EASY (入门)" value="easy"></el-option>
                  <el-option label="MEDIUM (进阶)" value="medium"></el-option>
                  <el-option label="HARD (挑战)" value="hard"></el-option>
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="14">
              <el-form-item label="案例封面">
                <el-upload
                  class="cover-uploader"
                  action="javascript:void(0)"
                  :show-file-list="false"
                  :before-upload="beforeCoverUpload"
                  :http-request="handleCoverUpload"
                  :disabled="submitLoading || uploadingCover"
                >
                  <div class="cover-container">
                    <img
                      v-if="coverPreviewUrl"
                      :src="coverPreviewUrl"
                      class="cover-image"
                    />
                    <i v-else class="el-icon-plus cover-uploader-icon"></i>

                    <div class="cover-tip" v-if="!uploadingCover">
                      <i class="el-icon-camera"></i>
                    </div>

                    <div class="loading-cover" v-if="uploadingCover">
                      <i class="el-icon-loading"></i>
                    </div>
                  </div>
                  <div slot="tip" class="el-upload__tip hint-text">
                    <i class="el-icon-info"></i> 支持 JPG/PNG，建议比例 16:9
                  </div>
                </el-upload>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="案例简介" prop="description">
            <el-input
              type="textarea"
              v-model="form.description"
              :rows="2"
              placeholder="一句话描述案例核心功能..."
            ></el-input>
          </el-form-item>
        </div>

        <div class="form-section engine-section">
          <h4 class="section-title"><i class="el-icon-cpu"></i> 核心配置</h4>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="挂载数据集">
                <el-input
                  v-model="form.dataset"
                  placeholder="填入数据舱中的精确文件名"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="检索标签">
                <el-input
                  v-model="form.tags"
                  placeholder="多个标签请用逗号分隔"
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="预设 Prompt" v-if="form.category === 'copilot'">
            <el-input
              type="textarea"
              v-model="form.prompt"
              :rows="3"
              placeholder="AI 模式下自动注入的 Prompt 指令"
            ></el-input>
          </el-form-item>

          <el-form-item label="解析文档 (MD)">
            <el-input
              type="textarea"
              v-model="form.content"
              :rows="6"
              placeholder="支持 Markdown 语法的详细协议内容"
            ></el-input>
          </el-form-item>
        </div>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false" plain>取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm"
          >确认</el-button
        >
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getAdminCasePage, addCase, updateCase, deleteCase } from "@/api/case";
// 🌟 核心：直接复用课程的 API 接口！
import { uploadCourseCover } from "@/api/course";
import { mapGetters } from "vuex";

export default {
  name: "CaseManagement",
  data() {
    return {
      loading: false,
      submitLoading: false,
      caseList: [],
      total: 0,
      queryParams: { pageNum: 1, pageSize: 10, searchKey: "", category: "" },

      dialogVisible: false,
      dialogTitle: "部署新案例",

      coverPreviewUrl: "",
      uploadingCover: false,

      form: {
        id: null,
        title: "",
        description: "",
        category: "pipeline",
        difficulty: "medium",
        imageUrl: "",
        dataset: "",
        prompt: "",
        tags: "",
        content: "",
      },
      rules: {
        title: [
          { required: true, message: "案例标题不能为空", trigger: "blur" },
        ],
        category: [
          { required: true, message: "必须选择类别", trigger: "change" },
        ],
        description: [
          { required: true, message: "简介不能为空", trigger: "blur" },
        ],
      },
    };
  },
  computed: {
    ...mapGetters("user", ["userId"]),
  },
  created() {
    this.fetchData();
  },
  methods: {
    indexMethod(index) {
      return (
        (this.queryParams.pageNum - 1) * this.queryParams.pageSize + index + 1
      );
    },

    getRealCoverUrl(path) {
      if (!path) return "";
      if (path.startsWith("http")) return path;
      const baseUrl = process.env.VUE_APP_BASE_API || "http://localhost:8080";
      return baseUrl + path;
    },

    async fetchData() {
      this.loading = true;
      try {
        const res = await getAdminCasePage(this.queryParams);
        const responseData = res.success !== undefined ? res : res.data;
        if (responseData && responseData.success) {
          this.caseList = responseData.data.records || responseData.data;
          this.total = responseData.data.total || this.caseList.length;
        }
      } catch (e) {
        this.$message.error("获取案例矩阵数据失败");
      } finally {
        this.loading = false;
      }
    },
    handleSearch() {
      this.queryParams.pageNum = 1;
      this.fetchData();
    },
    handleSizeChange(val) {
      this.queryParams.pageSize = val;
      this.fetchData();
    },
    handleCurrentChange(val) {
      this.queryParams.pageNum = val;
      this.fetchData();
    },
    getCategoryName(cat) {
      const map = {
        pipeline: "智能分析流",
        structure: "三维洞察",
        copilot: "极客副驾",
      };
      return map[cat] || cat;
    },
    getCategoryType(cat) {
      const map = { pipeline: "", structure: "success", copilot: "danger" };
      return map[cat] || "info";
    },

    handleAdd() {
      this.form = {
        id: null,
        title: "",
        description: "",
        category: "pipeline",
        difficulty: "medium",
        imageUrl: "",
        dataset: "",
        prompt: "",
        tags: "",
        content: "",
      };
      this.coverPreviewUrl = "";
      this.dialogTitle = "部署新案例算子";
      this.dialogVisible = true;
      this.$nextTick(() => {
        this.$refs.caseForm?.clearValidate();
      });
    },

    handleEdit(row) {
      this.form = { ...row };
      this.coverPreviewUrl = this.getRealCoverUrl(row.imageUrl);
      this.dialogTitle = "调整案例引擎参数";
      this.dialogVisible = true;
    },

    beforeCoverUpload(file) {
      const isJPG = file.type === "image/jpeg" || file.type === "image/png";
      const isLt5M = file.size / 1024 / 1024 < 5;

      if (!isJPG) {
        this.$message.error("封面图片仅支持 JPG/PNG 格式");
        return false;
      }
      if (!isLt5M) {
        this.$message.error("封面图片大小限 5MB 以内");
        return false;
      }
      return true;
    },

    // 🌟 核心：直接调用已有的课程上传 API
    handleCoverUpload(options) {
      const file = options.file;
      this.uploadingCover = true;

      const formData = new FormData();
      // 后端只认名为 cover 的参数
      formData.append("cover", file);

      // 直接调用课程的 API，完全复用
      uploadCourseCover(formData)
        .then((response) => {
          // 适配后端的 Result 统一返回体： { code: 200, message: "上传成功", data: "..." }
          if (response.code === 200) {
            this.form.imageUrl = response.data;
            this.coverPreviewUrl = this.getRealCoverUrl(response.data);
            this.$message.success("封面上传成功");
          } else {
            this.$message.error(response.message || "封面上传失败");
          }
        })
        .catch(() => this.$message.error("网络卡顿，封面上传中断"))
        .finally(() => {
          this.uploadingCover = false;
        });
    },

    async submitForm() {
      this.$refs.caseForm.validate(async (valid) => {
        if (!valid) return;
        this.submitLoading = true;
        try {
          if (this.form.id) {
            await updateCase(this.form.id, this.form);
            this.$message.success("参数更新成功");
          } else {
            await addCase(this.form);
            this.$message.success("案例部署成功");
          }
          this.dialogVisible = false;
          this.fetchData();
        } catch (e) {
          this.$message.error("保存失败");
        } finally {
          this.submitLoading = false;
        }
      });
    },
    handleDelete(row) {
      this.$confirm(
        `警告：确定要从矩阵中永久移除案例 [${row.title}] 吗？`,
        "确认销毁",
        {
          type: "warning",
          confirmButtonText: "确认移除",
          cancelButtonText: "取消",
        },
      )
        .then(async () => {
          await deleteCase(row.id);
          this.$message.success("案例已销毁");
          this.fetchData();
        })
        .catch(() => {});
    },
  },
};
</script>

<style scoped>
/* 核心容器亮色背景 */
.case-management {
  min-height: calc(100vh - 64px);
  background-color: #f4f6f8;
  padding: 24px;
}

.page-container {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px 32px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.03);
}

.page-header-simple {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #edf2f7;
}

.header-left h2 {
  margin: 0 0 8px 0;
  font-size: 22px;
  font-weight: 600;
  color: #111827;
}

.deploy-btn {
  border-radius: 8px;
  font-weight: 500;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}
.search-group {
  display: flex;
  gap: 16px;
}
.custom-input {
  width: 280px;
}
.custom-select {
  width: 200px;
}

/* 表格定制 */
.custom-table {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}
::v-deep .table-header-cell {
  background-color: #f9fafb !important;
  color: #374151;
  font-weight: 600;
  height: 50px;
}
.case-title-text {
  font-weight: 500;
  color: #1f2937;
}

/* 难度评级 Pills */
.diff-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  font-family: Consolas, monospace;
}
.diff-easy {
  background: #d1fae5;
  color: #059669;
}
.diff-medium {
  background: #fef3c7;
  color: #d97706;
}
.diff-hard {
  background: #fee2e2;
  color: #dc2626;
}

.row-action-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  padding: 6px 10px !important;
  border-radius: 6px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  text-decoration: none;
  color: #64748b;
}

.btn-text {
  max-width: 0;
  opacity: 0;
  white-space: nowrap;
  display: inline-block;
  transition: all 0.3s ease;
  font-weight: 500;
}

.action-btn i {
  font-size: 16px;
}

.action-btn:hover .btn-text {
  max-width: 60px;
  opacity: 1;
  margin-left: 6px;
}

.edit-btn:hover {
  color: #3b82f6 !important;
  background-color: #eff6ff;
}

.delete-btn:hover {
  color: #ef4444 !important;
  background-color: #fef2f2;
}

/* 弹窗及表单 */
::v-deep .modern-dialog {
  border-radius: 12px;
  overflow: hidden;
}
::v-deep .modern-dialog .el-dialog__header {
  background: #f9fafb;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}
.form-section {
  margin-bottom: 24px;
}
.section-title {
  margin: 0 0 20px 0;
  font-size: 15px;
  font-weight: 600;
  color: #374151;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
  display: inline-block;
}
.engine-section {
  background: #f8fafc;
  padding: 20px;
  border-radius: 8px;
  border: 1px dashed #cbd5e1;
}
.engine-section .section-title {
  color: #3b82f6;
  border-bottom: none;
  margin-bottom: 16px;
}

.dataset-text {
  color: #4b5563;
  font-family: Consolas, monospace;
  font-size: 13px;
}
.text-muted {
  color: #9ca3af;
}

/* 🌟 16:9比例沉浸式上传框样式 */
.cover-uploader {
  :deep(.el-upload) {
    border: 1px dashed #dcdfe6;
    border-radius: 8px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: 0.2s;
    background-color: #fbfdff;
    width: 240px;
    height: 135px;
    display: flex;
    justify-content: center;
    align-items: center;

    &:hover {
      border-color: #409eff;
      background-color: #ecf5ff;
    }
  }
}

.cover-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;

  .cover-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .cover-uploader-icon {
    font-size: 28px;
    color: #8c939d;
  }

  .cover-tip {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-size: 24px;
    opacity: 0;
    transition: 0.2s;
  }

  &:hover .cover-tip {
    opacity: 1;
  }

  .loading-cover {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 24px;
    color: #409eff;
  }
}

.hint-text {
  margin-top: 6px;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.4;
  i {
    margin-right: 3px;
    color: #cbd5e1;
  }
}
</style>
