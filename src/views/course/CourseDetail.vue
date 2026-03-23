<template>
  <div class="course-detail-wrapper" v-loading="loading">
    <div class="course-hero" v-if="courseInfo">
      <div class="hero-inner">
        <el-breadcrumb
          separator-class="el-icon-arrow-right"
          class="hero-breadcrumb"
        >
          <el-breadcrumb-item :to="{ path: '/course' }"
            >课程中心</el-breadcrumb-item
          >
          <el-breadcrumb-item>{{ courseInfo.title }}</el-breadcrumb-item>
        </el-breadcrumb>

        <div class="hero-main">
          <div class="hero-cover">
            <el-image
              :src="$img(courseInfo.coverImage)"
              fit="cover"
              class="cover-image"
            >
              <div
                slot="error"
                class="image-slot empty-cover"
                :style="{ background: courseInfo.bgColor || '#34495e' }"
              >
                <i class="el-icon-picture-outline"></i>
              </div>
            </el-image>
            <div
              class="difficulty-badge"
              :class="courseInfo.difficulty.toLowerCase()"
            >
              {{ formatDifficulty(courseInfo.difficulty) }}
            </div>
          </div>

          <div class="hero-info">
            <h1 class="course-title">{{ courseInfo.title }}</h1>
            <p class="course-desc" :title="courseInfo.description">
              {{ courseInfo.description }}
            </p>

            <div class="course-stats">
              <div class="stat-divider"></div>
              <div class="stat-item">
                <i class="el-icon-document"></i>
                <span class="stat-value"
                  >共 {{ courseInfo.lessonCount || 0 }} 课时</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="main-content" v-if="courseInfo">
      <div class="content-left">
        <el-card shadow="never" class="tabs-card">
          <el-tabs v-model="activeTab" class="custom-tabs">
            <el-tab-pane label="课程介绍" name="overview">
              <div class="overview-section">
                <h3><i class="el-icon-collection-tag"></i> 课程简介</h3>
                <div class="rich-text-content">
                  <p>{{ courseInfo.description }}</p>
                  <p>
                    （此处在未来可替换为 v-html
                    渲染后端的详细富文本介绍，包含图文混排的教学目标、适合人群等。）
                  </p>
                </div>

                <h3><i class="el-icon-check"></i> 学习目标</h3>
                <ul class="learning-goals">
                  <li>深入理解生物信息学高通量测序的底层原理</li>
                  <li>独立完成相关组学数据的标准化分析流程</li>
                  <li>熟练使用 Linux 命令行及服务器端生信软件</li>
                  <li>结合平台在线分析工具，实现理论与实操的无缝衔接</li>
                </ul>
              </div>
            </el-tab-pane>

            <el-tab-pane label="课程大纲" name="syllabus">
              <div class="syllabus-section">
                <div
                  v-if="
                    !courseInfo.chapters || courseInfo.chapters.length === 0
                  "
                  class="empty-syllabus"
                >
                  <el-empty description="讲师正在努力备课中..."></el-empty>
                </div>

                <el-collapse v-model="activeChapters" v-else>
                  <el-collapse-item
                    v-for="(chapter, cIndex) in courseInfo.chapters"
                    :key="cIndex"
                    :name="cIndex"
                  >
                    <template slot="title">
                      <span class="chapter-title">{{
                        chapter.chapterName
                      }}</span>
                      <span class="chapter-lesson-count"
                        >共
                        {{ chapter.lessons ? chapter.lessons.length : 0 }}
                        节</span
                      >
                    </template>

                    <div
                      class="lesson-item"
                      v-for="(lesson, lIndex) in chapter.lessons"
                      :key="lesson.id"
                      :class="lesson.contentType.toLowerCase()"
                    >
                      <div class="lesson-info">
                        <i
                          :class="getLessonIcon(lesson.contentType)"
                          class="lesson-icon"
                        ></i>
                        <span class="lesson-index"
                          >{{ cIndex + 1 }}-{{ lIndex + 1 }}</span
                        >
                        <span class="lesson-name">{{ lesson.title }}</span>
                        <el-tag
                          size="mini"
                          type="success"
                          effect="plain"
                          v-if="lesson.isFreePreview === 1"
                          class="free-tag"
                          >免费试看</el-tag
                        >
                      </div>

                      <div class="lesson-action">
                        <el-button
                          v-if="lesson.contentType === 'PRACTICE'"
                          type="primary"
                          size="mini"
                          plain
                          round
                          @click="goToTool(lesson.relatedToolId)"
                          >去实操实验室</el-button
                        >

                        <el-button
                          v-else
                          type="text"
                          size="medium"
                          icon="el-icon-video-play"
                          @click="playLesson(lesson)"
                          >开始学习</el-button
                        >
                      </div>
                    </div>
                  </el-collapse-item>
                </el-collapse>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </div>

      <div class="content-right">
        <el-card shadow="hover" class="action-card">
          <div class="price-area">
            <span class="price-free">免费开放</span>
          </div>

          <!-- 立即学习 模块 -->
          <el-button
            v-if="!enrollmentRecord"
            type="primary"
            class="join-btn"
            :loading="btnLoading"
            @click="handleJoinCourse"
          >
            立即加入学习
          </el-button>

          <div v-else>
            <el-progress
              :text-inside="true"
              :stroke-width="20"
              :percentage="enrollmentRecord.progress || 0"
              status="success"
              style="margin-bottom: 15px"
            ></el-progress>

            <el-button
              type="success"
              class="join-btn"
              @click="continueLearning"
            >
              继续学习
            </el-button>
          </div>

          <div class="action-promise">
            <span><i class="el-icon-circle-check"></i> 平台专属资源</span>
            <span><i class="el-icon-mobile"></i> 进度云端同步 </span>
          </div>
        </el-card>

        <el-card shadow="never" class="instructor-card">
          <div slot="header" class="card-header">
            <span>授课讲师</span>
          </div>
          <div class="instructor-profile">
            <el-avatar
              :size="56"
              :src="$img(courseInfo.instructorAvatar)"
              icon="el-icon-user-solid"
            ></el-avatar>
            <div class="info">
              <h4>{{ courseInfo.instructorName }}</h4>
              <p>特邀高级生信工程师</p>
            </div>
          </div>
          <div class="instructor-desc">
            参与多项国家级重大科研项目数据分析，精通转录组学、表观遗传学及单细胞多组学数据挖掘，致力于生物信息学工具的开源与普及。
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script>
import {
  getCourseDetail,
  checkEnrollmentStatus,
  enrollCourse,
} from "@/api/course"; // 确保你的路径正确

