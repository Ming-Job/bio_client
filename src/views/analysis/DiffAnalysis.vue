<template>
  <div class="bio-os-container">
    <div class="bio-main">
      <header class="console-header">
        <div class="greeting">
          <h2 class="title">
            <i class="el-icon-data-analysis"></i> 差异表达分析 (多样本 DESeq2)
          </h2>
          <p class="subtitle">
            选择多组已完成的 RNA-Seq 任务进行对撞比对，提取显著表达变化的基因。
          </p>
        </div>
        <el-button plain size="small" @click="$router.go(-1)" class="back-btn">
          <i class="el-icon-back"></i> 返回工作台
        </el-button>
      </header>

      <div class="bento-panel control-panel">
        <div class="panel-header">
          <h3><i class="el-icon-set-up"></i> 设定对比逻辑 (Contrast Setup)</h3>
        </div>
        <div class="select-group">
          <div class="select-item">
            <span class="label">对照组 (Control):</span>
            <el-select
              v-model="controlTaskIds"
              multiple
              placeholder="请选择 3 个以上任务"
              class="dark-select"
              popper-class="bio-dark-select-dropdown"
            >
              <el-option
                v-for="task in completedTasks"
                :key="task.id"
                :label="`[任务 ${task.id}] ${task.taskName}`"
                :value="task.id"
              ></el-option>
            </el-select>
          </div>

          <div class="vs-badge">VS</div>

          <div class="select-item">
            <span class="label text-treat">处理组 (Treat):</span>
            <el-select
              v-model="treatTaskIds"
              multiple
              placeholder="请选择 3 个以上任务"
              class="dark-select"
              popper-class="bio-dark-select-dropdown"
            >
              <el-option
                v-for="task in completedTasks"
                :key="task.id"
                :label="`[任务 ${task.id}] ${task.taskName}`"
                :value="task.id"
              ></el-option>
            </el-select>
          </div>

          <el-button
            type="primary"
            class="run-btn"
            :loading="isCalculating"
            @click="runDifferentialAnalysis"
          >
            <i class="el-icon-cpu"></i> 启动差异计算
          </el-button>
        </div>
      </div>

      <div
        class="bento-panel chart-panel"
        v-loading="isDrawing"
        element-loading-background="rgba(17, 24, 39, 0.8)"
      >
        <div class="panel-header">
          <h3><i class="el-icon-pie-chart"></i> 火山图可视化 (Volcano Plot)</h3>
          <div class="header-actions">
            <el-tag size="mini" effect="dark" type="info"
              >|Log2FC| > 1.0 定义为显著</el-tag
            >
            <el-button
              v-if="hasData"
              type="success"
              size="mini"
              icon="el-icon-download"
              style="margin-left: 12px"
              @click="exportToCSV"
              >导出差异分析报表 (CSV)</el-button
            >
          </div>
        </div>

        <div v-if="!hasData" class="empty-stage">
          <i class="el-icon-data-line empty-icon"></i>
          <p>请在上方设定对照组和处理组并执行计算</p>
        </div>

        <div v-if="hasData" id="volcano-chart" class="chart-container"></div>
      </div>
    </div>
  </div>
</template>

<script>
import request from "@/api/request";
import { getTaskPage } from "@/api/analysis";
import * as echarts from "echarts";
import { mapGetters } from "vuex";

