<template>
  <div class="data-cabin-container">
    <div class="cabin-header">
      <div class="header-left">
        <el-page-header
          @back="$router.push('/analysis')"
          content="数据资源中心 (Data Center)"
          class="dark-page-header"
        ></el-page-header>
      </div>
      <div class="header-right">
        <el-input
          v-model="searchQuery"
          placeholder="搜索文件名..."
          prefix-icon="el-icon-search"
          clearable
          class="dark-search-input"
        ></el-input>
        <el-button
          type="primary"
          icon="el-icon-upload"
          class="upload-btn"
          @click="showUploadDialog = true"
        >
          上传数据
        </el-button>
      </div>
    </div>

    <div class="storage-bar">
      <div class="storage-info">
        <span
          ><i class="el-icon-odometer"></i> 数据资源统计 (共 {{
            files.length
          }} 个文件)</span
        >
        <span class="storage-usage">
          已占用物理存储: {{ totalUsedStorage }}
        </span>
      </div>
    </div>

    <div class="cabin-main">
      <div class="file-table-wrapper">
        <div class="table-toolbar">
          <div class="toolbar-left">
            <el-radio-group
              v-model="sourceFilter"
              size="small"
              class="dark-radio-group"
            >
              <el-radio-button label="all">全部文件</el-radio-button>
              <el-radio-button label="upload"
                ><i class="el-icon-upload2"></i> 我上传的</el-radio-button
              >
              <el-radio-button label="generate"
                ><i class="el-icon-cpu"></i> 分析产出物</el-radio-button
              >
            </el-radio-group>
          </div>

          <div class="toolbar-right">
            <el-select
              v-model="activeType"
              size="small"
              placeholder="请选择文件格式"
              class="dark-select"
              popper-class="dark-dropdown"
            >
              <el-option label="全部格式" value="all"></el-option>
              <el-option
                label="原始测序 (FastQ/FASTA)"
                value="fastq"
              ></el-option>
              <el-option label="比对结果 (BAM/SAM)" value="bam"></el-option>
              <el-option label="变异检测 (VCF)" value="vcf"></el-option>
              <el-option label="分子结构 (PDB/SDF)" value="struct"></el-option>
              <el-option label="数据矩阵 (CSV/TXT)" value="csv"></el-option>
              <el-option label="分析结题 (PDF/报告)" value="pdf"></el-option>
            </el-select>
          </div>
        </div>

        <el-table
          :data="paginatedFiles"
          v-loading="loading"
          element-loading-background="rgba(11, 15, 25, 0.8)"
          class="dark-table"
          height="calc(100vh - 380px)"
        >
          <el-table-column label="文件名" min-width="280">
            <template slot-scope="scope">
              <div class="file-name-cell" @click="handlePreview(scope.row)">
                <i :class="getFileIcon(scope.row.type) + ' file-icon'"></i>
                <span class="file-name" :title="scope.row.name">{{
                  scope.row.name
                }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="type" label="格式" width="100">
            <template slot-scope="scope">
              <el-tag size="mini" effect="plain" type="info">{{
                scope.row.type.toUpperCase()
              }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column
            label="归属课题"
            min-width="160"
            show-overflow-tooltip
          >
            <template slot-scope="scope">
              <el-tag
                v-if="scope.row.projectName !== '未绑定课题'"
                size="mini"
                type="info"
                effect="plain"
                style="
                  background: transparent;
                  border-color: #334155;
                  color: #94a3b8;
                "
              >
                <i class="el-icon-folder-opened"></i>
                {{ scope.row.projectName }}
              </el-tag>
              <span v-else style="color: #475569; font-size: 13px"
                >- 独立文件 -</span
              >
            </template>
          </el-table-column>

          <el-table-column label="来源" width="120">
            <template slot-scope="scope">
              <el-tag
                size="mini"
                :type="scope.row.source === 'generate' ? 'success' : 'primary'"
                effect="dark"
                style="border: none"
              >
                {{ scope.row.source === "generate" ? "分析产出" : "手动上传" }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column
            prop="formattedSize"
            label="大小"
            width="120"
          ></el-table-column>

          <el-table-column label="产生时间" width="180">
            <template slot-scope="scope">
              <span class="time-text">{{
                formatTime(scope.row.uploadTime)
              }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="160" align="right">
            <template slot-scope="scope">
              <el-tooltip content="预览" placement="top">
                <el-button
                  type="text"
                  icon="el-icon-view"
                  class="action-icon view"
                  @click="handlePreview(scope.row)"
                ></el-button>
              </el-tooltip>
              <el-tooltip content="下载" placement="top">
                <el-button
                  type="text"
                  icon="el-icon-download"
                  class="action-icon download"
                  @click="handleDownload(scope.row)"
                ></el-button>
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button
                  type="text"
                  icon="el-icon-delete"
                  class="action-icon delete"
                  @click="handleDelete(scope.row)"
                ></el-button>
              </el-tooltip>
            </template>
          </el-table-column>

          <template slot="empty">
            <el-empty
              description="暂无文件数据"
              :image-size="80"
            ></el-empty>
          </template>
        </el-table>

        <div class="pagination-container">
          <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="currentPage"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredFilesAll.length"
            class="bio-dark-pagination"
          >
          </el-pagination>
        </div>
      </div>
    </div>

    <el-dialog
      :visible.sync="showUploadDialog"
      width="750px"
      :close-on-click-modal="false"
      custom-class="glass-dialog-wrapper"
      :show-close="false"
    >
      <div class="glass-dialog-close" @click="showUploadDialog = false">
        <i class="el-icon-close"></i>
      </div>
      <FileUploader @upload-complete="handleUploadComplete" />
    </el-dialog>

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
        element-loading-background="rgba(11, 15, 25, 0.8)"
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
    </el-dialog>
  </div>
</template>

<script>
import { getAllFileList, deleteFile, previewFile } from "@/api/file";
import FileUploader from "@/components/analysis/FileUploader.vue";
import { mapGetters } from "vuex";

export default {
  name: "DataCabin",
  components: { FileUploader },
  data() {
    return {
      loading: false,
      searchQuery: "",
      activeType: "all",
      sourceFilter: "all",
      files: [],

      showUploadDialog: false,
      previewVisible: false,
      previewLoading: false,
      previewContent: "",
      previewFileName: "",

      currentPage: 1,
      pageSize: 10,
    };
  },
  computed: {
    ...mapGetters("user", ["userId"]),

    filteredFilesAll() {
      return this.files.filter((f) => {
        const matchSearch = f.name
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase());
        const matchSource =
          this.sourceFilter === "all" || f.source === this.sourceFilter;

        let matchType = false;
        const fType = f.type.toLowerCase();

        if (this.activeType === "all") {
          matchType = true;
        } else if (this.activeType === "fastq") {
          matchType = ["fastq", "fq", "fasta", "fa"].some((t) =>
            fType.includes(t),
          );
        } else if (this.activeType === "csv") {
          matchType = ["csv", "tsv", "txt"].some((t) => fType.includes(t));
        } else if (this.activeType === "struct") {
          matchType = ["pdb", "sdf"].some((t) => fType.includes(t));
        } else {
          matchType = fType.includes(this.activeType);
        }

        return matchSearch && matchType && matchSource;
      });
    },

    paginatedFiles() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredFilesAll.slice(start, end);
    },

    totalUsedStorage() {
      const totalBytes = this.files.reduce((sum, f) => sum + (f.size || 0), 0);
      return this.formatFileSize(totalBytes);
    },

  },

  watch: {
    searchQuery() {
      this.currentPage = 1;
    },
    activeType() {
      this.currentPage = 1;
    },
    sourceFilter() {
      this.currentPage = 1;
    },
  },

  mounted() {
    this.fetchFiles();
  },
  methods: {
    async fetchFiles() {
      this.loading = true;
      try {
        const res = await getAllFileList({ userId: this.userId || 6 });
        const dataList = res.data || res;
        if (Array.isArray(dataList)) {
          this.files = dataList.map((file) => {
            let sourceFlag = "upload";
            if (file.fileSource) {
              sourceFlag = file.fileSource.toLowerCase();
            } else if (file.source) {
              sourceFlag = file.source.toLowerCase();
            } else if (file.taskId) {
              sourceFlag = "generate";
            }

            return {
              id: file.id,
              name: file.originalName,
              type: file.fileType || this.extractExt(file.originalName),
              size: file.sizeBytes,
              formattedSize:
                file.formattedSize || this.formatFileSize(file.sizeBytes),
              uploadTime: file.uploadTime,
              source: sourceFlag,
              projectName: file.projectName || "未绑定课题",
            };
          });
        }
      } catch (error) {
        this.$message.error("无法连接到服务器，请检查网络");
      } finally {
        this.loading = false;
      }
    },

    handleSizeChange(val) {
      this.pageSize = val;
      this.currentPage = 1;
    },
    handleCurrentChange(val) {
      this.currentPage = val;
    },

    handleUploadComplete(result) {
      if (result && result.error === 0) {
        setTimeout(() => {
          this.showUploadDialog = false;
          this.fetchFiles();
        }, 1000);
      } else {
        setTimeout(() => {
          this.showUploadDialog = false;
          this.fetchFiles();
        }, 1000);
      }
    },

    handleDownload(file) {
      const downloadUrl = `/api/files/download/${file.id}?userId=${
        this.userId || 6
      }`;
      const link = document.createElement("a");
      link.style.display = "none";
      link.href = downloadUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.$message.success(`开始下载: ${file.name}`);
    },

    async handlePreview(file) {
      if (["bam", "sam", "gz", "zip"].includes(file.type.toLowerCase())) {
        this.$message.warning("二进制大文件不支持在线预览，请下载后查看");
        return;
      }
      this.previewFileName = file.name;
      this.previewContent = "";
      this.previewVisible = true;
      this.previewLoading = true;
      try {
        const res = await previewFile(file.id, this.userId || 6);
        this.previewContent =
          res && typeof res.data === "string" ? res.data : "无法读取内容";
      } catch (error) {
        this.previewContent = "读取预览失败，物理文件可能丢失。";
      } finally {
        this.previewLoading = false;
      }
    },

    async handleDelete(file) {
      try {
        await this.$confirm(
          `警告：确定要彻底删除文件 [${file.name}] 吗？删除后将无法恢复。`,
          "高危操作确认",
          {
            confirmButtonText: "确定删除",
            cancelButtonText: "取消",
            type: "warning",
            customClass: "bio-dark-message-box",
          },
        );
        await deleteFile(file.id, this.userId || 6);
        this.$message.success("文件已成功删除");
        this.fetchFiles();
      } catch (err) {
        if (err !== "cancel") this.$message.error("文件删除失败");
      }
    },

    extractExt(filename) {
      return filename ? filename.split(".").pop().toLowerCase() : "unknown";
    },

    getFileIcon(type) {
      const map = {
        fastq: "el-icon-document",
        fq: "el-icon-document",
        fasta: "el-icon-files",
        fa: "el-icon-files",
        bam: "el-icon-coin",
        sam: "el-icon-coin",
        pdf: "el-icon-document-checked",
        vcf: "el-icon-s-flag",
        csv: "el-icon-s-data",
        tsv: "el-icon-s-data",
        txt: "el-icon-tickets",
        pdb: "el-icon-connection",
        sdf: "el-icon-connection",
      };
      return map[type.toLowerCase()] || "el-icon-document";
    },

    formatFileSize(bytes) {
      if (!bytes) return "0 B";
      const k = 1024,
        sizes = ["B", "KB", "MB", "GB", "TB"],
        i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    },

    formatTime(timeStr) {
      if (!timeStr) return "-";
      return typeof timeStr === "string"
        ? timeStr.substring(0, 16).replace("T", " ")
        : "-";
    },
  },
};
</script>

<style lang="scss" scoped>
/* ================= 极客暗黑风全局设定 ================= */
.data-cabin-container {
  min-height: calc(100vh - 60px);
  background-color: #0b0f19;
  padding: 30px;
  color: #e2e8f0;
}

/* 顶部头部 */
.cabin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  ::v-deep .dark-page-header {
    .el-page-header__left {
      color: #94a3b8;
      &:hover {
        color: #3b82f6;
      }
    }
    .el-page-header__content {
      color: #f8fafc;
      font-weight: 600;
    }
  }
  .header-right {
    display: flex;
    gap: 16px;
    ::v-deep .dark-search-input .el-input__inner {
      background-color: #1e293b;
      border: 1px solid #334155;
      color: #f8fafc;
      border-radius: 8px;
      width: 250px;
      &:focus {
        border-color: #3b82f6;
      }
    }
    .upload-btn {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      border: none;
    }
  }
}

/* 存储监控条 */
.storage-bar {
  background: #111827;
  border: 1px solid #1f2937;
  padding: 16px 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  .storage-info {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #94a3b8;
    i {
      color: #3b82f6;
      margin-right: 6px;
    }
    .storage-usage {
      color: #f8fafc;
      font-weight: bold;
      font-family: Consolas, monospace;
    }
  }
  ::v-deep .el-progress-bar__outer {
    background-color: #1e293b !important;
  }
}

/* 主体内容区 */
.cabin-main {
  display: flex;
  gap: 24px;
}

/* ================= 工具栏与来源切换 ================= */
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  ::v-deep .dark-radio-group {
    .el-radio-button__inner {
      background: #0f172a;
      border-color: #334155;
      color: #94a3b8;
      box-shadow: none !important;
      padding: 8px 16px;
      font-size: 13px;
    }
    .el-radio-button__orig-radio:checked + .el-radio-button__inner {
      background-color: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }
    .el-radio-button:first-child .el-radio-button__inner {
      border-radius: 6px 0 0 6px;
    }
    .el-radio-button:last-child .el-radio-button__inner {
      border-radius: 0 6px 6px 0;
    }
  }

  ::v-deep .dark-select {
    width: 220px;
    .el-input__inner {
      background-color: #0f172a;
      border-color: #334155;
      color: #f8fafc;
      border-radius: 6px;
      &:focus {
        border-color: #3b82f6;
      }
    }
  }
}