import { mapState, mapGetters } from "vuex";

export default {
  name: "CourseDetail",
  data() {
    return {
      loading: true,
      courseId: null,
      courseInfo: null,
      activeTab: "syllabus", // 默认打开课程大纲 Tab
      activeChapters: [0, 1], // 默认展开前两个章节

      enrollmentRecord: null, // 存放报名记录
      btnLoading: false, // 加入课程按钮的 loading 状态
    };
  },

  created() {
    this.courseId = this.$route.params.id; // 获取路由中的课程 ID
    if (this.courseId) {
      this.fetchDetail();
      this.checkStatus(); // 页面一加载就去查有没有报过名
    }
  },

  computed: {
    ...mapState("user", {
      isLoggedIn: (state) => state.isLoggedIn,
      userInfo: (state) => state.userInfo,
    }),

    ...mapGetters("user", ["userId", "username", "userRole"]),
  },

  methods: {
    fetchDetail() {
      this.loading = true;
      getCourseDetail(this.courseId)
        .then((res) => {
          if (res.code === 200) {
            this.courseInfo = res.data;
            // 如果章节数很多，可以动态设置 activeChapters 默认展开第一章
            if (
              this.courseInfo.chapters &&
              this.courseInfo.chapters.length > 0
            ) {
              this.activeChapters = [0];
            }
          } else {
            this.$message.error(res.msg || "获取课程详情失败");
          }
        })
        .catch((err) => {
          console.error("Fetch detail error:", err);
          this.$message.error("网络异常，请稍后再试");
        })
        .finally(() => {
          this.loading = false;
        });
    },

    // 动态匹配课时类型的图标
    getLessonIcon(type) {
      const iconMap = {
        VIDEO: "el-icon-video-camera-solid",
        ARTICLE: "el-icon-document",
        PRACTICE: "el-icon-cpu",
      };
      return iconMap[type] || "el-icon-reading";
    },

    // 格式化难度
    formatDifficulty(difficulty) {
      const map = {
        BEGINNER: "初级入门",
        INTERMEDIATE: "中级进阶",
        ADVANCED: "高级科研",
      };
      return map[difficulty] || difficulty;
    },

    // 查询当前用户是否报过名
    checkStatus() {
      // 🌟【防护 1】如果用户没登录，直接不发请求，并认定为未报名状态
      if (!this.userId) {
        this.enrollmentRecord = null;
        return;
      }
      console.log("当前用户id", this.userId);

      checkEnrollmentStatus(this.courseId, this.userId)
        .then((res) => {
          if (res.code === 200) {
            this.enrollmentRecord = res.data; // 如果有报名记录，说明已经加入课程了
          } else {
            this.enrollmentRecord = null; // 没有记录，说明没加入
          }
        })
        .catch((err) => {
          console.error("Check enrollment error:", err);
          this.$message.error("无法获取报名状态，请稍后再试");
        });
    },

    // 动作：加入学习
    handleJoinCourse() {
      // 🌟【防护 2】如果没登录，拦截点击，提示登录
      if (!this.userId) {
        this.$message.warning("请先登录后再加入课程！");
        // 如果你有登录页，可以取消下面这行的注释自动跳过去
        this.$router.push("/login");
        return;
      }
      this.btnLoading = true;
      enrollCourse(this.courseId, this.userId)
        .then((res) => {
          if (res.code === 200) {
            this.$message.success("成功加入课程！");
            // 把后端返回的最新记录赋值给本地变量，页面会自动切换成“继续学习”状态
            this.enrollmentRecord = res.data; // 更新报名记录
          } else {
            this.$message.error(res.msg || "加入课程失败");
          }
        })
        .catch((err) => {
          console.error("Enroll course error:", err);
          this.$message.error("网络异常，请稍后再试");
        })
        .finally(() => {
          this.btnLoading = false;
        });
    },

    // 点击继续学习
    continueLearning() {
      this.$message.info("正在进入沉浸式学习...");
      this.$router.push({
        name: "CourseLearn",
        params: {
          id: this.courseId,
        },
      });
    },

    // 动作：点击学习单个课时
    playLesson(lesson) {
      if (lesson.isFreePreview === 0) {
        // 如果不是免费试看，且用户没加入课程，可以提示
        this.$message.warning("请先加入课程后再学习该课时");
        return;
      }
      this.$message.info(`正在加载：${lesson.title}`);
      this.$router.push({
        name: "CourseLearn",
        params: {
          id: this.courseId,
        },
      });
    },

    // 动作：跳转到分析实验室
    goToTool(toolId) {
      if (!toolId) {
        this.$message.warning("该课时暂未绑定特定分析工具");
        return;
      }
      // 携带工具 ID 跳转到你的分析中心页面
      this.$router.push({ path: "/analysis", query: { toolId: toolId } });
    },
  },
};
</script>

