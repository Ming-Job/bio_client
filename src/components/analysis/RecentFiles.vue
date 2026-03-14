<template>
  <div class="data-files">
    <div class="files-header">
      <h3 class="section-title">
        <i class="el-icon-folder-opened"></i> 最近上传文件
      </h3>

      <div class="header-actions">
        <el-button
          type="text"
          size="mini"
          icon="el-icon-refresh"
          @click="refresh"
          >刷新</el-button
        >
        <el-button
          type="text"
          size="mini"
          icon="el-icon-upload"
          @click="handleUploadClick"
          >上传</el-button
        >
      </div>
    </div>

    <div class="file-list">
      <div v-if="loading" class="loading-files">
        <i class="el-icon-loading"></i>
        <p>正在加载文件列表...</p>
      </div>

      <div v-else>
        <div
          v-for="file in files"
          :key="file.id"
          class="file-item"
          @click="handleViewFile(file)"
        >
          <div class="file-icon">
            <i :class="getFileIcon(file.type)"></i>
          </div>
          <div class="file-info">
            <div class="file-name">
              <span>{{ file.name }}</span>
              <el-tag v-if="file.isPublic" size="mini" type="success"
                >公开</el-tag
              >
            </div>
            <div class="file-meta">
              <span>{{ file.formattedSize || formatFileSize(file.size) }}</span>
              <span>{{ formatTime(file.uploadTime) }}</span>
            </div>
          </div>
          <div class="file-actions">
            <el-dropdown
              trigger="click"
              @command="handleFileCommand($event, file)"
              @click.native.stop
            >
              <span class="el-dropdown-link">
                <i class="el-icon-more"></i>
              </span>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="preview">预览</el-dropdown-item>
                <el-dropdown-item command="download">下载</el-dropdown-item>
                <el-dropdown-item command="delete" divided
                  >删除</el-dropdown-item
                >
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </div>

        <div v-if="files.length === 0" class="empty-files">
          <i class="el-icon-document"></i>
          <p>暂无数据文件</p>
          <el-button type="text" @click="handleUploadClick"
            >上传第一个文件</el-button
          >
        </div>
      </div>

      <div class="file-storage">
        <div class="storage-info">
          <span>存储空间</span>
          <span>{{ usedStorage }} / {{ totalStorage }}</span>
        </div>
        <el-progress
          :percentage="storagePercentage"
          :stroke-width="6"
          :color="storagePercentage > 90 ? '#f56c6c' : '#409eff'"
        />
      </div>
    </div>

    <el-dialog
      :title="`文件预览: ${previewFileName}`"
      :visible.sync="previewVisible"
      width="70%"
      top="5vh"
      custom-class="preview-dialog"
      append-to-body
    >
      <div
        v-loading="previewLoading"
        element-loading-background="rgba(30, 30, 30, 0.8)"
        class="preview-container"
      >
        <pre
          v-if="previewContent"
          class="code-block"
        ><code>{{ previewContent }}</code></pre>

        <el-empty
          v-else-if="!previewLoading"
          description="暂无预览内容"
        ></el-empty>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="previewVisible = false">关 闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getRecentUploadFiles, deleteFile, previewFile } from "@/api/file";
import { EventBus } from "@/utils/event-bus";

