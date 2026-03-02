<template>
  <div class="course-center-container">
    <div class="course-main">
      <div class="welcome-banner course-banner">
        <div class="banner-content">
          <div ref="dnaCanvas" class="dna-canvas-container"></div>
          <h2>生信系统学习路径</h2>
          <p>
            从零基础到进阶，理论结合实操，配合平台专属分析工具，助你快速掌握生物信息学核心技能。
          </p>
        </div>
        <div class="banner-actions">
          <el-button
            type="primary"
            icon="el-icon-collection"
            @click="goToMyCourses"
          >
            我的学习
          </el-button>
        </div>
      </div>

      <div class="ai-search-banner">
        <div class="ai-banner-content">
          <h2 class="ai-title">
            <i class="el-icon-magic-stick"></i> AI 选课助手
          </h2>
          <p class="ai-subtitle">
            不会选课？直接把导师分配的任务，或者你的科研需求用大白话告诉我！
          </p>

          <div class="search-box-wrapper">
            <el-input
              v-model="aiSearchQuery"
              placeholder="例如：导师让我处理一批单细胞数据，但我只会一点Linux，该按什么顺序学？"
              class="ai-input"
              @keyup.enter.native="handleAiSearch"
              clearable
              @clear="clearAiSearch"
            >
              <el-button
                slot="append"
                class="ai-btn"
                :loading="isAiSearching"
                @click="handleAiSearch"
              >
                <i class="el-icon-cpu" v-if="!isAiSearching"></i>
                {{ isAiSearching ? "AI 正在分析..." : "帮我规划" }}
              </el-button>
            </el-input>
          </div>
        </div>
      </div>

      <div
        class="ai-recommend-results"
        v-if="aiRecommendedCourses.length > 0"
        v-loading="isAiSearching"
      >
        <div class="section-header">
          <h3 class="gradient-text">
            <i class="el-icon-s-promotion"></i> AI 为您定制的学习路径
          </h3>
          <el-button type="text" @click="clearAiSearch" class="clear-btn">
            <i class="el-icon-refresh-left"></i> 清除推荐，查看全部课程
          </el-button>
        </div>

        <el-row :gutter="20">
          <el-col
            :span="6"
            v-for="(course, index) in aiRecommendedCourses"
            :key="course.id"
          >
            <el-card
              shadow="hover"
              class="course-card"
              @click.native="$router.push(`/course/detail/${course.id}`)"
            >
              <div class="step-badge">第 {{ index + 1 }} 步</div>

              <img :src="$img(course.coverImage)" class="course-cover" />
              <div class="course-info">
                <h4 class="text-ellipsis">{{ course.title }}</h4>
                <p class="desc text-ellipsis">
                  {{ course.description || "暂无简介" }}
                </p>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      <div
        class="normal-course-list"
        v-show="aiRecommendedCourses.length === 0"
      ></div>

      <div class="main-content">
        <div class="content-left">
          <div class="filter-dashboard">
            <div class="filter-header">
              <h3 class="section-title">
                <i class="el-icon-reading"></i> 全部课程
              </h3>
              <el-input
                v-model="queryParams.title"
                placeholder="搜索课程名称..."
                prefix-icon="el-icon-search"
                size="small"
                clearable
                @keyup.enter.native="handleSearch"
                style="width: 250px"
              ></el-input>
            </div>

            <div class="filter-tags">
              <span class="filter-label">难度筛选：</span>
              <el-radio-group
                v-model="queryParams.difficulty"
                size="small"
                @change="handleSearch"
              >
                <el-radio-button label="">全部</el-radio-button>
                <el-radio-button label="BEGINNER">初级入门</el-radio-button>
                <el-radio-button label="INTERMEDIATE">中级进阶</el-radio-button>
                <el-radio-button label="ADVANCED">高级科研</el-radio-button>
              </el-radio-group>
            </div>
          </div>

          <div class="course-grid" v-loading="loading">
            <el-card
              v-for="course in courseList"
              :key="course.id"
              class="course-card"
              shadow="hover"
              @click.native="goToCourseDetail(course)"
            >
              <div class="course-cover">
                <el-image
                  :src="getImageUrl(course.coverImage)"
                  fit="cover"
                  class="cover-img"
                >
                  <div slot="error" class="image-slot empty-cover">
                    <i class="el-icon-picture-outline"></i>
                    <span>暂无封面</span>
                  </div>
                </el-image>

                <div
                  class="course-level-badge"
                  :class="course.difficulty.toLowerCase()"
                >
                  {{ formatDifficulty(course.difficulty) }}
                </div>
              </div>

              <div class="course-content">
                <div class="course-title-area">
                  <h4 class="text-ellipsis" :title="course.title">
                    {{ course.title }}
                  </h4>
                  <el-rate
                    v-model="course.rating"
                    disabled
                    text-color="#ff9900"
                    class="course-rating"
                  />
                </div>

                <p class="course-description">{{ course.description }}</p>
              </div>

              <div class="course-footer">
                <div class="instructor-info">
                  <el-avatar
                    size="small"
                    :src="getInstructorAvatar(course.instructorAvatar)"
                    icon="el-icon-user-solid"
                  ></el-avatar>
                  <span class="instructor-name">
                    {{ course.instructorName }}
                  </span>
                </div>
                <el-button
                  type="primary"
                  size="small"
                  plain
                  @click.stop="goToCourseDetail(course)"
                >
                  开始学习
                </el-button>
              </div>
            </el-card>

            <div v-if="courseList.length === 0 && !loading" class="empty-state">
              <i class="el-icon-notebook-2"></i>
              <p>暂无符合条件的课程</p>
            </div>
          </div>

          <div class="pagination-wrapper" v-if="total > 0">
            <el-pagination
              background
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
              :current-page="queryParams.pageNum"
              :page-sizes="[6, 12, 18, 24]"
              :page-size="queryParams.pageSize"
              layout="total, sizes, prev, pager, next, jumper"
              :total="total"
            >
            </el-pagination>
          </div>
        </div>

        <div class="content-right">
          <div class="my-learning-progress">
            <div class="section-header">
              <h3 class="section-title">
                <i class="el-icon-video-play"></i> 最近学习
              </h3>
            </div>

            <div class="progress-list">
              <div
                v-for="prog in recentProgress"
                :key="prog.courseId"
                class="progress-item"
                @click="continueLearning(prog)"
              >
                <div class="prog-info">
                  <h5 class="text-ellipsis">{{ prog.title }}</h5>

                  <span class="prog-chapter">点击继续学习...</span>
                </div>
                <div class="prog-bar-area">
                  <el-progress
                    :percentage="prog.progress || 0"
                    :status="prog.progress === 100 ? 'success' : null"
                    :stroke-width="6"
                  />
                </div>
              </div>

              <div v-if="recentProgress.length === 0" class="empty-progress">
                <p>您还没有开始任何课程</p>
              </div>
            </div>
          </div>

          <div class="learning-paths">
            <div class="section-header">
              <h3 class="section-title">
                <i class="el-icon-guide"></i> 推荐学习路径
              </h3>
            </div>

            <div class="path-timeline">
              <el-timeline>
                <el-timeline-item
                  v-for="(path, index) in learningPaths"
                  :key="index"
                  :color="path.color"
                  :icon="path.icon"
                  size="large"
                  :timestamp="path.level"
                >
                  <div
                    class="path-card"
                    @click="handleSearchByTitle(path.keyword)"
                  >
                    <h4>{{ path.title }}</h4>
                    <p>{{ path.desc }}</p>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// 1. 顶部导入你新写的 api 方法
