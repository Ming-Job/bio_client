<template>
  <div class="resource-section">
    <div class="container">
      <div class="section-header-center">
        <h2 class="section-title">公共算力与数据矩阵</h2>
        <p class="section-subtitle">Public Compute & Dataset Matrix</p>
      </div>

      <div class="tabs">
        <el-tabs v-model="activeTab" @tab-click="handleTabClick">
          <el-tab-pane label="黄金数据集 (Datasets)" name="datasets"></el-tab-pane>
          <el-tab-pane label="标准分析流 (Pipelines)" name="pipelines"></el-tab-pane>
          <el-tab-pane label="容器镜像 (Images)" name="images"></el-tab-pane>
          <el-tab-pane label="极客脚本 (Scripts)" name="scripts"></el-tab-pane>
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
              <span><i class="el-icon-download"></i> {{ resource.downloads }}</span>
              <span><i class="el-icon-cpu"></i> {{ resource.time }}</span>
            </div>
            <el-button type="primary" size="small" plain class="download-btn">
              克隆至沙箱 (Fork)
            </el-button>
          </div>
        </div>
      </div>

      <div class="quick-links">
        <h3><i class="el-icon-position"></i> 系统快速入口</h3>
        <div class="links-grid">
          <el-button
            v-for="link in quickLinks"
            :key="link.text"
            type="text"
            @click="$router.push(link.url)"
          >
            <i :class="link.icon"></i> {{ link.text }}
          </el-button>
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
          { title: "TCGA 肺癌表达量矩阵", description: "包含 500+ 肿瘤/正常样本的标准化 TPM 表达量矩阵与临床表型数据。", icon: "el-icon-data-line", downloads: "3.2k 次克隆", time: "15.4 MB" },
          { title: "16S 肠道微生物数据", description: "Mock 菌群群落原始 FASTQ 序列，用于流程性能基准测试。", icon: "el-icon-files", downloads: "1.8k 次克隆", time: "2.1 GB" },
          { title: "GSE1234 单细胞测序集", description: "小鼠大脑皮层 10X Genomics 单细胞基因表达计数矩阵。", icon: "el-icon-document", downloads: "950 次克隆", time: "850 MB" }
        ],
        pipelines: [
          { title: "AutoDock Vina 虚拟筛选", description: "高通量分子对接流水线，自动处理 PDBQT 转换与结合能计算。", icon: "el-icon-set-up", downloads: "4.5k 次调用", time: "CPU/GPU 混合" },
          { title: "CellRanger 定量分析流", description: "标准的 10X 单细胞上游比对与定量计算工作流。", icon: "el-icon-guide", downloads: "1.2k 次调用", time: "高内存集群" }
        ],
        images: [
          { title: "Rocker / R-Base (v4.3)", description: "预装 ggplot2, DESeq2, clusterProfiler 等核心包的沙箱镜像。", icon: "el-icon-box", downloads: "系统内置", time: "秒级启动" },
          { title: "Python Data Science (3.9)", description: "包含 Pandas, SciPy, Scikit-learn 的全能数据科学环境。", icon: "el-icon-cpu", downloads: "系统内置", time: "秒级启动" }
        ],
        scripts: [
          { title: "Python 火山图渲染脚本", description: "使用 Matplotlib 动态绘制高颜值差异表达火山图的标准模板。", icon: "el-icon-document-copy", downloads: "9k+ 复制", time: "100 行代码" },
          { title: "R 语言 GO/KEGG 富集分析", description: "标准的 clusterProfiler 富集分析与气泡图出图脚本。", icon: "el-icon-magic-stick", downloads: "5k+ 复制", time: "120 行代码" }
        ],
      },
      quickLinks: [
        { text: "进入极客沙箱", icon: "el-icon-monitor", url: "/assistant" },
        { text: "我的 Workspace", icon: "el-icon-folder", url: "/project" },
        { text: "案例广场", icon: "el-icon-discover", url: "/case" },
        { text: "API 开发者文档", icon: "el-icon-document", url: "/help" },
      ],
    };
  },
  methods: { handleTabClick() {} }
};
</script>

<style scoped>
.resource-section { padding: 60px 20px; background-color: #ffffff; }
.container { max-width: 1200px; margin: 0 auto; }
.section-header-center { text-align: center; margin-bottom: 40px; }
.section-title { font-size: 2.2rem; color: #111827; margin: 0 0 10px 0; font-weight: 700; }
.section-subtitle { color: #6b7280; font-family: Consolas, monospace; margin: 0; text-transform: uppercase;}
.tabs { margin-bottom: 30px; }
::v-deep .el-tabs__item { font-size: 16px; font-weight: 500; height: 50px; line-height: 50px; }

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 50px;
}

.resource-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: flex-start;
  transition: all 0.3s ease;
}

.resource-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.05);
  border-color: #cbd5e1;
  background: #ffffff;
}

.resource-icon {
  width: 54px; height: 54px;
  background: #121314; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  margin-right: 16px; flex-shrink: 0;
}
.resource-icon i { font-size: 24px; color: #3b82f6; }

.resource-info { flex: 1; }
.resource-info h4 { margin: 0 0 8px 0; color: #1f2937; font-size: 1.1rem; }
.resource-info p { color: #64748b; font-size: 0.9rem; margin-bottom: 16px; line-height: 1.5; min-height: 40px;}
.resource-meta { display: flex; gap: 20px; margin-bottom: 16px; color: #94a3b8; font-size: 0.85rem; font-family: Consolas, monospace;}
.download-btn { border-radius: 6px; font-weight: bold; }

.quick-links { background: #f8fafc; border-radius: 12px; padding: 30px; border: 1px dashed #cbd5e1; }
.quick-links h3 { text-align: center; margin: 0 0 25px 0; color: #374151; font-size: 1.2rem;}
.links-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; }
.links-grid .el-button { justify-content: flex-start; padding: 12px 20px; border-radius: 8px; color: #4b5563; font-weight: 600; background: #fff; border: 1px solid #e2e8f0; }
.links-grid .el-button:hover { color: #3b82f6; border-color: #3b82f6; background: #eff6ff; transform: translateY(-2px); }
</style>