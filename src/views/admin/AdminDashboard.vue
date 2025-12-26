<!-- views/admin/DashboardPage.vue -->
<template>
  <div class="dashboard">
    <h2>仪表盘</h2>

    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #409eff">
            <i class="el-icon-user"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ userStats.total || 0 }}</div>
            <div class="stat-label">总用户数</div>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #67c23a">
            <i class="el-icon-notebook-2"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ courseStats.total || 0 }}</div>
            <div class="stat-label">课程总数</div>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #e6a23c">
            <i class="el-icon-files"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ datasetStats.total || 0 }}</div>
            <div class="stat-label">数据集数</div>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f56c6c">
            <i class="el-icon-time"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ growthStats.totalNewUsers || 0 }}</div>
            <div class="stat-label">今日新增</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :xs="24" :md="16">
        <div class="chart-card">
          <div class="chart-header">
            <h3>用户增长趋势</h3>
            <div class="chart-controls">
              <el-select
                v-model="growthPeriod"
                size="small"
                @change="loadUserGrowthChart"
                style="width: 120px"
              >
                <el-option label="最近7天" value="7d"></el-option>
                <el-option label="最近30天" value="30d"></el-option>
                <el-option label="最近90天" value="90d"></el-option>
              </el-select>
              <el-button
                type="text"
                icon="el-icon-refresh"
                @click="loadUserGrowthChart"
                :loading="chartLoading"
              >
                刷新
              </el-button>
            </div>
          </div>
          <div style="height: 300px">
            <div
              v-loading="chartLoading"
              ref="growthChart"
              style="height: 100%; width: 100%"
            ></div>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :md="8">
        <div class="chart-card">
          <div class="chart-header">
            <h3>资源分布</h3>
            <el-button
              type="text"
              icon="el-icon-refresh"
              @click="loadResourceDistribution"
            >
              刷新
            </el-button>
          </div>
          <div style="height: 300px">
            <!-- 这里可以放饼图 -->
            <div class="placeholder-chart">
              <i
                class="el-icon-pie-chart"
                style="font-size: 48px; color: #c0c4cc"
              ></i>
              <p style="margin-top: 10px">资源分布图表</p>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import * as echarts from "echarts";
import { getUserStatistics, getUserGrowthChart } from "@/api/user";