import {
  getCoursePage,
  getRecentCourses,
  recommendCoursesByAi,
} from "@/api/course";
import { getImageUrl } from "@/utils/image";
import { getAvatarUrl } from "@/utils/auth";
// 2. 必须引入 Vuex，为了拿到当前登录用户的 ID
import { mapGetters, mapState } from "vuex";

// 🌟 1. 引入 Three.js
import * as THREE from "three";

export default {
  name: "CoursePage",
  data() {
    return {
      loading: false,
      // 查询参数对象   专门用来保存当前页面的所有检索状态
      queryParams: {
        pageNum: 1, // 当前页码
        pageSize: 6, // 每页条数
        title: "", // 课程标题关键词 搜索
        difficulty: "", // 课程难度筛选 难度选择
      },
      total: 0,
      courseList: [],
      recentProgress: [],
      learningPaths: [
        {
          level: "Step 1",
          title: "生信基础技能",
          desc: "掌握 Linux 与 R 语言基础",
          color: "#10b981", // 绿色，代表入门安全区
          icon: "el-icon-monitor",
          keyword: "基础",
        },
        {
          level: "Step 2",
          title: "转录组分析初探",
          desc: "RNA-Seq 核心流程",
          color: "#3b82f6", // 蓝色，进阶
          icon: "el-icon-data-analysis",
          keyword: "RNA",
        },
        {
          level: "Step 3",
          title: "单细胞多组学",
          desc: "前沿测序与降维聚类",
          color: "#8b5cf6", // 紫色，高级、前沿
          icon: "el-icon-magic-stick",
          keyword: "单细胞",
        },
      ],
      // 🌟 2. 存放 3D 相关的变量
      scene: null,
      camera: null,
      renderer: null,
      particlesMesh: null,
      animationId: null,

      // 🌟 AI 搜索相关的变量
      aiSearchQuery: "",
      isAiSearching: false,
      aiRecommendedCourses: [], // 存放 AI 推荐的专属课程列表
    };
  },

  // computed，获取用户登录状态
  computed: {
    ...mapState("user", ["isLoggedIn"]),
    ...mapGetters("user", ["userId"]),
  },

  mounted() {
    // 🌟 3. 页面挂载后初始化 3D 背景
    this.initThreeDNA();
    // 监听窗口大小改变，动态调整画布
    window.addEventListener("resize", this.handleResize);
  },

  beforeDestroy() {
    // 🌟 4. 离开页面时销毁 3D，释放内存防卡顿
    window.removeEventListener("resize", this.handleResize);
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }
  },

  created() {
    this.fetchCourses();
    // 页面加载时，尝试获取最近学习记录
    this.fetchRecentProgress();
  },
  methods: {
    fetchCourses() {
      this.loading = true;
      getCoursePage(this.queryParams)
        .then((res) => {
          if (res.code === 200) {
            this.courseList = res.data.records;
            this.total = res.data.total;
            console.log("Fetched courses:", this.courseList);
            console.log("Total courses:", this.total);
          } else {
            this.$message.error(res.msg || "获取课程列表失败");
          }
        })
        .catch((err) => {
          console.error("API Error:", err);
          this.$message.error("网络请求异常");
        })
        .finally(() => {
          this.loading = false;
        });
    },

    handleSearch() {
      this.queryParams.pageNum = 1;
      this.fetchCourses();
    },

    handleSearchByTitle(keyword) {
      // 1. 将关键词填入搜索框，实现双向绑定同步
      this.queryParams.title = keyword;

      // 2. 给出明确的提示，让用户知道发生了联动
      this.$message({
        message: `为您筛选【${keyword}】方向的推荐课程`,
        type: "success",
        duration: 2000,
      });

      // 3. 页面平滑滚动回顶部（为了防止用户在页面底部点击时，看不到上方列表更新）
      window.scrollTo({
        top: 80,
        behavior: "smooth",
      });

      // 4. 触发查询
      this.handleSearch();
    },

    handleSizeChange(val) {
      this.queryParams.pageSize = val;
      this.fetchCourses();
    },
    handleCurrentChange(val) {
      this.queryParams.pageNum = val;
      this.fetchCourses();
    },

    // 转换真实图片URL
    getImageUrl(path) {
      return getImageUrl(path);
    },

    // 获取讲师头像
    getInstructorAvatar(instructorAvatar) {
      return getAvatarUrl(instructorAvatar);
    },

    goToCourseDetail(course) {
      // 1. 使用 resolve 解析出目标路由的完整 URL
      const routeData = this.$router.resolve({
        // 用命名路由：
        name: "CourseDetail",
        params: { id: course.id },
      });

      // 2. 使用原生 JavaScript 的 window.open 在新标签页打开
      window.open(routeData.href, "_blank");
    },

    // 从后端获取最近学习记录
    fetchRecentProgress() {
      // 如果没登录，直接返回，不发请求
      if (!this.isLoggedIn || !this.userId) {
        this.recentProgress = [];
        return;
      }

      getRecentCourses(this.userId)
        .then((res) => {
          if (res.code === 200) {
            // 将后端的 RecentCourseVO 数组赋值给前端变量
            this.recentProgress = res.data || [];
          }
        })
        .catch((err) => {
          console.error("获取最近学习记录失败", err);
        });
    },

    // 实现跳转学习环境
    continueLearning(prog) {
      if (!prog || !prog.courseId) return;

      this.$message.info(`正在为您打开专属学习环境...`);

      // 在新标签页打开沉浸式播放页
      const routeData = this.$router.resolve({
        name: "CourseLearn",
        params: { id: prog.courseId },
      });
      window.open(routeData.href, "_blank");
    },

    goToMyCourses() {
      this.$router.push("/my-course");
    },

    formatDifficulty(difficulty) {
      const map = {
        BEGINNER: "初级",
        INTERMEDIATE: "中级",
        ADVANCED: "高级",
      };
      return map[difficulty] || difficulty;
    },
    // ================= 🌟 下面是新增的 3D 专属方法 =================

    initThreeDNA() {
      const container = this.$refs.dnaCanvas;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      // 1. 创建场景
      this.scene = new THREE.Scene();

      // 2. 创建相机 (透视相机)
      this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      this.camera.position.z = 40;

      // 3. 创建渲染器 (alpha: true 允许背景透明，显示你原来的渐变蓝底色)
      this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 高清屏优化
      container.appendChild(this.renderer.domElement);

      // 4. 数学方程式生成 DNA 粒子
      const particlesCount = 3000; // 3000 个发光粒子
      const posArray = new Float32Array(particlesCount * 3);
      const colorsArray = new Float32Array(particlesCount * 3);

      // 生信极客专属配色：青色到紫色的渐变
      const color1 = new THREE.Color(0x38bdf8); // 亮青色
      const color2 = new THREE.Color(0x8b5cf6); // 紫色

      for (let i = 0; i < particlesCount; i++) {
        // 沿 Y 轴分布 [-50, 50]
        const y = (Math.random() - 0.5) * 100;
        const radius = 8; // 螺旋半径
        const frequency = 0.2; // 螺旋密集度

        // 随机分配到两条螺旋链上 (相位差 π)
        const strand = Math.random() > 0.5 ? 0 : Math.PI;

        // 参数方程计算 X 和 Z，并加入一点随机噪点让粒子看起来更梦幻
        const noiseX = (Math.random() - 0.5) * 1.5;
        const noiseZ = (Math.random() - 0.5) * 1.5;
        const x = Math.cos(y * frequency + strand) * radius + noiseX;
        const z = Math.sin(y * frequency + strand) * radius + noiseZ;

        posArray[i * 3] = x;
        posArray[i * 3 + 1] = y;
        posArray[i * 3 + 2] = z;

        // 根据 Y 轴高度混合颜色
        const mixedColor = color1.clone().lerp(color2, (y + 50) / 100);
        colorsArray[i * 3] = mixedColor.r;
        colorsArray[i * 3 + 1] = mixedColor.g;
        colorsArray[i * 3 + 2] = mixedColor.b;
      }

      // 5. 将数据丢进几何体和材质
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colorsArray, 3));

      const material = new THREE.PointsMaterial({
        size: 0.4, // 粒子大小
        vertexColors: true, // 启用顶点颜色
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending, // 叠加发光效果
      });

      this.particlesMesh = new THREE.Points(geometry, material);

      // 把 DNA 放倒一点，斜铺在背景上
      this.particlesMesh.rotation.z = Math.PI / 4;
      // 把它往右边挪一点，不要挡住文字
      this.particlesMesh.position.x = 25;

      this.scene.add(this.particlesMesh);

      // 6. 开启帧动画循环
      this.animateDNA();
    },

    animateDNA() {
      this.animationId = requestAnimationFrame(this.animateDNA);
      // 让 DNA 缓缓自转
      if (this.particlesMesh) {
        this.particlesMesh.rotation.y += 0.003;
        this.particlesMesh.rotation.x += 0.001;
      }
      this.renderer.render(this.scene, this.camera);
    },

    handleResize() {
      const container = this.$refs.dnaCanvas;
      if (!container || !this.camera || !this.renderer) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    },

    // 🌟 处理 AI 搜索的核心方法
    handleAiSearch() {
      if (!this.aiSearchQuery.trim()) {
        this.$message.warning("请输入你的科研需求！");
        return;
      }

      this.isAiSearching = true;
      this.aiRecommendedCourses = []; // 清空之前的推荐

      recommendCoursesByAi(this.aiSearchQuery.trim())
        .then((res) => {
          if (res.code === 200 && res.data && res.data.length > 0) {
            this.aiRecommendedCourses = res.data;
            this.$message.success("✨ AI 已为您规划好学习路径！");
          } else {
            this.$message.info("暂未找到完全匹配的课程，建议换个说法试试~");
          }
        })
        .catch(() => {
          this.$message.error("AI 引擎网络开小差了...");
        })
        .finally(() => {
          this.isAiSearching = false;
        });
    },

    // 🌟 清除搜索结果，返回普通大厅
    clearAiSearch() {
      this.aiSearchQuery = "";
      this.aiRecommendedCourses = [];
    },
  },
};
</script>

