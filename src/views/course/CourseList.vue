<template>
  <div class="course-list-container">
    <!-- 搜索和筛选区域 -->
    <div class="search-filter-container">
      <el-card>
        <div class="filter-content">
          <!-- 搜索框 -->
          <div class="search-box">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索课程..."
              prefix-icon="el-icon-search"
              @keyup.enter.native="handleSearch"
              style="width: 300px"
            >
              <el-button
                slot="append"
                icon="el-icon-search"
                @click="handleSearch"
              ></el-button>
            </el-input>
          </div>

          <!-- 筛选条件 -->
          <div class="filter-options">
            <el-select
              v-model="filter.category"
              placeholder="全部分类"
              clearable
              @change="loadCourses"
            >
              <el-option label="DNA分析" value="DNA分析"></el-option>
              <el-option label="RNA分析" value="RNA分析"></el-option>
              <el-option label="蛋白质分析" value="蛋白质分析"></el-option>
              <el-option label="基因组学" value="基因组学"></el-option>
              <el-option label="转录组学" value="转录组学"></el-option>
              <el-option label="蛋白质组学" value="蛋白质组学"></el-option>
            </el-select>

            <el-select
              v-model="filter.difficulty"
              placeholder="全部难度"
              clearable
              @change="loadCourses"
              style="margin-left: 10px"
            >
              <el-option label="初级" value="1"></el-option>
              <el-option label="中级" value="2"></el-option>
              <el-option label="高级" value="3"></el-option>
            </el-select>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 课程列表 -->
    <div class="course-list-content">
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="6" animated />
      </div>

      <div v-else-if="courses.length === 0" class="empty-container">
        <el-empty description="暂无课程" />
      </div>

      <div v-else class="course-grid">
        <el-row :gutter="20">
          <el-col
            v-for="course in courses"
            :key="course.id"
            :xs="24"
            :sm="12"
            :md="8"
            :lg="6"
            style="margin-bottom: 20px"
          >
            <el-card class="course-card" shadow="hover">
              <!-- 课程封面 -->
              <div class="course-cover" @click="goToDetail(course.id)">
                <img
                  v-if="course.coverImage"
                  :src="course.coverImage"
                  :alt="course.title"
                />
                <div v-else class="default-cover">
                  <i class="el-icon-notebook-2"></i>
                  <span>{{ course.category }}</span>
                </div>
                <div class="course-status">
                  <el-tag v-if="course.status === 0" type="info" size="mini"
                    >草稿</el-tag
                  >
                  <el-tag v-if="course.status === 1" type="success" size="mini"
                    >已发布</el-tag
                  >
                </div>
              </div>

              <!-- 课程信息 -->
              <div class="course-info">
                <h3 class="course-title" @click="goToDetail(course.id)">
                  {{ course.title }}
                </h3>

                <div class="course-meta">
                  <div class="meta-item">
                    <i class="el-icon-user"></i>
                    <span>{{ course.teacherName || "未知教师" }}</span>
                  </div>
                  <div class="meta-item">
                    <i class="el-icon-s-custom"></i>
                    <span>{{ course.studentCount }}人学习</span>
                  </div>
                </div>

                <div class="course-tags">
                  <el-tag size="mini">{{ course.category }}</el-tag>
                  <el-tag
                    v-if="course.difficulty"
                    :type="getDifficultyTagType(course.difficulty)"
                    size="mini"
                  >
                    {{ getDifficultyText(course.difficulty) }}
                  </el-tag>
                </div>

                <!-- 操作按钮 -->
                <div class="course-actions">
                  <el-button
                    v-if="
                      userRole === 'teacher' &&
                      course.teacherId === currentUserId
                    "
                    type="primary"
                    size="small"
                    icon="el-icon-edit"
                    @click="editCourse(course.id)"
                    >编辑</el-button
                  >

                  <el-button
                    v-else-if="userRole === 'student'"
                    :type="course.selected ? 'success' : 'primary'"
                    :icon="course.selected ? 'el-icon-check' : 'el-icon-plus'"
                    size="small"
                    @click="handleSelectCourse(course)"
                    :loading="selectingCourseId === course.id"
                  >
                    {{ course.selected ? "已选课" : "选课" }}
                  </el-button>

                  <el-button
                    type="text"
                    icon="el-icon-view"
                    @click="goToDetail(course.id)"
                    >详情</el-button
                  >
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            :current-page="pagination.current"
            :page-size="pagination.size"
            :total="pagination.total"
            :page-sizes="[12, 24, 36, 48]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "CourseList",
  data() {
    return {
      loading: false,
      courses: [],
      searchKeyword: "",
      filter: {
        category: "",
        difficulty: "",
      },
      pagination: {
        current: 1,
        size: 12,
        total: 0,
      },
      selectingCourseId: null,
      currentUserId: null,
      userRole: "",
    };
  },
  created() {
    // 获取用户信息
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    this.currentUserId = user.id;
    this.userRole = user.role;

    this.loadCourses();
  },
  methods: {
    // 加载课程列表
    async loadCourses() {
      this.loading = true;
      try {
        const params = {
          pageNum: this.pagination.current,
          pageSize: this.pagination.size,
          ...this.filter,
        };

        if (this.searchKeyword) {
          params.keyword = this.searchKeyword;
        }

        const response = await this.$http.get("/api/courses", { params });
        if (response.data.code === 200) {
          this.courses = response.data.data.records || [];
          this.pagination.total = response.data.data.total || 0;
        } else {
          this.$message.error(response.data.message);
        }
      } catch (error) {
        console.error("加载课程失败:", error);
        this.$message.error("加载课程失败");
      } finally {
        this.loading = false;
      }
    },

    // 搜索课程
    handleSearch() {
      this.pagination.current = 1;
      this.loadCourses();
    },

    // 查看课程详情
    goToDetail(courseId) {
      this.$router.push(`/course/${courseId}`);
    },

    // 编辑课程（教师）
    editCourse(courseId) {
      this.$router.push(`/teacher/course/${courseId}/edit`);
    },

    // 学生选课
    async handleSelectCourse(course) {
      if (this.userRole !== "student") {
        this.$message.warning("只有学生可以选课");
        return;
      }

      if (course.selected) {
        this.$message.info("您已经选过这门课程了");
        return;
      }

      this.selectingCourseId = course.id;
      try {
        const response = await this.$http.post(
          `/api/selections/course/${course.id}/select`,
          null,
          {
            params: { studentId: this.currentUserId },
          }
        );

        if (response.data.code === 200) {
          this.$message.success("选课成功");
          course.selected = true;
          course.studentCount += 1;
        } else {
          this.$message.error(response.data.message);
        }
      } catch (error) {
        console.error("选课失败:", error);
        this.$message.error("选课失败");
      } finally {
        this.selectingCourseId = null;
      }
    },

    // 获取难度标签类型
    getDifficultyTagType(difficulty) {
      const map = { 1: "success", 2: "warning", 3: "danger" };
      return map[difficulty] || "info";
    },

    // 获取难度文本
    getDifficultyText(difficulty) {
      const map = { 1: "初级", 2: "中级", 3: "高级" };
      return map[difficulty] || "未知";
    },

    // 分页大小改变
    handleSizeChange(size) {
      this.pagination.size = size;
      this.pagination.current = 1;
      this.loadCourses();
    },

    // 页码改变
    handleCurrentChange(page) {
      this.pagination.current = page;
      this.loadCourses();
    },
  },
};
</script>

