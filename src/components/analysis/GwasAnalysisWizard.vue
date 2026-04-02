<template>
  <div class="new-analysis-container">
    <div class="page-header">
      <div class="back-btn" @click="$router.push('/analysis/new')">
        <i class="el-icon-back"></i> 重新选择
      </div>
      <div class="header-title">
        <i class="el-icon-cpu" style="color: #10b981"></i>
        <span>全基因组端到端分析 (E2E GWAS)</span>
      </div>
    </div>

    <div class="wizard-main">
      <div class="wizard-sidebar">
        <el-steps
          :active="currentStep"
          direction="vertical"
          finish-status="success"
        >
          <el-step title="配置数据" description="参考、测序与表型"></el-step>
          <el-step title="启动执行" description="任务概览"></el-step>
        </el-steps>
      </div>

      <div class="wizard-content">
        <div v-show="currentStep === 0" class="step-panel">
          <h3 class="panel-title">
            步骤 1: 准备分析数据
            <span class="sub-step-text">({{ subStepText }})</span>
          </h3>

          <div class="gwas-tip-box" :class="themeClass">
            <i :class="iconClass"></i>
            <span>{{ tipText }}</span>
          </div>

          <div class="selection-status-bar">
            <div
              class="status-item"
              :class="{ active: subStep === 0, completed: refFile }"
            >
              <i class="el-icon-circle-check" v-if="refFile"></i>
              <span class="label">参考基因组:</span>
              <span class="value">{{ refFile ? refFile.name : "未选择" }}</span>
            </div>
            <div
              class="status-item"
              :class="{ active: subStep === 1, completed: fqFiles.length > 0 }"
            >
              <i class="el-icon-circle-check" v-if="fqFiles.length > 0"></i>
              <span class="label">群体测序:</span>
              <span class="value">{{
                fqFiles.length > 0 ? `已选 ${fqFiles.length} 个文件` : "未选择"
              }}</span>
            </div>
            <div
              class="status-item"
              :class="{ active: subStep === 2, completed: phenoFile }"
            >
              <i class="el-icon-circle-check" v-if="phenoFile"></i>
              <span class="label">群体表型:</span>
              <span class="value">{{
                phenoFile ? phenoFile.name : "未选择"
              }}</span>
            </div>
          </div>

          <div class="table-toolbar" v-if="subStep === 1">
            <div class="toolbar-left">
              <span class="filter-tag"
                ><i class="el-icon-filter"></i> 仅显示 .fq / .fastq</span
              >
            </div>
            <div class="toolbar-right">
              <el-button
                size="mini"
                type="primary"
                plain
                icon="el-icon-check"
                @click="selectAllFiles"
                >一键全选</el-button
              >
              <el-button
                size="mini"
                type="info"
                plain
                icon="el-icon-delete"
                @click="clearSelection"
                >清空已选</el-button
              >
            </div>
          </div>

          <div class="table-toolbar" v-if="subStep === 0">
            <span class="filter-tag text-green"
              ><i class="el-icon-filter"></i> 仅显示 .fa / .fasta</span
            >
          </div>
          <div class="table-toolbar" v-if="subStep === 2">
            <span class="filter-tag text-blue"
              ><i class="el-icon-filter"></i> 仅显示 .txt / .csv</span
            >
          </div>

          <el-table
            ref="fileTable"
            :data="filteredFiles"
            @row-click="handleRowClick"
            @selection-change="handleSelectionChange"
            class="dark-table"
            border
            height="300"
          >
            <el-table-column
              type="selection"
              width="55"
              align="center"
              v-if="subStep === 1"
            ></el-table-column>

            <el-table-column
              width="65"
              align="center"
              v-if="subStep === 0 || subStep === 2"
            >
              <template slot-scope="scope">
                <el-radio
                  v-model="selectedId"
                  :label="scope.row.id"
                  class="hide-radio-label"
                  ><i></i
                ></el-radio>
              </template>
            </el-table-column>

            <el-table-column label="文件名" prop="name">
              <template slot-scope="scope">
                <i :class="iconClass" :style="{ color: themeColor }"></i>
                <span style="margin-left: 8px">{{ scope.row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column
              label="文件大小"
              prop="size"
              width="120"
              align="right"
            ></el-table-column>
            <el-table-column
              label="上传日期"
              prop="date"
              width="160"
              align="center"
            ></el-table-column>
          </el-table>
        </div>

        <div v-show="currentStep === 1" class="step-panel">
          <div class="launch-summary">
            <div class="check-icon-large">
              <i class="el-icon-document-checked"></i>
            </div>
            <h3>端到端任务确认</h3>
            <div class="summary-details">
              <div class="summary-item">
                <span class="label">归属项目:</span
                ><span class="value">{{ projectName }}</span>
              </div>
              <div class="summary-item">
                <span class="label">参考基因组:</span
                ><span class="value text-green">{{
                  refFile ? refFile.name : ""
                }}</span>
              </div>
              <div class="summary-item">
                <span class="label">测序文件:</span
                ><span class="value text-purple"
                  >{{ fqFiles.length }} 个 FQ 已锁定</span
                >
              </div>
              <div class="summary-item">
                <span class="label">表型文件:</span
                ><span class="value text-blue">{{
                  phenoFile ? phenoFile.name : ""
                }}</span>
              </div>
              <div class="summary-item">
                <span class="label">执行策略:</span>
                <span class="value">GATK4 + PLINK + LMM 智能全自动执行</span>
              </div>
            </div>
          </div>
        </div>

        <div class="wizard-footer">
          <el-button
            @click="handlePrev"
            v-if="currentStep > 0 || subStep > 0"
            class="dark-btn-cancel"
            >上一步</el-button
          >
          <el-button
            type="primary"
            @click="handleNext"
            v-if="currentStep < 1"
            :disabled="!canProceedNext"
            class="dark-btn-submit"
          >
            {{ nextBtnText }}
          </el-button>
          <el-button
            type="success"
            @click="submitTask"
            v-if="currentStep === 1"
            :loading="submitting"
            class="dark-btn-launch"
          >
            挂载并执行流水线
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getFileList } from "@/api/file";
import { getPipelines, submitAnalysisTask } from "@/api/analysis";
import { getUserProjects } from "@/api/project";
import { mapGetters } from "vuex";

export default {
  name: "GwasAnalysisWizard",
  data() {
    return {
      currentStep: 0, // 🌟 现在的上限是 1 (0: 数据, 1: 确认)
      subStep: 0,
      projectId: null,
      pipelineId: null,
      pipeline: null,
      myFiles: [],
      projectList: [],

      selectedId: null,
      refFile: null,
      tempSelectedFq: [],
      fqFiles: [],
      phenoFile: null,

      submitting: false,
    };
  },
  computed: {
    ...mapGetters("user", ["userId"]),
    projectName() {
      return (
        this.projectList.find((p) => String(p.id) === String(this.projectId))
          ?.name || "..."
      );
    },
    subStepText() {
      return [
        "阶段 A: 选择参考基因组",
        "阶段 B: 锁定群体测序文件",
        "阶段 C: 挂载表型数据",
      ][this.subStep];
    },
    tipText() {
      return [
        "基建准备：请选择本次比对所依赖的 **参考基因组 (.fa/.fasta)**",
        "群体导入：请勾选该群体**所有原始测序数据 (.fq/.fastq)**，支持一键全选。",
        "表型映射：变异与群体结构已就绪，请选择对应的 **表型数据文件 (.txt/.csv)**",
      ][this.subStep];
    },
    themeClass() {
      return ["fa-theme", "fq-theme", "txt-theme"][this.subStep];
    },
    iconClass() {
      return ["el-icon-collection", "el-icon-files", "el-icon-document"][
        this.subStep
      ];
    },
    themeColor() {
      return ["#10b981", "#8b5cf6", "#3b82f6"][this.subStep];
    },
    nextBtnText() {
      if (this.currentStep === 0) {
        if (this.subStep === 0) return "选好参考，去选测序数据";
        if (this.subStep === 1) return "测序完毕，去选表型";
        if (this.subStep === 2) return "确认数据，进入任务概览"; // 🌟 修改提示文案
      }
      return "下一步";
    },
    filteredFiles() {
      return this.myFiles.filter((f) => {
        const isProjectMatch = String(f.projectId) === String(this.projectId);
        const name = (f.name || "").toLowerCase();
        if (this.subStep === 0)
          return isProjectMatch && name.includes(".fasta");
        if (this.subStep === 1)
          return (
            isProjectMatch && (name.includes(".fq") || name.includes(".fastq"))
          );
        if (this.subStep === 2)
          return (
            isProjectMatch && (name.includes(".txt") || name.includes(".csv"))
          );
        return false;
      });
    },
    canProceedNext() {
      if (this.currentStep === 0) {
        if (this.subStep === 0) return this.selectedId !== null;
        if (this.subStep === 1) return this.tempSelectedFq.length > 0;
        if (this.subStep === 2) return this.selectedId !== null;
      }
      return true;
    },
  },
  mounted() {
    this.projectId = this.$route.query.projectId;
    this.pipelineId = this.$route.query.pipelineId;
    this.initData();
  },
  methods: {
    async initData() {
      const currentUid = this.userId || 6;
      try {
        const [pipelineRes, projRes, fileRes] = await Promise.all([
          getPipelines(),
          getUserProjects(currentUid),
          getFileList({ userId: currentUid }),
        ]);

        let projList = [];
        if (Array.isArray(projRes)) projList = projRes;
        else if (projRes && Array.isArray(projRes.data))
          projList = projRes.data;
        else if (projRes && projRes.data && Array.isArray(projRes.data.data))
          projList = projRes.data.data;
        this.projectList = projList;

        let pList = [];
        if (Array.isArray(pipelineRes)) pList = pipelineRes;
        else if (pipelineRes && Array.isArray(pipelineRes.data))
          pList = pipelineRes.data;
        else if (
          pipelineRes &&
          pipelineRes.data &&
          Array.isArray(pipelineRes.data.data)
        )
          pList = pipelineRes.data.data;
        this.pipeline = pList.find(
          (p) => String(p.id) === String(this.pipelineId),
        );

        let fList = [];
        if (Array.isArray(fileRes)) fList = fileRes;
        else if (fileRes && Array.isArray(fileRes.data)) fList = fileRes.data;
        else if (fileRes && fileRes.data && Array.isArray(fileRes.data.data))
          fList = fileRes.data.data;

        const rawFiles = fList.filter((f) => f.fileSource !== "generate");
        this.myFiles = rawFiles.map((f) => ({
          id: f.id,
          name: f.originalName || f.name,
          projectId: String(f.projectId),
          size: f.sizeBytes
            ? (f.sizeBytes / 1024 / 1024).toFixed(2) + "MB"
            : "-",
          date: f.uploadTime
            ? f.uploadTime.substring(0, 16).replace("T", " ")
            : "-",
        }));
      } catch (error) {
        this.$message.error("数据加载失败");
      }
    },
    selectAllFiles() {
      this.$refs.fileTable.clearSelection();
      this.filteredFiles.forEach((row) => {
        this.$refs.fileTable.toggleRowSelection(row, true);
      });
    },
    clearSelection() {
      this.$refs.fileTable.clearSelection();
    },
    handleSelectionChange(val) {
      if (this.subStep === 1) this.tempSelectedFq = val;
    },
    handleRowClick(row) {
      if (this.subStep === 1) {
        this.$refs.fileTable.toggleRowSelection(row);
      } else {
        this.selectedId = row.id;
      }
    },
    handleNext() {
      if (this.currentStep === 0) {
        if (this.subStep === 0) {
          this.refFile = this.myFiles.find((f) => f.id === this.selectedId);
          this.subStep = 1;
          this.selectedId = null;
          this.$nextTick(() => {
            this.fqFiles.forEach((row) => {
              const found = this.filteredFiles.find((f) => f.id === row.id);
              if (found) this.$refs.fileTable.toggleRowSelection(found, true);
            });
          });
        } else if (this.subStep === 1) {
          this.fqFiles = [...this.tempSelectedFq];
          this.subStep = 2;
          this.selectedId = this.phenoFile ? this.phenoFile.id : null;
        } else if (this.subStep === 2) {
          this.phenoFile = this.myFiles.find((f) => f.id === this.selectedId);
          this.currentStep = 1; // 🌟 选完表型，直接跳到步骤 1 (任务概览)
        }
      }
    },
    handlePrev() {
      if (this.currentStep === 0) {
        if (this.subStep === 2) {
          this.subStep = 1;
          this.$nextTick(() => {
            this.fqFiles.forEach((row) => {
              const found = this.filteredFiles.find((f) => f.id === row.id);
              if (found) this.$refs.fileTable.toggleRowSelection(found, true);
            });
          });
        } else if (this.subStep === 1) {
          this.subStep = 0;
          this.selectedId = this.refFile ? this.refFile.id : null;
        }
      } else if (this.currentStep === 1) {
        this.currentStep = 0; // 🌟 从概览退回时，回到数据配置的第 3 小步 (选表型)
        this.subStep = 2;
      }
    },
    async submitTask() {
      this.submitting = true;
      const allFileIds = [
        this.refFile.id,
        ...this.fqFiles.map((f) => f.id),
        this.phenoFile.id,
      ];

      const payload = {
        projectId: Number(this.projectId),
        pipelineId: Number(this.pipelineId),
        fileIds: allFileIds,
        // 🌟 发送一个空的 params 或者保留系统默认配置，防止后端 JSON 解析报 Null 指针
        params: JSON.stringify({ mode: "auto_e2e" }),
      };

      try {
        const res = await submitAnalysisTask(payload, this.userId || 6);
        if (res.code === 200 || res.status === 200) {
          this.$message.success("端到端 GWAS 分析流水线已全自动点火启动！");
          this.$router.push("/analysis/tasks");
        }
      } catch (e) {
        this.$message.error("提交失败");
      }
      this.submitting = false;
    },
  },
};
</script>

<style lang="scss" scoped>
/* 样式部分完全保持你原来的暗黑极客风，一行没动 */
.new-analysis-container {
  min-height: calc(100vh - 60px);
  background-color: #0b0f19;
  padding: 30px 20px;
  color: #f8fafc;
}
.page-header {
  max-width: 1000px;
  margin: 0 auto 30px auto;
  display: flex;
  align-items: center;
  gap: 24px;
}
.back-btn {
  cursor: pointer;
  color: #94a3b8;
  font-size: 14px;
  &:hover {
    color: #3b82f6;
  }
}
.header-title {
  font-size: 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}
.wizard-main {
  max-width: 1000px;
  margin: 0 auto;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 16px;
  display: flex;
  overflow: hidden;
}
.wizard-sidebar {
  width: 240px;
  padding: 40px 30px;
  background: #111827;
  border-right: 1px solid #1e293b;
}
.wizard-content {
  flex: 1;
  padding: 40px;
  background: #0f172a;
  min-height: 600px;
  display: flex;
  flex-direction: column;
}
.panel-title {
  font-size: 18px;
  margin-bottom: 20px;
  .sub-step-text {
    font-size: 13px;
    color: #64748b;
    margin-left: 10px;
  }
}

.gwas-tip-box {
  padding: 15px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  &.fa-theme {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.2);
    color: #10b981;
  }
  &.fq-theme {
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid rgba(139, 92, 246, 0.2);
    color: #8b5cf6;
  }
  &.txt-theme {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
    color: #3b82f6;
  }
}

