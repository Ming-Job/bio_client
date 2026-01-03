<template>
  <div class="course-list-container">
    <h2 class="page-title">全部课程</h2>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="6" animated />
    </div>

    <!-- 按类别分组的课程列表 -->
    <div v-else-if="Object.keys(groupedCourses).length > 0" class="category-groups">
      <div 
        v-for="(courses, categoryName) in groupedCourses" 
        :key="categoryName" 
        class="category-group"
      >
        <!-- 类别标题 -->
        <div class="category-header">
          <div class="category-title-wrapper">
            <i class="el-icon-collection-tag category-icon"></i>
            <h3 class="category-title">{{ categoryName || '未分类' }}</h3>
            <span class="course-count">({{ courses.length }}门课程)</span>
          </div>
          <el-divider class="category-divider" />
        </div>

        <!-- 横向课程列表 -->
        <div class="horizontal-course-list">
          <div 
            v-for="course in courses" 
            :key="course.id" 
            class="course-card-horizontal"
          >
            <!-- 课程封面 -->
            <div class="course-cover-wrapper">
              <el-image
                v-if="course.coverImage"
                :src="getCoverUrl(course.coverImage)"
                :alt="course.title"
                fit="cover"
                class="course-cover-img"
              >
                <div slot="error" class="image-error">
                  <i class="el-icon-picture-outline"></i>
                  <span>加载失败</span>
                </div>
              </el-image>
              <div v-else class="no-cover-img">
                <i class="el-icon-picture-outline"></i>
                <span>无封面</span>
              </div>
              
              <!-- 分类标签 -->
              <div v-if="course.category" class="cover-category-tag">
                <el-tag size="mini" type="info">{{ course.category }}</el-tag>
              </div>
            </div>

            <!-- 课程信息 -->
            <div class="course-info-horizontal">
              <h4 class="course-title-horizontal" :title="course.title">
                {{ course.title }}
              </h4>
              
              <div class="course-meta">
                <!-- 教师信息 -->
                <div class="meta-item">
                  <i class="el-icon-user meta-icon"></i>
                  <span class="meta-text">{{ teacherNames[course.teacherId] || '加载中...' }}</span>
                </div>

                <!-- 创建时间 -->
                <div class="meta-item">
                  <i class="el-icon-time meta-icon"></i>
                  <span class="meta-text">{{ formatTime(course.createTime) }}</span>
                </div>

                <!-- 学生数量 -->
                <div class="meta-item">
                  <i class="el-icon-user-solid meta-icon"></i>
                  <span class="meta-text">{{ course.studentCount }}人</span>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="course-actions-horizontal">
                <el-button 
                  type="primary" 
                  size="mini" 
                  plain 
                  class="action-btn"
                  @click="viewCourseDetail(course.id)"
                >
                  查看详情
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 无数据状态 -->
    <div v-else class="empty-container">
      <el-empty description="暂无课程数据" />
    </div>
  </div>
</template>

<script>
import { getCourses } from '@/api/course'
import { getAvatarUrl } from '@/utils/auth';
import { getUsername } from '@/api/user'

