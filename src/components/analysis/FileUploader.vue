<template>
  <div class="simple-file-uploader">
    <!-- 上传区域 -->
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
        :accept="allowedExtensions"
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

    <!-- 文件列表 -->
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
          <!-- 文件信息 -->
          <div class="file-info">
            <div class="file-icon">
              <i :class="getFileIcon(file.name)"></i>
            </div>
            <div class="file-details">
              <div class="file-name">
                <span class="name-text">{{ file.name }}</span>
              </div>
              <div class="file-meta">
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
                <span class="file-status" :class="file.status">
                  {{ getStatusText(file.status) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
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

      <!-- 批量操作 -->
      <div class="batch-actions">
        <el-button type="text" @click="clearAllFiles">
          <i class="el-icon-delete"></i> 清空列表
        </el-button>
        <el-button type="text" @click="selectMoreFiles">
          <i class="el-icon-folder-add"></i> 继续添加
        </el-button>
      </div>
    </div>

    <!-- 上传统计 -->
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
        <span class="stats-label">失败：</span>
        <span class="stats-value error">{{ errorCount }} 个</span>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import { uploadFiles } from "@/api/file";

export default {
  name: "SimpleFileUploader",

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

    // 格式化允许的文件扩展名文本
    allowedExtensionsText() {
      const exts = this.allowedExtensions.map((ext) =>
        ext.replace(".", "").toUpperCase(),
      );
      return exts.join("、");
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

  methods: {
    // 检查用户是否已登录
    checkLogin() {
      if (!this.isLoggedIn || !this.userId) {
        this.$message.warning("请先登录后再上传文件");
        this.$router.push("/login");
        return false;
      }

      // 调试信息
      console.log("当前用户信息：", this.userInfo);
      console.log("用户ID：", this.userId);
      console.log("用户名：", this.userInfo?.username);

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
        const fileExt = this.getFileExtension(file.name).toLowerCase();
        const allowedExts = this.allowedExtensions.map((ext) =>
          ext.toLowerCase(),
        );
        if (!allowedExts.includes(fileExt)) {
          this.$message.error(
            `不支持的文件类型 ${fileExt}，允许的类型：${this.allowedExtensionsText}`,
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
          retryCount: 0,
        });
      });

      if (files.length > 0) {
        this.$message.success(`成功添加 ${files.length} 个文件`);
      }
    },

    // 开始批量上传
    async startUpload() {
      if (!this.checkLogin()) return;

      if (this.fileList.length === 0) {
        this.$message.warning("请先选择要上传的文件");
        return;
      }

      this.uploading = true;

      try {
        // 准备 FormData
        const formData = new FormData();

        // 添加文件列表（多个文件）
        this.fileList.forEach((fileItem, index) => {
          formData.append("files", fileItem.file);
          // 更新文件状态为上传中
          this.$set(this.fileList[index], "status", "uploading");
        });

        // 添加用户ID（必需参数）
        if (!this.userId) {
          throw new Error("无法获取用户ID，请重新登录");
        }

        formData.append("userId", this.userId);

        // 添加其他参数
        if (this.projectId) {
          formData.append("projectId", this.projectId);
        }

        if (this.description) {
          formData.append("description", this.description);
        }

        // 调用批量上传API
        const response = await uploadFiles(formData);
        console.log("上传响应：", response);

        // 处理上传结果
        if (response && Array.isArray(response)) {
          // 创建一个文件名映射，处理可能的编码差异
          const createMatchKey = (fileName) => {
            // 移除可能的路径信息，只保留文件名
            const name = fileName.split(/[\\/]/).pop();
            // 转换为小写进行不区分大小写的比较
            return name.toLowerCase();
          };

          // 为后端返回的数据创建映射表
          const responseMap = {};
          response.forEach((item) => {
            if (item.file && item.file.originalName) {
              const key = createMatchKey(item.file.originalName);
              responseMap[key] = item;
            }
          });
          console.log("响应映射表：", responseMap);

          // 更新每个文件的状态
          let successCount = 0;
          let errorCount = 0;

          this.fileList.forEach((fileItem, index) => {
            const fileKey = createMatchKey(fileItem.name);
            const matchedResult = responseMap[fileKey];

            if (matchedResult) {
              console.log(
                `文件 ${fileItem.name} 匹配到响应记录：`,
                matchedResult,
              );

              if (matchedResult.status === "completed") {
                this.$set(this.fileList[index], "status", "success");
                this.$set(this.fileList[index], "result", matchedResult);
                successCount++;

                // 显示更多成功信息
                this.$message.success({
                  message: `文件 ${fileItem.name} 上传成功`,
                  duration: 3000,
                });
              } else {
                this.$set(this.fileList[index], "status", "error");
                this.$set(
                  this.fileList[index],
                  "error",
                  `上传状态: ${matchedResult.status}`,
                );
                errorCount++;
              }
            }
          });

          // 显示统计信息
          if (errorCount === 0) {
            this.$message.success(
              `所有文件上传成功，共 ${successCount} 个文件`,
            );
          } else {
            this.$message.warning(
              `上传完成，成功 ${successCount} 个，失败 ${errorCount} 个`,
            );
          }

          // 触发上传成功事件
          this.$emit("upload-success", {
            success: successCount,
            total: this.fileList.length,
            results: response,
          });
        } else {
          // 响应不是数组格式，按原逻辑处理
          console.warn("上传响应不是数组格式：", response);

          if (response && response.status === "completed") {
            const results = response.file || [];
            results.forEach((result, index) => {
              if (result && result.success !== false) {
                this.$set(this.fileList[index], "status", "success");
                this.$set(this.fileList[index], "result", result);
              } else {
                this.$set(this.fileList[index], "status", "error");
                this.$set(
                  this.fileList[index],
                  "error",
                  result?.message || "上传失败",
                );
              }
            });
            // 处理没有返回结果的剩余文件
            this.fileList.forEach((file, index) => {
              if (file.status === "uploading") {
                this.$set(this.fileList[index], "status", "error");
                this.$set(
                  this.fileList[index],
                  "error",
                  "服务器未返回此文件的上传结果",
                );
              }
            });

            this.$message.success(
              `批量上传完成，成功 ${this.successCount} 个，失败 ${this.errorCount} 个`,
            );

            // 触发上传成功事件
            this.$emit("upload-success", {
              success: this.successCount,
              total: this.fileList.length,
              results: response.data || response,
            });
          } else {
            // 所有文件标记为失败
            this.fileList.forEach((file, index) => {
              this.$set(this.fileList[index], "status", "error");
              this.$set(
                this.fileList[index],
                "error",
                response?.message || "上传失败",
              );
            });
            this.$message.error(`上传失败: ${response?.message || "未知错误"}`);
          }
        }
      } catch (error) {
        console.error("批量上传失败:", error);

        // 所有文件标记为失败
        this.fileList.forEach((file, index) => {
          this.$set(this.fileList[index], "status", "error");
          this.$set(this.fileList[index], "error", error.message || "网络错误");
        });

        // 如果是认证错误，提示重新登录
        if (error.response && error.response.status === 401) {
          this.$message.error("登录已过期，请重新登录");
          this.$router.push("/login");
        } else if (error.message.includes("用户ID")) {
          this.$message.error(error.message);
          this.$router.push("/login");
        } else {
          this.$message.error(`上传失败: ${error.message || "网络错误"}`);
        }
      } finally {
        this.uploading = false;
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
      }).then(() => {
        this.fileList = [];
        this.$message.success("已清空文件列表");
        this.$emit("clear-all");
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

    // 公开方法：重置上传器
    reset() {
      this.fileList = [];
      this.uploading = false;
      this.isDragover = false;
    },
  },

  mounted() {
    // 组件挂载时检查 Vuex 状态
    console.log("组件挂载，Vuex状态检查：");
    console.log("用户ID：", this.userId);
    console.log("登录状态：", this.isLoggedIn);
    console.log("用户信息：", this.userInfo);
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

        .file-icon {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;

          i {
            font-size: 20px;
            color: white;
          }
        }

        .file-details {
          flex: 1;

          .file-name {
            margin-bottom: 6px;

            .name-text {
              font-weight: 500;
              color: #303133;
              display: block;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }

          .file-meta {
            display: flex;
            align-items: center;
            gap: 16px;
            font-size: 12px;
            color: #909399;

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
          }
        }
      }

      .file-actions {
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
  margin-top: 20px;

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
