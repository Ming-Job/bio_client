<template>
  <div class="pipeline-library">
    <div class="library-header">
      <el-page-header
        @back="goBack"
        content="分析流模板库"
        class="dark-page-header"
      ></el-page-header>

      <div class="header-actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索流程名称..."
          prefix-icon="el-icon-search"
          clearable
          class="dark-search-input"
        ></el-input>
        <el-button
          type="primary"
          icon="el-icon-plus"
          class="dark-btn-submit"
          @click="openDialog('add')"
        >
          新建流程
        </el-button>
      </div>
    </div>

    <div class="filter-section">
      <el-radio-group
        v-model="activeCategory"
        size="medium"
        class="dark-radio-group"
      >
        <el-radio-button label="all">全部领域</el-radio-button>
        <el-radio-button label="genomics">基因组学</el-radio-button>
        <el-radio-button label="transcriptomics">转录组学</el-radio-button>
        <el-radio-button label="proteomics">蛋白质组</el-radio-button>
      </el-radio-group>
    </div>

    <div v-if="loading" class="pipeline-grid">
      <el-skeleton v-for="i in 6" :key="i" animated class="skeleton-card">
        <template slot="template">
          <el-skeleton-item variant="rect" style="height: 120px" />
          <div style="padding: 14px">
            <el-skeleton-item variant="h3" style="width: 50%" />
            <div style="margin-top: 10px; height: 40px">
              <el-skeleton-item variant="text" style="margin-bottom: 5px" />
              <el-skeleton-item variant="text" style="width: 80%" />
            </div>
          </div>
        </template>
      </el-skeleton>
    </div>

    <div v-else class="pipeline-grid">
      <div v-for="tpl in filteredPipelines" :key="tpl.id" class="pipeline-card">
        <div class="card-header">
          <h3 class="pipeline-name text-ellipsis" :title="tpl.name">
            {{ tpl.name }}
          </h3>
          <el-dropdown trigger="click" @command="handleCommand($event, tpl)">
            <span class="el-dropdown-link">
              <i class="el-icon-more el-icon--right action-icon"></i>
            </span>
            <el-dropdown-menu slot="dropdown" class="bio-dark-dropdown">
              <el-dropdown-item command="edit" icon="el-icon-edit"
                >编辑配置</el-dropdown-item
              >
              <el-dropdown-item
                command="delete"
                icon="el-icon-delete"
                class="text-danger"
                >删除模板</el-dropdown-item
              >
            </el-dropdown-menu>
          </el-dropdown>
        </div>

        <div class="card-body">
          <p class="pipeline-desc">
            {{ tpl.description || "暂无描述" }}
          </p>
        </div>

        <div class="card-footer">
          <div class="pipeline-tags">
            <el-tag
              size="mini"
              effect="dark"
              :type="tpl.isActive ? 'success' : 'info'"
            >
              {{ tpl.isActive ? "可用" : "停用" }}
            </el-tag>
            <el-tag size="mini" type="info" effect="plain" v-if="tpl.category">
              {{ tpl.category }}
            </el-tag>
          </div>

          <el-button
            type="primary"
            size="small"
            class="use-btn"
            :disabled="!tpl.isActive"
            @click="usePipeline(tpl)"
          >
            使用流程 <i class="el-icon-right"></i>
          </el-button>
        </div>
      </div>

      <div v-if="filteredPipelines.length === 0" class="empty-state">
        <el-empty description="未找到流程" :image-size="100"></el-empty>
      </div>
    </div>

    <el-dialog
      :title="dialogType === 'add' ? '新建分析流程' : '编辑分析流程'"
      :visible.sync="dialogVisible"
      width="600px"
      custom-class="bio-dark-dialog"
      :close-on-click-modal="false"
    >
      <el-form
        ref="form"
        :model="form"
        :rules="rules"
        label-position="top"
        class="bio-dark-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="流程名称" prop="name">
              <el-input
                v-model="form.name"
                placeholder="如：RNA-Seq分析"
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="唯一编码" prop="pipelineCode">
              <el-input
                v-model="form.pipelineCode"
                placeholder="如：rna_seq"
                :disabled="dialogType === 'edit'"
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属领域" prop="category">
              <el-select
                v-model="form.category"
                style="width: 100%"
                popper-class="bio-dark-select-dropdown"
              >
                <el-option label="基因组学" value="genomics"></el-option>
                <el-option label="转录组学" value="transcriptomics"></el-option>
                <el-option label="蛋白质组" value="proteomics"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="启用状态">
              <el-switch
                v-model="form.isActive"
                active-color="#10b981"
                inactive-color="#475569"
                :active-value="1"
                :inactive-value="0"
                active-text="启用"
                inactive-text="停用"
              ></el-switch>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="参考基因组 (.fa)">
              <el-upload
                class="compact-uploader"
                action="#"
                :http-request="uploadFaFile"
                :on-remove="handleFaRemove"
                :before-upload="handleBeforeUpload"
                :file-list="faFileList"
                :limit="1"
                accept=".fa,.fasta"
              >
                <el-button
                  size="small"
                  type="primary"
                  plain
                  icon="el-icon-upload2"
                  >选择文件</el-button
                >
              </el-upload>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="基因注释 (.gtf)">
              <el-upload
                class="compact-uploader"
                action="#"
                :http-request="uploadGtfFile"
                :on-remove="handleGtfRemove"
                :before-upload="handleBeforeUpload"
                :file-list="gtfFileList"
                :limit="1"
                accept=".gtf"
              >
                <el-button
                  size="small"
                  type="primary"
                  plain
                  icon="el-icon-upload2"
                  >选择文件</el-button
                >
              </el-upload>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="功能描述" style="margin-bottom: 0">
          <el-input
            type="textarea"
            :rows="2"
            v-model="form.description"
          ></el-input>
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false" class="dark-btn-cancel"
          >取 消</el-button
        >
        <el-button
          type="primary"
          @click="submitForm"
          :loading="submitLoading"
          class="dark-btn-submit"
          >确 定</el-button
        >
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mapState } from "vuex";
import {
  getPipelines,
  createPipeline,
  updatePipeline,
  deletePipeline,
} from "@/api/analysis";
import { uploadSingleFile } from "@/api/file";

