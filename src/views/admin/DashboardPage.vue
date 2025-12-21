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
            <div class="stat-value">56</div>
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
            <div class="stat-value">89</div>
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
            <div class="stat-value">98%</div>
            <div class="stat-label">系统运行率</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :xs="24" :md="16">
        <div class="chart-card">
          <h3>用户增长趋势</h3>
          <div style="height: 300px">
            <!-- 这里可以放图表，暂时用图片替代 -->
            <div class="placeholder-chart"></div>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :md="8">
        <div class="chart-card">
          <h3>资源分布</h3>
          <div style="height: 300px">
            <!-- 这里可以放饼图，暂时用图片替代 -->
            <div class="placeholder-chart"></div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { getUserStatistics } from "@/api/user";

export default {
  name: "DashboardPage",
  data() {
    return {
      userStats: {
        total: 0,
      },
      loading: false,
    };
  },

  created() {
    this.loadUserStatistics();
  },

  methods: {

    // 统计用户数
    async loadUserStatistics() {
      try {
        this.loading = true;
        const response = await getUserStatistics();

        // 后端返回数据 根据实际的api进行调整
        console.log("返回的用户数据", response);
        if (response) {
          this.userStats.total = response.totalUsers;
        } else {
          this.$message.error(response.message || "获取用户统计数据失败");
        }
      } catch (error) {
        console.error("获取用户统计数据失败：", error);
        this.$message.error("获取用户统计数据失败");
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
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
}

.stat-label {
  color: #999;
  margin-top: 5px;
}

.chart-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.chart-card h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.placeholder-chart {
  background: #f5f7fa;
  border-radius: 4px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
}
</style>
