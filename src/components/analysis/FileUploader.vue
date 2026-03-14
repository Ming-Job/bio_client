<template>
  <div class="glass-uploader-container">
    <div class="ambient-bg"></div>

    <div
      class="glass-dropzone"
      :class="{ 'is-dragover': isDragover }"
      @click="triggerFileInput"
      @dragover.prevent="onDragOver"
      @drop.prevent="onDrop"
      @dragleave.prevent="isDragover = false"
    >
      <input
        ref="fileInput"
        type="file"
        multiple
        :accept="allowedExtensionsText"
        @change="handleFileChange"
        style="display: none"
      />
      <div class="dropzone-content">
        <div class="icon-ring">
          <i class="el-icon-upload cloud-icon"></i>
        </div>
        <h3 class="title">点击或将文件拖拽至此处</h3>
        <p class="subtitle">
          支持 {{ allowedExtensionsText }} 格式，最大 {{ maxFileSizeText }}
        </p>
      </div>
    </div>

    <div v-if="fileList.length > 0" class="glass-file-section">
      <div class="section-header">
        <span class="header-title">待上传列表 ({{ fileList.length }})</span>
        <div class="header-actions">
          <el-button type="text" class="glass-btn-text" @click="clearAllFiles">
            <i class="el-icon-delete"></i> 清空
          </el-button>
          <el-button
            type="text"
            class="glass-btn-text"
            @click="selectMoreFiles"
          >
            <i class="el-icon-plus"></i> 继续添加
          </el-button>
          <el-button
            type="primary"
            round
            class="glass-btn-primary"
            :loading="uploading"
            :disabled="uploading"
            @click="startUpload"
          >
            {{ uploading ? "上传中..." : "开始上传" }}
          </el-button>
        </div>
      </div>

      <div class="glass-file-list">
        <div
          v-for="(file, index) in fileList"
          :key="file.id"
          class="glass-file-item"
          :class="file.status"
        >
          <div class="file-icon-box">
            <i :class="getFileIcon(file.name)"></i>
          </div>

          <div class="file-info-box">
            <div class="info-top">
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
            </div>

            <div class="progress-wrapper" v-if="file.status === 'uploading'">
              <el-progress
                :percentage="file.progress"
                :stroke-width="6"
                :show-text="false"
                color="#007aff"
              ></el-progress>
            </div>

            <div class="info-bottom">
              <span class="status-text" :class="file.status">
                <i
                  v-if="file.status === 'success'"
                  class="el-icon-circle-check"
                ></i>
                <i
                  v-if="file.status === 'error'"
                  class="el-icon-warning-outline"
                ></i>
                <i
                  v-if="file.status === 'uploading'"
                  class="el-icon-loading"
                ></i>
                {{
                  file.status === "uploading"
                    ? `上传中 ${file.progress}%`
                    : getStatusText(file.status)
                }}
              </span>
              <span v-if="file.status === 'error'" class="error-msg">
                - {{ file.error }}
              </span>
            </div>
          </div>

          <div class="file-actions">
            <el-button
              v-if="file.status === 'pending' || file.status === 'error'"
              type="text"
              icon="el-icon-close"
              class="action-btn remove"
              @click.stop="removeFile(index)"
            ></el-button>
          </div>
        </div>
      </div>

      <div class="glass-stats-pill">
        <div class="stat-group">
          <i class="el-icon-files"></i> 总大小:
          <b>{{ formatFileSize(totalSize) }}</b>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-group success">
          <i class="el-icon-success"></i> 成功: <b>{{ successCount }}</b>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-group error">
          <i class="el-icon-error"></i> 失败/拦截: <b>{{ errorCount }}</b>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import { uploadSingleFile } from "@/api/file";
import { EventBus } from "@/utils/event-bus";

