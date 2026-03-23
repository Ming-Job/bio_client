<template>
  <div class="new-analysis-container">
    <div class="page-header">
      <div class="back-btn" @click="$router.back()">
        <i class="el-icon-back"></i> 返回控制台
      </div>
      <div class="header-title">
        <i class="el-icon-video-play"></i>
        <span>启动分析 Pipeline</span>
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
            title="空间与流程"
            description="选定归属课题与 Pipeline"
          ></el-step>
          <el-step
            title="挂载数据"
            description="选择该课题下的输入文件"
          ></el-step>
          <el-step title="配置参数" description="设置质控与计算阈值"></el-step>
          <el-step title="预检发射" description="确认信息并提交集群"></el-step>
        </el-steps>
      </div>

      <div class="wizard-content">
        <div v-show="currentStep === 0" class="step-panel">
          <h3 class="panel-title">步骤 1: 基础环境配置</h3>

          <div class="config-section">
            <h4 class="section-sub-title">
              <i class="el-icon-folder-opened"></i> 1. 选择归属科研空间
            </h4>
            <el-select
              v-model="formData.projectId"
              placeholder="请选择本次任务归属的课题"
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
              <i class="el-icon-magic-stick"></i> 2. 选择要执行的分析流程
            </h4>
            <div class="template-grid">
              <div
                v-for="tpl in pipelines"
                :key="tpl.id"
                class="pipeline-card"
                :class="{ 'is-selected': formData.pipelineId === tpl.id }"
                @click="formData.pipelineId = tpl.id"
              >
                <div
                  class="card-icon"
                  :style="{ background: tpl.color || '#3b82f6' }"
                >
                  <i :class="tpl.icon || 'el-icon-data-line'"></i>
                </div>
                <div class="card-info">
                  <h4>{{ tpl.name }}</h4>
                  <p>{{ tpl.desc }}</p>
                </div>
                <i
                  class="el-icon-circle-check check-icon"
                  v-if="formData.pipelineId === tpl.id"
                ></i>
              </div>
            </div>
          </div>
        </div>

        <div v-show="currentStep === 1" class="step-panel">
          <h3 class="panel-title">步骤 2: 挂载输入数据</h3>
          <p class="step-desc">
            当前展示的是 <b>{{ getSelectedProjectName() }}</b> 空间下的可用文件
          </p>

          <div class="data-selection">
            <el-table
              :data="filteredFiles"
              style="width: 100%"
              @selection-change="handleSelectionChange"
              class="dark-table"
              border
              empty-text="该空间下暂无可用文件，请先前往数据舱上传"
            >
              <el-table-column
                type="selection"
                width="55"
                align="center"
              ></el-table-column>
              <el-table-column label="文件名" prop="name">
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
              <i class="el-icon-warning-outline"></i>
              必须至少勾选一个输入文件才能进行下一步
            </p>
          </div>
        </div>

        <div v-show="currentStep === 2" class="step-panel">
          <h3 class="panel-title">步骤 3: 配置算法参数</h3>
          <el-form
            ref="paramForm"
            :model="formData.params"
            label-position="top"
            class="param-form"
          >
            <el-form-item label="参考基因组 / 目标受体库">
              <el-select
                v-model="formData.params.genome"
                placeholder="请选择核心参考库"
                class="dark-select"
                style="width: 100%"
                popper-class="bio-dark-select-dropdown"
              >
                <el-option
                  label="Homo sapiens (GRCh38/hg38)"
                  value="hg38"
                ></el-option>
                <el-option
                  label="Mus musculus (GRCm39/mm10)"
                  value="mm10"
                ></el-option>
                <el-option
                  label="Danio rerio (GRCz11/danRer11)"
                  value="danRer11"
                ></el-option>
                <el-option
                  label="SARS-CoV-2 (COVID-19 Ref)"
                  value="sars-cov-2"
                ></el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="核心算力资源调配">
              <el-slider
                v-model="formData.params.threads"
                :min="2"
                :max="32"
                :step="2"
                show-stops
              ></el-slider>
              <span class="form-hint"
                >已分配 CPU 核心数: {{ formData.params.threads }} Cores</span
              >
            </el-form-item>

            <el-form-item label="运行模式">
              <el-radio-group
                v-model="formData.params.mode"
                class="dark-radio-group"
              >
                <el-radio-button label="fast">极速摸底</el-radio-button>
                <el-radio-button label="standard">标准精度</el-radio-button>
                <el-radio-button label="deep"
                  >深度挖掘 (耗时较长)</el-radio-button
                >
              </el-radio-group>
            </el-form-item>
          </el-form>
        </div>

        <div v-show="currentStep === 3" class="step-panel">
          <div class="launch-summary">
            <div class="rocket-icon">🚀</div>
            <h3>预检完成，集群就绪</h3>
            <p>您的任务将分配至算力节点，系统会自动进行环境调度。</p>

            <div class="summary-details">
              <div class="summary-item">
                <span class="label">归属空间:</span>
                <span class="value">{{ getSelectedProjectName() }}</span>
              </div>
              <div class="summary-item">
                <span class="label">执行流程:</span>
                <span class="value text-blue">{{
                  getSelectedPipelineName()
                }}</span>
              </div>
              <div class="summary-item">
                <span class="label">输入文件:</span>
                <span class="value text-emerald"
                  >{{ formData.selectedFiles.length }} 个数据包</span
                >
              </div>
              <div class="summary-item">
                <span class="label">参考库环境:</span>
                <span class="value">{{ formData.params.genome }}</span>
              </div>
              <div class="summary-item">
                <span class="label">并发线程:</span>
                <span class="value">{{ formData.params.threads }} Cores</span>
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
            icon="el-icon-s-promotion"
            class="dark-btn-launch"
          >
            {{ submitting ? "正在分配算力..." : "正式发射任务" }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getPipelines, submitAnalysisTask } from "@/api/analysis";
