<template>
  <div class="course-learn-container" v-loading="loading">
    <div class="learn-header">
      <div class="header-left" @click="goBack">
        <i class="el-icon-back"></i>
        <span>返回课程详情</span>
      </div>
      <div class="header-center text-ellipsis">
        {{ courseInfo ? courseInfo.title : "加载中..." }}
      </div>
      <div class="header-right">
        <span class="progress-text">当前进度：{{ userProgress }}%</span>
      </div>
    </div>

    <div class="learn-body">
      <div class="content-area">
        <div class="content-wrapper" v-if="currentLesson">
          <div
            class="video-layout"
            v-if="currentLesson.contentType === 'VIDEO'"
          >
            <div class="video-content-desc" v-if="currentLesson.content">
              <h2 class="lesson-title">{{ currentLesson.title }}</h2>
              <div
                class="rich-text"
                v-html="formatArticle(currentLesson.content)"
              ></div>
            </div>

            <!-- 视频课程展示 -->
            <div class="video-container">
              <video
                v-if="currentLesson.videoUrl"
                :src="$img(currentLesson.videoUrl)"
                controls
                autoplay
                controlsList="nodownload"
                class="video-player"
                @ended="handleVideoEnded"
              ></video>

              <div v-else class="empty-player">
                <i class="el-icon-video-camera"></i>
                <p>视频正在转码或暂未上传</p>
              </div>
            </div>
          </div>

          <!-- 文章课程展示 -->
          <div
            class="article-container"
            v-else-if="currentLesson.contentType === 'ARTICLE'"
          >
            <el-card shadow="never" class="article-card">
              <h2 class="article-title">{{ currentLesson.title }}</h2>
              <div
                class="article-content"
                v-html="formatArticle(currentLesson.content)"
              ></div>
            </el-card>

            <div
              class="finish-action-area"
              style="text-align: center; margin-top: 40px"
            >
              <el-button
                v-if="!completedLessonIds.includes(currentLesson.id)"
                type="success"
                icon="el-icon-check"
                @click="markAsCompleted"
              >
                我已学完本节
              </el-button>
              <el-tag v-else type="success" effect="dark"
                ><i class="el-icon-success"></i> 已完成学习</el-tag
              >
            </div>
          </div>

          <!-- 实验 课程展示 -->
          <div
            class="practice-container"
            v-else-if="currentLesson.contentType === 'PRACTICE'"
          >
            <div class="practice-box">
              <i class="el-icon-cpu practice-icon"></i>
              <h2>{{ currentLesson.title }}</h2>
              <p class="practice-desc">{{ currentLesson.content }}</p>

              <div class="practice-actions">
                <el-button
                  type="primary"
                  size="large"
                  @click="goToTool(currentLesson.relatedToolId)"
                >
                  <i class="el-icon-data-analysis"></i> 启动云端分析实验室
                </el-button>
                <el-button plain size="large">下载示例实验数据</el-button>
              </div>
            </div>
          </div>

          <!-- ppt格式的文件展示 -->
          <div
            class="ppt-layout"
            v-else-if="currentLesson.contentType === 'PPT'"
          >
            <div class="ppt-header">
              <h2 class="lesson-title">{{ currentLesson.title }}</h2>
              <el-button
                type="success"
                size="small"
                plain
                @click="downloadFile"
              >
                <i class="el-icon-download"></i> 获取课件源码
              </el-button>
            </div>

            <div class="pdf-container">
              <iframe :src="$img(currentLesson.videoUrl)" class="pdf-iframe">
              </iframe>
            </div>

            <div
              class="finish-action-area"
              style="text-align: center; margin-top: 40px"
            >
              <el-button
                v-if="!completedLessonIds.includes(currentLesson.id)"
                type="success"
                icon="el-icon-check"
                @click="markAsCompleted"
              >
                我已学完本节
              </el-button>
              <el-tag v-else type="success" effect="dark"
                ><i class="el-icon-success"></i> 已完成学习</el-tag
              >
            </div>
          </div>
        </div>
      </div>

      <div class="sidebar-area">
        <div class="sidebar-header">
          <span class="sidebar-title">课程大纲</span>
        </div>

        <div class="directory-list">
          <div
            class="chapter-group"
            v-for="(chapter, cIndex) in courseInfo?.chapters"
            :key="cIndex"
          >
            <div class="chapter-title">{{ chapter.chapterName }}</div>

            <div
              class="lesson-item"
              v-for="(lesson, lIndex) in chapter.lessons"
              :key="lesson.id"
              :class="{
                'is-active': currentLesson && currentLesson.id === lesson.id,
              }"
              @click="selectLesson(lesson)"
            >
              <div class="lesson-icon">
                <i
                  v-if="currentLesson && currentLesson.id === lesson.id"
                  class="el-icon-loading active-icon"
                ></i>
                <i v-else :class="getLessonIcon(lesson.contentType)"></i>
              </div>
              <div class="lesson-info">
                <span class="lesson-index"
                  >{{ cIndex + 1 }}-{{ lIndex + 1 }}</span
                >
                <span class="lesson-name text-ellipsis" :title="lesson.title">{{
                  lesson.title
                }}</span>
              </div>
              <i
                v-if="completedLessonIds.includes(lesson.id)"
                class="el-icon-success completed-icon"
              ></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="ai-fab-button" @click="aiDrawerVisible = true">
      <i class="el-icon-chat-dot-square"></i>
      <span>AI 助教</span>
    </div>

    <el-drawer
      title="🧬 生信 AI 助教 (Beta)"
      :visible.sync="aiDrawerVisible"
      direction="rtl"
      :size="drawerWidth + 'px'"
      :append-to-body="true"
      :custom-class="isResizing ? 'ai-drawer is-resizing' : 'ai-drawer'"
    >
      <div class="drawer-drag-handle" @mousedown="startResize"></div>

      <div class="chat-container">
        <div class="chat-messages" id="chat-box">
          <div
            v-for="(msg, index) in chatHistory"
            :key="index"
            class="message-wrapper"
            :class="msg.role === 'user' ? 'is-user' : 'is-ai'"
          >
            <el-avatar
              :size="32"
              :icon="msg.role === 'user' ? 'el-icon-user-solid' : 'el-icon-cpu'"
              class="msg-avatar"
            ></el-avatar>

            <div
              class="message-content markdown-body"
              v-html="renderMarkdown(msg.content)"
            ></div>
          </div>
          <div v-if="aiThinking" class="message-wrapper is-ai">
            <el-avatar
              :size="32"
              icon="el-icon-cpu"
              class="msg-avatar"
            ></el-avatar>
            <div class="message-content thinking">
              <i class="el-icon-loading"></i> AI正在思考代码逻辑...
            </div>
          </div>
        </div>

        <div class="chat-input-area">
          <el-input
            type="textarea"
            :rows="3"
            placeholder="遇到报错？看不懂概念？直接问我..."
            v-model="userInput"
            @keyup.enter.native.prevent="sendMessage"
            resize="none"
          ></el-input>
          <div class="input-actions">
            <span class="tip">Enter 键发送</span>
            <el-button
              type="primary"
              size="small"
              @click="sendMessage"
              :loading="aiThinking"
              round
            >
              发送
            </el-button>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";

