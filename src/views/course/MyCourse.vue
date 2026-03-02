<template>
  <div class="my-course-container" v-loading="loading">
    <div class="profile-header">
      <div class="profile-inner">
        <div class="user-info-section">
          <el-avatar
            :size="80"
            :src="
              userInfo && userInfo.avatar
                ? $img(userInfo.avatar)
                : defaultAvatar
            "
            class="user-avatar"
          ></el-avatar>
          <div class="user-text">
            <h2>
              {{
                userInfo ? userInfo.nickname || userInfo.username : "生信极客"
              }}
            </h2>
            <p class="bio">学海无涯，生信作舟。开启你的数字化生命探索之旅。</p>
          </div>
        </div>

        <div class="user-stats-section">
          <div class="stat-box">
            <span class="stat-num">{{ stats.learningCount || 0 }}</span>
            <span class="stat-desc">在学课程</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-box">
            <span class="stat-num">{{ stats.completedCount || 0 }}</span>
            <span class="stat-desc">已学完</span>
          </div>
        </div>
      </div>
    </div>

    <div class="course-shelf">
      <el-tabs v-model="activeTab" class="custom-tabs">
        <el-tab-pane label="正在学习" name="learning">
          <span slot="label"><i class="el-icon-reading"></i> 正在学习</span>

          <div class="course-grid" v-if="learningList.length > 0">
            <el-card
              v-for="item in learningList"
              :key="item.courseId"
              class="learning-card"
              shadow="hover"
            >
              <div class="card-layout">
                <el-image
                  :src="$img(item.coverImage)"
                  fit="cover"
                  class="course-cover"
                ></el-image>
                <div class="course-info">
                  <h3 class="text-ellipsis" :title="item.title">
                    {{ item.title }}
                  </h3>
                  <p class="last-learn">
                    <i class="el-icon-time"></i> 上次学习:
                    {{ formatTime(item.lastLearnedAt) }}
                  </p>

                  <div class="progress-area">
                    <div class="progress-text">
                      <span>已完成 {{ item.progress }}%</span>
                    </div>
                    <el-progress
                      :percentage="item.progress"
                      :show-text="false"
                      stroke-width="8"
                    ></el-progress>
                  </div>

                  <div class="action-area">
                    <el-button
                      type="primary"
                      size="small"
                      round
                      @click="continueLearning(item.courseId)"
                    >
                      继续学习 <i class="el-icon-right"></i>
                    </el-button>
                  </div>
                </div>
              </div>
            </el-card>
          </div>

          <el-empty
            v-else
            description="暂无正在学习的课程，快去课程中心看看吧！"
            :image-size="200"
          >
            <el-button type="primary" @click="$router.push('/course')"
              >发现好课</el-button
            >
          </el-empty>
        </el-tab-pane>

        <el-tab-pane label="已学完" name="completed">
          <span slot="label"><i class="el-icon-medal"></i> 已学完</span>

          <div class="course-grid" v-if="completedList.length > 0">
            <el-card
              v-for="item in completedList"
              :key="item.courseId"
              class="learning-card completed"
              shadow="never"
            >
              <div class="card-layout">
                <div class="cover-wrapper">
                  <el-image
                    :src="$img(item.coverImage)"
                    fit="cover"
                    class="course-cover"
                  ></el-image>
                  <div class="completed-mask">
                    <i class="el-icon-circle-check"></i>
                  </div>
                </div>
                <div class="course-info">
                  <h3 class="text-ellipsis" :title="item.title">
                    {{ item.title }}
                  </h3>
                  <el-tag
                    type="success"
                    size="small"
                    effect="dark"
                    class="mb-10"
                  >
                    <i class="el-icon-trophy"></i> 恭喜结课
                  </el-tag>
                  <p class="last-learn">
                    结课时间: {{ formatTime(item.lastLearnedAt) }}
                  </p>

                  <div class="action-area">
                    <el-button
                      size="small"
                      round
                      plain
                      @click="continueLearning(item.courseId)"
                    >
                      回顾课程
                    </el-button>
                  </div>
                </div>
              </div>
            </el-card>
          </div>

          <el-empty
            v-else
            description="还没有学完的课程，继续加油哦！"
            :image-size="200"
          ></el-empty>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import { getMyCourses } from "@/api/course"; // 我们马上要在 api 里面加这个方法