export default {
  name: "RecentFiles",

  props: {
    userId: {
      type: [Number, String],
      required: true,
    },
  },

  data() {
    return {
      files: [],
      loading: false,
      usedStorage: "0B",
      totalStorage: "10GB",
      storagePercentage: 0,

      // 【新增】：预览相关的状态数据
      previewVisible: false,
      previewLoading: false,
      previewContent: "",
      previewFileName: "",
    };
  },

  mounted() {
    EventBus.$on("file-uploaded", this.handleFileUploaded);
  },

  beforeDestroy() {
    EventBus.$off("file-uploaded", this.handleFileUploaded);
  },

  watch: {
    userId: {
      immediate: true,
      handler(newVal) {
        if (newVal) this.loadFiles();
      },
    },
  },

  methods: {
    async handleFileUploaded(data) {
      if (data.userId && data.userId.toString() === this.userId.toString()) {
        setTimeout(() => {
          this.loadFiles();
        }, 500);
      }
    },

    async loadFiles() {
      try {
        this.loading = true;
        const response = await getRecentUploadFiles(this.userId);

        if (response && Array.isArray(response)) {
          // 这里为了兼容 Axios 不同的响应拦截器配置，可能是 response 也可能是 response.data
          const dataList = response.data || response;
          this.files = dataList.map((file) => ({
            id: file.id,
            name: file.originalName,
            type: file.fileType,
            size: file.sizeBytes,
            uploadTime: file.uploadTime,
            isPublic: file.isPublic || file.accessLevel === "public",
            downloadUrl: file.downloadUrl,
            formattedSize: file.formattedSize,
          }));
        } else {
          this.files = [];
        }
        this.updateStorageInfo();
      } catch (error) {
        console.error("加载文件列表失败:", error);
        this.files = [];
      } finally {
        this.loading = false;
      }
    },

    updateStorageInfo() {
      const totalBytes = this.files.reduce(
        (sum, file) => sum + (file.size || 0),
        0,
      );
      this.usedStorage = this.formatFileSize(totalBytes);
      this.storagePercentage = Math.min(
        100,
        Math.round((totalBytes / (10 * 1024 * 1024 * 1024)) * 100),
      );
    },

    handleUploadClick() {
      this.$emit("upload-click");
    },

    // 【核心修改】：点击文件列表直接触发预览
    async handleViewFile(file) {
      this.$emit("file-click", file); // 保持向外抛出事件，不影响别的逻辑

      this.previewFileName = file.name;
      this.previewContent = "";
      this.previewVisible = true;
      this.previewLoading = true;

      try {
        const response = await previewFile(file.id, this.userId);
        console.log("预览响应数据类型:", typeof response);

        // 【核心修复】：更灵活的数据解析逻辑
        let content = "";

        // Axios 包装了 data，且 data 是字符串
        if (response && typeof response.data === "string") {
          content = response.data;
        }

        if (content) {
          this.previewContent = content;
        } else {
          // 如果解析不到内容，提示警告
          this.$message.warning(
            response?.message ||
              response?.data?.message ||
              "无法预览该文件或文件内容为空",
          );
          this.previewVisible = false;
        }
      } catch (error) {
        console.error("预览请求报错:", error);
        const errorMsg =
          error.response?.data?.message || error.message || "预览加载失败";
        this.$message.error(errorMsg);
        this.previewVisible = false;
      } finally {
        this.previewLoading = false;
      }
    },

    async handleFileCommand(command, file) {
      try {
        switch (command) {
          case "preview":
            this.handleViewFile(file);
            break;

          case "download":
            // 【核心实现】：原生 a 标签触发浏览器下载，完美支持大文件和断点续传

            // 1. 拼接下载接口的 URL（确保包含了鉴权用的 userId）
            // 注意：如果你的前端配置了代理 (vue.config.js 里的 proxy)，这里的 /api/files 会自动转发到后端
            // eslint-disable-next-line no-case-declarations
            const downloadUrl = `/api/files/download/${file.id}?userId=${this.userId}`;

            // 2. 动态创建隐藏的 a 标签
            // eslint-disable-next-line no-case-declarations
            const link = document.createElement("a");
            link.style.display = "none";
            link.href = downloadUrl;

            // 3. 挂载到 DOM 并模拟点击
            document.body.appendChild(link);
            link.click();

            // 4. 清理 DOM 节点
            document.body.removeChild(link);

            this.$message.success(
              `已开始下载: ${file.name}，请查看浏览器的下载任务`,
            );
            break;

          case "delete":
            await this.deleteFile(file);
            break;
        }
      } catch (error) {
        console.error(`${command} 文件失败:`, error);
      }
    },

    async deleteFile(file) {
      try {
        await this.$confirm(`确定要删除 "${file.name}" 吗？`, "警告", {
          confirmButtonText: "确定删除",
          cancelButtonText: "取消",
          type: "warning",
        });

        await deleteFile(file.id, this.userId);
        this.$message.success("文件删除成功");

        const index = this.files.findIndex((f) => f.id === file.id);
        if (index !== -1) {
          this.files.splice(index, 1);
          this.updateStorageInfo();
        }
      } catch (error) {
        if (error !== "cancel") console.error("删除文件失败:", error);
      }
    },

    getFileIcon(fileType) {
      /* 保持原样 */
      const iconMap = {
        fastq: "el-icon-document",
        fasta: "el-icon-files",
        fq: "el-icon-document",
        fa: "el-icon-files",
        csv: "el-icon-s-data",
        bam: "el-icon-coin",
        vcf: "el-icon-s-flag",
        txt: "el-icon-tickets",
        pdf: "el-icon-document",
        zip: "el-icon-files",
        gz: "el-icon-files",
        unknown: "el-icon-document",
      };
      return iconMap[fileType] || "el-icon-document";
    },

    formatFileSize(bytes) {
      /* 保持原样 */
      if (typeof bytes !== "number" || bytes < 0) return "0 B";
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    },

    formatTime(timestamp) {
      /* 保持原样 */
      try {
        if (!timestamp) return "未知时间";
        let date =
          typeof timestamp === "string" && timestamp.includes(" ")
            ? new Date(timestamp.replace(" ", "T") + "Z")
            : new Date(timestamp);
        if (isNaN(date.getTime())) return "未知时间";
        const diffMs = new Date() - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 1) return "刚刚";
        if (diffMins < 60) return `${diffMins}分钟前`;
        if (diffHours < 24) return `${diffHours}小时前`;
        if (diffDays < 7) return `${diffDays}天前`;
        return `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
      } catch {
        return "时间错误";
      }
    },

    refresh() {
      this.loadFiles();
    },
  },
};
</script>

<style lang="scss" scoped>
.data-files {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);

  /* === 新增：弹性伸缩与溢出隐藏 === */
  display: flex;
  flex-direction: column;
  flex: 1; /* 自动撑满右侧下方所有的剩余高度 */
  overflow: hidden; /* 截断溢出部分 */
}
.files-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  .section-title {
    font-size: 16px;
    color: #f8fafc;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    i {
      color: #3b82f6;
    }
  }
  .header-actions {
    display: flex;
    gap: 8px;
  }
}
.file-list {
  .loading-files {
    text-align: center;
    padding: 40px 20px;
    color: #64748b;
    i {
      font-size: 32px;
      margin-bottom: 12px;
    }

    /* 极客风暗黑滚动条美化 */
    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background: #374151;
      border-radius: 3px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }
  .file-item {
    display: flex;
    align-items: center;
    padding: 12px;
    border-radius: 10px;
    background: #1f2937;
    border: 1px solid #374151;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    &:hover {
      border-color: #4b5563;
      background: #262f3f;
    }
    .file-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      i {
        font-size: 20px;
        color: #94a3b8;
      }
    }
    .file-info {
      flex: 1;
      overflow: hidden;
      .file-name {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
        span {
          flex: 1;
          font-weight: 500;
          color: #f8fafc;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
      .file-meta {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #64748b;
      }
    }
    .file-actions {
      .el-dropdown-link {
        cursor: pointer;
        padding: 8px;
        border-radius: 4px;
        &:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        i {
          color: #94a3b8;
          font-size: 16px;
        }
      }
    }
  }
  .empty-files {
    text-align: center;
    padding: 30px 20px;
    color: #64748b;
    border: 1px dashed #374151;
    border-radius: 8px;
    margin-bottom: 16px;
    i {
      font-size: 36px;
      margin-bottom: 12px;
    }
  }
  .file-storage {
    padding-top: 16px;
    border-top: 1px solid #374151;
    .storage-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
      color: #94a3b8;
    }
  }
}

/* 弹窗及内部保持你的深色设计即可 */
::v-deep .preview-dialog {
  border-radius: 8px;
  overflow: hidden;
  .el-dialog__header {
    background-color: #111827;
    border-bottom: 1px solid #1f2937;
    padding: 15px 20px;
    .el-dialog__title {
      color: #f8fafc;
      font-size: 16px;
    }
  }
  .el-dialog__body {
    padding: 0;
    background-color: #0b0f19;
  }
}
.preview-container {
  min-height: 250px;
  max-height: 65vh;
  overflow-y: auto;
  padding: 20px;
  background-color: #0b0f19;
  .code-block {
    margin: 0;
    font-family: Consolas, "Courier New", monospace;
    font-size: 14px;
    line-height: 1.6;
    color: #10b981; /* 代码高亮用荧光绿，更有极客感 */
    white-space: pre-wrap;
    word-break: break-all;
  }
}
</style>
