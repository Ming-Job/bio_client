<template>
  <div class="new-analysis-container">
    <div class="page-header">
      <div class="back-btn" @click="$router.push('/analysis/new')">
        <i class="el-icon-back"></i> 重新选择
      </div>
      <div class="header-title">
        <i class="el-icon-set-up" style="color: #3b82f6"></i>
        <span>RNA-Seq 端到端全流程向导 (FastQ -> DESeq2)</span>
      </div>
    </div>

    <div class="wizard-main">
      <div class="wizard-sidebar">
        <el-steps
          :active="currentStep"
          direction="vertical"
          finish-status="success"
        >
          <el-step title="配置基建" description="核对参考文件"></el-step>
          <el-step
            title="设定实验组"
            description="划分 Control 与 Treat"
          ></el-step>
          <el-step title="确认并点火" description="分配计算资源"></el-step>
        </el-steps>
      </div>

      <div class="wizard-content">
        <div v-show="currentStep === 0" class="step-panel">
          <h3 class="panel-title">步骤 1: 模板参考文件核对</h3>
          <div class="template-infra-box" v-if="pipeline">
            <div
              v-if="!pipeline.refFaFileId || !pipeline.refGtfFileId"
              class="infra-warning"
            >
              <i class="el-icon-info"></i>
              <div class="warning-text">
                当前模板缺少参考基因组或注释文件，请上传。
              </div>
            </div>
            <div class="infra-items">
              <div class="infra-item">
                <span class="label">参考基因组 (.fa):</span>
                <span class="value" v-if="pipeline.refFaFileId"
                  >已就绪 (ID:{{ pipeline.refFaFileId }})</span
                >
                <el-upload
                  v-else
                  action="#"
                  :http-request="uploadFa"
                  :show-file-list="false"
                  accept=".fa,.fasta"
                  ><el-button
                    size="mini"
                    type="primary"
                    plain
                    :loading="uploadingFa"
                    >立即上传</el-button
                  ></el-upload
                >
              </div>
              <div class="infra-item" style="margin-top: 10px">
                <span class="label">基因注释文件 (.gtf):</span>
                <span class="value" v-if="pipeline.refGtfFileId"
                  >已就绪 (ID:{{ pipeline.refGtfFileId }})</span
                >
                <el-upload
                  v-else
                  action="#"
                  :http-request="uploadGtf"
                  :show-file-list="false"
                  accept=".gtf"
                  ><el-button
                    size="mini"
                    type="primary"
                    plain
                    :loading="uploadingGtf"
                    >立即上传</el-button
                  ></el-upload
                >
              </div>
            </div>
          </div>
        </div>

        <div v-show="currentStep === 1" class="step-panel">
          <h3 class="panel-title">步骤 2: 设定多样本对比逻辑 (差异分析核心)</h3>

          <div
            class="gwas-tip-box"
            style="
              background: rgba(59, 130, 246, 0.1);
              border: 1px solid rgba(59, 130, 246, 0.2);
              color: #3b82f6;
              padding: 15px;
              border-radius: 8px;
              font-size: 13px;
              margin-bottom: 20px;
            "
          >
            <i class="el-icon-info"></i> 学术规范要求：为了 DESeq2
            能正确计算离散度，对照组和处理组建议
            <b>至少各选 3 个生物学重复样本</b>。
          </div>

          <div class="group-design-container">
            <div class="group-box control-box">
              <div class="group-header">
                <span class="dot"></span> 对照组 (Control Group)
              </div>
              <el-select
                v-model="controlFileIds"
                multiple
                filterable
                placeholder="请选择 Control 组的 .fq 文件"
                class="dark-select w-full"
                popper-class="bio-dark-select-dropdown"
              >
                <el-option
                  v-for="f in filteredFiles"
                  :key="'ctrl-' + f.id"
                  :label="f.name"
                  :value="f.id"
                  :disabled="treatFileIds.includes(f.id)"
                ></el-option>
              </el-select>
              <div
                class="selected-count"
                :class="{ 'is-valid': controlFileIds.length >= 3 }"
              >
                已选: {{ controlFileIds.length }} 个样本
              </div>
            </div>

            <div class="vs-divider">VS</div>

            <div class="group-box treat-box">
              <div class="group-header text-treat">
                <span class="dot treat-dot"></span> 处理组 (Treat Group)
              </div>
              <el-select
                v-model="treatFileIds"
                multiple
                filterable
                placeholder="请选择 Treat 组的 .fq 文件"
                class="dark-select w-full"
                popper-class="bio-dark-select-dropdown"
              >
                <el-option
                  v-for="f in filteredFiles"
                  :key="'trt-' + f.id"
                  :label="f.name"
                  :value="f.id"
                  :disabled="controlFileIds.includes(f.id)"
                ></el-option>
              </el-select>
              <div
                class="selected-count text-treat"
                :class="{ 'is-valid': treatFileIds.length >= 3 }"
              >
                已选: {{ treatFileIds.length }} 个样本
              </div>
            </div>
          </div>
        </div>

        <div v-show="currentStep === 2" class="step-panel">
          <h3 class="panel-title">步骤 3: 端到端任务确认</h3>
          <el-form label-position="top">
            <el-form-item label="单样本基础算力分配 (CPU Threads / Sample)">
              <el-slider
                v-model="threads"
                :min="1"
                :max="8"
                show-stops
              ></el-slider>
              <div style="font-size: 12px; color: #10b981; margin-top: 5px">
                💡
                提示：本系统将采用队列排队机制，按顺序逐个处理样本的比对定量，最后自动合并执行
                DESeq2。
              </div>
            </el-form-item>
          </el-form>

          <div class="launch-summary">
            <div class="summary-details">
              <div class="summary-item">
                <span class="label">归属项目:</span
                ><span class="value">{{ projectName }}</span>
              </div>
              <div class="summary-item">
                <span class="label">对比阵列:</span>
                <span class="value text-blue"
                  >{{ controlFileIds.length }} Control
                  <i class="el-icon-right"></i>
                  {{ treatFileIds.length }} Treat</span
                >
              </div>
              <div class="summary-item">
                <span class="label">总样本数:</span>
                <span class="value text-purple"
                  >{{
                    controlFileIds.length + treatFileIds.length
                  }}
                  个测序文件</span
                >
              </div>
              <div class="summary-item">
                <span class="label">资源分配:</span
                ><span class="value">{{ threads }} 线程</span>
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
            v-if="currentStep < 2"
            :disabled="!canNext"
            class="dark-btn-submit"
            >下一步</el-button
          >
          <el-button
            type="success"
            @click="submitTask"
            v-if="currentStep === 2"
            :loading="submitting"
            class="dark-btn-launch"
            >挂载并点火执行</el-button
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getFileList, uploadSingleFile } from "@/api/file";
import {
  getPipelines,
  submitAnalysisTask,
  updatePipeline,
} from "@/api/analysis";
import { getUserProjects } from "@/api/project";
import { mapGetters } from "vuex";

