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
          <el-select
            v-model="selectedProjectId"
            size="small"
            placeholder="请选择归属科研课题 (必填)"
            class="dark-select project-select"
            clearable
            popper-class="bio-dark-select-dropdown"
          >
            <el-option
              v-for="proj in projectList"
              :key="proj.id"
              :label="proj.name"
              :value="proj.id"
            >
              <i
                class="el-icon-folder"
                style="color: #3b82f6; margin-right: 5px"
              ></i>
              {{ proj.name }}
            </el-option>
          </el-select>

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
            <i class="el-icon-upload2"></i>
            {{ uploading ? "正在上传..." : "开始上传" }}
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
              <span class="file-name" :title="file.name">{{ file.name }}</span>
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
              <span
                v-if="file.status === 'error'"
                class="error-msg"
                :title="file.error"
              >
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
          <i class="el-icon-success"></i> 上传成功: <b>{{ successCount }}</b>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-group error">
          <i class="el-icon-error"></i> 上传失败: <b>{{ errorCount }}</b>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import { uploadSingleFile } from "@/api/file";
import { getUserProjects } from "@/api/project";
import { EventBus } from "@/utils/event-bus";

export default {
  name: "FileUploader",

  props: {
    projectId: { type: [Number, String], default: null },
    description: { type: String, default: "" },
    maxFileSize: { type: Number, default: 10 * 1024 * 1024 * 1024 }, // 10GB
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
      fileList: [],
      uploading: false,
      isDragover: false,
      projectList: [],
      selectedProjectId: "",
    };
  },

  computed: {
    ...mapState("user", {
      userId: (state) => state.userInfo?.id,
      userInfo: (state) => state.userInfo,
      isLoggedIn: (state) => state.isLoggedIn,
    }),
    allowedExtensionsText() {
      return this.allowedExtensions.join(",");
    },
    maxFileSizeText() {
      return this.formatFileSize(this.maxFileSize);
    },
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
    isLoggedIn(newVal) {
      if (!newVal) {
        this.fileList = [];
        this.projectList = [];
      }
    },
    projectId: {
      immediate: true,
      handler(newVal) {
        if (newVal) this.selectedProjectId = Number(newVal);
      },
    },
  },

  mounted() {
    if (this.isLoggedIn && this.userId) {
      this.loadUserProjects();
    }
  },

  methods: {
    async loadUserProjects() {
      try {
        const res = await getUserProjects(this.userId);
        if (res && res.data) {
          this.projectList = res.data;
        }
      } catch (error) {
        console.error("项目列表拉取失败:", error);
      }
    },

    checkLogin() {
      if (!this.isLoggedIn || !this.userId) {
        this.$message.warning("提示：请先登录后再进行文件上传");
        this.$router.push("/login");
        return false;
      }
      return true;
    },

    triggerFileInput() {
      if (!this.checkLogin()) return;
      this.$refs.fileInput.click();
    },

    handleFileChange(event) {
      if (!this.checkLogin()) return;
      const files = Array.from(event.target.files);
      this.addFiles(files);
      event.target.value = "";
    },

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

    addFiles(files) {
      files.forEach((file) => {
        if (file.size > this.maxFileSize) {
          this.$message.error(
            `文件 ${file.name} 大小超出系统限制 (${this.maxFileSizeText})`
          );
          return;
        }

        const allowedExts = this.allowedExtensions.map((ext) =>
          ext.toLowerCase()
        );
        let isValidExt = false;
        for (let ext of allowedExts) {
          if (file.name.toLowerCase().endsWith(ext)) {
            isValidExt = true;
            break;
          }
        }

        if (!isValidExt) {
          this.$message.error(
            `文件格式不支持，允许格式：${this.allowedExtensions.join("、")}`
          );
          return;
        }

        const exists = this.fileList.some(
          (f) => f.name === file.name && f.size === file.size
        );
        if (exists) {
          this.$message.warning(`文件已存在：${file.name} 已在待上传列表中`);
          return;
        }

        this.fileList.push({
          id: Date.now() + Math.random(),
          file: file,
          name: file.name,
          size: file.size,
          status: "pending",
          progress: 0,
          error: "",
        });
      });

      if (files.length > 0)
        this.$message.success(`已选择 ${files.length} 个文件，准备上传`);
    },

    async startUpload() {
      if (!this.checkLogin()) return;

      if (!this.selectedProjectId) {
        this.$message.error("请先选择该文件所属的科研课题！");
        return; 
      }

      const pendingFiles = this.fileList.filter(
        (f) => f.status === "pending" || f.status === "error"
      );
      if (pendingFiles.length === 0) {
        this.$message.warning("待上传列表为空");
        return;
      }

      this.uploading = true;
      const uploadPromises = pendingFiles.map((fileItem) =>
        this.uploadSingle(fileItem)
      );

      try {
        await Promise.all(uploadPromises);
      } finally {
        this.uploading = false;
        if (this.errorCount === 0) {
          this.$message.success(
            `上传完毕，共成功上传 ${this.successCount} 个文件`
          );
        } else {
          this.$message.warning(
            `上传结束。成功 ${this.successCount} 个，失败 ${this.errorCount} 个`
          );
        }

        this.$emit("upload-complete", {
          success: this.successCount,
          error: this.errorCount,
          total: this.fileList.length,
        });
      }
    },

    async uploadSingle(fileItem) {
      const index = this.fileList.findIndex((f) => f.id === fileItem.id);
      if (index === -1) return Promise.resolve();

      this.$set(this.fileList[index], "status", "uploading");
      this.$set(this.fileList[index], "progress", 0);
      this.$set(this.fileList[index], "error", "");

      const formData = new FormData();
      formData.append("file", fileItem.file);
      formData.append("userId", this.userId);

      if (this.selectedProjectId) {
        formData.append("projectId", this.selectedProjectId);
      }

      if (this.description) {
        formData.append("description", this.description);
      }

      try {
        const response = await uploadSingleFile(formData, (progressEvent) => {
          let percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          if (percent > 99) percent = 99;
          this.$set(this.fileList[index], "progress", percent);
        });

        const resultData = response.data || response;

        if (resultData.isDuplicate) {
          this.$set(this.fileList[index], "status", "error");
          this.$set(
            this.fileList[index],
            "error",
            "系统提示：该文件已在平台中存在"
          );
          this.$set(this.fileList[index], "progress", 0);
        } else if (
          resultData.status === "completed" ||
          resultData.status === "ready" ||
          resultData.id
        ) {
          this.$set(this.fileList[index], "status", "success");
          this.$set(this.fileList[index], "progress", 100);
          this.$set(this.fileList[index], "result", resultData);

          EventBus.$emit("file-uploaded", {
            file: resultData,
            userId: this.userId,
            projectId: this.selectedProjectId,
            timestamp: new Date(),
          });
        } else {
          throw new Error(resultData.message || "服务器响应异常");
        }
      } catch (error) {
        this.$set(this.fileList[index], "status", "error");
        this.$set(this.fileList[index], "progress", 0);
        const errorMsg =
          error.response?.data?.message || error.message || "网络连接中断";
        this.$set(this.fileList[index], "error", errorMsg);

        if (error.response && error.response.status === 401) {
          this.$message.error("登录已失效，请重新登录");
          this.$router.push("/login");
        }
      }
    },

    removeFile(index) {
      this.fileList.splice(index, 1);
      if (this.fileList.length === 0) this.$emit("clear-all");
    },

    clearAllFiles() {
      this.$confirm("确定要清空上传列表吗？", "提示", {
        type: "warning",
        customClass: "bio-dark-message-box",
      })
        .then(() => {
          this.fileList = [];
          this.$message.success("列表已清空");
          this.$emit("clear-all");
        })
        .catch(() => {});
    },

    selectMoreFiles() {
      this.triggerFileInput();
    },

    getFileExtension(filename) {
      if (!filename) return "";
      const lastDot = filename.lastIndexOf(".");
      return lastDot === -1 ? "" : filename.substring(lastDot);
    },

    getFileIcon(filename) {
      const ext = this.getFileExtension(filename).toLowerCase();
      if (ext.includes("fastq") || ext.includes("fq"))
        return "el-icon-document";
      if (ext.includes("fasta") || ext.includes("fa")) return "el-icon-files";
      if (ext.includes("bam") || ext.includes("sam")) return "el-icon-coin";
      if (ext.includes("vcf")) return "el-icon-s-flag";
      if (ext.includes("pdb") || ext.includes("sdf")) return "el-icon-discover";
      return "el-icon-document";
    },

    getStatusText(status) {
      const textMap = {
        pending: "等待上传",
        uploading: "正在上传",
        success: "上传成功",
        error: "上传失败",
      };
      return textMap[status] || status;
    },

    formatFileSize(bytes) {
      if (bytes === 0) return "0 B";
      const k = 1024,
        sizes = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    },
  },
};
</script>