<style lang="scss" scoped>
.course-center-container {
  min-height: calc(100vh - 60px);
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 20px;
}

.course-main {
  max-width: 1400px;
  margin: 0 auto;
}

/* 欢迎横幅 */
.course-banner {
  background: linear-gradient(135deg, #4b6cb7 0%, #182848 100%);
  border-radius: 16px;
  padding: 30px;
  color: white;
  margin-bottom: 24px;
  box-shadow: 0 6px 20px rgba(75, 108, 183, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;

  /* 🌟 新增：3D 容器绝对定位，铺满横幅 */
  .dna-canvas-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0; /* 垫在最下面 */
    pointer-events: none; /* 让鼠标事件穿透，不影响按钮点击 */
  }

  .banner-content {
    flex: 1;
    z-index: 10;
    position: relative;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5); /* 给文字加点阴影，在3D背景前更清晰 */

    h2 {
      font-size: 32px;
      margin-bottom: 12px;
      font-weight: 700;
    }
    p {
      font-size: 16px;
      opacity: 0.95;
      margin-bottom: 24px;
      max-width: 700px;
      line-height: 1.6;
    }
  }

  .banner-stats {
    z-index: 10; /* 调高层级 */
    display: flex;
    gap: 48px;

    .stat-item {
      text-align: center;
      .stat-number {
        display: block;
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 6px;
      }
      .stat-label {
        font-size: 14px;
        opacity: 0.9;
      }
    }
  }

  .banner-actions {
    z-index: 1;
  }
}