export default {
  name: "FileUploader",

  props: {
    // 项目ID（可选）
    projectId: {
      type: [Number, String],
      default: null,
    },
    // 文件描述（可选）
    description: {
      type: String,
      default: "",
    },
    // 最大文件大小（字节）
    maxFileSize: {
      type: Number,
      default: 10 * 1024 * 1024 * 1024, // 10GB
    },
    // 允许的文件扩展名
    allowedExtensions: {
      type: Array,
      default: () => [
        ".fastq",
        ".fastq.gz",
        ".fq",
        ".fq.gz",
        ".fasta",
        ".fa",
        ".fa.gz",
        ".fasta.gz",
        ".bam",
        ".sam",
        ".vcf",
        ".bed",
        ".gtf",
        ".pdb",
        ".sdf",
      ],
    },
  },

  data() {
    return {
      // 文件列表
      fileList: [],
      // 上传状态
      uploading: false,
      isDragover: false,
    };
  },

  computed: {
    // 直接从 Vuex 的 user 模块获取用户信息
    ...mapState("user", {
      userId: (state) => state.userInfo?.id,
      userInfo: (state) => state.userInfo,
      isLoggedIn: (state) => state.isLoggedIn,
    }),

    allowedExtensionsText() {
      return this.allowedExtensions.join(",");
    },

    // 格式化最大文件大小
    maxFileSizeText() {
      return this.formatFileSize(this.maxFileSize);
    },

    // 统计信息
    totalSize() {
      return this.fileList.reduce((sum, file) => sum + file.size, 0);
    },

    successCount() {
      return this.fileList.filter((file) => file.status === "success").length;
    },

    errorCount() {
      return this.fileList.filter((file) => file.status === "error").length;
    },
  },

  watch: {
    // 监听用户登录状态变化，如果用户登出，清空文件列表
    isLoggedIn(newVal) {
      if (!newVal) {
        this.fileList = [];
      }
    },
  },

  methods: {
    // 检查用户是否已登录
    checkLogin() {
      if (!this.isLoggedIn || !this.userId) {
        this.$message.warning("请先登录后再上传文件");
        this.$router.push("/login");
        return false;
      }
      return true;
    },

    // 触发文件选择
    triggerFileInput() {
      if (!this.checkLogin()) return;
      this.$refs.fileInput.click();
    },

    // 处理文件选择
    handleFileChange(event) {
      if (!this.checkLogin()) return;

      const files = Array.from(event.target.files);
      this.addFiles(files);
      // 清空input，以便可以选择相同的文件
      event.target.value = "";
    },

    // 拖拽相关方法
    onDragOver() {
      if (!this.checkLogin()) return;
      this.isDragover = true;
    },

    onDrop(event) {
      if (!this.checkLogin()) return;

      this.isDragover = false;
      const files = Array.from(event.dataTransfer.files);
      this.addFiles(files);
    },

    // 添加文件到列表
    addFiles(files) {
      files.forEach((file) => {
        // 检查文件大小
        if (file.size > this.maxFileSize) {
          this.$message.error(
            `文件 ${file.name} 超过最大限制 ${this.maxFileSizeText}`,
          );
          return;
        }

        // 检查文件类型
        const allowedExts = this.allowedExtensions.map((ext) =>
          ext.toLowerCase(),
        );

        // 简单后缀校验，针对 .tar.gz 这种双后缀可以稍微放宽
        let isValidExt = false;
        for (let ext of allowedExts) {
          if (file.name.toLowerCase().endsWith(ext)) {
            isValidExt = true;
            break;
          }
        }

        if (!isValidExt) {
          this.$message.error(
            `不支持的文件类型，允许的类型：${this.allowedExtensions.join(
              "、",
            )}`,
          );
          return;
        }

        // 检查是否已存在同名文件
        const exists = this.fileList.some(
          (f) => f.name === file.name && f.size === file.size,
        );
        if (exists) {
          this.$message.warning(`文件 ${file.name} 已存在列表中`);
          return;
        }

        // 添加到文件列表
        this.fileList.push({
          id: Date.now() + Math.random(),
          file: file,
          name: file.name,
          size: file.size,
          status: "pending", // pending, uploading, success, error
          progress: 0, // 初始化进度为0
          error: "", // 初始化错误信息为空
          retryCount: 0,
        });
      });

      if (files.length > 0) {
        this.$message.success(`成功添加 ${files.length} 个文件`);
      }
    },

    // 并发处理独立上传
    async startUpload() {
      if (!this.checkLogin()) return;

      const pendingFiles = this.fileList.filter(
        (f) => f.status === "pending" || f.status === "error",
      );
      if (pendingFiles.length === 0) {
        this.$message.warning("没有需要上传的文件");
        return;
      }

      this.uploading = true;

      // 为每个文件创建一个独立的上传任务
      const uploadPromises = pendingFiles.map((fileItem) => {
        return this.uploadSingle(fileItem);
      });

      try {
        // 使用 Promise.all 来等待所有上传任务完成 (无论成功还是失败)
        await Promise.all(uploadPromises);
      } finally {
        this.uploading = false;

        if (this.errorCount === 0) {
          this.$message.success(`全部上传完成，共 ${this.successCount} 个文件`);
        } else {
          this.$message.warning(
            `上传结束，成功 ${this.successCount} 个，失败/拦截 ${this.errorCount} 个`,
          );
        }

        this.$emit("upload-complete", {
          success: this.successCount,
          error: this.errorCount,
          total: this.fileList.length,
        });
      }
    },

    // 单个文件的上传于进度监听
    async uploadSingle(fileItem) {
      const index = this.fileList.findIndex((f) => f.id === fileItem.id);
      if (index === -1) return Promise.resolve(); // 文件不在列表中，直接返回

      // 重置状态
      this.$set(this.fileList[index], "status", "uploading");
      this.$set(this.fileList[index], "progress", 0);
      this.$set(this.fileList[index], "error", "");

      const formData = new FormData();

      // 这里的参数名与后端接口要求的保持一致
      formData.append("file", fileItem.file);
      formData.append("userId", this.userId);
      if (this.projectId) {
        formData.append("projectId", this.projectId);
      }
      if (this.description) {
        formData.append("description", this.description);
      }

      try {
        // 调用带进度监听的 API
        const response = await uploadSingleFile(formData, (progressEvent) => {
          // 计算百分比 并更新文件项的进度
          let percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          // 避免进度条提早跑满但后端还在处理 MD5，最高跑到 99%，真正完成时再设置为100%
          if (percent > 99) percent = 99;
          this.$set(this.fileList[index], "progress", percent);
        });

        const resultData = response.data || response; // 兼容不同的响应格式

        // 【处理秒传/拦截防重逻辑】
        if (resultData.isDuplicate) {
          // 命中后端拦截：文件已存在
          this.$set(this.fileList[index], "status", "error");
          this.$set(this.fileList[index], "error", "文件已存在，请勿重复上传");
          this.$set(this.fileList[index], "progress", 0); // 进度条归零
        } else if (
          resultData.status === "completed" ||
          resultData.status === "ready" ||
          resultData.id
        ) {
          // 正常上传成功
          this.$set(this.fileList[index], "status", "success");
          this.$set(this.fileList[index], "progress", 100);
          this.$set(this.fileList[index], "result", resultData);

          EventBus.$emit("file-uploaded", {
            file: resultData,
            userId: this.userId,
            projectId: this.projectId,
            timestamp: new Date(),
          });
        } else {
          // 其他未知异常
          this.$set(this.fileList[index], "status", "error");
          this.$set(
            this.fileList[index],
            "error",
            resultData.message || "服务器响应异常",
          );
        }
      } catch (error) {
        console.error(`文件 ${fileItem.name} 上传失败:`, error);
        this.$set(this.fileList[index], "status", "error");
        this.$set(this.fileList[index], "progress", 0);

        const errorMsg =
          error.response?.data?.message || error.message || "网络或服务器错误";
        this.$set(this.fileList[index], "error", errorMsg);

        if (error.response && error.response.status === 401) {
          this.$message.error("登录已过期，请重新登录");
          this.$router.push("/login");
        }
      }
    },

    // 移除文件
    removeFile(index) {
      this.fileList.splice(index, 1);
      if (this.fileList.length === 0) {
        this.$emit("clear-all");
      }
    },

    // 清空所有文件
    clearAllFiles() {
      this.$confirm("确定要清空所有文件吗？", "提示", {
        type: "warning",
      })
        .then(() => {
          this.fileList = [];
          this.$message.success("已清空文件列表");
          this.$emit("clear-all");
        })
        .catch(() => {
          // 用户取消清空
        });
    },

    // 选择更多文件
    selectMoreFiles() {
      this.triggerFileInput();
    },

    // 工具方法
    getFileExtension(filename) {
      if (!filename) return "";
      const lastDot = filename.lastIndexOf(".");
      return lastDot === -1 ? "" : filename.substring(lastDot);
    },

    getFileIcon(filename) {
      const ext = this.getFileExtension(filename).toLowerCase();
      if (ext.includes("fastq") || ext.includes("fq")) {
        return "el-icon-document";
      } else if (ext.includes("fasta") || ext.includes("fa")) {
        return "el-icon-files";
      } else if (ext.includes("bam") || ext.includes("sam")) {
        return "el-icon-coin";
      } else if (ext.includes("vcf")) {
        return "el-icon-s-flag";
      } else if (ext.includes("bed") || ext.includes("gtf")) {
        return "el-icon-s-data";
      }
      return "el-icon-document";
    },

    getStatusText(status) {
      const textMap = {
        pending: "等待上传",
        uploading: "上传中",
        success: "上传成功",
        error: "上传失败",
      };
      return textMap[status] || status;
    },

    formatFileSize(bytes) {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    },
  },
};
</script>
<style lang="scss" scoped>
/* 🌟 容器与极光背景 (完全暗黑不透明版) */
.glass-uploader-container {
  position: relative;
  padding: 30px; /* 增加一点内边距，大气一点 */
  border-radius: 16px; /* 适配主页面的圆角风格 */
  background: #111827; /* 实体极暗背景，彻底不透明 */
  overflow: hidden;
  z-index: 1;
  border: 1px solid #374151; /* 加上一层淡淡的边框线 */

  /* 压暗亮度的绚丽背景光晕，保留深邃感 */
  .ambient-bg {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
        circle at 50% 50%,
        rgba(59, 130, 246, 0.08),
        /* 降低蓝光的亮度 */ transparent 40%
      ),
      radial-gradient(
        circle at 80% 20%,
        rgba(139, 92, 246, 0.08),
        /* 降低紫光的亮度 */ transparent 40%
      ),
      radial-gradient(
        circle at 20% 80%,
        rgba(16, 185, 129, 0.05),
        /* 降低绿光的亮度 */ transparent 40%
      );
    z-index: -1;
    pointer-events: none;
    animation: slowDrift 15s infinite alternate ease-in-out;
  }
}

