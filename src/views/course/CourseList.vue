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
        v-for="(courses, categoryName, categoryIndex) in groupedCourses" 
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

        <!-- 横向课程列表容器 -->
        <div class="horizontal-course-container">
          <!-- 左箭头按钮 -->
          <div 
            v-if="showLeftArrow[categoryIndex] && courses.length > 5" 
            class="scroll-arrow arrow-left"
            @click="scrollLeft(categoryIndex)"
          >
            <i class="el-icon-arrow-left"></i>
          </div>
          
          <!-- 横向课程列表 -->
          <div 
            :ref="`scrollContainer_${categoryIndex}`"
            class="horizontal-course-list"
            @scroll="handleScroll(categoryIndex)"
          >
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
          
          <!-- 右箭头按钮 -->
          <div 
            v-if="showRightArrow[categoryIndex] && courses.length > 5" 
            class="scroll-arrow arrow-right"
            @click="scrollRight(categoryIndex)"
          >
            <i class="el-icon-arrow-right"></i>
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
      groupedCourses: {},
      showLeftArrow: {}, // 控制左箭头显示
      showRightArrow: {}, // 控制右箭头显示
      resizeObserver: null // 用于监听容器大小变化
    }
  },
  created() {
    this.fetchCourses()
    console.log('CourseList component created.')
  },
  mounted() {
    // 监听窗口大小变化
    window.addEventListener('resize', this.debounceCalculateArrow)
    
    // 设置一个初始化检查的定时器
    this.$nextTick(() => {
      // 延迟检查，确保DOM完全渲染
      setTimeout(() => {
        this.calculateArrowVisibility()
      }, 300)
      
      // 再次检查，处理图片加载等延迟
      setTimeout(() => {
        this.calculateArrowVisibility()
      }, 1000)
    })
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.debounceCalculateArrow)
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
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
        
        // 重置箭头状态
        this.showLeftArrow = {}
        this.showRightArrow = {}
        
        // 在DOM更新后计算箭头显示状态
        this.$nextTick(() => {
          // 立即计算一次
          this.calculateArrowVisibility()
          
          // 延迟计算，确保DOM完全渲染
          setTimeout(() => {
            this.calculateArrowVisibility()
          }, 300)
          
          // 初始化ResizeObserver
          this.initResizeObserver()
        })
        
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
    },
    
    // 初始化ResizeObserver
    initResizeObserver() {
      // 检查浏览器是否支持ResizeObserver
      if (typeof ResizeObserver === 'undefined') return
      
      // 断开之前的观察器
      if (this.resizeObserver) {
        this.resizeObserver.disconnect()
      }
      
      // 创建新的ResizeObserver
      this.resizeObserver = new ResizeObserver(this.debounceCalculateArrow)
      
      // 观察每个滚动容器
      const categoryCount = Object.keys(this.groupedCourses).length
      for (let i = 0; i < categoryCount; i++) {
        const container = this.$refs[`scrollContainer_${i}`]?.[0]
        if (container) {
          this.resizeObserver.observe(container)
        }
      }
    },
    
    // 防抖的箭头计算
    debounceCalculateArrow() {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer)
      }
      this.debounceTimer = setTimeout(() => {
        this.calculateArrowVisibility()
      }, 200)
    },
    
    // 计算箭头显示状态
    calculateArrowVisibility() {
      const categoryCount = Object.keys(this.groupedCourses).length
      console.log(`开始计算箭头可见性，共${categoryCount}个类别`)
      
      for (let i = 0; i < categoryCount; i++) {
        const container = this.$refs[`scrollContainer_${i}`]?.[0]
        if (container && container.offsetWidth > 0) {
          console.log(`容器 ${i} 尺寸:`, {
            容器宽度: container.clientWidth,
            内容宽度: container.scrollWidth,
            是否可滚动: container.scrollWidth > container.clientWidth
          })
          
          // 强制重新计算布局
          const containerStyle = window.getComputedStyle(container)
          const paddingLeft = parseInt(containerStyle.paddingLeft) || 0
          const paddingRight = parseInt(containerStyle.paddingRight) || 0
          const actualContainerWidth = container.clientWidth - paddingLeft - paddingRight
          
          // 计算卡片总宽度
          const courseCards = container.querySelectorAll('.course-card-horizontal')
          let totalCardsWidth = 0
          courseCards.forEach(card => {
            const cardStyle = window.getComputedStyle(card)
            const cardWidth = card.offsetWidth
            const marginRight = parseInt(cardStyle.marginRight) || 0
            totalCardsWidth += cardWidth + marginRight
          })
          
          console.log(`容器 ${i} 实际可用宽度: ${actualContainerWidth}, 卡片总宽度: ${totalCardsWidth}`)
          
          // 判断是否可滚动
          const canScroll = totalCardsWidth > actualContainerWidth
          const showLeft = canScroll && container.scrollLeft > 0
          const showRight = canScroll && totalCardsWidth > actualContainerWidth + container.scrollLeft
          
          // 如果课程数量大于5，强制显示右侧箭头
          const courses = Object.values(this.groupedCourses)[i]
          const forceShowRight = courses && courses.length > 5
          
          console.log(`容器 ${i} 箭头状态:`, { 
            可滚动: canScroll, 
            显示左箭头: showLeft, 
            显示右箭头: showRight || forceShowRight
          })
          
          this.$set(this.showLeftArrow, i, showLeft)
          this.$set(this.showRightArrow, i, showRight || forceShowRight)
        } else {
          console.warn(`容器 ${i} 未找到或宽度为0`)
          this.$set(this.showLeftArrow, i, false)
          this.$set(this.showRightArrow, i, false)
        }
      }
    },
    
    // 更新单个容器的箭头显示状态
    updateArrowVisibility(index, container) {
      if (!container || container.offsetWidth === 0) {
        this.$set(this.showLeftArrow, index, false)
        this.$set(this.showRightArrow, index, false)
        return
      }
      
      const canScroll = container.scrollWidth > container.clientWidth
      const showLeft = canScroll && container.scrollLeft > 0
      const showRight = canScroll && container.scrollWidth > container.clientWidth + container.scrollLeft
      
      // 如果课程数量大于5，强制显示右侧箭头
      const courses = Object.values(this.groupedCourses)[index]
      const forceShowRight = courses && courses.length > 5
      
      this.$set(this.showLeftArrow, index, showLeft)
      this.$set(this.showRightArrow, index, showRight || forceShowRight)
    },
    
    // 滚动事件处理
    handleScroll(index) {
      const container = this.$refs[`scrollContainer_${index}`]?.[0]
      if (container) {
        this.updateArrowVisibility(index, container)
      }
    },
    
    // 向左滚动
    scrollLeft(index) {
      const container = this.$refs[`scrollContainer_${index}`]?.[0]
      if (container) {
        // 每次滚动一行的宽度（5个卡片）
        const scrollAmount = container.clientWidth
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
      }
    },
    
    // 向右滚动
    scrollRight(index) {
      const container = this.$refs[`scrollContainer_${index}`]?.[0]
      if (container) {
        // 每次滚动一行的宽度（5个卡片）
        const scrollAmount = container.clientWidth
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
      }
    }
  }
}
</script>