export default {
  name: "DiffAnalysis",
  data() {
    return {
      controlTaskIds: [], // 数组
      treatTaskIds: [], // 数组
      completedTasks: [],
      isCalculating: false,
      isDrawing: false,
      hasData: false,
      myChart: null,
      lastRawData: [], // 🌟 新增：用于存储最近一次分析的原始数据报表
    };
  },
  computed: { ...mapGetters("user", ["userId"]) },
  mounted() {
    this.fetchCompletedTasks();
    window.addEventListener("resize", this.handleResize);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.handleResize);
    if (this.myChart) this.myChart.dispose();
  },
  methods: {
    handleResize() {
      if (this.myChart) this.myChart.resize();
    },

    async fetchCompletedTasks() {
      try {
        const res = await getTaskPage(
          { page: 1, size: 50, status: "COMPLETED" },
          this.userId,
        );
        if (res && res.code === 200) {
          this.completedTasks = res.data.records;
        }
      } catch (e) {
        this.$message.error("拉取任务列表失败");
      }
    },

    async runDifferentialAnalysis() {
      // 强制要求生物学重复 >= 3
      if (
        !this.controlTaskIds ||
        this.controlTaskIds.length < 3 ||
        !this.treatTaskIds ||
        this.treatTaskIds.length < 3
      ) {
        return this.$message.warning(
          "为了统计学严谨，对照组和处理组请至少各选 3 个任务！",
        );
      }

      this.isCalculating = true;
      try {
        const res = await request({
          url: "/api/analysis/tasks/diff",
          method: "post",
          data: {
            controlTaskIds: this.controlTaskIds,
            treatTaskIds: this.treatTaskIds,
          },
          headers: { userId: this.userId },
        });

        if (res && res.code === 200) {
          this.$message.success("跨语言 Python 沙盒计算成功，正在提取数据...");
          await this.fetchChartData();
        } else {
          this.$message.error(res.message || "计算失败");
        }
      } catch (e) {
        this.$message.error("系统异常");
      } finally {
        this.isCalculating = false;
      }
    },

    async fetchChartData() {
      this.isDrawing = true;
      try {
        const res = await request({
          url: "/api/analysis/tasks/diff/result",
          method: "get",
          params: {
            controlId: this.controlTaskIds[0],
            treatId: this.treatTaskIds[0],
          },
          headers: { userId: this.userId },
        });

        if (res && res.code === 200) {
          const rawData = Array.isArray(res.data) ? res.data : [];
          this.lastRawData = rawData; // 🌟 核心修改：备份一份原始数据用于表格导出
          this.hasData = true;
          this.$nextTick(() => {
            this.renderVolcanoPlot(rawData);
          });
        }
      } catch (e) {
        this.$message.error("提取图表数据失败");
      } finally {
        this.isDrawing = false;
      }
    },

    // 防弹版 Echarts 渲染逻辑
    renderVolcanoPlot(data) {
      console.log("【排错探针】后端传来的原始图表数据：", data);

      if (!document.getElementById("volcano-chart")) {
        console.error("【致命错误】找不到图表容器的 DOM 节点！");
        return;
      }

      if (this.myChart) {
        this.myChart.dispose();
      }
      this.myChart = echarts.init(document.getElementById("volcano-chart"));

      const scatterData = data.map((item) => {
        const x = parseFloat(
          item.log2FoldChange ||
            item.log2_fold_change ||
            item.log2foldchange ||
            0,
        );
        const pVal = parseFloat(
          item.pValue || item.p_value || item.pvalue || 1.0,
        );

        let category = 0; // 0=灰(不显著), 1=红(显著上调), 2=蓝(显著下调)
        const y = -Math.log10(pVal);

        if (x >= 2.0) category = 1;
        else if (x <= -2.0) category = 2;

        return [x, y, item.geneId || "Unknown", category];
      });

      console.log("【排错探针】喂给 Echarts 的散点数组：", scatterData);

      const option = {
        backgroundColor: "transparent",

        // 🌟 保存图片功能
        toolbox: {
          show: true,
          right: "5%",
          top: "2%",
          feature: {
            saveAsImage: {
              show: true,
              title: "保存为高清图",
              type: "png", // 导出格式
              pixelRatio: 2, // 🌟 关键：2倍像素，保证图片打印到论文里也是清晰的
              backgroundColor: "#0b0f19", // 设置导出图片的背景色，匹配你的暗黑主题
              name: `火山图_任务_${this.controlTaskIds[0]}_VS_${this.treatTaskIds[0]}`,
            },
          },
          iconStyle: {
            borderColor: "#94a3b8", // 图标颜色
          },
        },
        tooltip: {
          trigger: "item",
          backgroundColor: "rgba(15, 23, 42, 0.9)",
          borderColor: "#334155",
          textStyle: { color: "#f8fafc" },
          formatter: function (params) {
            return `
              <b>Gene:</b> ${params.data[2]} <br/>
              <b>Log2FC:</b> ${params.data[0].toFixed(2)} <br/>
              <b>-Log10(P):</b> ${params.data[1].toFixed(2)}
            `;
          },
        },
        xAxis: {
          name: "Log2 Fold Change",
          nameTextStyle: { color: "#94a3b8" },
          splitLine: {
            show: true,
            lineStyle: { color: "#1e293b", type: "dashed" },
          },
          axisLabel: { color: "#94a3b8" },
        },
        yAxis: {
          name: "-Log10(P-value)",
          nameTextStyle: { color: "#94a3b8" },
          min: -0.5,
          // 🌟 这里已经去掉了 max: 2.0，Y 轴完全解放
          splitLine: {
            show: true,
            lineStyle: { color: "#1e293b", type: "dashed" },
          },
          axisLabel: { color: "#94a3b8" },
        },
        series: [
          {
            type: "scatter",
            symbolSize: 8, // 点可以稍微调小一点，显得更密集
            data: scatterData,
            itemStyle: {
              color: function (params) {
                const category = params.data[3];
                if (category === 1) return "#ef4444"; // 红色上调
                if (category === 2) return "#3b82f6"; // 蓝色下调
                return "#64748b"; // 灰色不显著
              },
            },
            // 🌟 新增：科研级阈值参考线 (完美复刻文献画风)
            markLine: {
              silent: true, // 鼠标移上去不触发交互
              symbol: ["none", "none"], // 去掉线两端的箭头
              lineStyle: {
                color: "#94a3b8",
                type: "dashed",
                width: 1,
                opacity: 0.8,
              },
              data: [
                // 垂直线：Log2FC = 1.0 (即上调 2 倍)
                {
                  xAxis: 1.0,
                  label: {
                    formatter: "FC=2",
                    position: "insideStartTop",
                    color: "#f8fafc",
                  },
                },
                // 垂直线：Log2FC = -1.0 (即下调 2 倍，0.5)
                {
                  xAxis: -1.0,
                  label: {
                    formatter: "FC=0.5",
                    position: "insideStartTop",
                    color: "#f8fafc",
                  },
                },
                // 水平线：-Log10(P) = 1.30 (即 P-value = 0.05 的显著性门槛)
                {
                  yAxis: 1.3,
                  label: {
                    formatter: "P=0.05",
                    position: "insideEndTop",
                    color: "#f8fafc",
                  },
                },
              ],
            },
          },
        ],
      };

      this.myChart.setOption(option);

      setTimeout(() => {
        if (this.myChart) {
          this.myChart.resize();
        }
      }, 300);
    },

    // 🌟 导出 CSV：增加了字段名兼容性处理，确保与绘图完全对齐
    exportToCSV() {
      if (this.lastRawData.length === 0) {
        return this.$message.warning("暂无差异分析数据可供导出");
      }

      let csvContent = "\ufeff";
      csvContent += "GeneID,Log2FoldChange,P-Value,Significance\n";

      this.lastRawData.forEach((item) => {
        // 关键点：这里必须使用和绘图函数完全一致的字段提取逻辑
        const x = parseFloat(
          item.log2FoldChange ||
            item.log2_fold_change ||
            item.log2foldchange ||
            0,
        );
        const p = parseFloat(item.pValue || item.p_value || item.pvalue || 1.0);

        let status = "Not-Significant";
        // 判定标准：P <= 0.05 且 |Log2FC| >= 1.0 (对应 FC=2)
        if (p <= 0.05) {
          if (x >= 1.0) status = "Up-regulated";
          else if (x <= -1.0) status = "Down-regulated";
        }

        // 科学计数法导出 P 值，保证专业度
        csvContent += `${item.geneId || item.gene_id},${x.toFixed(
          4,
        )},${p.toExponential(4)},${status}\n`;
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `Diff_Report_${new Date().getTime()}.csv`);
      link.click();
      this.$message.success("报表导出成功，请查看下载结果");
    },
  },
};
</script>