import {
  getCourseDetail,
  recordLessonProgress,
  getCompletedLessons,
} from "@/api/course";

// 🌟 1. 引入 Markdown 和 代码高亮插件
import { marked } from "marked";
import hljs from "highlight.js";
// 🌟 2. 引入一款极客风的代码高亮主题（Atom One Dark）
import "highlight.js/styles/atom-one-dark.css";

// 🌟 3. 配置 marked，让它在解析代码块时自动调用 highlight.js
marked.setOptions({
  renderer: new marked.Renderer(),
  highlight: function (code, lang) {
    const language = hljs.getLanguage(lang) ? lang : "plaintext";
    return hljs.highlight(code, { language }).value;
  },
  langPrefix: "hljs language-", // 配合 highlight.js 的类名
  breaks: true, // 允许回车换行
  gfm: true, // 允许 GitHub 标准 Markdown（支持表格）
});

export default {
  name: "CourseLearn",
  data() {
    return {
      loading: true,
      courseId: null,
      courseInfo: null,
      currentLesson: null, // 当前正在学习的课时对象
      completedLessonIds: [], // 存放已经学完的课时 ID 数组
      userProgress: 0,
      // AI 相关变量
      aiDrawerVisible: false,
      userInput: "",
      aiThinking: false,
      chatHistory: [
        {
          role: "assistant",
          content:
            "你好！我是你的专属生信 AI 助教。在学习中遇到不懂的名词（如 PCA、UMAP）或者跑不动代码，都可以随时发给我帮你排错哦！",
        },
      ],
      // 拖拽相关的变量
      drawerWidth: 400, // 默认宽度 400px
      isResizing: false,
      startX: 0,
      startWidth: 0,
    };
  },
  created() {
    this.courseId = this.$route.params.id;
    if (this.courseId) {
      this.fetchDetail();
      this.fetchProgress();
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
    // 实时更新用户学习进度
    //1. 获取已完成列表
    fetchProgress() {
      getCompletedLessons(this.courseId, this.userId).then((res) => {
        if (res.code === 200) {
          this.completedLessonIds = res.data;
          this.calculateOverallProgress(); // 计算总进度百分比
        }
      });
    },

    // 2. 当视频自然播放结束时触发
    handleVideoEnded() {
      this.$message.success("恭喜，本节视频观看完毕！");
      this.markAsCompleted();
    },

    // 3. 执行打卡（标记为已完成）
    markAsCompleted() {
      if (!this.currentLesson) return;

      const lessonId = this.currentLesson.id;

      recordLessonProgress(this.userId, lessonId, 0, true).then((res) => {
        if (res.code === 200) {
          // 如果后端记录成功，前端就把这个ID塞进已完成数组里，绿勾就会自动亮起！
          if (!this.completedLessonIds.includes(lessonId)) {
            this.completedLessonIds.push(lessonId);
            this.calculateOverallProgress(); // 重新计算总进度
          }
        }
      });
    },

    // 4. 计算当前总学习进度百分比（供右上角展示）
    calculateOverallProgress() {
      if (!this.courseInfo || !this.courseInfo.chapters) return;

      // 算出总共有多少节课
      let totalLessons = 0;
      this.courseInfo.chapters.forEach((ch) => {
        totalLessons += ch.lessons.length;
      });

      if (totalLessons === 0) {
        this.userProgress = 0;
      } else {
        // 计算百分比并取整
        this.userProgress = Math.round(
          (this.completedLessonIds.length / totalLessons) * 100,
        );
      }
    },

    // 下载/在新窗口打开课件
    downloadFile() {
      if (!this.currentLesson || !this.currentLesson.videoUrl) {
        this.$message.warning("课件地址不存在");
        return;
      }
      // 直接在新标签页打开 PDF 链接，浏览器原生支持下载
      window.open(this.$img(this.currentLesson.videoUrl), "_blank");
    },

    fetchDetail() {
      this.loading = true;
      getCourseDetail(this.courseId)
        .then((res) => {
          if (res.code === 200) {
            this.courseInfo = res.data;
            this.autoSelectFirstLesson();
            // 👇 加上这一行：确保获取到大纲后，重新算一次进度
            this.calculateOverallProgress();
          } else {
            this.$message.error("获取课程信息失败");
          }
        })
        .finally(() => {
          this.loading = false;
        });
    },

    // 自动找到第一章的第一节课并选中
    autoSelectFirstLesson() {
      if (
        this.courseInfo &&
        this.courseInfo.chapters &&
        this.courseInfo.chapters.length > 0
      ) {
        const firstChapter = this.courseInfo.chapters[0];
        if (firstChapter.lessons && firstChapter.lessons.length > 0) {
          this.currentLesson = firstChapter.lessons[0];
        }
      }
    },

    // 切换课时
    selectLesson(lesson) {
      if (this.currentLesson && this.currentLesson.id === lesson.id) return;
      this.currentLesson = lesson;
      // TODO: 这里可以向后端发请求，记录用户学到了这一节
    },

    // 格式化图文内容（简单处理换行）
    formatArticle(content) {
      if (!content) return "暂无内容";
      return content.replace(/\n/g, "<br>");
    },

    getLessonIcon(type) {
      const map = {
        VIDEO: "el-icon-video-play",
        ARTICLE: "el-icon-document",
        PRACTICE: "el-icon-cpu",
      };
      return map[type] || "el-icon-video-play";
    },

    goBack() {
      this.$router.push(`/course/detail/${this.courseId}`);
    },

    goToTool(toolId) {
      if (!toolId) {
        this.$message.warning("该课时暂未绑定特定分析工具");
        return;
      }
      this.$message.success("正在为您准备云端分析环境...");
      // this.$router.push({ path: '/analysis', query: { toolId: toolId } });
    },

    // 新增一个方法，用于把普通文本转成高亮 HTML
    renderMarkdown(text) {
      if (!text) return "";
      return marked.parse(text); // 实时将文本编译为漂亮的 HTML
    },

    async sendMessage() {
      if (!this.userInput.trim() || this.aiThinking) return;

      // 1. 获取用户输入，并清空输入框
      const userText = this.userInput.trim();
      this.chatHistory.push({ role: "user", content: userText });
      this.userInput = "";
      this.aiThinking = true;

      // 2. 🌟 灵魂操作：先在页面上创建一个空的 AI 气泡，准备接字！
      this.chatHistory.push({ role: "assistant", content: "" });
      // 记录下这个空气泡在数组里的索引
      const aiMessageIndex = this.chatHistory.length - 1;

      this.scrollToBottom();

      try {
        // 提取前 N 条记录发给后端（排除掉刚刚加进去的那个空气泡）
        const payload = this.chatHistory.slice(0, -1).map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        // 3. 使用原生 fetch 发起流式请求 (不受 axios 10秒超时的限制)
        const response = await fetch("/api/ai/chat/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // 如果你的系统需要 Token，在这里加上： 'Authorization': 'Bearer ' + localStorage.getItem('token')
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error("网络请求失败");

        // 4. 🌟 核心魔法：开启流式读取器
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        let isStreamDone = false;
        while (!isStreamDone) {
          const { done, value } = await reader.read();
          isStreamDone = done; // 将读取状态赋值给外部变量

          if (isStreamDone) {
            break; // 如果读完了，跳出循环
          }

          // 把接收到的二进制碎片解码成文本
          const textChunk = decoder.decode(value, { stream: true });

          if (textChunk) {
            // 更加安全的 Vue 响应式拼接写法
            const oldText = this.chatHistory[aiMessageIndex].content;
            this.chatHistory[aiMessageIndex].content = oldText + textChunk;

            this.scrollToBottom();
          }
        }
      } catch (error) {
        console.error("AI 报错:", error);
        this.chatHistory[aiMessageIndex].content +=
          "\n[请求失败，请检查网络或后端配置]";
      } finally {
        this.aiThinking = false;
        this.scrollToBottom();
      }
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const box = document.getElementById("chat-box");
        if (box) {
          box.scrollTop = box.scrollHeight;
        }
      });
    },

    // ================= 🌟 拖拽缩放逻辑开始 =================
    startResize(e) {
      this.isResizing = true;
      this.startX = e.clientX; // 记录鼠标按下的 X 坐标
      this.startWidth = this.drawerWidth; // 记录按下的初始宽度

      // 绑定鼠标移动和松开事件到整个 document 上，防止鼠标移出把手时失效
      document.addEventListener("mousemove", this.doResize);
      document.addEventListener("mouseup", this.stopResize);

      // 拖拽时禁止页面文字被意外选中（体验更好）
      document.body.style.userSelect = "none";
    },

    doResize(e) {
      if (!this.isResizing) return;

      // 抽屉在右侧，向左拖拽（X变小）时，宽度应该变大
      const deltaX = this.startX - e.clientX;
      let newWidth = this.startWidth + deltaX;

      // 限制拖拽的极限范围（不能太窄，也不能超过屏幕）
      if (newWidth < 350) newWidth = 350; // 最窄 350px
      if (newWidth > window.innerWidth * 0.8)
        newWidth = window.innerWidth * 0.8; // 最宽不超过屏幕的 80%

      this.drawerWidth = newWidth;
    },

    stopResize() {
      this.isResizing = false;
      // 拖拽结束，卸载全局事件
      document.removeEventListener("mousemove", this.doResize);
      document.removeEventListener("mouseup", this.stopResize);

      // 恢复文字选中功能
      document.body.style.userSelect = "";
    },
    // ================= 拖拽缩放逻辑结束 =================
  },
};
</script>

