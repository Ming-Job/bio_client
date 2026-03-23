<template>
  <div class="dashboard">
    <div class="page-header-simple">
      <h2>管理员仪表盘</h2>
      <el-tag effect="dark" type="success" size="small"><i class="el-icon-magic-stick"></i> 节点运行正常</el-tag>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #409eff, #2563eb)">
            <i class="el-icon-user"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ userStats.total || 0 }}</div>
            <div class="stat-label">注册的用户总数</div>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #67c23a, #059669)">
            <i class="el-icon-guide"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ courseStats.total || 0 }}</div>
            <div class="stat-label">课程总数</div>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #e6a23c, #d97706)">
            <i class="el-icon-coin"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ datasetStats.total || 0 }}</div>
            <div class="stat-label">案例总数</div>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f56c6c, #dc2626)">
            <i class="el-icon-cpu"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ growthStats.totalNewUsers || 0 }}</div>
            <div class="stat-label">今日新增注册</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 24px">
      <el-col :xs="24" :md="16">
        <div class="chart-card">
          <div class="chart-header">
            <h3><i class="el-icon-data-line"></i> 平台研究员增长趋势</h3>
            <div class="chart-controls">
              <el-radio-group v-model="growthPeriod" size="mini" @change="loadUserGrowthChart">
                <el-radio-button label="7d">近 7 天</el-radio-button>
                <el-radio-button label="30d">近 30 天</el-radio-button>
                <el-radio-button label="90d">近 90 天</el-radio-button>
              </el-radio-group>
              <el-button type="text" icon="el-icon-refresh" @click="loadUserGrowthChart" :loading="chartLoading">刷新</el-button>
            </div>
          </div>
          <div style="height: 320px">
            <div v-loading="chartLoading" ref="growthChart" style="height: 100%; width: 100%"></div>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :md="8">
        <div class="chart-card">
          <div class="chart-header">
            <h3><i class="el-icon-pie-chart"></i> 平台课程难度分布</h3>
            <el-button type="text" icon="el-icon-refresh" @click="loadCourseDistribution">刷新</el-button>
          </div>
          <div style="height: 320px">
            <div v-loading="pieLoading" ref="pieChart" style="height: 100%; width: 100%"></div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import * as echarts from "echarts";
// 🌟 引入了刚刚在 user.js 里新增的 getCourseDistribution 接口
import { getUserStatistics, getUserGrowthChart, getCourseDistribution } from "@/api/user";

