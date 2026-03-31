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
        <el-steps :active="0" direction="vertical" finish-status="success">
          <el-step title="基础配置" description="选择项目与分析领域"></el-step>
          <el-step
            title="专业向导"
            description="进入对应领域的配置空间"
          ></el-step>
        </el-steps>
      </div>

      <div class="wizard-content">
        <div class="step-panel">
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

        <div class="wizard-footer">
          <el-button
            type="primary"
            @click="handleNext"
            :disabled="!formData.projectId || !formData.pipelineId"
            class="dark-btn-submit"
          >
            下一步：进入专业向导 <i class="el-icon-right"></i>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getPipelines } from "@/api/analysis";
import { getUserProjects } from "@/api/project";
import { mapGetters } from "vuex";

export default {
  name: "NewAnalysis",
  data() {
    return {
      projectList: [],
      pipelines: [],
      formData: { projectId: null, pipelineId: "" },
    };
  },
  computed: { ...mapGetters("user", ["userId"]) },
  mounted() {
    this.initData();
  },
  methods: {
    async initData() {
      const uid = this.userId || 6;
      try {
        const [pipeRes, projRes] = await Promise.all([
          getPipelines(),
          getUserProjects(uid),
        ]);
        this.pipelines = pipeRes.data?.data || pipeRes.data || [];
        this.projectList = projRes.data?.data || projRes.data || [];
      } catch (e) {
        this.$message.error("数据加载失败");
      }
    },
    formatCategory(c) {
      const m = {
        genomics: "基因组",
        transcriptomics: "转录组",
        proteomics: "蛋白质组",
        // 🌟 新增：显示微生物组的中文标签
        microbiome: "微生物组",
      };
      return m[c] || c;
    },
    handleNext() {
      const selected = this.pipelines.find(
        (p) => p.id === this.formData.pipelineId,
      );

      // 🌟 新增：根据领域类型进行精准的路由分发
      let targetPath = "/analysis/rna-wizard"; // 默认指向转录组

      if (selected.category === "genomics") {
        targetPath = "/analysis/gwas-wizard";
      } else if (selected.category === "microbiome") {
        targetPath = "/analysis/microbiome-wizard"; // 指向刚刚新建的 16S 向导页
      }

      this.$router.push({
        path: targetPath,
        query: {
          projectId: this.formData.projectId,
          pipelineId: this.formData.pipelineId,
        },
      });
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
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
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
  font-size: 20px;
  margin-bottom: 25px;
}
.config-section {
  margin-bottom: 30px;
}
.section-sub-title {
  color: #94a3b8;
  margin-bottom: 15px;
  i {
    color: #3b82f6;
    margin-right: 8px;
  }
}
.template-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.pipeline-card {
  padding: 20px;
  background: #111827;
  border: 1px solid #334155;
  border-radius: 12px;
  cursor: pointer;
  transition: 0.3s;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.pipeline-card:hover {
  border-color: #4b5563;
}
.pipeline-card.is-selected {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.08);
}
.card-info h4 {
  margin: 0 0 8px 0;
  color: #f8fafc;
}
.card-info p {
  margin: 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.4;
}
.check-icon {
  font-size: 20px;
  color: #3b82f6;
}
.wizard-footer {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #1e293b;
  display: flex;
  justify-content: flex-end;
}
.dark-btn-submit {
  background: #3b82f6;
  border: none;
  color: white;
  padding: 12px 30px;
  border-radius: 8px;
}
</style>