/* ================= 🌟 AI 智能搜索区样式 ================= */
.ai-search-banner {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  padding: 20px 10px;
  border-radius: 16px;
  margin-bottom: 30px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;

  /* 弄点背景光晕装饰 */
  &::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -10%;
    width: 300px;
    height: 300px;
    background: radial-gradient(
      circle,
      rgba(59, 130, 246, 0.3) 0%,
      transparent 70%
    );
    border-radius: 50%;
  }

  .ai-banner-content {
    position: relative;
    z-index: 2;
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
  }

  .ai-title {
    color: #f8fafc;
    font-size: 28px;
    margin-bottom: 12px;
    i {
      color: #3b82f6;
      margin-right: 8px;
    }
  }

  .ai-subtitle {
    color: #94a3b8;
    font-size: 15px;
    margin-bottom: 30px;
  }

  .search-box-wrapper {
    box-shadow: 0 8px 30px rgba(59, 130, 246, 0.2);
    border-radius: 8px;

    ::v-deep .el-input__inner {
      height: 56px;
      line-height: 56px;
      font-size: 16px;
      border: 2px solid #334155;
      background: rgba(255, 255, 255, 0.05);
      color: #f8fafc;
      &:focus {
        border-color: #3b82f6;
        background: rgba(255, 255, 255, 0.1);
      }
    }

    ::v-deep .el-input-group__append {
      background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
      border: none;
      color: white;
      font-weight: bold;
      font-size: 16px;
      padding: 0 30px;
      cursor: pointer;
      transition: opacity 0.3s;
      &:hover {
        opacity: 0.9;
      }
    }
  }
}