export default {
  name: "PipelineLibrary",
  data() {
    return {
      loading: true,
      submitLoading: false,
      searchQuery: "",
      activeCategory: "all",
      pipelines: [],

      dialogVisible: false,
      dialogType: "add",

      form: {
        id: null,
        pipelineCode: "",
        name: "",
        description: "",
        category: "genomics",
        isActive: 1,
        refFaFileId: null,
        refGtfFileId: null,
      },

      faFileList: [],
      gtfFileList: [],

      rules: {
        name: [{ required: true, message: "请输入流程名称", trigger: "blur" }],
        pipelineCode: [
          { required: true, message: "请输入唯一编码", trigger: "blur" },
        ],
        category: [
          { required: true, message: "请选择领域", trigger: "change" },
        ],
      },
    };
  },
  computed: {
    ...mapState("user", {
      userId: (state) => state.userInfo?.id,
    }),
    filteredPipelines() {
      return this.pipelines.filter((p) => {
        const matchQuery =
          p.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          (p.description &&
            p.description
              .toLowerCase()
              .includes(this.searchQuery.toLowerCase()));
        const matchCategory =
          this.activeCategory === "all" || p.category === this.activeCategory;
        return matchQuery && matchCategory;
      });
    },
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    goBack() {
      this.$router.push("/analysis");
    },
    async fetchData() {
      this.loading = true;
      try {
        const res = await getPipelines();
        if (res && res.data) {
          let pList = [];
          if (Array.isArray(res.data)) pList = res.data;
          else if (res.data.data && Array.isArray(res.data.data))
            pList = res.data.data;

          this.pipelines = pList.map((p, index) => ({
            ...p,
            id: p.id,
            pipelineCode: p.pipelineCode,
            isActive: p.isActive === 1 || p.isActive === true,
            category:
              p.category || (index % 2 === 0 ? "genomics" : "transcriptomics"),
          }));
        }
      } catch (error) {
        this.$message.error("获取模板失败");
      } finally {
        this.loading = false;
      }
    },
    usePipeline(tpl) {
      this.$router.push({
        path: "/analysis/new",
        query: { pipelineId: tpl.id },
      });
    },
    handleCommand(command, tpl) {
      if (command === "edit") {
        this.openDialog("edit", tpl);
      } else if (command === "delete") {
        this.handleDelete(tpl);
      }
    },
    openDialog(type, row = null) {
      this.dialogType = type;
      this.faFileList = [];
      this.gtfFileList = [];

      if (type === "edit" && row) {
        this.form = {
          ...row,
          isActive: row.isActive ? 1 : 0,
          refFaFileId: row.refFaFileId || null,
          refGtfFileId: row.refGtfFileId || null,
        };
        if (row.refFaFileId)
          this.faFileList = [
            { name: `已绑定参考基因组 (ID: ${row.refFaFileId})`, url: "" },
          ];
        if (row.refGtfFileId)
          this.gtfFileList = [
            { name: `已绑定注释文件 (ID: ${row.refGtfFileId})`, url: "" },
          ];
      } else {
        this.form = {
          id: null,
          pipelineCode: "",
          name: "",
          description: "",
          category: "genomics",
          isActive: 1,
          refFaFileId: null,
          refGtfFileId: null,
        };
      }
      this.dialogVisible = true;
      this.$nextTick(() => {
        this.$refs.form?.clearValidate();
      });
    },

    // 物理拦截判断，去除花哨的提示语
    handleBeforeUpload(file) {
      const isLt20M = file.size / 1024 / 1024 < 20;
      if (!isLt20M) {
        this.$message.error("文件大小不能超过 20MB");
      }
      return isLt20M;
    },

    // 🌟 自定义上传 参考基因组
    async uploadFaFile(options) {
      const { file, onProgress, onSuccess, onError } = options;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", this.userId);

      try {
        const res = await uploadSingleFile(formData, (progressEvent) => {
          let percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress({ percent });
        });

        const resultData = res.data || res;
        if (res.code === 200 || resultData.id) {
          this.form.refFaFileId = resultData.fileId || resultData;
          this.$message.success("参考基因组上传成功");
          onSuccess(resultData, file);
        } else {
          throw new Error("上传异常");
        }
      } catch (error) {
        this.$message.error("上传失败，请重试");
        this.faFileList = [];
        onError(error);
      }
    },

    handleFaRemove() {
      this.form.refFaFileId = null;
    },

    // 🌟 自定义上传 注释文件
    async uploadGtfFile(options) {
      const { file, onProgress, onSuccess, onError } = options;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", this.userId);

      try {
        const res = await uploadSingleFile(formData, (progressEvent) => {
          let percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress({ percent });
        });

        const resultData = res.data || res;
        if (res.code === 200 || resultData.id) {
          this.form.refGtfFileId = resultData.fileId || resultData;
          this.$message.success("注释文件上传成功");
          onSuccess(resultData, file);
        } else {
          throw new Error("上传异常");
        }
      } catch (error) {
        this.$message.error("上传失败，请重试");
        this.gtfFileList = [];
        onError(error);
      }
    },

    handleGtfRemove() {
      this.form.refGtfFileId = null;
    },

    submitForm() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return;
        this.submitLoading = true;
        try {
          if (this.dialogType === "add") {
            await createPipeline(this.form);
            this.$message.success("保存成功");
          } else {
            await updatePipeline(this.form);
            this.$message.success("更新成功");
          }
          this.dialogVisible = false;
          this.fetchData();
        } catch (error) {
          this.$message.error(error.response?.data?.message || "操作失败");
        } finally {
          this.submitLoading = false;
        }
      });
    },

    async handleDelete(row) {
      try {
        await this.$confirm(`确定删除流程 "${row.name}" 吗？`, "确认", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
          customClass: "bio-dark-message-box",
        });
        await deletePipeline(row.id);
        this.$message.success("删除成功");
        this.fetchData();
      } catch (error) {
        if (error !== "cancel") this.$message.error("删除失败");
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.pipeline-library {
  min-height: calc(100vh - 60px);
  background-color: #0b0f19;
  padding: 30px;
  color: #e2e8f0;
}
.library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}
::v-deep .dark-page-header .el-page-header__left {
  color: #94a3b8;
  &:hover {
    color: #3b82f6;
  }
}
::v-deep .dark-page-header .el-page-header__content {
  color: #f8fafc;
  font-weight: 600;
}
.header-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}
::v-deep .dark-search-input {
  width: 280px;
  .el-input__inner {
    background-color: #1e293b;
    border: 1px solid #334155;
    color: #f8fafc;
    border-radius: 20px;
    &:focus {
      border-color: #3b82f6;
    }
  }
}
.filter-section {
  margin-bottom: 30px;
}
::v-deep .dark-radio-group .el-radio-button__inner {
  background: #1e293b;
  border-color: #334155;
  color: #94a3b8;
  box-shadow: none !important;
}
::v-deep
  .dark-radio-group
  .el-radio-button__orig-radio:checked
  + .el-radio-button__inner {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: white;
}
.pipeline-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}
.skeleton-card {
  background: #111827;
  border-radius: 12px;
  padding: 0;
  overflow: hidden;
  border: 1px solid #1f2937;
}
.pipeline-card {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.5);
    border-color: #374151;
  }
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.pipeline-name {
  font-size: 18px;
  color: #f8fafc;
  margin: 0;
  font-weight: 600;
  flex: 1;
  padding-right: 12px;
}
.action-icon {
  cursor: pointer;
  color: #64748b;
  font-size: 18px;
  transition: color 0.2s;
  &:hover {
    color: #f8fafc;
  }
}
.card-body {
  flex: 1;
  .pipeline-desc {
    color: #94a3b8;
    font-size: 14px;
    line-height: 1.6;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
.card-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #1f2937;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pipeline-tags {
  display: flex;
  gap: 8px;
  ::v-deep .el-tag {
    border: none;
    &.el-tag--info.is-plain {
      background: #1e293b;
      color: #94a3b8;
    }
  }
}
.use-btn {
  background: #1e293b;
  border: 1px solid #3b82f6;
  color: #3b82f6;
  border-radius: 6px;
  font-weight: 500;
  transition: 0.3s;
  &:hover:not(:disabled) {
    background: #3b82f6;
    color: white;
  }
  &:disabled {
    border-color: #334155;
    color: #475569;
    background: transparent;
  }
}
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  padding: 60px;
}
.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dark-btn-submit {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  color: white;
  &:hover {
    opacity: 0.9;
  }
}
.dark-btn-cancel {
  background: transparent;
  border: 1px solid #475569;
  color: #94a3b8;
  &:hover {
    border-color: #f8fafc;
    color: #f8fafc;
  }
}
.text-danger {
  color: #ef4444 !important;
}

