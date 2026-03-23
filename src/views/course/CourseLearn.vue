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

          <div
            class="article-container"
            v-else-if="currentLesson.contentType === 'ARTICLE'"
          >
            <el-card shadow="never" class="article-card">
              <h2 class="article-title">{{ currentLesson.title }}</h2>
              
              <div v-if="isDocument(currentLesson.content)" class="document-view" style="text-align: center; padding: 20px 0;">
                <i class="el-icon-document" style="font-size: 48px; color: #3b82f6; margin-bottom: 16px; display: block;"></i>
                <h3 style="margin-top: 0; margin-bottom: 24px; color: #334155;">课件已就绪</h3>
                
                <el-button type="primary" icon="el-icon-view" @click="downloadArticleFile(currentLesson.content)" round>
                  点击在新窗口预览 / 下载课件
                </el-button>

                <iframe 
                  v-if="currentLesson.content.toLowerCase().endsWith('.pdf')" 
                  :src="$img(currentLesson.content)" 
                  width="100%" 
                  height="600px" 
                  style="margin-top: 30px; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                </iframe>
              </div>

              <div
                v-else
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

import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";

marked.setOptions({
  renderer: new marked.Renderer(),
  highlight: function (code, lang) {
    const language = hljs.getLanguage(lang) ? lang : "plaintext";
    return hljs.highlight(code, { language }).value;
  },
  langPrefix: "hljs language-",
  breaks: true,
  gfm: true,
});

