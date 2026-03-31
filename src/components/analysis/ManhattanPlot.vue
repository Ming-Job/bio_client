<template>
  <div class="gwas-chart-container">
    <div class="chart-header">
      <h3 class="title">
        <i class="el-icon-data-analysis"></i> 全基因组关联分析 - 曼哈顿图
        (Manhattan Plot)
      </h3>
      <div class="controls">
        <el-button size="mini" icon="el-icon-refresh" @click="fetchData"
          >刷新视图</el-button
        >
        <el-button
          size="mini"
          type="primary"
          icon="el-icon-download"
          @click="downloadChart"
          >导出高清大图</el-button
        >
      </div>
    </div>

    <div
      ref="chartRef"
      class="manhattan-chart"
      v-loading="loading"
      element-loading-text="全基因组 SNP 散点渲染中..."
      element-loading-background="rgba(11, 15, 25, 0.8)"
    ></div>
  </div>
</template>
<script>
import * as echarts from "echarts";
import axios from "axios";

export default {
  name: "ManhattanPlot",
  props: {
    taskId: {
      type: [Number, String],
      required: true,
    },
  },
  data() {
    return {
      // 🚨 警报解除：把 chartInstance 从这里删掉，绝不能让 Vue 劫持 Echarts 实例！
      loading: false,
      colors: [
        "#3b82f6",
        "#10b981",
        "#8b5cf6",
        "#f59e0b",
        "#06b6d4",
        "#ec4899",
      ],
    };
  },
  mounted() {
    // 🌟 直接将实例挂载在 this 上，绕过 Vue 的响应式追踪，性能提升 100 倍！
    this.chartInstance = echarts.init(this.$refs.chartRef, "dark");
    window.addEventListener("resize", this.chartInstance.resize);

    this.fetchData();
  },
  beforeDestroy() {
    if (this.chartInstance) {
      window.removeEventListener("resize", this.chartInstance.resize);
      this.chartInstance.dispose();
      this.chartInstance = null;
    }
  },
  methods: {
    async fetchData() {
      if (!this.taskId) return;
      this.loading = true;
      try {
        const res = await axios.get(
          `/api/task/result/${this.taskId}/manhattan`,
        );

        if (res.data && res.data.code === 200) {
          const chartData = res.data.data;
          // 增加安全校验
          if (chartData && chartData.series && chartData.series.length > 0) {
            this.renderChart(chartData);
          } else {
            this.$message.warning("该任务的曼哈顿图数据为空");
          }
        } else {
          this.$message.error(res.data.msg || "获取图表数据失败");
        }
      } catch (error) {
        console.error("Echarts渲染失败:", error);
        this.$message.error("渲染数据量过大或解析异常，请查看控制台");
      } finally {
        this.loading = false;
      }
    },

    renderChart(backendData) {
      let globalX = 0;

      const processedSeries = backendData.series.map((item, index) => {
        const color = this.colors[index % this.colors.length];

        const mappedData = item.data.map((point) => {
          globalX += 1;
          return [
            globalX,
            point[1],
            point[2],
            point[0],
            item.name || "未知染色体",
          ];
        });

        const seriesItem = {
          name: item.name || `Chr${index}`,
          type: "scatter",
          symbolSize: 4,
          itemStyle: { color: color },
          large: true, // 🌟 开启 WebGL 优化，画几十万个点不卡顿
          data: mappedData,
        };

        // 仅在第一个系列画警戒线，防止 undefined 报错
        if (index === 0) {
          seriesItem.markLine = {
            silent: true,
            lineStyle: { color: "#ef4444", type: "dashed", width: 2 },
            label: {
              formatter: "P=5e-8",
              position: "insideEndTop",
              color: "#ef4444",
            },
            data: [{ yAxis: 7.301 }],
          };
        }
        return seriesItem;
      });

      const option = {
        backgroundColor: "transparent",
        tooltip: {
          trigger: "item",
          backgroundColor: "rgba(15, 23, 42, 0.9)",
          borderColor: "#3b82f6",
          textStyle: { color: "#f8fafc" },
          formatter: function (params) {
            const data = params.data;
            if (!data) return "";
            return `
              <div style="font-weight:bold; margin-bottom:5px; border-bottom:1px solid #334155; padding-bottom:5px;">
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:${
                  params.color
                };margin-right:5px;"></span>
                SNP: ${data[2]}
              </div>
              <div style="font-size: 13px;">
                <b>染色体:</b> ${data[4]}<br/>
                <b>物理位置 (BP):</b> ${Number(data[3]).toLocaleString()}<br/>
                <b style="color:#ef4444;">-log<sub>10</sub>(P):</b> ${Number(
                  data[1],
                ).toFixed(4)}
              </div>
            `;
          },
        },
        legend: { show: false },
        grid: {
          left: "5%",
          right: "5%",
          top: "10%",
          bottom: "15%",
          containLabel: true,
        },
        xAxis: {
          type: "value",
          name: "Chromosome Position",
          nameLocation: "middle",
          nameGap: 30,
          axisLabel: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
        },
        yAxis: {
          type: "value",
          // 🌟 核心修复：直接使用 Unicode 下标字符，ECharts 原生完美支持
          name: "-log₁₀(P-value)",
          nameTextStyle: { fontSize: 14, fontWeight: "bold" },
          splitLine: { lineStyle: { color: "#1e293b", type: "dashed" } },
          max: backendData.maxLogP || undefined,
        },
        dataZoom: [
          { type: "inside", xAxisIndex: 0, filterMode: "filter" },
          {
            type: "slider",
            xAxisIndex: 0,
            height: 20,
            bottom: "2%",
            borderColor: "#1e293b",
            fillerColor: "rgba(59, 130, 246, 0.2)",
          },
          { type: "inside", yAxisIndex: 0, filterMode: "empty" },
        ],
        series: processedSeries,
      };

      this.chartInstance.setOption(option, true);
    },

    downloadChart() {
      if (!this.chartInstance) return;
      const url = this.chartInstance.getDataURL({
        type: "png",
        pixelRatio: 2,
        backgroundColor: "#0f172a",
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = `Manhattan_Plot_Task_${this.taskId}.png`;
      a.click();
    },
  },
};
</script>
<style lang="scss" scoped>
.gwas-chart-container {
  background: #0b0f19;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 20px;
}
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  .title {
    margin: 0;
    font-size: 16px;
    color: #f8fafc;
  }
}
.manhattan-chart {
  width: 100%;
  height: 550px;
}
</style>