/* 🌟 表单元素精简版样式 */
::v-deep .bio-dark-form {
  .el-form-item__label {
    color: #94a3b8;
    padding-bottom: 4px;
    font-weight: 500;
    font-size: 13px;
  }
  .el-input__inner,
  .el-textarea__inner {
    background-color: #1e293b;
    border: 1px solid #334155;
    color: #f8fafc;
    border-radius: 4px;
    &:focus {
      border-color: #3b82f6;
    }
  }
  .el-input.is-disabled .el-input__inner {
    background-color: #0f172a;
    color: #64748b;
    border-color: #1e293b;
  }

  .compact-uploader {
    .el-upload {
      text-align: left;
    }
    .el-upload-list__item-name {
      color: #a7f3d0;
      font-size: 12px;
    }
    .el-upload-list__item:hover {
      background-color: #1e293b;
    }
    .el-button {
      background: #1e293b;
      border: 1px solid #3b82f6;
      color: #3b82f6;
      &:hover {
        background: #3b82f6;
        color: white;
      }
    }
  }
}
</style>

<style>
.bio-dark-dropdown,
.bio-dark-select-dropdown {
  background-color: #1e293b !important;
  border: 1px solid #334155 !important;
}
.bio-dark-dropdown .el-dropdown-menu__item,
.bio-dark-select-dropdown .el-select-dropdown__item {
  color: #94a3b8 !important;
}
.bio-dark-dropdown .el-dropdown-menu__item:hover,
.bio-dark-select-dropdown .el-select-dropdown__item.hover,
.bio-dark-select-dropdown .el-select-dropdown__item:hover {
  background-color: #0f172a !important;
  color: #f8fafc !important;
}
.bio-dark-dialog {
  background-color: #0f172a !important;
  border: 1px solid #1e293b;
  border-radius: 8px;
}
.bio-dark-dialog .el-dialog__title {
  color: #f8fafc;
  font-weight: 600;
  font-size: 16px;
}
.bio-dark-dialog .el-dialog__header {
  border-bottom: 1px solid #1e293b;
  padding: 16px 20px;
}
.bio-dark-dialog .el-dialog__body {
  padding: 24px;
  background: #0b0f19;
}
.bio-dark-dialog .el-dialog__footer {
  border-top: 1px solid #1e293b;
  background: #0f172a;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  padding: 12px 20px;
}
</style>