.selection-status-bar {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  .status-item {
    flex: 1;
    padding: 12px;
    border-radius: 8px;
    background: #111827;
    border: 1px solid #1e293b;
    font-size: 12px;
    color: #475569;
    display: flex;
    align-items: center;
    gap: 8px;
    &.active {
      border-color: #3b82f6;
      color: #f8fafc;
    }
    &.completed {
      border-color: #10b981;
      color: #10b981;
      .value {
        color: #e2e8f0;
      }
    }
    .label {
      font-weight: 600;
    }
    .value {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  .filter-tag {
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 4px;
    background: #1e293b;
  }
  .text-green {
    color: #10b981;
  }
  .text-blue {
    color: #3b82f6;
  }
  .toolbar-left {
    color: #8b5cf6;
  }
  .toolbar-right {
    display: flex;
    gap: 10px;
  }
}

.dark-table {
  background: transparent !important;
}
::v-deep .el-table {
  background-color: transparent !important;
  color: #e2e8f0;
  border: 1px solid #1e293b;
}
::v-deep .el-table tr {
  background-color: #111827 !important;
}
::v-deep .el-table--enable-row-hover .el-table__body tr:hover > td {
  background-color: #1e293b !important;
}
::v-deep .el-table::before {
  height: 0;
}
.hide-radio-label ::v-deep .el-radio__label {
  display: none;
}
.check-icon-large {
  font-size: 50px;
  color: #10b981;
  margin-bottom: 10px;
  text-align: center;
}
.summary-details {
  background: #111827;
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
}
.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
  .label {
    color: #64748b;
  }
  .text-green {
    color: #10b981;
    font-weight: 600;
  }
  .text-purple {
    color: #8b5cf6;
    font-weight: 600;
  }
  .text-blue {
    color: #3b82f6;
  }
}
.wizard-footer {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid #1e293b;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.dark-btn-cancel {
  background: transparent;
  border: 1px solid #475569;
  color: #94a3b8;
}
.dark-btn-submit {
  background: #1e293b;
  border: 1px solid #3b82f6;
  color: #3b82f6;
}
.dark-btn-launch {
  background: #3b82f6;
  border: none;
  color: white;
  padding: 10px 25px;
  border-radius: 6px;
  font-weight: bold;
}
</style>