<style lang="scss" scoped>
/* 整个页面占满屏幕，隐藏滚动条 */
.course-learn-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  background-color: #0f172a; /* 深色背景更具沉浸感 */
  overflow: hidden;

  /* 覆盖你可能全局存在的 navbar（如果有的话，确保这个页面脱离常规布局） */
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1999;
}

/* 顶部黑色导航栏 */
.learn-header {
  height: 60px;
  background-color: #1e293b;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  color: #f8fafc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  z-index: 10;

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: color 0.3s;
    &:hover {
      color: #3b82f6;
    }
  }

  .header-center {
    font-size: 16px;
    font-weight: bold;
    max-width: 40vw;
    text-align: center;
  }

  .header-right {
    font-size: 13px;
    color: #94a3b8;
  }
}

/* 下方主体 Flex 布局 */
.learn-body {
  flex: 1;
  display: flex;
  overflow: hidden; /* 保证内部可以独立滚动 */
}

/* 左侧内容区 (占据剩余全部空间) */
.content-area {
  flex: 1;
  background-color: #000; /* 视频区纯黑底色 */
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow-y: auto; /* 允许图文内容滚动 */

  .content-wrapper {
    width: 100%;
    height: 100%;
  }

  /* 视频混合图文布局 (上下排列) */
  .video-layout {
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    padding: 30px 40px;
    box-sizing: border-box;

    /* 上方描述文字 (夜间模式) */
    .video-content-desc {
      width: 100%;
      max-width: 1000px;
      margin: 0 auto 24px auto; /* 居中并与下方视频留出间距 */
      color: #cbd5e1; /* 浅灰蓝色，护眼 */

      .lesson-title {
        font-size: 20px;
        color: #f8fafc;
        margin-bottom: 12px;
        border-bottom: 1px solid #334155;
        padding-bottom: 12px;
      }

      .rich-text {
        font-size: 15px;
        line-height: 1.8;
        /* 穿透修改可能存在的 p 标签等 */
        ::v-deep p {
          margin-bottom: 10px;
        }
        ::v-deep code {
          background: #1e293b;
          padding: 2px 6px;
          border-radius: 4px;
          color: #38bdf8;
          font-family: Consolas, monospace;
        }
      }
    }

    /* 下方视频容器 */
    .video-container {
      flex: 1;
      width: 100%;
      max-width: 1000px;
      margin: 0 auto;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #000;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); /* 给视频加个深色阴影增加立体感 */

      .video-player {
        width: 100%;
        max-height: 70vh; /* 防止视频过高导致看不见控件 */
        outline: none;
        background: #000;
      }
      .empty-player {
        text-align: center;
        color: #475569;
        padding: 80px 0;
        i {
          font-size: 48px;
          margin-bottom: 16px;
        }
      }
    }
  }

  /* 图文文章区域 (限制宽度居中阅读体验好) */
  .article-container {
    padding: 40px;
    background: #f8fafc;
    min-height: 100%;
    .article-card {
      max-width: 800px;
      margin: 0 auto;
      border-radius: 12px;
      padding: 20px;
      .article-title {
        font-size: 24px;
        color: #1e293b;
        margin-bottom: 24px;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 16px;
      }
      .article-content {
        font-size: 16px;
        color: #334155;
        line-height: 1.8;
      }
    }
  }

  /* PPT 布局 */
  .ppt-layout {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 20px 40px;
    box-sizing: border-box;

    .ppt-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid #334155;

      .lesson-title {
        font-size: 20px;
        color: #f8fafc;
        margin: 0;
      }
    }

    .pdf-container {
      flex: 1;
      width: 100%;
      background: #e2e8f0; /* 给 iframe 一点底色 */
      border-radius: 8px;
      overflow: hidden;

      .pdf-iframe {
        width: 100%;
        height: 100%;
        border: none;
      }
    }
  }

  /* 实操任务专区 */
  .practice-container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #f0fdf4;
    .practice-box {
      background: white;
      padding: 60px;
      border-radius: 16px;
      text-align: center;
      max-width: 600px;
      box-shadow: 0 10px 30px rgba(16, 185, 129, 0.1);
      border: 2px solid #bbf7d0;
      .practice-icon {
        font-size: 64px;
        color: #10b981;
        margin-bottom: 24px;
      }
      h2 {
        color: #065f46;
        margin-bottom: 16px;
        font-size: 24px;
      }
      .practice-desc {
        color: #047857;
        margin-bottom: 40px;
        line-height: 1.6;
      }
      .practice-actions {
        display: flex;
        gap: 16px;
        justify-content: center;
      }
    }
  }
}

