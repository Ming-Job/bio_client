<template>
  <div class="new-analysis-container">
    <div class="page-header">
      <div class="back-btn" @click="$router.back()">
        <i class="el-icon-back"></i> 返回列表
      </div>
      <div class="header-title">
        <i class="el-icon-video-play"></i>
        <span>新建分析任务</span>
      </div>
    </div>

    <div class="wizard-main">
      <div class="wizard-sidebar">
        <el-steps
          :active="currentStep"
          direction="vertical"
          finish-status="success"
        >
          <el-step
            title="项目与模板"
            description="选择归属项目与分析流程"
          ></el-step>
          <el-step
            title="选择数据"
            description="核对参考文件与选择测序数据"
          ></el-step>
          <el-step
            title="配置参数"
            description="设置分析程序使用的线程数"
          ></el-step>
          <el-step
            title="确认并提交"
            description="确认任务信息并提交执行"
          ></el-step>
        </el-steps>
      </div>

      <div class="wizard-content">
        <div v-show="currentStep === 0" class="step-panel">
          <h3 class="panel-title">步骤 1: 基础配置</h3>

          <div class="config-section">
            <h4 class="section-sub-title">
              <i class="el-icon-folder-opened"></i> 1. 选择归属项目
            </h4>
            <el-select
              v-model="formData.projectId"
              placeholder="请选择任务归属的项目"
              class="dark-select"
              style="width: 100%; margin-bottom: 24px"
              popper-class="bio-dark-select-dropdown"
              @change="handleProjectChange"
            >
              <el-option
                v-for="proj in projectList"
                :key="proj.id"
                :label="proj.name"
                :value="proj.id"
              >
                <i class="el-icon-folder"></i> {{ proj.name }}
              </el-option>
            </el-select>
          </div>

          <div class="config-section">
            <h4 class="section-sub-title">
              <i class="el-icon-setting"></i> 2. 选择分析模板
            </h4>
            <div class="template-grid">
              <div
                v-for="tpl in pipelines"
                :key="tpl.id"
                class="pipeline-card"
                :class="{ 'is-selected': formData.pipelineId === tpl.id }"
                @click="formData.pipelineId = tpl.id"
              >
                <div class="card-info">
                  <h4>{{ tpl.name }}</h4>
                  <p>{{ tpl.description }}</p>
                </div>
                <div class="card-action">
                  <i
                    class="el-icon-circle-check check-icon"
                    v-if="formData.pipelineId === tpl.id"
                  ></i>
                  <el-tag
                    size="mini"
                    type="info"
                    effect="plain"
                    v-else
                    class="category-tag"
                  >
                    {{ formatCategory(tpl.category) }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-show="currentStep === 1" class="step-panel">
          <h3 class="panel-title">步骤 2: 核对参考文件与选择测序数据</h3>

          <div class="template-infra-box" v-if="selectedPipeline">
            <h4 class="box-title">
              <i class="el-icon-link"></i> 模板参考文件状态
            </h4>

            <div
              v-if="
                !selectedPipeline.refFaFileId || !selectedPipeline.refGtfFileId
              "
              class="infra-warning"
            >
              <i class="el-icon-info"></i>
              <div class="warning-text">
                <strong>该模板缺少必要的参考文件</strong><br />
                请在右侧点击“立即上传”补充缺失的文件。<br />
                <span class="highlight-hint"
                  >上传后将自动保存至当前模板，无需返回模板管理页。</span
                >
              </div>
            </div>

            <div class="infra-items">
              <div class="infra-item">
                <div class="item-left">
                  <i class="el-icon-document"></i>
                  <span class="label">参考基因组 (.fa):</span>
                  <span class="value" v-if="selectedPipeline.refFaFileId">
                    已选择 (File ID: {{ selectedPipeline.refFaFileId }})
                  </span>
                  <span class="value missing" v-else>未配置，无法运行</span>
                </div>
                <div class="item-right" v-if="!selectedPipeline.refFaFileId">
                  <el-upload
                    action="#"
                    :http-request="uploadFa"
                    :show-file-list="false"
                    accept=".fa,.fasta"
                    :before-upload="handleBeforeUpload"
                  >
                    <el-button
                      size="mini"
                      type="primary"
                      plain
                      :loading="uploadingFa"
                    >
                      {{ uploadingFa ? "上传中..." : "立即上传" }}
                    </el-button>
                  </el-upload>
                </div>
              </div>

              <div class="infra-item">
                <div class="item-left">
                  <i class="el-icon-tickets"></i>
                  <span class="label">基因注释文件 (.gtf):</span>
                  <span class="value" v-if="selectedPipeline.refGtfFileId">
                    已选择 (File ID: {{ selectedPipeline.refGtfFileId }})
                  </span>
                  <span class="value missing" v-else>未配置，无法运行</span>
                </div>
                <div class="item-right" v-if="!selectedPipeline.refGtfFileId">
                  <el-upload
                    action="#"
                    :http-request="uploadGtf"
                    :show-file-list="false"
                    accept=".gtf"
                    :before-upload="handleBeforeUpload"
                  >
                    <el-button
                      size="mini"
                      type="primary"
                      plain
                      :loading="uploadingGtf"
                    >
                      {{ uploadingGtf ? "上传中..." : "立即上传" }}
                    </el-button>
                  </el-upload>
                </div>
              </div>
            </div>
          </div>

          <p class="step-desc" style="margin-top: 24px">
            请勾选
            <b>{{ getSelectedProjectName() }}</b> 项目下需要分析的测序数据
            (.fq):
          </p>

          <div class="data-selection">
            <el-table
              :data="filteredFiles"
              style="width: 100%"
              @row-click="handleRowClick"
              class="dark-table"
              border
              empty-text="该项目下暂无可用测序数据，请先前往文件管理上传"
            >
              <el-table-column width="65" align="center">
                <template slot-scope="scope">
                  <el-radio
                    v-model="formData.selectedFileId"
                    :label="scope.row.id"
                    class="hide-radio-label"
                  >
                    <i></i>
                  </el-radio>
                </template>
              </el-table-column>

              <el-table-column label="文件名" prop="name" min-width="200">
                <template slot-scope="scope">
                  <i class="el-icon-document" style="color: #3b82f6"></i>
                  <span style="margin-left: 8px">{{ scope.row.name }}</span>
                </template>
              </el-table-column>
              <el-table-column
                label="大小"
                prop="size"
                width="120"
              ></el-table-column>
              <el-table-column
                label="上传时间"
                prop="date"
                width="180"
              ></el-table-column>
            </el-table>

            <p class="file-tips" v-if="formData.selectedFiles.length === 0">
              <i class="el-icon-info"></i> 请选择 1
              个输入文件（1个任务对应1个样本）
            </p>
          </div>
        </div>

        <div v-show="currentStep === 2" class="step-panel">
          <h3 class="panel-title">步骤 3: 配置参数</h3>
          <p class="step-desc">
            参考基因组与注释文件已随模板选定，此处仅需设置分析程序使用的线程数。
          </p>
          <el-form
            ref="paramForm"
            :model="formData.params"
            label-position="top"
            class="param-form"
          >
            <el-form-item label="线程数设置 (Threads)">
              <el-slider
                v-model="formData.params.threads"
                :min="1"
                :max="8"
                :step="1"
                show-stops
              ></el-slider>
              <span class="form-hint"
                >当前设置: {{ formData.params.threads }} 线程 (用于 fastp,
                hisat2, featureCounts)</span
              >
            </el-form-item>
          </el-form>
        </div>

        <div v-show="currentStep === 3" class="step-panel">
          <div class="launch-summary">
            <div class="check-icon-large">
              <i class="el-icon-document-checked"></i>
            </div>
            <h3>配置确认</h3>
            <p>请确认以下任务信息，无误后点击提交。</p>

            <div class="summary-details">
              <div class="summary-item">
                <span class="label">归属项目:</span>
                <span class="value">{{ getSelectedProjectName() }}</span>
              </div>
              <div class="summary-item">
                <span class="label">分析模板:</span>
                <span class="value text-blue">{{
                  getSelectedPipelineName()
                }}</span>
              </div>
              <div class="summary-item">
                <span class="label">参考文件:</span>
                <span class="value">已随模板选定 (.fa/.gtf)</span>
              </div>
              <div class="summary-item">
                <span class="label">输入数据:</span>
                <span class="value text-emerald"
                  >{{ formData.selectedFiles.length }} 个文件</span
                >
              </div>
              <div class="summary-item">
                <span class="label">分析线程:</span>
                <span class="value">{{ formData.params.threads }} 线程</span>
              </div>
            </div>
          </div>
        </div>

        <div class="wizard-footer">
          <el-button
            @click="prevStep"
            v-if="currentStep > 0"
            class="dark-btn-cancel"
            >上一步</el-button
          >

          <el-button
            type="primary"
            @click="nextStep"
            v-if="currentStep < 3"
            :disabled="!canNext"
            class="dark-btn-submit"
          >
            下一步
          </el-button>

          <el-button
            type="success"
            @click="submitTask"
            v-if="currentStep === 3"
            :loading="submitting"
            icon="el-icon-check"
            class="dark-btn-launch"
          >
            {{ submitting ? "提交中..." : "提交任务" }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  getPipelines,
  submitAnalysisTask,
  updatePipeline,
} from "@/api/analysis";
import { getFileList, uploadSingleFile } from "@/api/file";
import { getUserProjects } from "@/api/project";
import { mapState, mapGetters } from "vuex";

export default {
  name: "NewAnalysis",
  data() {
    return {
      currentStep: 0,
      submitting: false,
      uploadingFa: false,
      uploadingGtf: false,
      pipelines: [],
      myFiles: [],
      projectList: [],
      formData: {
        projectId: null,
        pipelineId: "",
        selectedFileId: null, // 🌟 专门记录当前单选的 ID
        selectedFiles: [], // 保持数组结构给后端提交
        params: {
          threads: 4,
        },
      },
    };
  },
  computed: {
    ...mapState("user", ["isLoggedIn", "userInfo"]),
    ...mapGetters("user", ["userId"]),

    filteredFiles() {
      if (!this.formData.projectId) return [];
      return this.myFiles.filter(
        (f) => f.projectId === this.formData.projectId,
      );
    },

    selectedPipeline() {
      if (!this.formData.pipelineId) return null;
      return this.pipelines.find((p) => p.id === this.formData.pipelineId);
    },

    canNext() {
      if (this.currentStep === 0) {
        return this.formData.projectId && this.formData.pipelineId !== "";
      }
      if (this.currentStep === 1) {
        const hasSelectedFiles = this.formData.selectedFiles.length > 0;
        const templateIsComplete =
          this.selectedPipeline &&
          this.selectedPipeline.refFaFileId &&
          this.selectedPipeline.refGtfFileId;
        return hasSelectedFiles && templateIsComplete;
      }
      return true;
    },
  },
  mounted() {
    this.initData().then(() => {
      // 1. 接收从案例广场传过来的模板 ID
      const preSelectedId = this.$route.query.pipelineId;
      console.log("预选的模板 ID:", preSelectedId);
      if (preSelectedId) {
        // 自动选中分析模板
        this.formData.pipelineId = Number(preSelectedId);

        // 🌟 核心优化：自动为用户选中他的第一个项目 (如果有的话)
        // 这样一来，项目和模板都填好了，"下一步"按钮会瞬间亮起！
        if (this.projectList && this.projectList.length > 0) {
          this.formData.projectId = this.projectList[0].id;
        } else {
          // 如果他连一个项目都没有，给个贴心提示
          this.$message.info("请先在系统内创建一个项目，再进行分析任务哦");
        }
      }
    });
  },
  methods: {
    async initData() {
      const currentUid = this.userId || 6;
      try {
        const pipelineRes = await getPipelines();
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

        this.pipelines = pList.map((p) => ({
          ...p,
          id: p.id,
          name: p.name || "未命名流程",
          category: p.category || "genomics",
          refFaFileId: p.refFaFileId || null,
          refGtfFileId: p.refGtfFileId || null,
        }));

        const projRes = await getUserProjects(currentUid);
        let projList = [];
        if (Array.isArray(projRes)) projList = projRes;
        else if (projRes && Array.isArray(projRes.data))
          projList = projRes.data;
        else if (projRes && projRes.data && Array.isArray(projRes.data.data))
          projList = projRes.data.data;
        this.projectList = projList;

        const fileRes = await getFileList({ userId: currentUid });
        let fList = [];
        if (Array.isArray(fileRes)) fList = fileRes;
        else if (fileRes && Array.isArray(fileRes.data)) fList = fileRes.data;
        else if (fileRes && fileRes.data && Array.isArray(fileRes.data.data))
          fList = fileRes.data.data;

        const rawFiles = fList.filter((f) => f.fileSource !== "generate");
        this.myFiles = rawFiles.map((f) => ({
          id: f.id,
          name: f.originalName,
          projectId: f.projectId,
          size: this.formatFileSize(f.sizeBytes),
          date: this.formatTime(f.uploadTime),
        }));
      } catch (error) {
        this.$message.error("数据加载失败，请刷新重试");
      }
    },

    handleBeforeUpload(file) {
      const isLt20M = file.size / 1024 / 1024 < 20;
      if (!isLt20M) {
        this.$message.error("文件大小限制在 20MB 内");
      }
      return isLt20M;
    },

    async uploadFa(options) {
      this.uploadingFa = true;
      try {
        const formData = new FormData();
        formData.append("file", options.file);
        formData.append("userId", this.userId);

        const res = await uploadSingleFile(formData);
        const resultData = res.data || res;
        console.log("上传参考基因组结果:", resultData);
        const fileId = resultData.fileId;

        if (!fileId) throw new Error("文件保存失败");

        const updatePayload = {
          ...this.selectedPipeline,
          refFaFileId: fileId,
        };
        await updatePipeline(updatePayload);

        const pIndex = this.pipelines.findIndex(
          (p) => p.id === this.selectedPipeline.id,
        );
        if (pIndex > -1) {
          this.$set(this.pipelines[pIndex], "refFaFileId", fileId);
        }

        this.$message.success("参考基因组上传并保存成功！");
      } catch (error) {
        this.$message.error("参考基因组上传失败");
      } finally {
        this.uploadingFa = false;
      }
    },

    async uploadGtf(options) {
      this.uploadingGtf = true;
      try {
        const formData = new FormData();
        formData.append("file", options.file);
        formData.append("userId", this.userId);

        const res = await uploadSingleFile(formData);
        const resultData = res.data || res;
        const fileId = resultData.fileId;

        if (!fileId) throw new Error("文件保存失败");

        const updatePayload = {
          ...this.selectedPipeline,
          refGtfFileId: fileId,
        };
        await updatePipeline(updatePayload);

        const pIndex = this.pipelines.findIndex(
          (p) => p.id === this.selectedPipeline.id,
        );
        if (pIndex > -1) {
          this.$set(this.pipelines[pIndex], "refGtfFileId", fileId);
        }

        this.$message.success("注释文件上传并保存成功！");
      } catch (error) {
        this.$message.error("注释文件上传失败");
      } finally {
        this.uploadingGtf = false;
      }
    },

    formatCategory(category) {
      const map = {
        genomics: "基因组学",
        transcriptomics: "转录组学",
        proteomics: "蛋白质组学",
      };
      return map[category] || category;
    },

    // 🌟 单选逻辑核心实现
    handleProjectChange() {
      // 切换项目时清空文件选择状态
      this.formData.selectedFileId = null;
      this.formData.selectedFiles = [];
    },
    handleRowClick(row) {
      // 点击整行时，更新单选 ID，并把整行数据放进数组里保持结构兼容
      this.formData.selectedFileId = row.id;
      this.formData.selectedFiles = [row];
    },

    nextStep() {
      if (this.currentStep < 3) this.currentStep++;
    },
    prevStep() {
      if (this.currentStep > 0) this.currentStep--;
    },
    getSelectedProjectName() {
      const target = this.projectList.find(
        (p) => p.id === this.formData.projectId,
      );
      return target ? target.name : "未选择";
    },
    getSelectedPipelineName() {
      const target = this.pipelines.find(
        (p) => p.id === this.formData.pipelineId,
      );
      return target ? target.name : "未选择";
    },

    async submitTask() {
      this.submitting = true;
      try {
        const realFileIds = this.formData.selectedFiles.map((f) => f.id);
        const currentUserId = this.userId || 6;

        const payload = {
          projectId: this.formData.projectId,
          pipelineId: this.formData.pipelineId,
          fileIds: realFileIds,
          params: JSON.stringify(this.formData.params),
        };

        const res = await submitAnalysisTask(payload, currentUserId);

        if (res && res.code === 200) {
          this.$message.success("任务提交成功！");
          setTimeout(() => {
            this.$router.push("/analysis/tasks");
          }, 1500);
        } else {
          this.$message.error(res.message || "任务提交失败，请检查参数");
        }
      } catch (error) {
        this.$message.error("任务提交异常，请检查网络或重试");
      } finally {
        this.submitting = false;
      }
    },

    formatFileSize(bytes) {
      if (!bytes) return "0 B";
      const k = 1024,
        sizes = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    },
    formatTime(timeStr) {
      if (!timeStr) return "-";
      return typeof timeStr === "string"
        ? timeStr.substring(0, 16).replace("T", " ")
        : "-";
    },
  },
};
</script>

<style lang="scss" scoped>
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
.page-header .back-btn {
  cursor: pointer;
  font-size: 14px;
  color: #94a3b8;
  transition: 0.3s;
  &:hover {
    color: #3b82f6;
  }
}
.page-header .header-title {
  font-size: 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  i {
    color: #3b82f6;
  }
}
.wizard-main {
  max-width: 1000px;
  margin: 0 auto;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 16px;
  display: flex;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}
.wizard-sidebar {
  width: 240px;
  padding: 40px 30px;
  background: linear-gradient(180deg, #111827 0%, #0b0f19 100%);
  border-right: 1px solid #1e293b;
}
::v-deep .wizard-sidebar .el-step__title {
  color: #64748b;
  font-size: 15px;
}
::v-deep .wizard-sidebar .el-step__title.is-process {
  color: #3b82f6;
  font-weight: bold;
}
::v-deep .wizard-sidebar .el-step__title.is-success {
  color: #10b981;
}
::v-deep .wizard-sidebar .el-step__description {
  color: #475569;
}
.wizard-content {
  flex: 1;
  padding: 40px;
  display: flex;
  flex-direction: column;
  position: relative;
  background: #0f172a;
}
.step-panel {
  flex: 1;
  min-height: 400px;
}
.step-panel .panel-title {
  font-size: 20px;
  margin: 0 0 8px 0;
  font-weight: 500;
  color: #f8fafc;
}
.step-panel .step-desc {
  color: #94a3b8;
  margin-bottom: 24px;
  font-size: 14px;
  b {
    color: #3b82f6;
  }
}
.config-section {
  margin-bottom: 30px;
}
.config-section .section-sub-title {
  color: #94a3b8;
  font-size: 15px;
  margin-bottom: 16px;
  i {
    margin-right: 4px;
    color: #3b82f6;
  }
}
.template-grid {
  display: grid;
  template-columns: repeat(2, 1fr);
  gap: 16px;
}
.pipeline-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 20px;
  background: #111827;
  border: 1px solid #334155;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  min-height: 80px;
}
.pipeline-card:hover {
  border-color: #4b5563;
  background: #1e293b;
}
.pipeline-card.is-selected {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.08);
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.15);
}
.pipeline-card .card-info {
  flex: 1;
  padding-right: 12px;
}
.pipeline-card .card-info h4 {
  margin: 0 0 6px 0;
  font-size: 15px;
  color: #f8fafc;
  font-weight: 600;
}
.pipeline-card .card-info p {
  margin: 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.pipeline-card .card-action {
  display: flex;
  align-items: center;
  height: 100%;
}
.pipeline-card .card-action .check-icon {
  font-size: 24px;
  color: #3b82f6;
}
.pipeline-card .card-action .category-tag {
  background: transparent;
  border-color: #334155;
}

/* 模板基建样式 */
.template-infra-box {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;

  .box-title {
    color: #f8fafc;
    font-size: 15px;
    margin: 0 0 16px 0;
    i {
      margin-right: 6px;
      color: #3b82f6;
    }
  }

  .infra-warning {
    display: flex;
    align-items: flex-start;
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.3);
    padding: 12px 16px;
    border-radius: 6px;
    margin-bottom: 16px;
    i {
      color: #f59e0b;
      font-size: 18px;
      margin-right: 10px;
      margin-top: 2px;
    }
    .warning-text {
      color: #fbbf24;
      font-size: 13px;
      line-height: 1.6;
      strong {
        color: #f59e0b;
        font-size: 14px;
      }
      .highlight-hint {
        color: #f8fafc;
        font-weight: bold;
        margin-top: 4px;
        display: inline-block;
      }
    }
  }

  .infra-items {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .infra-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #111827;
      padding: 10px 16px;
      border-radius: 6px;
      border: 1px solid #1e293b;

      .item-left {
        font-size: 13px;
        display: flex;
        align-items: center;
        i {
          color: #64748b;
          margin-right: 8px;
          font-size: 16px;
        }
        .label {
          color: #94a3b8;
          margin-right: 12px;
          width: 130px;
        }
        .value {
          color: #10b981;
        }
        .missing {
          color: #ef4444;
          font-weight: normal;
        }
      }

      .item-right {
        ::v-deep .el-upload {
          text-align: right;
        }
      }
    }
  }
}