<style scoped>
.course-list-container {
  padding: 20px;
  max-width: 1600px;
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

/* 横向课程列表容器 */
.horizontal-course-container {
  position: relative;
  padding: 0 50px;
  width: 100%;
  min-height: 370px; /* 确保容器有最小高度，避免布局抖动 */
}

/* 滚动箭头样式 - 添加阴影和背景增强可见性 */
.scroll-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 80px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  z-index: 10;
  border: 1px solid #ebeef5;
}

.scroll-arrow:hover {
  background: #409EFF;
  color: white;
  box-shadow: 0 6px 24px rgba(64, 158, 255, 0.3);
  transform: translateY(-50%) scale(1.05);
}

.scroll-arrow i {
  font-size: 20px;
  font-weight: bold;
}

.arrow-left {
  left: 5px;
}

.arrow-right {
  right: 5px;
}

/* 横向课程列表样式 - 确保使用flex布局 */
.horizontal-course-list {
  display: flex;
  gap: 20px;
  padding: 24px 0;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-behavior: smooth;
  flex-wrap: nowrap;
  width: 100%;
  min-width: 100%; /* 确保最小宽度为100% */
}

/* Chrome、Safari和Opera隐藏滚动条 */
.horizontal-course-list::-webkit-scrollbar {
  display: none;
}

/* 横向课程卡片样式 - 使用固定的flex-basis，不依赖百分比 */
.course-card-horizontal {
  flex: 0 0 calc((100% - 80px) / 5); /* 5个卡片，减去总间距 */
  min-width: calc((100% - 80px) / 5);
  max-width: calc((100% - 80px) / 5);
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
  height: 320px;
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
  object-fit: cover;
}

/* 其他样式保持不变... */

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
  font-size: 36px;
  margin-bottom: 8px;
  opacity: 0.7;
}

.image-error span,
.no-cover-img span {
  font-size: 12px;
}

/* 封面上的分类标签 */
.cover-category-tag {
  position: absolute;
  top: 8px;
  right: 8px;
}

/* 课程信息区域 */
.course-info-horizontal {
  flex: 1;
  padding: 10px;
  display: flex;
  flex-direction: column;
  min-height: 160px; /* 确保信息区域有最小高度 */
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
  gap: 6px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #606266;
}

.meta-icon {
  color: #909399;
  font-size: 12px;
  width: 14px;
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
  padding-top: 10px;
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


/* 响应式设计 - 调整卡片宽度计算 */
@media (max-width: 1200px) {
  .course-list-container {
    padding: 16px;
    max-width: 100%;
  }
  
  .course-card-horizontal {
    flex: 0 0 calc((100% - 60px) / 4); /* 4个卡片 */
    min-width: calc((100% - 60px) / 4);
    max-width: calc((100% - 60px) / 4);
  }
  
  .horizontal-course-container {
    padding: 0 40px;
  }
}

@media (max-width: 992px) {
  .course-card-horizontal {
    flex: 0 0 calc((100% - 40px) / 3); /* 3个卡片 */
    min-width: calc((100% - 40px) / 3);
    max-width: calc((100% - 40px) / 3);
  }
  
  .horizontal-course-container {
    padding: 0 36px;
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
  
  .course-card-horizontal {
    flex: 0 0 calc((100% - 20px) / 2); /* 2个卡片 */
    min-width: calc((100% - 20px) / 2);
    max-width: calc((100% - 20px) / 2);
    height: 300px;
  }
  
  .course-cover-wrapper {
    height: 140px;
  }
  
  .horizontal-course-container {
    padding: 0 32px;
  }
  
  .scroll-arrow {
    width: 32px;
    height: 64px;
  }
}

@media (max-width: 576px) {
  .course-list-container {
    padding: 12px;
  }
  
  .category-title-wrapper {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .course-card-horizontal {
    flex: 0 0 100%; /* 1个卡片 */
    min-width: 100%;
    max-width: 100%;
    height: 280px;
  }
  
  .horizontal-course-container {
    padding: 0 28px;
  }
  
  .scroll-arrow {
    width: 28px;
    height: 56px;
  }
  
  .scroll-arrow i {
    font-size: 16px;
  }
}
</style>