/* 右侧目录侧边栏 (固定宽度) */
.sidebar-area {
  width: 350px;
  background-color: #1e293b;
  border-left: 1px solid #334155;
  display: flex;
  flex-direction: column;

  .sidebar-header {
    height: 50px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    border-bottom: 1px solid #334155;
    .sidebar-title {
      font-size: 15px;
      font-weight: bold;
      color: #f8fafc;
    }
  }

  .directory-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px 0;

    /* 自定义滚动条样式 */
    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background: #475569;
      border-radius: 3px;
    }

    .chapter-group {
      margin-bottom: 16px;
      .chapter-title {
        font-size: 13px;
        color: #94a3b8;
        padding: 8px 20px;
        font-weight: bold;
      }
    }

    .lesson-item {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      cursor: pointer;
      transition: all 0.2s;
      color: #cbd5e1;

      &:hover {
        background-color: #334155;
      }

      &.is-active {
        background-color: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
        border-right: 3px solid #3b82f6;
        .active-icon {
          color: #3b82f6;
        }
      }

      .lesson-icon {
        width: 24px;
        font-size: 16px;
        flex-shrink: 0;
      }
      .lesson-info {
        flex: 1;
        display: flex;
        overflow: hidden;
        gap: 8px;
        .lesson-index {
          font-size: 12px;
          opacity: 0.7;
          flex-shrink: 0;
        }
        .lesson-name {
          font-size: 14px;
        }
      }
      .completed-icon {
        color: #10b981; /* 漂亮的翠绿色 */
        font-size: 16px;
        margin-left: auto; /* 把图标推到最右边 */
      }
    }
  }
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 悬浮按钮 */
.ai-fab-button {
  position: fixed;
  right: 40px;
  bottom: 80px;
  background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
  color: white;
  padding: 12px 24px;
  border-radius: 30px;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  z-index: 1000;
  transition: transform 0.3s;

  &:hover {
    transform: translateY(-5px) scale(1.05);
  }
  i {
    font-size: 20px;
  }
}