export default {
  name: "MyCourse",
  data() {
    return {
      loading: false,
      activeTab: "learning",
      defaultAvatar:
        "https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png",
      stats: {
        learningCount: 0,
        completedCount: 0,
        totalHours: 0,
      },
      learningList: [],
      completedList: [],
    };
  },
  computed: {
    ...mapState("user", ["userInfo", "isLoggedIn"]),
    ...mapGetters("user", ["userId"]),
  },
  created() {
    if (!this.isLoggedIn || !this.userId) {
      this.$message.warning("请先登录查看您的学习记录");
      this.$router.push("/login");
      return;
    }
    this.fetchMyCourses();
  },
  methods: {
    fetchMyCourses() {
      this.loading = true;
      getMyCourses(this.userId)
        .then((res) => {
          if (res.code === 200) {
            const allCourses = res.data || [];

            // 前端按状态将课程分入两个数组
            this.learningList = allCourses.filter((c) => c.progress < 100);
            this.completedList = allCourses.filter((c) => c.progress >= 100);

            // 计算顶部统计数据
            this.stats.learningCount = this.learningList.length;
            this.stats.completedCount = this.completedList.length;

            // 假设后端传过来的 totalHours 也在这个接口里，或者可以在这简单估算
            // this.stats.totalHours = res.extra.totalHours;
          }
        })
        .finally(() => {
          this.loading = false;
        });
    },

    continueLearning(courseId) {
      const routeData = this.$router.resolve({
        name: "CourseLearn",
        params: { id: courseId },
      });
      window.open(routeData.href, "_blank");
    },

    formatTime(timeStr) {
      if (!timeStr) return "刚刚";
      // 简单截取日期部分，如果是带时分秒的格式，如 2026-03-02 12:00:00 -> 2026-03-02
      return timeStr.substring(0, 10);
    },
  },
};
</script>

<style lang="scss" scoped>
.my-course-container {
  min-height: calc(100vh - 60px);
  background-color: #f8fafc;
}

/* 顶部档案横幅 */
.profile-header {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  padding: 40px 0;
  color: white;

  .profile-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .user-info-section {
    display: flex;
    align-items: center;
    gap: 24px;

    .user-avatar {
      border: 4px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .user-text {
      h2 {
        font-size: 28px;
        margin: 0 0 8px 0;
        font-weight: 600;
        letter-spacing: 1px;
      }
      .bio {
        margin: 0;
        font-size: 14px;
        color: #94a3b8;
      }
    }
  }

  .user-stats-section {
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.05);
    padding: 20px 40px;
    border-radius: 16px;
    backdrop-filter: blur(10px);

    .stat-box {
      text-align: center;
      min-width: 80px;

      .stat-num {
        display: block;
        font-size: 28px;
        font-weight: bold;
        color: #38bdf8;
        margin-bottom: 4px;
      }
      .stat-desc {
        font-size: 13px;
        color: #94a3b8;
      }
    }

    .stat-divider {
      width: 1px;
      height: 40px;
      background: rgba(255, 255, 255, 0.1);
      margin: 0 30px;
    }
  }
}

/* 底部课程架 */
.course-shelf {
  max-width: 1200px;
  margin: -30px auto 40px auto; /* 负边距实现向上重叠效果 */
  padding: 0 20px;
  position: relative;
  z-index: 10;

  /* 深度覆盖 el-tabs 样式，让它看起来像悬浮卡片 */
  ::v-deep .el-tabs__header {
    background: white;
    padding: 0 20px;
    border-radius: 12px 12px 0 0;
    margin-bottom: 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border-bottom: 1px solid #f1f5f9;
  }
  ::v-deep .el-tabs__nav-wrap::after {
    display: none;
  }
  ::v-deep .el-tabs__item {
    height: 60px;
    line-height: 60px;
    font-size: 16px;
    i {
      margin-right: 4px;
    }
  }

  ::v-deep .el-tabs__content {
    background: white;
    padding: 30px;
    border-radius: 0 0 12px 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    min-height: 400px;
  }
}

/* 课程网格 */
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
  gap: 24px;

  .learning-card {
    border-radius: 12px;
    border: 1px solid #f1f5f9;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08) !important;
      border-color: #cbd5e1;
    }

    ::v-deep .el-card__body {
      padding: 16px;
    }

    .card-layout {
      display: flex;
      gap: 20px;
    }

    .cover-wrapper {
      position: relative;
    }

    .course-cover {
      width: 180px;
      height: 110px;
      border-radius: 8px;
      flex-shrink: 0;
      background: #f1f5f9;
    }

    .course-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      h3 {
        margin: 0 0 8px 0;
        font-size: 16px;
        color: #1e293b;
        line-height: 1.4;
      }

      .last-learn {
        margin: 0 0 12px 0;
        font-size: 12px;
        color: #64748b;
        i {
          margin-right: 4px;
        }
      }

      .progress-area {
        margin-top: auto;
        margin-bottom: 12px;
        .progress-text {
          font-size: 12px;
          color: #3b82f6;
          margin-bottom: 6px;
          font-weight: 500;
        }
      }

      .action-area {
        display: flex;
        justify-content: flex-end;
      }
    }

    /* 已完成卡片的特殊样式 */
    &.completed {
      background: #fafbfc;
      .course-info h3 {
        color: #475569;
      }
      .completed-mask {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 8px;
        i {
          font-size: 40px;
          color: #10b981;
          opacity: 0.9;
        }
      }
      .mb-10 {
        margin-bottom: 10px;
        width: fit-content;
      }
    }
  }
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .profile-inner {
    flex-direction: column;
    gap: 30px;
  }
  .user-stats-section {
    width: 100%;
    justify-content: space-around;
  }
  .course-grid {
    grid-template-columns: 1fr;
  }
  .learning-card .card-layout {
    flex-direction: column;
    .course-cover {
      width: 100%;
      height: 160px;
    }
  }
}
</style>