@keyframes slowDrift {
  0% {
    transform: translate(0, 0) scale(1);
  }
  100% {
    transform: translate(5%, 5%) scale(1.05);
  }
}

/* 🌟 实体暗黑面板材质 (移除毛玻璃，使用实体色) */
@mixin dark-panel {
  background: #1f2937; /* 使用更深一层的灰色，彻底不透明 */
  border: 1px solid #374151; /* 统一的边框色 */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); /* 增强阴影，体现悬浮感 */
}

/* 🌟 上传拖拽区 */
.glass-dropzone {
  @include dark-panel;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px dashed #4b5563; /* 虚线也压暗 */
  margin-bottom: 24px;

  &:hover {
    background: #262f3f; /* 悬浮时稍微提亮，增加交互感 */
    border-color: #3b82f6; /* 悬浮时边框变蓝 */
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(59, 130, 246, 0.15); /* 淡淡的蓝色光晕 */

    .icon-ring {
      transform: scale(1.05);
      background: rgba(59, 130, 246, 0.15); /* 内部圆环变蓝 */
    }
  }

  &.is-dragover {
    background: rgba(59, 130, 246, 0.1); /* 拖拽时淡淡的蓝色背景 */
    border-color: #3b82f6;
    border-style: solid; /* 变实线 */
    transform: scale(1.01);
  }

  .dropzone-content {
    display: flex;
    flex-direction: column;
    align-items: center;

    .icon-ring {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.03); /* 默认极暗的圆环 */
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      transition: all 0.3s ease;

      .cloud-icon {
        font-size: 36px;
        color: #94a3b8; /* 默认灰色图标 */
      }
    }

    .title {
      font-size: 16px;
      font-weight: 600;
      color: #e2e8f0; /* 适配暗黑风的浅灰白字体 */
      margin: 0 0 8px 0;
    }

    .subtitle {
      font-size: 13px;
      color: #94a3b8; /* 适配暗黑风的深灰字体 */
      margin: 0;
    }
  }
}