/* 文件大表样式 */
.file-table-wrapper {
  flex: 1;
  overflow: hidden;
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 16px;
  ::v-deep .dark-table {
    background-color: transparent !important;
    &::before {
      display: none;
    }
    th,
    tr {
      background-color: #111827 !important;
      color: #94a3b8;
      border-color: #1f2937 !important;
    }
    td {
      border-color: #1f2937 !important;
      color: #e2e8f0;
    }
    .el-table__body tr:hover > td {
      background-color: #1e293b !important;
    }
  }

  .file-name-cell {
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: 0.2s;
    &:hover {
      color: #3b82f6;
    }
    .file-icon {
      font-size: 20px;
      color: #64748b;
      margin-right: 12px;
    }
    .file-name {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .time-text {
    font-size: 13px;
    color: #64748b;
    font-family: Consolas, monospace;
  }

  .action-icon {
    font-size: 16px;
    padding: 4px 8px;
    transition: 0.2s;
    &.view {
      color: #3b82f6;
    }
    &.download {
      color: #10b981;
    }
    &.delete {
      color: #ef4444;
    }
    &:hover {
      transform: scale(1.2);
    }
  }
}

/* 分页器样式 */
.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
::v-deep .bio-dark-pagination {
  .el-pagination__total,
  .el-pagination__jump {
    color: #64748b;
  }
  .btn-prev,
  .btn-next,
  button:disabled {
    background-color: transparent !important;
    color: #64748b !important;
  }
  .el-pager li {
    background-color: transparent !important;
    color: #94a3b8;
    border: none;

    &.active {
      color: #3b82f6 !important;
      font-weight: bold;
    }
    &:hover:not(.active) {
      color: #60a5fa !important;
    }
  }
  .el-input__inner {
    background-color: #1e293b !important;
    border: 1px solid #334155 !important;
    color: #f8fafc !important;
  }
}

/* 预览弹窗样式复用 */
::v-deep .preview-dialog {
  border-radius: 12px;
  overflow: hidden;
  background: #0b0f19;
  border: 1px solid #1e293b;
  .el-dialog__header {
    background-color: #111827;
    border-bottom: 1px solid #1f2937;
    .el-dialog__title {
      color: #f8fafc;
    }
  }
  .el-dialog__body {
    padding: 0;
    background-color: #0b0f19;
  }
}
.preview-container {
  height: 60vh;
  overflow-y: auto;
  padding: 20px;
  .code-block {
    margin: 0;
    font-family: Consolas, monospace;
    font-size: 13px;
    color: #10b981;
    white-space: pre-wrap;
    word-break: break-all;
  }
}

/* 隐藏弹窗样式复用 */
::v-deep .glass-dialog-wrapper {
  background: transparent !important;
  box-shadow: none !important;
  .el-dialog__header {
    display: none;
  }
  .el-dialog__body {
    padding: 0 !important;
    position: relative;
  }
}
.glass-dialog-close {
  position: absolute;
  top: -40px;
  right: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #fff;
  cursor: pointer;
  z-index: 100;
  &:hover {
    background: rgba(239, 68, 68, 0.8);
  }
}
</style>

<style>
.dark-dropdown {
  background-color: #1e293b !important;
  border: 1px solid #334155 !important;
}
.dark-dropdown .el-select-dropdown__item {
  color: #94a3b8;
}
.dark-dropdown .el-select-dropdown__item.hover,
.dark-dropdown .el-select-dropdown__item:hover {
  background-color: #0f172a !important;
}
.dark-dropdown .el-select-dropdown__item.selected {
  color: #3b82f6 !important;
  font-weight: bold;
}
.dark-dropdown .popper__arrow::after {
  border-bottom-color: #1e293b !important;
  border-top-color: #1e293b !important;
}
</style>
