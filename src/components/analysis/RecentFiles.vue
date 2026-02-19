<!-- @/components/analysis/RecentFiles.vue -->
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
        >
          刷新
        </el-button>

        <el-button
          type="text"
          size="mini"
          icon="el-icon-upload"
          @click="handleUploadClick"
        >
          上传
        </el-button>
      </div>
    </div>

    <div class="file-list">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-files">
        <i class="el-icon-loading"></i>
        <p>正在加载文件列表...</p>
      </div>

      <!-- 文件列表 -->
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
              <el-tag v-if="file.isPublic" size="mini" type="success">
                公开
              </el-tag>
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
            >
              <span class="el-dropdown-link">
                <i class="el-icon-more"></i>
              </span>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="download">下载</el-dropdown-item>
                <el-dropdown-item command="delete" divided
                  >删除</el-dropdown-item
                >
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="files.length === 0" class="empty-files">
          <i class="el-icon-document"></i>
          <p>暂无数据文件</p>
          <el-button type="text" @click="handleUploadClick">
            上传第一个文件
          </el-button>
        </div>
      </div>

      <!-- 存储空间信息 -->
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
  </div>
</template>

<script>
import { getRecentUploadFiles } from "@/api/file";
import { EventBus } from "@/utils/event-bus"; // 事件总线 类似于 广播器
import { deleteFile } from "@/api/file";

export default {
  name: "RecentFiles",

  props: {
    // 用户ID
    userId: {
      type: [Number, String],
      required: true,
    },
  },

  data() {
    return {
      // 文件列表
      files: [],
      // 加载状态
      loading: false,
      // 存储空间信息
      usedStorage: "0B",
      totalStorage: "10GB",
      storagePercentage: 0,
    };
  },

  // 添加生命周期钩子
  mounted() {
    // 监听文件上传事件
    EventBus.$on("file-uploaded", this.handleFileUploaded);
  },
  beforeDestroy() {
    // 取消监听文件上传事件
    EventBus.$off("file-uploaded", this.handleFileUploaded);
  },

  watch: {
    // 监听userId变化
    userId: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.loadFiles();
        }
      },
    },
  },

  methods: {
    // 处理文件上传事件
    async handleFileUploaded(data) {
      // 检查是否是当前用户的文件
      if (data.userId && data.userId.toString() === this.userId.toString()) {
        console.log("收到文件上传事件，刷新列表");
        // 延迟一点时间确保数据库已更新
        setTimeout(() => {
          this.loadFiles();
        }, 500);
      }
    },

    // 加载文件列表
    async loadFiles() {
      try {
        this.loading = true;

        // 调用API获取最近上传的文件
        const response = await getRecentUploadFiles(this.userId);

        if (response && Array.isArray(response)) {
          // 处理文件数据
          this.files = response.map((file) => ({
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

        // 计算存储空间使用情况
        this.updateStorageInfo();
      } catch (error) {
        console.error("加载文件列表失败:", error);
        this.$message.error("获取文件列表失败");
        this.files = [];
      } finally {
        this.loading = false;
      }
    },

    // 更新存储空间信息
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

    // 处理上传点击
    handleUploadClick() {
      this.$emit("upload-click");
    },

    // 处理查看文件
    handleViewFile(file) {
      this.$emit("file-click", file);
    },

    // 处理文件操作命令
    async handleFileCommand(command, file) {
      try {
        switch (command) {
          case "download":
            this.$emit("file-download", file);
            break;
          case "delete":
            await this.deleteFile(file);
            break;
        }
      } catch (error) {
        console.error(`${command} 文件失败:`, error);
      }
    },

    // 删除文件 (软删除)
    async deleteFile(file) {
      console.log("准备删除文件，fileId:", file.id, "userId:", this.userId);
      try {
        // 确认对话框
        await this.$confirm(`确定要删除 "${file.name}" 吗？`, "警告", {
          confirmButtonText: "确定删除",
          cancelButtonText: "取消",
          type: "warning",
        });

        // 调用API删除文件
        await deleteFile(file.id, this.userId);

        // 成功提示
        this.$message.success("文件删除成功");

        // 从列表中移除
        const index = this.files.findIndex((f) => f.id === file.id);
        if (index !== -1) {
          this.files.splice(index, 1);
          // 更新存储空间信息
          this.updateStorageInfo();
        }
      } catch (error) {
        if (error !== "cancel") {
          console.error("删除文件失败:", error);
        }
      }
    },

    // 获取文件图标
    getFileIcon(fileType) {
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

    // 格式化文件大小
    formatFileSize(bytes) {
      if (typeof bytes !== "number" || bytes < 0) return "0 B";
      if (bytes === 0) return "0 B";

      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));

      const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
      return size + " " + sizes[i];
    },

    // 格式化时间
    formatTime(timestamp) {
      try {
        if (!timestamp) return "未知时间";

        let date;
        if (typeof timestamp === "string" && timestamp.includes(" ")) {
          date = new Date(timestamp.replace(" ", "T") + "Z");
        } else {
          date = new Date(timestamp);
        }

        if (isNaN(date.getTime())) {
          return "未知时间";
        }

        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
          return "刚刚";
        } else if (diffMins < 60) {
          return `${diffMins}分钟前`;
        } else if (diffHours < 24) {
          return `${diffHours}小时前`;
        } else if (diffDays < 7) {
          return `${diffDays}天前`;
        } else {
          const year = date.getFullYear();
          const month = (date.getMonth() + 1).toString().padStart(2, "0");
          const day = date.getDate().toString().padStart(2, "0");
          return `${year}-${month}-${day}`;
        }
      } catch (error) {
        console.error("格式化时间失败:", error);
        return "时间错误";
      }
    },

    // 刷新文件列表（公开方法）
    refresh() {
      this.loadFiles();
    },
  },
};
</script>

<style lang="scss" scoped>
.data-files {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  .files-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .header-actions {
      display: flex;
      gap: 8px; // 两个按钮之间的间距
    }
  }

  .file-list {
    .loading-files {
      text-align: center;
      padding: 40px 20px;
      color: #bdc3c7;

      i {
        font-size: 32px;
        margin-bottom: 12px;
      }

      p {
        margin: 0;
        font-size: 14px;
      }
    }

    .file-item {
      display: flex;
      align-items: center;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #e8e8e8;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        border-color: #3498db;
        background: #f8fafc;
      }

      .file-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        background: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;

        i {
          font-size: 20px;
          color: #7f8c8d;
        }
      }

      .file-info {
        flex: 1;

        .file-name {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;

          span {
            flex: 1;
            font-weight: 500;
            color: #2c3e50;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }

        .file-meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #95a5a6;
        }
      }

      .file-actions {
        .el-dropdown-link {
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;

          &:hover {
            background: #f5f5f5;
          }

          i {
            color: #7f8c8d;
            font-size: 16px;
          }
        }
      }
    }

    .empty-files {
      text-align: center;
      padding: 30px 20px;
      color: #bdc3c7;
      border: 1px dashed #e8e8e8;
      border-radius: 8px;
      margin-bottom: 16px;

      i {
        font-size: 36px;
        margin-bottom: 12px;
      }

      p {
        margin-bottom: 12px;
        font-size: 14px;
      }
    }

    .file-storage {
      padding-top: 16px;
      border-top: 1px solid #e8e8e8;

      .storage-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 14px;
        color: #2c3e50;
      }
    }
  }
}
</style>