import { getFileList } from "@/api/file"; // 🌟 核心修改 1：引入全量文件接口
import { getUserProjects } from "@/api/project"; // 🌟 核心修改 2：引入项目列表接口
import { mapState, mapGetters } from "vuex";

export default {
  name: "NewAnalysis",
  data() {
    return {
      currentStep: 0,
      submitting: false,

      pipelines: [],
      myFiles: [],
      projectList: [],

      formData: {
        projectId: null, // 🌟 核心新增
        pipelineId: "",
        selectedFiles: [],
        params: {
          genome: "hg38",
          threads: 8,
          mode: "standard",
        },
      },
    };
  },
  computed: {
    ...mapState("user", ["isLoggedIn", "userInfo"]),
    ...mapGetters("user", ["userId"]),

    // 🌟 核心过滤：根据选中的课题，过滤对应的文件！
    filteredFiles() {
      if (!this.formData.projectId) return [];
      return this.myFiles.filter(
        (f) => f.projectId === this.formData.projectId,
      );
    },

    canNext() {
      // 步骤1：必须同时选择课题和流程
      if (this.currentStep === 0) {
        return this.formData.projectId && this.formData.pipelineId !== "";
      }
      // 步骤2：必须挂载文件
      if (this.currentStep === 1) {
        return this.formData.selectedFiles.length > 0;
      }
      return true;
    },
  },

  mounted() {
    this.initData().then(() => {
      
      const preSelectedId = this.$route.query.pipelineId;
      if (preSelectedId) {
        // 将路由里的字符串 ID 转换成数字
        this.formData.pipelineId = Number(preSelectedId); 
      }
    });
  },

  methods: {
    async initData() {
      const currentUid = this.userId || 6;
      try {
        // ================= 1. 获取分析模板 (兼容解析) =================
        const pipelineRes = await getPipelines();
        let pList = [];

        // 暴力剥洋葱：不管嵌套了几层 data，全都剥出来
        if (Array.isArray(pipelineRes)) {
          pList = pipelineRes;
        } else if (pipelineRes && Array.isArray(pipelineRes.data)) {
          pList = pipelineRes.data;
        } else if (
          pipelineRes &&
          pipelineRes.data &&
          Array.isArray(pipelineRes.data.data)
        ) {
          pList = pipelineRes.data.data;
        }

        //只拿后端的真实数字 ID！
        this.pipelines = pList.map((p) => ({
          id: p.id,
          name: p.name || "未命名流程",
          desc: p.description || "暂无流程描述",
          icon: p.icon || "el-icon-data-line",
          color: p.color || "#3b82f6",
        }));

        // ================= 2. 获取用户的课题列表 =================
        const projRes = await getUserProjects(currentUid);
        let projList = [];
        if (Array.isArray(projRes)) projList = projRes;
        else if (projRes && Array.isArray(projRes.data))
          projList = projRes.data;
        else if (projRes && projRes.data && Array.isArray(projRes.data.data))
          projList = projRes.data.data;

        this.projectList = projList;

        // ================= 3. 获取当前用户的所有物理文件 =================
        const fileRes = await getFileList({ userId: currentUid });
        let fList = [];
        if (Array.isArray(fileRes)) fList = fileRes;
        else if (fileRes && Array.isArray(fileRes.data)) fList = fileRes.data;
        else if (fileRes && fileRes.data && Array.isArray(fileRes.data.data))
          fList = fileRes.data.data;

        // 只保留原始上传的数据，踢掉 generate 的产出物
        const rawFiles = fList.filter((f) => f.fileSource !== "generate");

        this.myFiles = rawFiles.map((f) => ({
          id: f.id,
          name: f.originalName,
          projectId: f.projectId,
          size: this.formatFileSize(f.sizeBytes),
          date: this.formatTime(f.uploadTime),
        }));
      } catch (error) {
        this.$message.error("初始化环境失败，请检查网络集群状态");
        console.error(error);
      }
    },

    // 切换项目时，清空之前选中的文件，防止带错数据
    handleProjectChange() {
      this.formData.selectedFiles = [];
    },

    handleSelectionChange(val) {
      this.formData.selectedFiles = val;
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
      return target ? target.name : "未指定";
    },

    getSelectedPipelineName() {
      const target = this.pipelines.find(
        (p) => p.id === this.formData.pipelineId,
      );
      return target ? target.name : "未知流程";
    },

    // 提交任务到引擎
    async submitTask() {
      this.submitting = true;
      try {
        const realFileIds = this.formData.selectedFiles.map((f) => f.id);
        const currentUserId = this.userId || 6;

        // 组装发给后端的 DTO，完全对齐我们的最新架构
        const payload = {
          projectId: this.formData.projectId, // 🌟 传给后端
          pipelineId: this.formData.pipelineId,
          fileIds: realFileIds,
          params: JSON.stringify(this.formData.params), // 转化为 JSON 字符串
        };

        const res = await submitAnalysisTask(payload, currentUserId);

        if (res && res.code === 200) {
          this.$message({
            message: "🎉 任务发射成功！集群算力已分配。",
            type: "success",
            duration: 2000,
          });

          setTimeout(() => {
            this.$router.push("/analysis/tasks"); // 推荐发射完直接跳到任务矩阵中心看进度
          }, 1500);
        } else {
          this.$message.error(res.message || "任务被拦截，请检查参数");
        }
      } catch (error) {
        this.$message.error("核心调度引擎异常，发射失败");
        console.error(error);
      } finally {
        this.submitting = false;
      }
    },

    // 辅助格式化函数
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
/* 保持你的极客暗黑风 */
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

  .back-btn {
    cursor: pointer;
    font-size: 14px;
    color: #94a3b8;
    transition: 0.3s;
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
    i {
      color: #3b82f6;
    }
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

  ::v-deep .el-step__title {
    color: #64748b;
    font-size: 15px;
  }
  ::v-deep .el-step__title.is-process {
    color: #3b82f6;
    font-weight: bold;
  }
  ::v-deep .el-step__title.is-success {
    color: #10b981;
  }
  ::v-deep .el-step__description {
    color: #475569;
  }
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
  .panel-title {
    font-size: 20px;
    margin: 0 0 8px 0;
    font-weight: 500;
    color: #f8fafc;
  }
  .step-desc {
    color: #94a3b8;
    margin-bottom: 24px;
    font-size: 14px;
    b {
      color: #3b82f6;
    }
  }
}

/* Step 1: 流程与空间 */
.config-section {
  margin-bottom: 30px;
  .section-sub-title {
    color: #94a3b8;
    font-size: 15px;
    margin-bottom: 16px;
    i {
      margin-right: 4px;
      color: #3b82f6;
    }
  }
}
.template-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .pipeline-card {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    background: #111827;
    border: 1px solid #334155;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s;
    position: relative;

    &:hover {
      border-color: #4b5563;
      transform: translateX(4px);
    }
    &.is-selected {
      border-color: #3b82f6;
      background: rgba(59, 130, 246, 0.05);
      box-shadow: 0 0 15px rgba(59, 130, 246, 0.15);
    }

    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20px;
      i {
        font-size: 24px;
        color: white;
      }
    }
    .card-info {
      flex: 1;
      h4 {
        margin: 0 0 6px 0;
        font-size: 16px;
        color: #f8fafc;
      }
      p {
        margin: 0;
        font-size: 13px;
        color: #64748b;
      }
    }
    .check-icon {
      position: absolute;
      right: 20px;
      font-size: 24px;
      color: #3b82f6;
    }
  }
}