export default {
  name: "AdminDashboard",
  data() {
    return {
      userStats: { total: 0 },
      courseStats: { total: 0 },
      datasetStats: { total: 0 },
      growthStats: { totalNewUsers: 0 },
      
      growthPeriod: "30d",
      chartData: null,
      
      chartLoading: false,
      pieLoading: false,
      
      growthChartInstance: null,
      pieChartInstance: null,
    };
  },

  mounted() {
    this.initAllData();
    window.addEventListener("resize", this.handleResize);
  },

  beforeDestroy() {
    if (this.growthChartInstance) this.growthChartInstance.dispose();
    if (this.pieChartInstance) this.pieChartInstance.dispose();
    window.removeEventListener("resize", this.handleResize);
  },

  methods: {
    // 🌟 初始化调用所有真实接口
    async initAllData() {
      this.loadUserStatistics();
      this.loadUserGrowthChart();
      this.loadCourseDistribution(); 
    },

    // 1. 真实获取四大核心指标
    async loadUserStatistics() {
      try {
        const res = await getUserStatistics();
        const responseData = res.success !== undefined ? res : res.data;
        
        if (responseData && responseData.success) {
          this.userStats.total = responseData.data.totalUsers || 0;
          this.courseStats.total = responseData.data.totalCourses || 0;
          this.datasetStats.total = responseData.data.totalDatasets || 0;
          this.growthStats.totalNewUsers = responseData.data.todayNewUsers || 0;
        } else {
          this.$message.error(responseData.message || "统计数据解析失败");
        }
      } catch (error) {
        console.error("统计大盘接口报错:", error);
      }
    },

    // 2. 真实获取折线图数据
    async loadUserGrowthChart() {
      try {
        this.chartLoading = true;
        const res = await getUserGrowthChart(this.growthPeriod);
        const responseData = res.success !== undefined ? res : res.data;
        
        if (responseData && responseData.success) {
          this.chartData = responseData.data;
          this.renderGrowthChart();
        } else {
          this.$message.error(responseData.message || "图表数据获取失败");
        }
      } catch (error) {
        console.error("折线图接口报错:", error);
      } finally {
        this.chartLoading = false;
      }
    },

    // 3. 渲染 ECharts 折线图
    renderGrowthChart() {
      if (!this.growthChartInstance) {
        this.growthChartInstance = echarts.init(this.$refs.growthChart);
      }
      
      const { dates = [], newUsers = [], totalUsers = [] } = this.chartData || {};
      
      const option = {
        tooltip: { trigger: "axis" },
        legend: { data: ["单日新增", "累计研究员"], bottom: 0 },
        grid: { left: "3%", right: "4%", bottom: "10%", top: "8%", containLabel: true },
        xAxis: { type: "category", boundaryGap: false, data: dates },
        yAxis: [
          { type: "value", name: "新增数", position: "left", splitLine: { lineStyle: { type: "dashed", color: "#f0f0f0" } } },
          { type: "value", name: "累计数", position: "right", splitLine: { show: false } }
        ],
        series: [
          {
            name: "单日新增", type: "line", smooth: true, symbolSize: 8,
            data: newUsers,
            itemStyle: { color: "#3b82f6" }, lineStyle: { width: 3 },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "rgba(59, 130, 246, 0.4)" },
                { offset: 1, color: "rgba(59, 130, 246, 0.05)" }
              ])
            }
          },
          {
            name: "累计研究员", type: "line", yAxisIndex: 1, smooth: true, symbolSize: 8,
            data: totalUsers,
            itemStyle: { color: "#10b981" }, lineStyle: { width: 3 }
          }
        ]
      };
      this.growthChartInstance.setOption(option);
    },

    // ==========================================
    // 4. 课程难度分布饼图 (对接后端真实接口)
    // ==========================================
    async loadCourseDistribution() {
      try {
        this.pieLoading = true;
        const res = await getCourseDistribution();
        const responseData = res.success !== undefined ? res : res.data;
        
        if (responseData && responseData.success) {
          this.renderPieChart(responseData.data);
        } else {
          this.$message.error(responseData.message || "饼图数据获取失败");
        }
      } catch (error) {
        console.error("饼图接口报错:", error);
      } finally {
        this.pieLoading = false;
      }
    },

    renderPieChart(realPieData) {
      if (!this.pieChartInstance) {
        this.pieChartInstance = echarts.init(this.$refs.pieChart);
      }

      // 如果数据库里目前没有任何课程，提供一个占位显示
      if (!realPieData || realPieData.length === 0) {
        realPieData = [{ name: "暂无课程", value: 0 }];
      }

      const option = {
        tooltip: { trigger: "item", formatter: "{a} <br/>{b} : {c} 门 ({d}%)" },
        legend: { bottom: "0%", left: "center", itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 12 } },
        series: [
          {
            name: "难度占比",
            type: "pie",
            radius: ["40%", "70%"], 
            center: ["50%", "45%"],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 5, borderColor: "#fff", borderWidth: 2 },
            label: { show: false, position: "center" },
            emphasis: { label: { show: true, fontSize: 16, fontWeight: "bold" } },
            labelLine: { show: false },
            data: realPieData,
            // 🌟 颜色微调：初级(绿), 中级(黄), 高级(红), 其他(紫/灰)
            color: ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"]
          }
        ]
      };
      
      this.pieChartInstance.setOption(option);
    },

    // 窗口缩放适配
    handleResize() {
      if (this.growthChartInstance) this.growthChartInstance.resize();
      if (this.pieChartInstance) this.pieChartInstance.resize();
    }
  }
};
</script>

<style scoped lang="scss">
.dashboard { padding: 24px; background: #f3f4f6; min-height: 100vh; }

.page-header-simple {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  h2 { margin: 0; font-size: 24px; font-weight: 700; color: #111827; }
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  border: 1px solid #e5e7eb;
  cursor: default;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    border-color: #d1d5db;
  }
}

.stat-icon {
  width: 56px; height: 56px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 26px;
  margin-right: 18px;
  box-shadow: inset 0 -2px 4px rgba(0,0,0,0.2);
}

.stat-value { font-size: 28px; font-weight: 800; color: #1f2937; margin-bottom: 4px; font-family: Consolas, monospace;}
.stat-label { color: #6b7280; font-size: 13px; font-weight: 500; }

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  border: 1px solid #e5e7eb;
  height: calc(100% - 20px);
}

.chart-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px;
  h3 { margin: 0; color: #111827; font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
}

.chart-controls { display: flex; align-items: center; gap: 15px; }

/* ECharts 渲染速度优化 */
div[ref] {
  transition: all 0.3s ease;
}
</style>