export default {
  name: "CourseLearn",
  data() {
    return {
      loading: true,
      courseId: null,
      courseInfo: null,
      currentLesson: null,
      completedLessonIds: [],
      userProgress: 0,
      
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
      
      drawerWidth: 400,
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
    // 🌟 1. 新增：判断 content 是不是一个上传的文件路径
    isDocument(content) {
      if (!content) return false;
      return content.startsWith('/document/') || /\.(pdf|ppt|pptx)$/i.test(content);
    },

    // 🌟 2. 新增：预览或下载文档
    downloadArticleFile(url) {
      if (!url) return;
      window.open(this.$img(url), "_blank");
    },

    fetchProgress() {
      getCompletedLessons(this.courseId, this.userId).then((res) => {
        if (res.code === 200) {
          this.completedLessonIds = res.data;
          this.calculateOverallProgress();
        }
      });
    },

    handleVideoEnded() {
      this.$message.success("恭喜，本节视频观看完毕！");
      this.markAsCompleted();
    },

    markAsCompleted() {
      if (!this.currentLesson) return;

      const lessonId = this.currentLesson.id;

      recordLessonProgress(this.userId, lessonId, 0, true).then((res) => {
        if (res.code === 200) {
          if (!this.completedLessonIds.includes(lessonId)) {
            this.completedLessonIds.push(lessonId);
            this.calculateOverallProgress();
          }
        }
      });
    },

    calculateOverallProgress() {
      if (!this.courseInfo || !this.courseInfo.chapters) return;

      let totalLessons = 0;
      this.courseInfo.chapters.forEach((ch) => {
        totalLessons += ch.lessons.length;
      });

      if (totalLessons === 0) {
        this.userProgress = 0;
      } else {
        this.userProgress = Math.round(
          (this.completedLessonIds.length / totalLessons) * 100,
        );
      }
    },

    downloadFile() {
      if (!this.currentLesson || !this.currentLesson.videoUrl) {
        this.$message.warning("课件地址不存在");
        return;
      }
      window.open(this.$img(this.currentLesson.videoUrl), "_blank");
    },

    fetchDetail() {
      this.loading = true;
      getCourseDetail(this.courseId)
        .then((res) => {
          if (res.code === 200) {
            this.courseInfo = res.data;
            this.autoSelectFirstLesson();
            this.calculateOverallProgress();
          } else {
            this.$message.error("获取课程信息失败");
          }
        })
        .finally(() => {
          this.loading = false;
        });
    },

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

    selectLesson(lesson) {
      if (this.currentLesson && this.currentLesson.id === lesson.id) return;
      this.currentLesson = lesson;
    },

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
    },

    renderMarkdown(text) {
      if (!text) return "";
      return marked.parse(text);
    },

    async sendMessage() {
      if (!this.userInput.trim() || this.aiThinking) return;

      const userText = this.userInput.trim();
      this.chatHistory.push({ role: "user", content: userText });
      this.userInput = "";
      this.aiThinking = true;

      this.chatHistory.push({ role: "assistant", content: "" });
      const aiMessageIndex = this.chatHistory.length - 1;

      this.scrollToBottom();

      try {
        const payload = this.chatHistory.slice(0, -1).map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        const response = await fetch("/api/ai/chat/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error("网络请求失败");

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        let isStreamDone = false;
        while (!isStreamDone) {
          const { done, value } = await reader.read();
          isStreamDone = done; 

          if (isStreamDone) {
            break; 
          }

          const textChunk = decoder.decode(value, { stream: true });

          if (textChunk) {
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

    startResize(e) {
      this.isResizing = true;
      this.startX = e.clientX; 
      this.startWidth = this.drawerWidth; 

      document.addEventListener("mousemove", this.doResize);
      document.addEventListener("mouseup", this.stopResize);

      document.body.style.userSelect = "none";
    },

    doResize(e) {
      if (!this.isResizing) return;

      const deltaX = this.startX - e.clientX;
      let newWidth = this.startWidth + deltaX;

      if (newWidth < 350) newWidth = 350; 
      if (newWidth > window.innerWidth * 0.8)
        newWidth = window.innerWidth * 0.8; 

      this.drawerWidth = newWidth;
    },

    stopResize() {
      this.isResizing = false;
      document.removeEventListener("mousemove", this.doResize);
      document.removeEventListener("mouseup", this.stopResize);

      document.body.style.userSelect = "";
    },
  },
};
</script>

<style lang="scss" scoped>
.course-learn-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  background-color: #0f172a; 
  overflow: hidden;

  position: fixed;
  top: 0;
  left: 0;
  z-index: 1999;
}

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

.learn-body {
  flex: 1;
  display: flex;
  overflow: hidden; 
}

.content-area {
  flex: 1;
  background-color: #000; 
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow-y: auto; 

  .content-wrapper {
    width: 100%;
    height: 100%;
  }

  .video-layout {
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    padding: 30px 40px;
    box-sizing: border-box;

    .video-content-desc {
      width: 100%;
      max-width: 1000px;
      margin: 0 auto 24px auto; 
      color: #cbd5e1; 

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
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); 

      .video-player {
        width: 100%;
        max-height: 70vh; 
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
      background: #e2e8f0; 
      border-radius: 8px;
      overflow: hidden;

      .pdf-iframe {
        width: 100%;
        height: 100%;
        border: none;
      }
    }
  }

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
        color: #10b981; 
        font-size: 16px;
        margin-left: auto; 
      }
    }
  }
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

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

.drawer-drag-handle {
  position: absolute;
  top: -60px; 
  left: 0; 
  width: 10px; 
  height: 120vh; 
  cursor: ew-resize; 
  background-color: transparent;
  z-index: 9999; 
  transition: background-color 0.2s;
  transform: translateX(-5px); 

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
      white-space: pre-wrap; 

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

::v-deep .markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial,
    sans-serif;
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;

  p {
    margin-top: 0;
    margin-bottom: 10px;
  }

  strong {
    font-weight: 600;
    color: #0f172a;
  }

  ul,
  ol {
    padding-left: 20px;
    margin-top: 0;
    margin-bottom: 10px;
  }
  li {
    margin-bottom: 4px;
  }

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

  code {
    background-color: rgba(9, 30, 66, 0.08);
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: Consolas, monospace;
    font-size: 85%;
  }

  pre {
    background-color: #282c34 !important; 
    border-radius: 6px;
    padding: 12px;
    overflow: auto;
    margin-top: 8px;
    margin-bottom: 12px;

    code {
      background-color: transparent; 
      padding: 0;
      color: #abb2bf;
      font-size: 13px;
    }
  }

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
.ai-drawer {
  background: #f8fafc;

  .el-drawer__header {
    margin-bottom: 0;
    padding: 20px;
    border-bottom: 1px solid #e2e8f0;
    font-weight: bold;
    color: #1e293b;
  }

  &.is-resizing {
    transition: width 0s !important;
  }
}
</style>