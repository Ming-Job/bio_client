<template>
  <div class="pipeline-library">
    <div class="library-header">
      <el-page-header
        @back="goBack"
        content="分析流模板库 (Pipeline Library)"
        class="dark-page-header"
      ></el-page-header>

      <div class="header-actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索流程名称或关键字..."
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
        <el-radio-button label="genomics">基因组学 (Genomics)</el-radio-button>
        <el-radio-button label="transcriptomics">转录组学 (Transcriptomics)</el-radio-button>
        <el-radio-button label="proteomics">蛋白质组/分子对接</el-radio-button>
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
          <h3 class="pipeline-name text-ellipsis" :title="tpl.name">{{ tpl.name }}</h3>
          <el-dropdown trigger="click" @command="handleCommand($event, tpl)">
            <span class="el-dropdown-link">
              <i class="el-icon-more el-icon--right action-icon"></i>
            </span>
            <el-dropdown-menu slot="dropdown" class="bio-dark-dropdown">
              <el-dropdown-item command="edit" icon="el-icon-edit">编辑配置</el-dropdown-item>
              <el-dropdown-item command="delete" icon="el-icon-delete" class="text-danger">删除模板</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>

        <div class="card-body">
          <p class="pipeline-desc">
            {{ tpl.description || "系统预置的标准生信分析流程，暂无详细描述。" }}
          </p>
        </div>

        <div class="card-footer">
          <div class="pipeline-tags">
            <el-tag
              size="mini"
              effect="dark"
              :type="tpl.isActive ? 'success' : 'info'"
            >
              {{ tpl.isActive ? "可用" : "维护中" }}
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
        <el-empty
          description="未找到匹配的分析流程"
          :image-size="100"
        ></el-empty>
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
        <div style="display: flex; gap: 16px">
          <el-form-item label="流程名称 (Name)" prop="name" style="flex: 1">
            <el-input
              v-model="form.name"
              placeholder="例如：RNA-Seq 差异表达分析"
            ></el-input>
          </el-form-item>
          <el-form-item
            label="唯一编码 (Code)"
            prop="pipelineCode"
            style="flex: 1"
          >
            <el-input
              v-model="form.pipelineCode"
              placeholder="例如：rna_seq (需英文)"
              :disabled="dialogType === 'edit'"
            ></el-input>
          </el-form-item>
        </div>

        <el-form-item label="所属领域 (Category)" prop="category">
          <el-select
            v-model="form.category"
            style="width: 100%"
            popper-class="bio-dark-select-dropdown"
          >
            <el-option label="基因组学 (Genomics)" value="genomics"></el-option>
            <el-option
              label="转录组学 (Transcriptomics)"
              value="transcriptomics"
            ></el-option>
            <el-option label="蛋白质组/分子对接" value="proteomics"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="功能描述 (Description)">
          <el-input
            type="textarea"
            :rows="3"
            v-model="form.description"
            placeholder="简单描述该流程的输入输出与算法特点..."
          ></el-input>
        </el-form-item>

        <el-form-item label="启用状态">
          <el-switch
            v-model="form.isActive"
            active-color="#10b981"
            inactive-color="#475569"
            :active-value="1"
            :inactive-value="0"
            active-text="可用"
            inactive-text="维护中"
          ></el-switch>
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
import {
  getPipelines,
  createPipeline,
  updatePipeline,
  deletePipeline,
} from "@/api/analysis";

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
      },
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
        this.$message.error("获取流程模板失败！");
      } finally {
        this.loading = false;
      }
    },
// 🌟 修改跳转路径和传参方式
    usePipeline(tpl) {
      this.$message.success(`已选定流程: ${tpl.name}，即将前往配置...`);
      this.$router.push({
        path: "/analysis/new", // 目标换成你的新组件路由
        query: { pipelineId: tpl.id }, // 参数名对齐
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
      if (type === "edit" && row) {
        this.form = {
          ...row,
          isActive: row.isActive ? 1 : 0,
        };
      } else {
        this.form = {
          id: null,
          pipelineCode: "",
          name: "",
          description: "",
          category: "genomics",
          isActive: 1,
        };
      }
      this.dialogVisible = true;
      this.$nextTick(() => {
        this.$refs.form?.clearValidate();
      });
    },

    submitForm() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return;
        this.submitLoading = true;
        try {
          if (this.dialogType === "add") {
            await createPipeline(this.form);
            this.$message.success("新建流程成功！");
          } else {
            await updatePipeline(this.form);
            this.$message.success("修改流程成功！");
          }
          this.dialogVisible = false;
          this.fetchData(); 
        } catch (error) {
          this.$message.error(
            error.response?.data?.message || "操作失败，请重试",
          );
        } finally {
          this.submitLoading = false;
        }
      });
    },

    async handleDelete(row) {
      try {
        await this.$confirm(
          `确定要删除流程 "${row.name}" 吗？此操作不可恢复。`,
          "高危操作",
          {
            confirmButtonText: "确定删除",
            cancelButtonText: "取消",
            type: "warning",
            customClass: "bio-dark-message-box",
          }
        );
        await deletePipeline(row.id);
        this.$message.success("流程删除成功");
        this.fetchData(); 
      } catch (error) {
        if (error !== "cancel") {
          this.$message.error("删除失败");
        }
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

  ::v-deep .dark-page-header {
    .el-page-header__left {
      color: #94a3b8;
      &:hover { color: #3b82f6; }
    }
    .el-page-header__content {
      color: #f8fafc;
      font-weight: 600;
    }
  }

  .header-actions {
    display: flex;
    gap: 16px;
    align-items: center;
    ::v-deep .dark-search-input {
      width: 280px;
      .el-input__inner {
        background-color: #1e293b;
        border: 1px solid #334155;
        color: #f8fafc;
        border-radius: 20px;
        &:focus { border-color: #3b82f6; }
      }
    }
  }
}

.filter-section {
  margin-bottom: 30px;
  ::v-deep .dark-radio-group {
    .el-radio-button__inner {
      background: #1e293b;
      border-color: #334155;
      color: #94a3b8;
      box-shadow: none !important;
    }
    .el-radio-button__orig-radio:checked + .el-radio-button__inner {
      background-color: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }
  }
}

.pipeline-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;

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
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.5);
      border-color: #374151;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      
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
        &:hover { color: #f8fafc; }
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
        -webkit-line-clamp: 3; /* 允许描述显示3行 */
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
    }
  }

  .empty-state {
    grid-column: 1 / -1;
    display: flex;
    justify-content: center;
    padding: 60px;
  }
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
  &:hover { opacity: 0.9; }
}
.dark-btn-cancel {
  background: transparent;
  border: 1px solid #475569;
  color: #94a3b8;
  &:hover { border-color: #f8fafc; color: #f8fafc; }
}

::v-deep .bio-dark-form {
  .el-form-item__label {
    color: #94a3b8;
    padding-bottom: 4px;
    font-weight: 500;
  }
  .el-input__inner,
  .el-textarea__inner {
    background-color: #1e293b;
    border: 1px solid #334155;
    color: #f8fafc;
    &:focus { border-color: #3b82f6; }
  }
  .el-input.is-disabled .el-input__inner {
    background-color: #111827;
    color: #64748b;
  }
}
.text-danger { color: #ef4444 !important; }
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
  border-radius: 12px;
}
.bio-dark-dialog .el-dialog__title {
  color: #f8fafc;
  font-weight: 600;
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
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}
</style>