/* ================= 🌟 AI 推荐结果样式 ================= */
.ai-recommend-results {
  background: #f0fdf4; /* 淡淡的护眼绿背景 */
  padding: 30px;
  border-radius: 16px;
  margin-bottom: 40px;
  border: 1px solid #bbf7d0;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    border-bottom: 2px solid #bbf7d0;
    padding-bottom: 10px;

    .gradient-text {
      background: linear-gradient(90deg, #059669 0%, #10b981 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-size: 22px;
      margin: 0;
    }
    .clear-btn {
      color: #64748b;
    }
  }

  .course-card {
    position: relative;
    cursor: pointer;
    border-radius: 12px;
    overflow: hidden;
    transition: transform 0.3s, box-shadow 0.3s;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2);
    }

    .step-badge {
      position: absolute;
      top: 10px;
      left: -30px;
      background: #10b981;
      color: white;
      padding: 4px 30px;
      font-size: 12px;
      font-weight: bold;
      transform: rotate(-45deg);
      z-index: 10;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .course-cover {
      width: 100%;
      height: 140px;
      object-fit: cover;
    }

    .course-info {
      padding: 12px;
      h4 {
        margin: 0 0 8px 0;
        color: #1e293b;
        font-size: 16px;
      }
      .desc {
        margin: 0;
        font-size: 13px;
        color: #64748b;
      }
    }
  }
}
.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 主内容双栏布局 */
.main-content {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
}