/* Step 2: 数据表格 */
.data-selection {
  .file-tips {
    color: #f59e0b;
    font-size: 13px;
    margin-top: 16px;
  }

  ::v-deep .dark-table.el-table {
    background-color: transparent !important;
    border: 1px solid #1e293b !important;
    &::before {
      display: none;
    }
    th,
    tr {
      background-color: #111827 !important;
      color: #e2e8f0;
      border-bottom: 1px solid #1e293b !important;
    }
    td {
      border-bottom: 1px solid #1e293b !important;
    }
    .el-table__body tr:hover > td {
      background-color: #1e293b !important;
    }
    .el-table__empty-block {
      background: #111827;
    }
  }
}

/* Step 3: 参数表单 */
.param-form {
  margin-top: 20px;
  ::v-deep .el-form-item__label {
    color: #94a3b8;
    font-weight: 500;
  }
  .form-hint {
    color: #10b981;
    font-size: 12px;
    font-family: Consolas, monospace;
    margin-left: 10px;
  }

  /* 滑块与单选暗黑重写 */
  ::v-deep .dark-radio-group .el-radio-button__inner {
    background: #111827;
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
  ::v-deep .dark-select .el-input__inner {
    background-color: #111827;
    border-color: #334155;
    color: #f8fafc;
  }
}

/* Step 4: 预检完成 */
.launch-summary {
  text-align: center;
  padding: 40px 0;
  .rocket-icon {
    font-size: 80px;
    margin-bottom: 20px;
    animation: float 3s ease-in-out infinite;
  }
  h3 {
    font-size: 24px;
    color: #10b981;
    margin-bottom: 12px;
  }
  p {
    color: #94a3b8;
    margin-bottom: 40px;
  }

  .summary-details {
    max-width: 450px;
    margin: 0 auto;
    background: #111827;
    padding: 24px;
    border-radius: 12px;
    border: 1px solid #1e293b;
    .summary-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 16px;
      font-size: 14px;
      &:last-child {
        margin-bottom: 0;
      }
      .label {
        color: #64748b;
      }
      .value {
        color: #f8fafc;
        font-weight: 500;
        font-family: Consolas, monospace;
      }
      .text-blue {
        color: #3b82f6;
      }
      .text-emerald {
        color: #10b981;
      }
    }
  }
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-15px);
  }
  100% {
    transform: translateY(0px);
  }
}

/* 底部操作 */
.wizard-footer {
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid #1e293b;
  display: flex;
  justify-content: flex-end;
  gap: 16px;

  .dark-btn-cancel {
    background: transparent;
    border: 1px solid #475569;
    color: #94a3b8;
    &:hover {
      border-color: #f8fafc;
      color: #f8fafc;
    }
  }
  .dark-btn-submit {
    background: #1e293b;
    border: 1px solid #3b82f6;
    color: #3b82f6;
    &:hover {
      background: #3b82f6;
      color: #fff;
    }
  }
  .dark-btn-launch {
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
    &:hover {
      transform: translateY(-1px);
    }
  }
}
</style>

<style>
/* 下拉框暗黑覆盖 */
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