export default {
  name: 'CourseList',
  data() {
    return {
      courses: [],
      teacherNames: {},
      loading: false,
      groupedCourses: {}
    }
  },
  created() {
    this.fetchCourses()
    console.log('CourseList component created.')
  },
  methods: {
    async fetchCourses() {
      this.loading = true
      try {
        const data = await getCourses()
        this.courses = data.data.records
        
        // 获取所有不重复的教师ID
        const teacherIds = [...new Set(
          this.courses.map(course => course.teacherId).filter(id => id)
        )]
        
        // 批量获取教师姓名
        await this.batchFetchTeachers(teacherIds)
        
        // 按类别分组
        this.groupCoursesByCategory()
        
      } catch (err) {
        console.error('获取课程失败:', err)
        this.$message.error('获取课程列表失败，请重试')
      } finally {
        this.loading = false
      }
    },

    groupCoursesByCategory() {
      const grouped = {}
      
      this.courses.forEach(course => {
        const category = course.category || '未分类'
        
        if (!grouped[category]) {
          grouped[category] = []
        }
        
        grouped[category].push(course)
      })
      
      // 排序：有类别的按字母排序，未分类放在最后
      this.groupedCourses = Object.keys(grouped)
        .sort((a, b) => {
          if (a === '未分类') return 1
          if (b === '未分类') return -1
          return a.localeCompare(b)
        })
        .reduce((acc, key) => {
          acc[key] = grouped[key]
          return acc
        }, {})
    },

    async batchFetchTeachers(teacherIds) {
      if (!teacherIds.length) return
      
      const promises = teacherIds.map(async (id) => {
        try {
          const response = await getUsername(id)
          if (response.code === 200) {
            this.$set(this.teacherNames, id, response.data)
          }
        } catch (error) {
          console.error(`获取教师${id}失败:`, error)
          this.$set(this.teacherNames, id, '未知教师')
        }
      })
      
      await Promise.all(promises)
    },
    
    getCoverUrl(cover) {
      return getAvatarUrl(cover)
    },

    formatTime(time) {
      if (!time) return '-'
      try {
        const date = new Date(time)
        return date.toLocaleDateString('zh-CN')
      } catch (e) {
        return time
      }
    },
    
    viewCourseDetail(courseId) {
      // 跳转到课程详情页
      this.$router.push(`/course/detail/${courseId}`)
    }
  }
}
</script>

<style scoped>
.course-list-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 150px;
  min-height: calc(100vh - 60px);
}

.page-title {
  margin: 0 0 30px 0;
  color: #303133;
  font-size: 28px;
  font-weight: 600;
  text-align: center;
}

.loading-container {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 类别分组样式 */
.category-groups {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.category-group {
  background: #fbfbfb;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
}

.category-group:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
}

/* 类别标题样式 */
.category-header {
  padding: 20px 24px 0;
}

.category-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.category-icon {
  font-size: 24px;
  color: #409EFF;
}

.category-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.course-count {
  font-size: 14px;
  color: #909399;
  margin-left: 4px;
}

.category-divider {
  margin: 0;
}

/* 横向课程列表样式 */
.horizontal-course-list {
  display: flex;
  gap: 20px;
  padding: 24px;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f5f5f5;
}

/* 自定义滚动条样式 */
.horizontal-course-list::-webkit-scrollbar {
  height: 8px;
}

.horizontal-course-list::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 4px;
}

.horizontal-course-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.horizontal-course-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 横向课程卡片样式 */
.course-card-horizontal {
  flex: 0 0 auto;
  width: 280px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
}

.course-card-horizontal:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

/* 课程封面区域 */
.course-cover-wrapper {
  position: relative;
  width: 100%;
  height: 160px;
  overflow: hidden;
}

.course-cover-img,
.no-cover-img {
  width: 100%;
  height: 100%;
}

.image-error,
.no-cover-img {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  color: #909399;
}

.image-error i,
.no-cover-img i {
  font-size: 48px;
  margin-bottom: 10px;
  opacity: 0.7;
}

.image-error span,
.no-cover-img span {
  font-size: 14px;
}

/* 封面上的分类标签 */
.cover-category-tag {
  position: absolute;
  top: 12px;
  right: 12px;
}

/* 课程信息区域 */
.course-info-horizontal {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.course-title-horizontal {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
  height: 44px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
}

/* 课程元信息 */
.course-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}

.meta-icon {
  color: #909399;
  font-size: 14px;
  width: 16px;
  text-align: center;
}

.meta-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 操作按钮 */
.course-actions-horizontal {
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.action-btn {
  width: 100%;
}

/* 空状态 */
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .course-list-container {
    padding: 16px;
  }
  
  .course-card-horizontal {
    width: 260px;
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 24px;
    margin-bottom: 20px;
  }
  
  .category-groups {
    gap: 20px;
  }
  
  .category-header {
    padding: 16px 20px 0;
  }
  
  .category-title {
    font-size: 20px;
  }
  
  .horizontal-course-list {
    padding: 20px 16px;
    gap: 16px;
  }
  
  .course-card-horizontal {
    width: 240px;
  }
  
  .course-cover-wrapper {
    height: 140px;
  }
}

@media (max-width: 480px) {
  .course-list-container {
    padding: 12px;
  }
  
  .category-title-wrapper {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .course-card-horizontal {
    width: 220px;
  }
}
</style>