<template>
  <div class="resource-section">
    <div class="container">
      <div class="section-header-center">
        <h2 class="section-title">内置资源矩阵</h2>
        <p class="section-subtitle">Datasets & Pipelines</p>
      </div>

      <div class="tabs">
        <el-tabs v-model="activeTab">
          <el-tab-pane
            label="演示数据集 (Datasets)"
            name="datasets"
          ></el-tab-pane>
          <el-tab-pane
            label="标准分析流 (Pipelines)"
            name="pipelines"
          ></el-tab-pane>
        </el-tabs>
      </div>

      <div class="resource-grid">
        <div
          v-for="(resource, index) in resources[activeTab]"
          :key="index"
          class="resource-item"
        >
          <div class="resource-icon">
            <i :class="resource.icon"></i>
          </div>
          <div class="resource-info">
            <h4>{{ resource.title }}</h4>
            <p>{{ resource.description }}</p>
            <div class="resource-meta">
              <span><i class="el-icon-collection-tag"></i> 系统内置</span>
              <span
                ><i class="el-icon-document"></i> {{ resource.format }}</span
              >
            </div>
            <el-button
              type="primary"
              size="small"
              plain
              class="download-btn"
              @click="$router.push(resource.link)"
            >
              {{ resource.btnText }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ResourceGrid",
  data() {
    return {
      activeTab: "datasets",
      resources: {
        datasets: [
          {
            title: "RNA-Seq 质控对照样本",
            description:
              "包含原始测序片段的 FASTQ 样本数据，用于 RNA-Seq 上游分析流程的运行测试。",
            icon: "el-icon-document",
            format: "FASTQ 格式",
            link: "/analysis/new",
            btnText: "去运行上游分析",
          },
          {
            title: "标准基因表达矩阵",
            description:
              "经过上游定量生成的 Count/TPM 表达矩阵，用于差异表达分析 (Differential Expression)。",
            icon: "el-icon-data-analysis",
            format: "CSV/TXT 矩阵",
            link: "/analysis/diff",
            btnText: "去运行差异分析",
          },
          {
            title: "大分子三维结构文件",
            description:
              "支持 PDB / SDF / MOL2 等格式，用于在工作台进行 360 度交互式渲染预览。",
            icon: "el-icon-view",
            format: "空间坐标数据",
            link: "/analysis",
            btnText: "去工作台预览",
          },
        ],
        pipelines: [
          {
            title: "RNA-Seq 上游分析标准流",
            description:
              "整合质控与序列比对的标准流水线，将测序文件自动化处理为可用的表达矩阵。",
            icon: "el-icon-video-play",
            format: "自动化流水线",
            link: "/analysis/new",
            btnText: "载入分析流",
          },
          {
            title: "差异表达基因 (DEG) 分析",
            description:
              "针对表达量矩阵进行组间差异基因计算，产出标准的上下调统计数据与绘图基础。",
            icon: "el-icon-s-data",
            format: "统计算法",
            link: "/analysis/diff",
            btnText: "载入分析流",
          },
        ],
      },
    };
  },
};
</script>

<style scoped>
/* 纯净亮色风背景 */
.resource-section {
  padding: 60px 20px;
  background-color: #ffffff;
}
.container {
  max-width: 1200px;
  margin: 0 auto;
}
.section-header-center {
  text-align: center;
  margin-bottom: 40px;
}
.section-title {
  font-size: 2.2rem;
  color: #111827;
  margin: 0 0 10px 0;
  font-weight: 700;
}
.section-subtitle {
  color: #6b7280;
  font-family: Consolas, monospace;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.tabs {
  margin-bottom: 30px;
}
::v-deep .el-tabs__item {
  font-size: 16px;
  font-weight: 500;
  height: 50px;
  line-height: 50px;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.resource-item {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: flex-start;
  transition: all 0.3s ease;
}

.resource-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
  border-color: #d1d5db;
}

.resource-icon {
  width: 54px;
  height: 54px;
  background: #eff6ff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
}
.resource-icon i {
  font-size: 24px;
  color: #3b82f6;
}

.resource-info {
  flex: 1;
}
.resource-info h4 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 1.1rem;
}
.resource-info p {
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 16px;
  line-height: 1.6;
  min-height: 60px;
}
.resource-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  color: #9ca3af;
  font-size: 0.85rem;
  font-family: Consolas, monospace;
}
.download-btn {
  border-radius: 6px;
  font-weight: 600;
}
</style>
