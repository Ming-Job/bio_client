<template>
  <div class="simple-file-uploader">
    <div
      class="upload-area"
      @click="triggerFileInput"
      @dragover.prevent="onDragOver"
      @drop.prevent="onDrop"
    >
      <input
        ref="fileInput"
        type="file"
        multiple
        :accept="allowedExtensionsText"
        @change="handleFileChange"
        style="display: none"
      />

      <div class="upload-content" :class="{ dragover: isDragover }">
        <i class="el-icon-upload upload-icon"></i>
        <h3 class="upload-title">点击或拖拽文件到此区域上传</h3>
        <p class="upload-tips">
          支持 {{ allowedExtensionsText }} 格式，单个文件最大
          {{ maxFileSizeText }}
        </p>
      </div>
    </div>

    <div v-if="fileList.length > 0" class="file-list">
      <div class="file-list-header">
        <span class="header-title">待上传文件（{{ fileList.length }}个）</span>
        <el-button
          type="primary"
          :loading="uploading"
          :disabled="uploading"
          @click="startUpload"
        >
          {{ uploading ? `上传中...` : "开始上传" }}
        </el-button>
      </div>

      <div class="file-items">
        <div
          v-for="(file, index) in fileList"
          :key="file.id"
          class="file-item"
          :class="{
            uploading: file.status === 'uploading',
            success: file.status === 'success',
            error: file.status === 'error',
          }"
        >
          <div class="file-info">
            <div class="file-icon">
              <i :class="getFileIcon(file.name)"></i>
            </div>
            <div class="file-details">
              <div class="file-name">
                <span class="name-text">{{ file.name }}</span>
              </div>

              <el-progress
                v-if="file.status === 'uploading'"
                :percentage="file.progress"
                :stroke-width="4"
                :show-text="false"
                class="file-progress"
              ></el-progress>

              <div class="file-meta">
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
                <span class="file-status" :class="file.status">
                  {{
                    file.status === "uploading"
                      ? `上传中 ${file.progress}%`
                      : getStatusText(file.status)
                  }}
                </span>

                <span v-if="file.status === 'error'" class="error-message">
                  ({{ file.error }})
                </span>
              </div>
            </div>
          </div>

          <div class="file-actions">
            <el-button
              v-if="file.status === 'pending' || file.status === 'error'"
              type="text"
              icon="el-icon-delete"
              @click="removeFile(index)"
              class="remove-btn"
              title="移除"
            ></el-button>
            <i
              v-if="file.status === 'success'"
              class="el-icon-circle-check success-icon"
              title="上传成功"
            ></i>
            <i
              v-if="file.status === 'error'"
              class="el-icon-circle-close error-icon"
              title="上传失败"
            ></i>
          </div>
        </div>
      </div>

      <div class="batch-actions">
        <el-button type="text" @click="clearAllFiles">
          <i class="el-icon-delete"></i> 清空列表
        </el-button>
        <el-button type="text" @click="selectMoreFiles">
          <i class="el-icon-folder-add"></i> 继续添加
        </el-button>
      </div>
    </div>

    <div v-if="fileList.length > 0" class="upload-stats">
      <div class="stats-item">
        <span class="stats-label">总大小：</span>
        <span class="stats-value">{{ formatFileSize(totalSize) }}</span>
      </div>
      <div class="stats-item">
        <span class="stats-label">成功：</span>
        <span class="stats-value success">{{ successCount }} 个</span>
      </div>
      <div class="stats-item">
        <span class="stats-label">失败/拦截：</span>
        <span class="stats-value error">{{ errorCount }} 个</span>
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
.simple-file-uploader {
  padding: 20px;
}

.upload-area {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 60px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 24px;

  &:hover {
    border-color: #409eff;
    background-color: rgba(64, 158, 255, 0.05);
  }

  &.dragover {
    border-color: #409eff;
    background-color: rgba(64, 158, 255, 0.1);
    transform: scale(1.01);
  }

  .upload-content {
    .upload-icon {
      font-size: 48px;
      color: #c0c4cc;
      margin-bottom: 16px;
    }

    .upload-title {
      font-size: 18px;
      color: #606266;
      margin-bottom: 8px;
    }

    .upload-tips {
      color: #909399;
      margin: 4px 0;
    }
  }
}

.file-list {
  .file-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .header-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }

  .file-items {
    border: 1px solid #ebeef5;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 16px;

    .file-item {
      display: flex;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #ebeef5;
      transition: all 0.3s ease;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background-color: #f8f9fa;
      }

      &.uploading {
        background-color: rgba(64, 158, 255, 0.05);
      }

      &.success {
        background-color: rgba(103, 194, 58, 0.05);
      }

      &.error {
        background-color: rgba(245, 108, 108, 0.05);
      }

      .file-info {
        display: flex;
        align-items: center;
        flex: 1;
        overflow: hidden; // 防止长文件名撑破布局

        .file-icon {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          flex-shrink: 0; // 防止图标被压缩

          i {
            font-size: 20px;
            color: white;
          }
        }

        .file-details {
          flex: 1;
          overflow: hidden;

          .file-name {
            margin-bottom: 4px; // 为进度条留出紧凑空间

            .name-text {
              font-weight: 500;
              color: #303133;
              display: block;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }

          // 【新增】进度条样式
          .file-progress {
            margin-bottom: 4px;
            padding-right: 20px; // 避免贴边
          }

          .file-meta {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 12px;
            color: #909399;
            flex-wrap: wrap; // 允许标签和错误信息换行

            .file-status {
              &.success {
                color: #67c23a;
              }
              &.error {
                color: #f56c6c;
              }
              &.uploading {
                color: #409eff;
              }
            }

            // 【新增】具体的错误信息文本样式
            .error-message {
              color: #f56c6c;
              font-size: 12px;
            }
          }
        }
      }

      .file-actions {
        padding-left: 16px;
        flex-shrink: 0; // 防止操作按钮被压缩

        .remove-btn {
          color: #f56c6c;
          &:hover {
            background-color: rgba(245, 108, 108, 0.1);
          }
        }

        .success-icon {
          color: #67c23a;
          font-size: 20px;
        }

        .error-icon {
          color: #f56c6c;
          font-size: 20px;
        }
      }
    }
  }

  .batch-actions {
    text-align: center;
    padding: 12px 0;
    border-top: 1px solid #ebeef5;

    .el-button {
      margin: 0 12px;
      color: #606266;

      &:hover {
        color: #409eff;
      }
    }
  }
}

.upload-stats {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-top: 0px;

  .stats-item {
    display: flex;
    align-items: center;

    .stats-label {
      color: #606266;
      margin-right: 8px;
    }

    .stats-value {
      font-weight: 600;
      color: #303133;

      &.success {
        color: #67c23a;
      }

      &.error {
        color: #f56c6c;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .file-item {
    flex-direction: column;
    align-items: flex-start;

    .file-actions {
      align-self: flex-end;
      margin-top: 12px;
    }
  }

  .upload-stats {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