<style lang="scss" scoped>
.course-detail-wrapper {
  min-height: calc(100vh - 60px);
  background: #f1f5f9;
  padding-bottom: 60px;
}

/* 顶部深色横幅 */
.course-hero {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  padding: 30px 0 40px 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

  .hero-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .hero-breadcrumb {
    margin-bottom: 24px;
    ::v-deep .el-breadcrumb__inner {
      color: #94a3b8 !important;
      font-weight: normal;
    }
    ::v-deep .el-breadcrumb__inner:hover {
      color: #fff !important;
    }
    ::v-deep .el-breadcrumb__separator {
      color: #64748b;
    }
  }

  .hero-main {
    display: flex;
    gap: 40px;
    align-items: center;

    .hero-cover {
      width: 380px;
      height: 220px;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
      flex-shrink: 0;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);

      .cover-image,
      .empty-cover {
        width: 100%;
        height: 100%;
      }
      .empty-cover {
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 48px;
        color: rgba(255, 255, 255, 0.2);
      }

      .difficulty-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        padding: 4px 12px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: bold;
        color: white;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(8px);
        &.beginner {
          border-bottom: 3px solid #10b981;
        }
        &.intermediate {
          border-bottom: 3px solid #f59e0b;
        }
        &.advanced {
          border-bottom: 3px solid #ef4444;
        }
      }
    }

    .hero-info {
      flex: 1;
      color: white;

      .course-title {
        font-size: 32px;
        font-weight: 700;
        margin: 0 0 16px 0;
        line-height: 1.4;
      }

      .course-desc {
        font-size: 15px;
        color: #cbd5e1;
        line-height: 1.6;
        margin-bottom: 24px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .course-stats {
        display: flex;
        align-items: center;
        gap: 16px;
        background: rgba(255, 255, 255, 0.05);
        padding: 12px 20px;
        border-radius: 8px;
        display: inline-flex;

        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #f8fafc;
          i {
            font-size: 16px;
            color: #94a3b8;
          }
          .rating-icon {
            color: #fbbf24;
          }
        }

        .stat-divider {
          width: 1px;
          height: 16px;
          background: rgba(255, 255, 255, 0.2);
        }
      }
    }
  }
}