.content-left {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-right {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 筛选控制台 */
.filter-dashboard {
  background: white;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  .filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    border-bottom: 1px solid #f0f2f5;
    padding-bottom: 16px;

    .section-title {
      font-size: 18px;
      color: #2c3e50;
      margin: 0;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .filter-tags {
    display: flex;
    align-items: center;
    .filter-label {
      font-size: 14px;
      color: #7f8c8d;
      margin-right: 12px;
      font-weight: 500;
    }
  }
}

/* 课程网格布局 */
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;

  .course-card {
    border: none;
    border-radius: 12px;
    transition: all 0.3s ease;
    cursor: pointer;
    display: flex;
    flex-direction: column;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1) !important;

      /* 鼠标悬停卡片时，触发图片的放大效果 */
      .cover-img {
        transform: scale(1.08);
      }
    }

    ::v-deep .el-card__body {
      padding: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    /* 全新封面图区域 */
    .course-cover {
      height: 160px;
      width: 100%;
      position: relative;
      overflow: hidden; /* 关键：确保放大的图片不超出圆角 */
      border-radius: 12px 12px 0 0;
      background-color: #f8fafc;

      /* 1. 图片本体样式 */
      .cover-img {
        width: 100%;
        height: 100%;
        /* 使用 cubic-bezier 让放大动画显得更有呼吸感、更高级 */
        transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }

      /* 2. 占位图(暂无封面)的高级灰渐变样式 */
      ::v-deep .empty-cover {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
        color: #94a3b8;
        font-size: 14px;
        letter-spacing: 1px;

        i {
          font-size: 36px;
          margin-bottom: 8px;
          color: #cbd5e1;
        }
      }

      /* 3. 难度角标 (毛玻璃效果) */
      .course-level-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        color: white;
        background: rgba(15, 23, 42, 0.4); /* 默认深色半透明底 */
        backdrop-filter: blur(6px); /* 毛玻璃模糊效果 */
        border: 1px solid rgba(255, 255, 255, 0.2);
        z-index: 10;
        letter-spacing: 1px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

        &.beginner {
          background: rgba(16, 185, 129, 0.85);
        }
        &.intermediate {
          background: rgba(245, 158, 11, 0.85);
        }
        &.advanced {
          background: rgba(239, 68, 68, 0.85);
        }
      }

      /* 4. 图片底部微弱的内阴影，让卡片文字区的过渡更自然 */
      &::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 30px;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.05), transparent);
        pointer-events: none;
      }
    }

    /* 文本内容区域 */
    .course-content {
      padding: 16px;
      flex: 1;

      .course-title-area {
        margin-bottom: 12px;
        h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
          color: #2c3e50;
          line-height: 1.4;
        }
        .course-rating {
          margin-bottom: 8px;
        }
      }

      .course-description {
        font-size: 13px;
        color: #7f8c8d;
        line-height: 1.5;
        margin-bottom: 4px;
        height: 39px;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
    }

    /* 底部讲师与操作区 */
    .course-footer {
      padding: 12px 16px;
      border-top: 1px solid #f5f5f5;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fafbfc;
      border-radius: 0 0 12px 12px;

      .instructor-info {
        display: flex;
        align-items: center;
        gap: 8px;
        .instructor-name {
          font-size: 13px;
          color: #34495e;
          font-weight: 500;
        }
      }
    }
  }

  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 60px 0;
    color: #bdc3c7;
    i {
      font-size: 48px;
      margin-bottom: 16px;
    }
  }
}