.data-selection .file-tips {
  color: #94a3b8;
  font-size: 13px;
  margin-top: 16px;
  i {
    color: #3b82f6;
    margin-right: 4px;
  }
}
::v-deep .dark-table.el-table {
  background-color: transparent !important;
  border: 1px solid #1e293b !important;
  &::before {
    display: none;
  }
}
::v-deep .dark-table.el-table th,
::v-deep .dark-table.el-table tr {
  background-color: #111827 !important;
  color: #e2e8f0;
  border-bottom: 1px solid #1e293b !important;
}
::v-deep .dark-table.el-table td {
  border-bottom: 1px solid #1e293b !important;
}
::v-deep .dark-table.el-table .el-table__body tr:hover > td {
  background-color: #1e293b !important;
  cursor: pointer; /* 增加鼠标悬停手型，提示可点击 */
}
::v-deep .dark-table.el-table .el-table__empty-block {
  background: #111827;
}

/* 🌟 隐藏 Radio 默认的 label 留白 */
::v-deep .hide-radio-label .el-radio__label {
  display: none;
}

.param-form {
  margin-top: 20px;
}
::v-deep .param-form .el-form-item__label {
  color: #94a3b8;
  font-weight: 500;
}
.param-form .form-hint {
  color: #10b981;
  font-size: 12px;
  margin-left: 10px;
}
.launch-summary {
  text-align: center;
  padding: 40px 0;
}
.launch-summary .check-icon-large {
  font-size: 60px;
  color: #10b981;
  margin-bottom: 16px;
}
.launch-summary h3 {
  font-size: 20px;
  color: #f8fafc;
  margin-bottom: 12px;
}
.launch-summary p {
  color: #94a3b8;
  margin-bottom: 30px;
  font-size: 14px;
}
.launch-summary .summary-details {
  max-width: 450px;
  margin: 0 auto;
  background: #111827;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #1e293b;
  text-align: left;
}
.launch-summary .summary-details .summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  font-size: 14px;
  &:last-child {
    margin-bottom: 0;
  }
}
.launch-summary .summary-details .summary-item .label {
  color: #64748b;
}
.launch-summary .summary-details .summary-item .value {
  color: #f8fafc;
  font-weight: 500;
}
.launch-summary .summary-details .summary-item .text-blue {
  color: #3b82f6;
}
.launch-summary .summary-details .summary-item .text-emerald {
  color: #10b981;
}
.wizard-footer {
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid #1e293b;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}
.wizard-footer .dark-btn-cancel {
  background: transparent;
  border: 1px solid #475569;
  color: #94a3b8;
  &:hover {
    border-color: #f8fafc;
    color: #f8fafc;
  }
}
.wizard-footer .dark-btn-submit {
  background: #1e293b;
  border: 1px solid #3b82f6;
  color: #3b82f6;
  &:hover {
    background: #3b82f6;
    color: #fff;
  }
}
.wizard-footer .dark-btn-launch {
  background: #10b981;
  border: none;
  color: #fff;
  &:hover {
    background: #059669;
  }
}
</style>

<style>
.bio-dark-select-dropdown {
  background-color: #1e293b !important;
  border: 1px solid #334155 !important;
}
.bio-dark-select-dropdown .el-select-dropdown__item {
  color: #94a3b8 !important;
}
.bio-dark-select-dropdown .el-select-dropdown__item.hover,
.bio-dark-select-dropdown .el-select-dropdown__item:hover {
  background-color: #0f172a !important;
  color: #f8fafc !important;
}
</style>