<style lang="scss" scoped>
/* 保持完美暗黑风格不变 */
.bio-os-container {
  min-height: calc(100vh - 60px);
  background-color: #0b0f19;
  padding: 30px 20px;
  color: #e2e8f0;
}
.bio-main {
  max-width: 1200px;
  margin: 0 auto;
}
.console-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  .title {
    margin: 0;
    font-size: 24px;
    color: #f8fafc;
  }
  .subtitle {
    color: #64748b;
    font-size: 14px;
    margin-top: 8px;
  }
  .back-btn {
    background: #1f2937;
    border-color: #374151;
    color: #e2e8f0;
  }
}
.bento-panel {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  .panel-header h3 {
    margin: 0;
    font-size: 16px;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
.control-panel .select-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-top: 20px;
  background: #0f172a;
  padding: 30px;
  border-radius: 8px;
  border: 1px dashed #334155;
}
.control-panel .select-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  .label {
    font-size: 13px;
    color: #10b981;
    font-weight: bold;
  }
  .text-treat {
    color: #3b82f6;
  }
  ::v-deep .el-input__inner {
    background-color: #1e293b;
    border-color: #334155;
    color: #f8fafc;
    width: 260px;
  }
}
.vs-badge {
  font-size: 20px;
  font-weight: 900;
  color: #475569;
  margin-top: 20px;
  font-style: italic;
}
.run-btn {
  margin-top: 24px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
}
.chart-panel .chart-container {
  width: 100%;
  height: 500px;
  margin-top: 20px;
}
.chart-panel .empty-stage {
  height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #64748b;
  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
    color: #3b82f6;
  }
}
</style>

<style>
/* 下拉框暗黑模式 */
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
