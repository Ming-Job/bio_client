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
            title="选择流程"
            description="选定生信分析 Pipeline"
          ></el-step>
          <el-step
            title="挂载数据"
            description="选择需要计算的测序文件"
          ></el-step>
          <el-step title="配置参数" description="设置质控与计算阈值"></el-step>
          <el-step title="预检发射" description="确认信息并提交集群"></el-step>
        </el-steps>
      </div>

      <div class="wizard-content">
        <div v-show="currentStep === 0" class="step-panel">
          <h3 class="panel-title">选择要执行的分析流程</h3>
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

        <div v-show="currentStep === 1" class="step-panel">
          <h3 class="panel-title">挂载云端数据舱文件</h3>
          <div class="data-selection">
            <el-table
              :data="myFiles"
              style="width: 100%"
              @selection-change="handleSelectionChange"
              class="dark-table"
              border
            >
              <el-table-column
                type="selection"
                width="55"
                align="center"
              ></el-table-column>
              <el-table-column label="文件名" prop="name">
                <template slot-scope="scope">
                  <i class="el-icon-document"></i>
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
              <i class="el-icon-warning-outline"></i> 请至少选择一个输入文件
            </p>
          </div>
        </div>

        <div v-show="currentStep === 2" class="step-panel">
          <h3 class="panel-title">配置算法参数</h3>
          <el-form
            ref="paramForm"
            :model="formData.params"
            label-width="120px"
            class="param-form"
          >
            <el-form-item label="参考基因组">
              <el-select
                v-model="formData.params.genome"
                placeholder="请选择参考基因组"
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
              </el-select>
            </el-form-item>
            <el-form-item label="差异表达阈值">
              <div class="slider-box">
                <span>P-value &lt; {{ formData.params.pvalue }}</span>
                <el-slider
                  v-model="formData.params.pvalue"
                  :step="0.01"
                  :max="0.1"
                  :min="0.01"
                ></el-slider>
              </div>
            </el-form-item>
            <el-form-item label="Fold Change">
              <el-input-number
                v-model="formData.params.foldChange"
                :min="1"
                :max="10"
                :step="0.5"
              ></el-input-number>
              <span class="form-hint"> |log2FC| 阈值设定</span>
            </el-form-item>
            <el-form-item label="运行模式">
              <el-radio-group v-model="formData.params.mode">
                <el-radio label="fast">极速模式 (省资源)</el-radio>
                <el-radio label="standard">标准模式</el-radio>
                <el-radio label="deep">深度挖掘 (耗时较长)</el-radio>
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
                <span class="label">执行流程:</span>
                <span class="value">{{ getSelectedPipelineName() }}</span>
              </div>
              <div class="summary-item">
                <span class="label">输入文件:</span>
                <span class="value"
                  >{{ formData.selectedFiles.length }} 个数据包</span
                >
              </div>
              <div class="summary-item">
                <span class="label">参考基因组:</span>
                <span class="value">{{ formData.params.genome }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="wizard-footer">
          <el-button @click="prevStep" v-if="currentStep > 0" plain
            >上一步</el-button
          >

          <el-button
            type="primary"
            @click="nextStep"
            v-if="currentStep < 3"
            :disabled="!canNext"
          >
            下一步
          </el-button>

          <el-button
            type="success"
            @click="submitTask"
            v-if="currentStep === 3"
            :loading="submitting"
            icon="el-icon-s-promotion"
          >
            {{ submitting ? "正在分配算力..." : "正式发射任务" }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// 🌟 从我们统一管理的 api 文件中导入方法
import {
  getPipelines,
  getRecentFiles,
  submitAnalysisTask,
} from "@/api/analysis";
import { mapState, mapGetters } from "vuex";

export default {
  name: "NewAnalysis",
  data() {
    return {
      currentStep: 0,
      submitting: false,

      // 等待后端赋予真实的灵魂
      pipelines: [],
      myFiles: [],

      // 用户填写的表单数据
      formData: {
        pipelineId: "",
        selectedFiles: [],
        params: {
          genome: "hg38",
          pvalue: 0.05,
          foldChange: 2,
          mode: "standard",
        },
      },
    };
  },
  computed: {
    // 拿到全局存储的用户信息
    ...mapState("user", ["isLoggedIn", "userInfo"]),
    ...mapGetters("user", ["userId"]),

    // 表单向导的防呆校验
    canNext() {
      if (this.currentStep === 0) return this.formData.pipelineId !== "";
      if (this.currentStep === 1) return this.formData.selectedFiles.length > 0;
      return true;
    },
  },

  mounted() {
    // 组件一挂载，就去后端拉取数据
    this.initData();
  },

  methods: {
    // 🌟 初始化，拉取真实的流模板和文件
    async initData() {
      try {
        // 1. 获取分析模板
        const pipelineRes = await getPipelines();
        if (pipelineRes.data && pipelineRes.data.code === 200) {
          this.pipelines = pipelineRes.data.data.map((p) => ({
            id: p.pipelineCode,
            name: p.name,
            desc: p.description,
            icon: p.icon,
            color: p.color,
          }));
        }

        // 2. 获取当前用户的文件
        const currentUserId = this.userId || 6;
        const fileRes = await getRecentFiles(currentUserId);

        if (fileRes.data && fileRes.data.code === 200) {
          this.myFiles = fileRes.data.data.map((f) => ({
            id: f.id,
            name: f.originalName,
            size: (f.sizeBytes / (1024 * 1024)).toFixed(2) + " MB",
            date: f.uploadTime,
          }));
        }
      } catch (error) {
        this.$message.error("初始化数据失败，请检查网络或后端状态！");
        console.error(error);
      }
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

    getSelectedPipelineName() {
      const target = this.pipelines.find(
        (p) => p.id === this.formData.pipelineId,
      );
      return target ? target.name : "未知";
    },

    // 🌟 最核心的请求：提交任务给后端
    async submitTask() {
      this.submitting = true;
      try {
        // 只把选中的真实 File ID 提取出来
        const realFileIds = this.formData.selectedFiles.map((f) => f.id);
        const currentUserId = this.userId || 6;

        // 组装要发给后端的 DTO 载体
        const payload = {
          pipelineCode: this.formData.pipelineId,
          fileIds: realFileIds,
          params: this.formData.params,
        };

        // 调用接口 (我们前面在 api/analysis.js 里写好的)
        const res = await submitAnalysisTask(payload, currentUserId);

        if (res.data && res.data.code === 200) {
          this.$message({
            message: "🎉 任务发射成功！计算集群已接管。",
            type: "success",
            duration: 2000,
          });

          // 提交成功，休息一秒让用户看看绿色的勾，然后跳回控制台主页看进度！
          setTimeout(() => {
            this.$router.push("/analysis");
          }, 1000);
        } else {
          this.$message.error(res.data.message || "提交失败");
        }
      } catch (error) {
        this.$message.error("发射异常，请检查控制台或网络！");
        console.error(error);
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.new-analysis-container {
  min-height: calc(100vh - 60px);
  background-color: #0f172a;
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
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 16px;
  display: flex;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.wizard-sidebar {
  width: 240px;
  padding: 40px 30px;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border-right: 1px solid #334155;

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
}

.step-panel {
  flex: 1;
  min-height: 400px;
  .panel-title {
    font-size: 20px;
    margin: 0 0 24px 0;
    font-weight: 500;
  }
}

/* Step 1: 流程卡片 */
.template-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .pipeline-card {
    display: flex;
    align-items: center;
    padding: 20px;
    background: #0f172a;
    border: 2px solid #334155;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s;
    position: relative;

    &:hover {
      border-color: #475569;
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
        color: #94a3b8;
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

  ::v-deep .el-table {
    background-color: transparent !important;
    &::before {
      display: none;
    }
    th,
    tr {
      background-color: #0f172a !important;
      color: #e2e8f0;
      border-color: #334155 !important;
    }
    td {
      border-color: #334155 !important;
    }
    .el-table__body tr:hover > td {
      background-color: #1e293b !important;
    }
  }
}

/* Step 3: 参数表单 */
.param-form {
  ::v-deep .el-form-item__label {
    color: #e2e8f0;
  }
  .slider-box {
    display: flex;
    align-items: center;
    gap: 20px;
    span {
      width: 120px;
      color: #3b82f6;
      font-weight: bold;
    }
    .el-slider {
      flex: 1;
    }
  }
  .form-hint {
    color: #94a3b8;
    font-size: 12px;
    margin-left: 10px;
  }
  ::v-deep .el-radio__label {
    color: #cbd5e1;
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
    max-width: 400px;
    margin: 0 auto;
    background: #0f172a;
    padding: 24px;
    border-radius: 12px;
    border: 1px solid #334155;
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
  padding-top: 20px;
  border-top: 1px solid #334155;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}
</style>