export default {
  name: "RnaAnalysisWizard",
  data() {
    return {
      currentStep: 0,
      projectId: null,
      pipelineId: null,
      pipeline: null,
      myFiles: [],
      projectList: [],

      // 分组数组
      controlFileIds: [],
      treatFileIds: [],

      threads: 4,
      uploadingFa: false,
      uploadingGtf: false,
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
    filteredFiles() {
      return this.myFiles.filter(
        (f) =>
          String(f.projectId) === String(this.projectId) &&
          (f.name || "").toLowerCase().includes("fq"),
      );
    },
    canNext() {
      if (this.currentStep === 0)
        return this.pipeline?.refFaFileId && this.pipeline?.refGtfFileId;
      // 步骤 2 必须两边都有数据才能进入下一步
      if (this.currentStep === 1)
        return this.controlFileIds.length > 0 && this.treatFileIds.length > 0;
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

        let projList = Array.isArray(projRes)
          ? projRes
          : projRes.data?.data || projRes.data || [];
        this.projectList = projList;

        let pList = Array.isArray(pipelineRes)
          ? pipelineRes
          : pipelineRes.data?.data || pipelineRes.data || [];
        this.pipeline = pList.find(
          (p) => String(p.id) === String(this.pipelineId),
        );

        let fList = Array.isArray(fileRes)
          ? fileRes
          : fileRes.data?.data || fileRes.data || [];
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
        this.$message.error("数据加载失败，请刷新重试");
        console.error("加载接口报错:", error);
      }
    },
    nextStep() {
      this.currentStep++;
    },
    prevStep() {
      this.currentStep--;
    },

    async uploadFa(opt) {
      this.uploadingFa = true;
      try {
        const fd = new FormData();
        fd.append("file", opt.file);
        fd.append("userId", this.userId);
        const res = await uploadSingleFile(fd);
        this.pipeline.refFaFileId = res.data?.fileId || res.data;
        await updatePipeline(this.pipeline);
        this.$message.success("FA上传成功");
      } catch (e) {
        this.$message.error("FA上传失败");
      }
      this.uploadingFa = false;
    },

    async uploadGtf(opt) {
      this.uploadingGtf = true;
      try {
        const fd = new FormData();
        fd.append("file", opt.file);
        fd.append("userId", this.userId);
        const res = await uploadSingleFile(fd);
        this.pipeline.refGtfFileId = res.data?.fileId || res.data;
        await updatePipeline(this.pipeline);
        this.$message.success("GTF上传成功");
      } catch (e) {
        this.$message.error("GTF上传失败");
      }
      this.uploadingGtf = false;
    },

    async submitTask() {
      this.submitting = true;

      // 把所有用到的 fq 文件全绑在这个任务下
      const allFileIds = [...this.controlFileIds, ...this.treatFileIds];

      const payload = {
        projectId: Number(this.projectId),
        pipelineId: Number(this.pipelineId),
        fileIds: allFileIds,
        // 巧用 JSON 把分组信息传给后端 Java
        params: JSON.stringify({
          threads: this.threads,
          isE2E: true,
          controlGroup: this.controlFileIds,
          treatGroup: this.treatFileIds,
        }),
      };

      try {
        const res = await submitAnalysisTask(payload, this.userId || 6);
        if (res.code === 200 || res.status === 200) {
          this.$message.success("端到端复合分析流水线已启动！");
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
  min-height: 500px;
  display: flex;
  flex-direction: column;
}
.step-panel {
  flex: 1;
}
.panel-title {
  font-size: 18px;
  margin-bottom: 20px;
}
.template-infra-box {
  background: rgba(30, 41, 59, 0.4);
  padding: 20px;
  border-radius: 10px;
  border: 1px solid #334155;
}
.infra-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  .value {
    color: #10b981;
  }
}

/* 分组设计器专属样式 */
.group-design-container {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  background: #111827;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #1e293b;
}
.group-box {
  flex: 1;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 16px;
}
.control-box {
  border-left: 3px solid #10b981;
}
.treat-box {
  border-left: 3px solid #ef4444;
}

.group-header {
  font-size: 14px;
  font-weight: bold;
  color: #f8fafc;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  .dot {
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
    margin-right: 8px;
  }
  .treat-dot {
    background: #ef4444;
  }
  &.text-treat {
    color: #f8fafc;
  }
}
.vs-divider {
  padding-top: 40px;
  font-size: 20px;
  font-weight: 900;
  color: #475569;
  font-style: italic;
}
.selected-count {
  margin-top: 12px;
  font-size: 12px;
  color: #64748b;
  text-align: right;
  &.is-valid {
    color: #10b981;
  }
  &.text-treat.is-valid {
    color: #ef4444;
  }
}

.w-full {
  width: 100%;
}
.text-blue {
  color: #3b82f6;
  font-weight: bold;
}
.text-purple {
  color: #8b5cf6;
  font-weight: bold;
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
  margin-bottom: 10px;
  font-size: 14px;
  .label {
    color: #64748b;
  }
}
.wizard-footer {
  margin-top: 30px;
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
  background: #10b981;
  border: none;
  color: white;
  padding: 10px 25px;
  border-radius: 6px;
}
</style>