/* 下方主体布局 */
.main-content {
  max-width: 1200px;
  margin: 24px auto 0;
  padding: 0 20px;
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
}

/* 左侧选项卡与目录 */
.tabs-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  min-height: 500px;

  ::v-deep .el-tabs__item {
    font-size: 16px;
    height: 54px;
    line-height: 54px;
  }
  ::v-deep .el-tabs__nav-wrap::after {
    background-color: #f1f5f9;
  }

  /* 介绍区域 */
  .overview-section {
    padding: 10px 0;
    h3 {
      font-size: 18px;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 24px 0 16px 0;
      i {
        color: #3b82f6;
      }
    }
    .rich-text-content {
      font-size: 15px;
      color: #475569;
      line-height: 1.8;
    }

    .learning-goals {
      list-style: none;
      padding: 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      li {
        position: relative;
        padding-left: 20px;
        font-size: 15px;
        color: #475569;
        line-height: 1.6;
        &::before {
          content: "•";
          position: absolute;
          left: 0;
          top: 0;
          color: #3b82f6;
          font-size: 20px;
          font-weight: bold;
        }
      }
    }
  }

  /* 大纲目录区域 */
  .syllabus-section {
    padding: 10px 0;

    .chapter-title {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }
    .chapter-lesson-count {
      font-size: 13px;
      color: #94a3b8;
      margin-left: 12px;
      font-weight: normal;
    }

    ::v-deep .el-collapse-item__header {
      background-color: #fafbfc;
      padding: 0 16px;
      border-radius: 8px;
      margin-bottom: 8px;
      border-bottom: none;
    }
    ::v-deep .el-collapse-item__wrap {
      border-bottom: none;
    }
    ::v-deep .el-collapse {
      border: none;
    }

    .lesson-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      margin: 8px 0;
      border-radius: 8px;
      background: #fff;
      border: 1px solid #f1f5f9;
      transition: all 0.3s ease;

      &:hover {
        border-color: #cbd5e1;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        transform: translateX(4px);
      }

      .lesson-info {
        display: flex;
        align-items: center;
        gap: 12px;
        .lesson-icon {
          font-size: 18px;
          color: #94a3b8;
        }
        .lesson-index {
          font-size: 13px;
          color: #94a3b8;
          width: 30px;
        }
        .lesson-name {
          font-size: 14px;
          color: #334155;
        }
        .free-tag {
          margin-left: 8px;
        }
      }

      /* 针对实操课时的特殊高亮样式 */
      &.practice {
        background: #f0fdf4;
        border-color: #bbf7d0;
        .lesson-icon {
          color: #10b981;
        }
      }

      &.video .lesson-icon {
        color: #3b82f6;
      }
    }
  }
}

/* 右侧边栏 */
.content-right {
  display: flex;
  flex-direction: column;
  gap: 24px;

  /* 浮动购买/加入面板 */
  .action-card {
    border: none;
    border-radius: 12px;
    text-align: center;
    .price-area {
      margin-bottom: 20px;
      .price-free {
        font-size: 28px;
        font-weight: bold;
        color: #10b981;
      }
    }
    .join-btn {
      width: 100%;
      height: 48px;
      font-size: 16px;
      font-weight: bold;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .action-promise {
      display: flex;
      justify-content: center;
      gap: 16px;
      font-size: 12px;
      color: #64748b;
      span {
        display: flex;
        align-items: center;
        gap: 4px;
        i {
          font-size: 14px;
        }
      }
    }
  }

  /* 讲师介绍卡片 */
  .instructor-card {
    border: none;
    border-radius: 12px;
    .card-header {
      font-weight: bold;
      font-size: 16px;
      color: #1e293b;
    }
    .instructor-profile {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
      h4 {
        margin: 0 0 6px 0;
        color: #1e293b;
        font-size: 16px;
      }
      p {
        margin: 0;
        color: #64748b;
        font-size: 13px;
      }
    }
    .instructor-desc {
      font-size: 13px;
      color: #475569;
      line-height: 1.6;
    }
  }
}

/* 响应式调整 */
@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
  }
  .hero-main {
    flex-direction: column;
    align-items: flex-start;
  }
  .hero-cover {
    width: 100% !important;
    max-width: 500px;
  }
}
</style>