/* 🌟 文件列表区 */
.glass-file-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 0 8px;

    .header-title {
      font-size: 14px;
      font-weight: 600;
      color: #e2e8f0; /* 适配暗黑风字体 */
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;

      .glass-btn-text {
        color: #94a3b8; /* 适配暗黑风字体 */
        font-size: 13px;
        padding: 4px 8px;
        &:hover {
          color: #3b82f6; /* 悬浮变蓝 */
          background: rgba(255, 255, 255, 0.03); /* 淡淡的背景 */
          border-radius: 4px;
        }
      }

      .glass-btn-primary {
        background: linear-gradient(
          135deg,
          #3b82f6,
          #2563eb
        ); /* 统一的主蓝色渐变 */
        border: none;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        padding: 8px 24px;
        font-weight: 500;
        &:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
      }
    }
  }

  .glass-file-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 350px;
    overflow-y: auto;
    padding-bottom: 12px;
    padding-right: 6px; /* 给滚动条留点空间 */

    /* 暗黑风美化滚动条 */
    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background: #4b5563;
      border-radius: 3px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }

    .glass-file-item {
      @include dark-panel;
      border-radius: 10px;
      padding: 16px;
      display: flex;
      align-items: center;
      transition: all 0.3s ease;

      &:hover {
        background: #262f3f; /* 悬浮时提亮 */
        border-color: #4b5563;
      }

      &.uploading {
        border-left: 3px solid #3b82f6; /* 统一的蓝色 */
      }
      &.success {
        border-left: 3px solid #10b981; /* 统一的绿色 */
      }
      &.error {
        border-left: 3px solid #ef4444; /* 统一的红色 */
      }

      .file-icon-box {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.2); /* 图标背景压暗 */
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
        flex-shrink: 0;
        i {
          font-size: 20px;
          color: #94a3b8; /* 图标灰色 */
        }
      }

      .file-info-box {
        flex: 1;
        min-width: 0;

        .info-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          .file-name {
            font-size: 13px;
            font-weight: 500;
            color: #f1f5f9; /* 适配暗黑风字体 */
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            padding-right: 12px;
          }
          .file-size {
            font-size: 11px;
            color: #64748b; /* 适配暗黑风灰色字体 */
            flex-shrink: 0;
          }
        }

        .progress-wrapper {
          margin-bottom: 6px;
          ::v-deep .el-progress-bar__outer {
            background-color: #374151; /* 进度条背景压暗 */
            border-radius: 4px;
          }
          ::v-deep .el-progress-bar__inner {
            background-color: #3b82f6; /* 统一的蓝色进度条 */
          }
        }

        .info-bottom {
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 6px;
          .status-text {
            display: flex;
            align-items: center;
            gap: 4px;
            &.pending {
              color: #64748b;
            }
            &.uploading {
              color: #3b82f6; /* 统一蓝色 */
              font-weight: 500;
            }
            &.success {
              color: #10b981; /* 统一绿色 */
              font-weight: 500;
            }
            &.error {
              color: #ef4444; /* 统一红色 */
              font-weight: 500;
            }
          }
          .error-msg {
            color: #ef4444; /* 红色错误信息 */
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }

      .file-actions {
        margin-left: 12px;
        .action-btn.remove {
          color: #64748b; /* 适配灰色图标 */
          font-size: 16px;
          &:hover {
            color: #ef4444; /* 悬浮变红 */
            background: rgba(239, 68, 68, 0.1);
            border-radius: 50%;
          }
        }
      }
    }
  }

  /* 🌟 底部统计药丸 (彻底压暗适应暗黑风) */
  .glass-stats-pill {
    @include dark-panel;
    margin-top: 12px;
    border-radius: 30px;
    padding: 10px 20px;
    display: inline-flex;
    align-items: center;
    gap: 16px;
    font-size: 12px;
    color: #e2e8f0; /* 适配暗黑风字体 */

    .stat-group {
      display: flex;
      align-items: center;
      gap: 6px;
      i {
        font-size: 14px;
        opacity: 0.7;
      }
      &.success {
        color: #10b981; /* 统一绿色 */
      }
      &.error {
        color: #ef4444; /* 统一红色 */
      }
    }
    .stat-divider {
      width: 1px;
      height: 12px;
      background: rgba(255, 255, 255, 0.1); /* 压暗分割线 */
    }
  }
}
</style>