<style scoped>
.course-list-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.search-filter-container {
  margin-bottom: 20px;
}

.filter-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.course-grid {
  min-height: 500px;
}

.course-card {
  height: 100%;
  transition: all 0.3s;
}

.course-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
}

.course-cover {
  position: relative;
  height: 160px;
  background: #f5f7fa;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}

.course-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-cover {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #909399;
  font-size: 14px;
}

.default-cover i {
  font-size: 48px;
  margin-bottom: 10px;
}

.course-status {
  position: absolute;
  top: 10px;
  right: 10px;
}

.course-info {
  padding: 15px 0 0;
}

.course-title {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
  cursor: pointer;
  transition: color 0.3s;
}

.course-title:hover {
  color: #409eff;
}

.course-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #909399;
  font-size: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
}

.meta-item i {
  margin-right: 4px;
}

.course-tags {
  margin-bottom: 15px;
}

.course-tags .el-tag {
  margin-right: 5px;
  margin-bottom: 5px;
}

.course-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #ebeef5;
}

.pagination-container {
  margin-top: 30px;
  text-align: center;
}

.loading-container {
  padding: 40px 0;
}

.empty-container {
  padding: 60px 0;
}

@media (max-width: 768px) {
  .filter-content {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    width: 100%;
  }

  .search-box .el-input {
    width: 100%;
  }
}
</style>