/* 🌟 拖拽把手样式 */
.drawer-drag-handle {
  position: absolute;
  top: -60px; /* 向上延伸，盖住抽屉 header 的侧边 */
  left: 0; /* 紧贴抽屉最左侧边缘 */
  width: 10px; /* 稍微变宽一点，更容易抓取 */
  height: 120vh; /* 故意写大一点，确保上下贯通全屏幕 */
  cursor: ew-resize; /* 左右拖拽的箭头 ↔️ */
  background-color: transparent;
  z-index: 9999; /* 层级调到最高，防止被内部消息气泡挡住 */
  transition: background-color 0.2s;
  transform: translateX(-5px); /* 向外偏一点点 */

  &:hover,
  &:active {
    background-color: #3b82f6;
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
  }
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 70px);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  .message-wrapper {
    display: flex;
    gap: 12px;

    &.is-user {
      flex-direction: row-reverse;
      .msg-avatar {
        background: #3b82f6;
      }
      .message-content {
        background: #3b82f6;
        color: white;
        border-radius: 12px 2px 12px 12px;
      }
    }

    &.is-ai {
      .msg-avatar {
        background: #8b5cf6;
      }
      .message-content {
        background: white;
        border: 1px solid #e2e8f0;
        color: #334155;
        border-radius: 2px 12px 12px 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
      }
    }

    .message-content {
      max-width: 75%;
      padding: 12px 16px;
      font-size: 14px;
      line-height: 1.6;
      white-space: pre-wrap; /* 保证换行符和代码排版正常显示 */

      &.thinking {
        color: #94a3b8;
        font-style: italic;
      }
    }
  }
}

