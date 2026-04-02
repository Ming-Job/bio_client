<template>
  <div class="resource-section">
    <div class="container">
      <div class="section-header-center">
        <h2 class="section-title">核心分析引擎</h2>
        <p class="section-subtitle">Standard Pipelines & Copilot</p>
      </div>

      <div class="resource-grid">
        <div
          v-for="(resource, index) in pipelines"
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
              <span><i class="el-icon-cpu"></i> {{ resource.format }}</span>
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
      // 直接砍掉 tabs，只保留真实跑得通的四大核心流水线
      pipelines: [
        {
          title: "RNA-Seq 端到端全流程",
          description:
            "自动化串联 fastp 清洗、HISAT2 比对与特征定量。后台 Docker 沙盒动态生成脚本，无缝衔接多样本 DESeq2 计算。",
          icon: "el-icon-set-up",
          format: "Shell / Python",
          link: "/analysis/new",
          btnText: "载入分析流",
        },
        {
          title: "全基因组关联分析 (E2E GWAS)",
          description:
            "整合 GATK4 单样本处理、多样本联合 Calling (GVCF) 与 PLINK 质控，采用 vcf2gwas (LMM 模型) 极速生成曼哈顿图矩阵。",
          icon: "el-icon-cpu",
          format: "GATK4 / LMM",
          link: "/analysis/new",
          btnText: "载入分析流",
        },
        {
          title: "16S 扩增子物种多样性分析",
          description:
            "基于 QIIME2 与 VSEARCH 双核引擎，自动执行双端拼接、去嵌合体、OTU 聚类 (97%) 与 Silva 数据库物种注释。",
          icon: "el-icon-data-analysis",
          format: "QIIME2 / VSEARCH",
          link: "/analysis/new",
          btnText: "载入分析流",
        },
      ],
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
  min-height: 80px;
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