export default {
  name: "AdminDashboard",
  data() {
    return {
      userStats: {
        total: 0,
      },
      courseStats: {
        total: 0,
      },
      datasetStats: {
        total: 0,
      },
      growthStats: {
        totalNewUsers: 0,
      },
      growthPeriod: "30d",
      chartData: null,
      chartLoading: false,
      growthChart: null,
      loading: false,
    };
  },

  created() {
    this.loadUserStatistics();
    this.loadUserGrowthChart();
  },

  mounted() {
    // 监听窗口大小变化，重新渲染图表
    window.addEventListener("resize", this.handleResize);
  },

  beforeDestroy() {
    // 清理图表实例和事件监听
    if (this.growthChart) {
      this.growthChart.dispose();
    }
    window.removeEventListener("resize", this.handleResize);
  },

  methods: {
    // 统计用户数
    async loadUserStatistics() {
      try {
        this.loading = true;
        const response = await getUserStatistics();

        // 根据实际API响应结构调整
        if (response) {
          this.userStats.total = response.totalUsers || 0;
          // 这里可以添加其他统计数据
        } else {
          this.$message.error(response?.message || "获取用户统计数据失败");
        }
      } catch (error) {
        console.error("获取用户统计数据失败：", error);
        this.$message.error("获取用户统计数据失败");
      } finally {
        this.loading = false;
      }
    },

    // 加载用户增长图表
    async loadUserGrowthChart() {
      try {
        this.chartLoading = true;

        // 调用接口获取图表数据
        const response = await getUserGrowthChart(this.growthPeriod);

        console.log("返回的数据：", response);

        if (response && response.code === 200) {
          this.chartData = response.data;
          this.renderGrowthChart();
        } else {
          this.$message.error(response?.message || "获取用户增长数据失败");
        }
      } catch (error) {
        console.error("获取用户增长数据失败：", error);
        this.$message.error("获取用户增长数据失败");
      } finally {
        this.chartLoading = false;
      }
    },

    // 渲染用户增长图表
    renderGrowthChart() {
      // 如果图表实例不存在，初始化
      if (!this.growthChart) {
        this.growthChart = echarts.init(this.$refs.growthChart);
      }

      // 使用后端返回的数据
      const { dates, newUsers, totalUsers } = this.chartData;

      // 配置项
      const option = {
        tooltip: {
          trigger: "axis",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderColor: "#eee",
          borderWidth: 1,
          textStyle: {
            color: "#333",
          },
          formatter: function (params) {
            let result = `<div style="font-weight: bold; margin-bottom: 5px">${params[0].axisValue}</div>`;
            params.forEach((param) => {
              const color = param.color;
              result += `
                <div style="display: flex; align-items: center; margin: 3px 0">
                  <span style="display: inline-block; width: 10px; height: 10px; 
                    border-radius: ${
                      param.seriesName === "新增用户" ? "50%" : "0"
                    }; 
                    background: ${color}; margin-right: 8px"></span>
                  ${
                    param.seriesName
                  }: <span style="font-weight: bold; margin-left: 5px">${
                param.value
              }</span>
                </div>
              `;
            });
            return result;
          },
        },
        legend: {
          data: ["新增用户", "累计用户"],
          bottom: 10,
          textStyle: {
            fontSize: 12,
          },
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "15%",
          top: "10%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: dates,
          axisLine: {
            lineStyle: {
              color: "#dcdfe6",
            },
          },
          axisLabel: {
            color: "#606266",
            fontSize: 12,
          },
        },
        yAxis: [
          {
            type: "value",
            name: "新增用户",
            position: "left",
            axisLine: {
              show: true,
              lineStyle: {
                color: "#dcdfe6",
              },
            },
            axisLabel: {
              color: "#606266",
              fontSize: 12,
            },
            splitLine: {
              lineStyle: {
                color: "#f0f0f0",
                type: "dashed",
              },
            },
          },
          {
            type: "value",
            name: "累计用户",
            position: "right",
            axisLine: {
              show: true,
              lineStyle: {
                color: "#dcdfe6",
              },
            },
            axisLabel: {
              color: "#606266",
              fontSize: 12,
            },
            splitLine: {
              show: false,
            },
          },
        ],
        series: [
          {
            name: "新增用户",
            type: "line",
            smooth: true,
            symbol: "circle",
            symbolSize: 6,
            data: newUsers,
            itemStyle: {
              color: "#409EFF",
            },
            lineStyle: {
              width: 2,
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "rgba(64, 158, 255, 0.3)" },
                { offset: 1, color: "rgba(64, 158, 255, 0.05)" },
              ]),
            },
            emphasis: {
              focus: "series",
              itemStyle: {
                color: "#FFF",
                borderColor: "#409EFF",
                borderWidth: 2,
                shadowBlur: 10,
                shadowColor: "rgba(64, 158, 255, 0.5)",
              },
            },
          },
          {
            name: "累计用户",
            type: "line",
            yAxisIndex: 1,
            smooth: true,
            symbol: "circle",
            symbolSize: 6,
            data: totalUsers,
            itemStyle: {
              color: "#67C23A",
            },
            lineStyle: {
              width: 2,
            },
            emphasis: {
              focus: "series",
              itemStyle: {
                color: "#FFF",
                borderColor: "#67C23A",
                borderWidth: 2,
                shadowBlur: 10,
                shadowColor: "rgba(103, 194, 58, 0.5)",
              },
            },
          },
        ],
      };
      // 设置配置项并渲染
      this.growthChart.setOption(option, true);
    },

    // 处理窗口大小变化
    handleResize() {
      if (this.growthChart) {
        this.growthChart.resize();
      }
    },

    // 加载资源分布（预留方法）
    async loadResourceDistribution() {
      // TODO: 实现资源分布图表的加载
      this.$message.info("资源分布功能开发中");
    },
  },
};
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

h2 {
  margin: 0 0 16px 0;
  padding: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 45px;
    height: 4px;
    background: linear-gradient(135deg, #409eff 0%, #1890ff 100%);
    border-radius: 2px;
  }
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-top: 15px;
  margin-bottom: 5px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  margin-right: 15px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.stat-label {
  color: #999;
  font-size: 14px;
}

.chart-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  height: 100%;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h3 {
  margin: 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.placeholder-chart {
  background: #f5f7fa;
  border-radius: 4px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  padding: 20px;
}

.placeholder-chart p {
  margin-top: 10px;
  font-size: 14px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .stat-card {
    padding: 15px;
  }

  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }

  .stat-value {
    font-size: 20px;
  }

  .chart-card {
    padding: 15px;
  }
}
</style>