.chat-input-area {
  padding: 16px 20px;
  background: white;
  border-top: 1px solid #e2e8f0;

  .input-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;

    .tip {
      font-size: 12px;
      color: #94a3b8;
    }
  }
}

/* 🌟 针对 AI 回答的 Markdown 专属美化 */
::v-deep .markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial,
    sans-serif;
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;

  /* 段落间距 */
  p {
    margin-top: 0;
    margin-bottom: 10px;
  }

  /* 加粗看着更明显 */
  strong {
    font-weight: 600;
    color: #0f172a;
  }

  /* 无序/有序列表排版 */
  ul,
  ol {
    padding-left: 20px;
    margin-top: 0;
    margin-bottom: 10px;
  }
  li {
    margin-bottom: 4px;
  }

  /* 标题大小控制 */
  h1,
  h2,
  h3,
  h4 {
    margin-top: 16px;
    margin-bottom: 10px;
    font-weight: 600;
    line-height: 1.25;
  }
  h3 {
    font-size: 1.25em;
  }

  /* 行内小代码块的底色 */
  code {
    background-color: rgba(9, 30, 66, 0.08);
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: Consolas, monospace;
    font-size: 85%;
  }

  /* 多行代码大黑框 */
  pre {
    background-color: #282c34 !important; /* 暗黑背景 */
    border-radius: 6px;
    padding: 12px;
    overflow: auto;
    margin-top: 8px;
    margin-bottom: 12px;

    code {
      background-color: transparent; /* 内部 code 去掉背景色 */
      padding: 0;
      color: #abb2bf;
      font-size: 13px;
    }
  }

  /* 解决用户气泡里文字颜色被加粗覆盖的问题 */
  &.is-user {
    strong {
      color: white;
    }
    code {
      background-color: rgba(255, 255, 255, 0.2);
      color: white;
    }
  }
}
</style>

<style lang="scss">
/* 聊天抽屉内部布局 */
.ai-drawer {
  background: #f8fafc;

  /* 美化头部 */
  .el-drawer__header {
    margin-bottom: 0;
    padding: 20px;
    border-bottom: 1px solid #e2e8f0;
    font-weight: bold;
    color: #1e293b;
  }

  /* 🌟 核心魔法：当处于拖拽状态时，强制干掉 0.3s 的过渡动画 */
  &.is-resizing {
    transition: width 0s !important;
  }
}
</style>