.pagination-wrapper {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 侧边栏通用区块样式 */
.my-learning-progress,
.learning-paths {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  .section-header {
    margin-bottom: 20px;
    .section-title {
      font-size: 18px;
      color: #2c3e50;
      margin: 0;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
}

/* 进度列表 */
.progress-list {
  .progress-item {
    padding: 12px;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      border-color: #3498db;
      background: #f8fafc;
    }

    .prog-info {
      margin-bottom: 8px;
      h5 {
        margin: 0 0 4px 0;
        font-size: 14px;
        color: #2c3e50;
      }
      .prog-chapter {
        font-size: 12px;
        color: #7f8c8d;
      }
    }
  }
  .empty-progress {
    text-align: center;
    font-size: 13px;
    color: #95a5a6;
    padding: 20px 0;
  }
}

/* 推荐路径时间轴 */
.path-timeline {
  padding-left: 4px;
  .path-card {
    background: #f8fafc;
    padding: 12px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.3s;
    &:hover {
      background: #e8f4fe;
    }
    h4 {
      margin: 0 0 4px 0;
      font-size: 14px;
      color: #2c3e50;
    }
    p {
      margin: 0;
      font-size: 12px;
      color: #7f8c8d;
    }
  }
}

/* 工具类 */
.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 响应式适配 */
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
  }
  .content-right {
    grid-row: 1;
  }
}
@media (max-width: 768px) {
  .course-banner {
    flex-direction: column;
    align-items: flex-start;
    .banner-stats {
      flex-wrap: wrap;
      gap: 24px;
    }
    .banner-actions {
      margin-top: 20px;
    }
  }
  .filter-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