<style lang="scss" scoped>
/* 容器与极光背景 */
.glass-uploader-container {
  position: relative;
  padding: 30px;
  border-radius: 16px;
  background: #111827;
  overflow: hidden;
  z-index: 1;
  border: 1px solid #374151;
  .ambient-bg {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
        circle at 50% 50%,
        rgba(59, 130, 246, 0.08),
        transparent 40%
      ),
      radial-gradient(
        circle at 80% 20%,
        rgba(139, 92, 246, 0.08),
        transparent 40%
      ),
      radial-gradient(
        circle at 20% 80%,
        rgba(16, 185, 129, 0.05),
        transparent 40%
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
@mixin dark-panel {
  background: #1f2937;
  border: 1px solid #374151;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* 上传拖拽区 */
.glass-dropzone {
  @include dark-panel;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px dashed #4b5563;
  margin-bottom: 24px;
  &:hover {
    background: #262f3f;
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(59, 130, 246, 0.15);
    .icon-ring {
      transform: scale(1.05);
      background: rgba(59, 130, 246, 0.15);
    }
  }
  &.is-dragover {
    background: rgba(59, 130, 246, 0.1);
    border-color: #3b82f6;
    border-style: solid;
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
      background: rgba(255, 255, 255, 0.03);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      transition: all 0.3s ease;
      .cloud-icon {
        font-size: 36px;
        color: #94a3b8;
      }
    }
    .title {
      font-size: 16px;
      font-weight: 600;
      color: #e2e8f0;
      margin: 0 0 8px 0;
    }
    .subtitle {
      font-size: 13px;
      color: #94a3b8;
      margin: 0;
      font-family: Consolas, monospace;
    }
  }
}

/* 文件列表区 */
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
      color: #e2e8f0;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      ::v-deep .dark-select {
        width: 220px;
        .el-input__inner {
          background-color: #1e293b;
          border: 1px solid #334155;
          color: #f8fafc;
          &:focus {
            border-color: #3b82f6;
          }
        }
      }
      .glass-btn-text {
        color: #94a3b8;
        font-size: 13px;
        padding: 4px 8px;
        &:hover {
          color: #3b82f6;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 4px;
        }
      }
      .glass-btn-primary {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        border: none;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        padding: 8px 24px;
        font-weight: 500;
        &:hover:not(:disabled) {
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
    padding-right: 6px;
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
        background: #262f3f;
        border-color: #4b5563;
      }
      &.uploading {
        border-left: 3px solid #3b82f6;
      }
      &.success {
        border-left: 3px solid #10b981;
      }
      &.error {
        border-left: 3px solid #ef4444;
      }
      .file-icon-box {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
        flex-shrink: 0;
        i {
          font-size: 20px;
          color: #94a3b8;
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
            color: #f1f5f9;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            padding-right: 12px;
            font-family: Consolas, monospace;
          }
          .file-size {
            font-size: 11px;
            color: #64748b;
            flex-shrink: 0;
            font-family: Consolas, monospace;
          }
        }
        .progress-wrapper {
          margin-bottom: 6px;
          ::v-deep .el-progress-bar__outer {
            background-color: #374151;
            border-radius: 4px;
          }
          ::v-deep .el-progress-bar__inner {
            background-color: #3b82f6;
          }
        }
        .info-bottom {
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: Consolas, monospace;
          .status-text {
            display: flex;
            align-items: center;
            gap: 4px;
            &.pending {
              color: #64748b;
            }
            &.uploading {
              color: #3b82f6;
              font-weight: 500;
            }
            &.success {
              color: #10b981;
              font-weight: 500;
            }
            &.error {
              color: #ef4444;
              font-weight: 500;
            }
          }
          .error-msg {
            color: #ef4444;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }
      .file-actions {
        margin-left: 12px;
        .action-btn.remove {
          color: #64748b;
          font-size: 16px;
          &:hover {
            color: #ef4444;
            background: rgba(239, 68, 68, 0.1);
            border-radius: 50%;
          }
        }
      }
    }
  }

  /* 底部统计药丸 */
  .glass-stats-pill {
    @include dark-panel;
    margin-top: 12px;
    border-radius: 30px;
    padding: 10px 20px;
    display: inline-flex;
    align-items: center;
    gap: 16px;
    font-size: 12px;
    color: #e2e8f0;
    font-family: Consolas, monospace;
    .stat-group {
      display: flex;
      align-items: center;
      gap: 6px;
      i {
        font-size: 14px;
        opacity: 0.7;
      }
      &.success {
        color: #10b981;
      }
      &.error {
        color: #ef4444;
      }
    }
    .stat-divider {
      width: 1px;
      height: 12px;
      background: rgba(255, 255, 255, 0.1);
    }
  }
}
</style>