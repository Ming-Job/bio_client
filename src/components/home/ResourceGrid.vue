<template>
  <div class="resource-section">
    <div class="container">
      <h2 class="section-title">教学资源库</h2>

      <div class="tabs">
        <el-tabs v-model="activeTab" @tab-click="handleTabClick">
          <el-tab-pane label="课件资料" name="courseware"></el-tab-pane>
          <el-tab-pane label="实验视频" name="videos"></el-tab-pane>
          <el-tab-pane label="试题库" name="exams"></el-tab-pane>
          <el-tab-pane label="电子图书" name="books"></el-tab-pane>
        </el-tabs>
      </div>

      <div class="resource-grid">
        <div
          v-for="(resource, index) in resources[activeTab]"
          :key="index"
          class="resource-item"
        >
          <div class="resource-icon">
            <i :class="resource.icon"></i>
          </div>
          <div class="resource-info">
            <h4>{{ resource.title }}</h4>
            <p>{{ resource.description }}</p>
            <div class="resource-meta">
              <span
                ><i class="el-icon-download"></i> {{ resource.downloads }}</span
              >
              <span><i class="el-icon-time"></i> {{ resource.time }}</span>
            </div>
            <el-button type="primary" size="small" class="download-btn">
              下载资源
            </el-button>
          </div>
        </div>
      </div>

      <div class="quick-links">
        <h3>快速链接</h3>
        <div class="links-grid">
          <el-button
            v-for="link in quickLinks"
            :key="link.text"
            type="text"
            @click="handleQuickLink(link)"
          >
            <i :class="link.icon"></i> {{ link.text }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ResourceGrid",
  data() {
    return {
      activeTab: "courseware",
      resources: {
        courseware: [
          {
            title: "细胞生物学PPT课件",
            description: "包含细胞结构、功能等完整教学课件",
            icon: "el-icon-files",
            downloads: "1.2k",
            time: "45分钟",
          },
          {
            title: "遗传学基础教案",
            description: "孟德尔遗传定律教学方案",
            icon: "el-icon-document",
            downloads: "890",
            time: "60分钟",
          },
          {
            title: "生态学课程包",
            description: "生态系统与环境保护教学资源",
            icon: "el-icon-folder",
            downloads: "1.5k",
            time: "90分钟",
          },
        ],
        videos: [
          {
            title: "DNA提取实验",
            description: "完整的DNA提取实验视频教程",
            icon: "el-icon-video-play",
            downloads: "2.3k",
            time: "15分钟",
          },
        ],
        exams: [
          {
            title: "高中生物模拟试题",
            description: "历年高考模拟试题及答案",
            icon: "el-icon-edit-outline",
            downloads: "3.4k",
            time: "120分钟",
          },
        ],
        books: [
          {
            title: "生物学原理电子书",
            description: "经典生物学教材电子版",
            icon: "el-icon-notebook-2",
            downloads: "4.1k",
            time: "免费",
          },
        ],
      },
      quickLinks: [
        { text: "在线课程", icon: "el-icon-video-camera", url: "/courses" },
        { text: "虚拟实验", icon: "el-icon-set-up", url: "/labs" },
        { text: "知识测验", icon: "el-icon-question", url: "/quiz" },
        { text: "科学论坛", icon: "el-icon-chat-line-square", url: "/forum" },
        { text: "科普文章", icon: "el-icon-reading", url: "/articles" },
      ],
    };
  },
  methods: {
    handleTabClick(tab) {
      console.log("切换到标签:", tab.name);
    },
    handleQuickLink(link) {
      this.$message(`跳转到: ${link.text}`);
    },
  },
};
</script>

<style scoped>
.resource-section {
  padding: 60px 20px;
  border-radius: 10px;
  background-color: #f5f7fa;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  text-align: center;
  margin-bottom: 40px;
  font-size: 2rem;
  color: #333;
}

.tabs {
  margin-bottom: 30px;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 50px;
}

.resource-item {
  background: white;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  align-items: flex-start;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;
}

.resource-item:hover {
  transform: translateY(-3px);
}

.resource-icon {
  width: 50px;
  height: 50px;
  background-color: #e8f4ff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  flex-shrink: 0;
}

.resource-icon i {
  font-size: 24px;
  color: #2196f3;
}

.resource-info {
  flex: 1;
}

.resource-info h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.resource-info p {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 15px;
  line-height: 1.4;
}

.resource-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
  color: #888;
  font-size: 0.9rem;
}

.resource-meta i {
  margin-right: 5px;
}

.download-btn {
  margin-top: 10px;
}

.quick-links {
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.quick-links h3 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.links-grid .el-button {
  justify-content: flex-start;
  padding: 12px 20px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.links-grid .el-button:hover {
  background-color: #f0f7ff;
  color: #2196f3;
  transform: translateX(5px);
}

.links-grid i {
  margin-right: 10px;
  font-size: 18px;
}
</style>
