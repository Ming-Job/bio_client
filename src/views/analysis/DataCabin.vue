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
          ><i class="el-icon-odometer"></i> 数据资源统计 (共
          {{ files.length }} 个文件)</span
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
              <el-radio-button label="all">全部来源</el-radio-button>
              <el-radio-button label="upload"
                ><i class="el-icon-upload2"></i> 手动上传</el-radio-button
              >
              <el-radio-button label="generate"
                ><i class="el-icon-cpu"></i> 分析产出</el-radio-button
              >
            </el-radio-group>
          </div>

          <div class="toolbar-right">
            <el-select
              v-model="activeType"
              size="small"
              placeholder="业务数据分类"
              class="dark-select"
              popper-class="dark-dropdown"
            >
              <el-option label="📁 全部资源" value="all"></el-option>
              <el-option
                label="🧬 原始测序 (FastQ/FQ)"
                value="sequence"
              ></el-option>
              <el-option
                label="📚 参考资源 (FASTA/GTF)"
                value="reference"
              ></el-option>
              <el-option
                label="🎯 比对/索引 (BAM/SAM)"
                value="alignment"
              ></el-option>
              <el-option
                label="📊 定量矩阵 (Counts/CSV)"
                value="expression"
              ></el-option>
              <el-option
                label="🧬 三维结构 (PDB/CIF)"
                value="structure"
              ></el-option>
              <el-option
                label="📋 报告产出 (PDF/HTML)"
                value="report"
              ></el-option>
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
              <el-tag
                size="mini"
                effect="plain"
                :type="getTagType(scope.row.type)"
              >
                {{ scope.row.type.toUpperCase() }}
              </el-tag>
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

          <el-table-column label="大小" width="120">
            <template slot-scope="scope">
              <span
                :class="{ 'text-danger': scope.row.size > 1024 * 1024 * 500 }"
              >
                {{ scope.row.formattedSize }}
              </span>
            </template>
          </el-table-column>

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
          ></el-pagination>
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

    // 🌟 核心业务逻辑：多维度生信文件过滤
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
        } else {
          const typeMap = {
            sequence: ["fastq", "fq", "gz"],
            reference: ["fa", "fasta", "gtf", "gff", "fna", "faa"],
            alignment: ["bam", "sam", "bai", "cram"],
            expression: ["counts", "matrix", "csv", "tsv", "txt"],
            structure: ["pdb", "cif"],
            report: ["pdf", "html", "png", "json"],
          };
          const targetExtensions = typeMap[this.activeType] || [];
          matchType = targetExtensions.some((ext) => fType === ext);
        }
        return matchSearch && matchType && matchSource;
      });
    },

    paginatedFiles() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredFilesAll.slice(start, start + this.pageSize);
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
          this.files = dataList.map((file) => ({
            id: file.id,
            name: file.originalName,
            type: file.fileType || this.extractExt(file.originalName),
            size: file.sizeBytes,
            formattedSize:
              file.formattedSize || this.formatFileSize(file.sizeBytes),
            uploadTime: file.uploadTime,
            source: (
              file.fileSource ||
              file.source ||
              (file.taskId ? "generate" : "upload")
            ).toLowerCase(),
            projectName: file.projectName || "未绑定课题",
          }));
        }
      } catch (error) {
        this.$message.error("无法连接到服务器");
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

    handleUploadComplete() {
      setTimeout(() => {
        this.showUploadDialog = false;
        this.fetchFiles();
      }, 1000);
    },

    handleDownload(file) {
      const downloadUrl = `/api/files/download/${file.id}?userId=${
        this.userId || 6
      }`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.click();
      this.$message.success(`开始下载: ${file.name}`);
    },

    async handlePreview(file) {
      if (["bam", "sam", "gz", "zip"].includes(file.type.toLowerCase())) {
        this.$message.warning("二进制文件不支持在线预览");
        return;
      }
      this.previewFileName = file.name;
      this.previewVisible = true;
      this.previewLoading = true;
      try {
        const res = await previewFile(file.id, this.userId || 6);
        this.previewContent =
          res && typeof res.data === "string" ? res.data : "内容无法解析";
      } catch (error) {
        this.previewContent = "预览失败，物理文件可能不存在";
      } finally {
        this.previewLoading = false;
      }
    },

    async handleDelete(file) {
      try {
        await this.$confirm(
          `确定要彻底删除文件 [${file.name}] 吗？`,
          "高危操作",
          {
            confirmButtonText: "确定删除",
            cancelButtonText: "取消",
            type: "warning",
            customClass: "bio-dark-message-box",
          },
        );
        await deleteFile(file.id, this.userId || 6);
        this.$message.success("已成功删除");
        this.fetchFiles();
      } catch (err) {
        if (err !== "cancel") this.$message.error("删除失败");
      }
    },

    extractExt(filename) {
      return filename ? filename.split(".").pop().toLowerCase() : "unknown";
    },

    // 🌟 细化图标逻辑
    getFileIcon(type) {
      const t = type.toLowerCase();
      if (["fastq", "fq", "gz"].includes(t)) return "el-icon-connection"; // 测序流
      if (["fa", "fasta", "gtf", "gff"].includes(t))
        return "el-icon-collection"; // 基建/图书
      if (["bam", "sam"].includes(t)) return "el-icon-aim"; // 比对目标
      if (["csv", "tsv", "counts", "matrix"].includes(t))
        return "el-icon-s-data"; // 数据表
      if (["vcf"].includes(t)) return "el-icon-warning-outline"; // 变异检测点
      if (["pdf", "html"].includes(t)) return "el-icon-document-checked"; // 报告
      return "el-icon-document";
    },

    // 🌟 细化标签颜色，基建文件用警告色提醒
    getTagType(type) {
      const t = type.toLowerCase();
      if (["fa", "fasta", "gtf", "gff"].includes(t)) return "warning"; // 橙色：重要基建
      if (["fastq", "fq"].includes(t)) return "primary"; // 蓝色：原始数据
      if (["bam", "sam"].includes(t)) return "info"; // 灰色：中间文件
      return "success"; // 绿色：产物
    },

    formatFileSize(bytes) {
      if (!bytes) return "0 B";
      const k = 1024,
        sizes = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    },

    formatTime(timeStr) {
      return timeStr ? timeStr.substring(0, 16).replace("T", " ") : "-";
    },
  },
};
</script>

<style lang="scss" scoped>
.data-cabin-container {
  min-height: calc(100vh - 60px);
  background-color: #0b0f19;
  padding: 30px;
  color: #e2e8f0;
}

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
    }
    .upload-btn {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      border: none;
    }
  }
}

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
}

.file-table-wrapper {
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
  .text-danger {
    color: #f87171;
    font-weight: bold;
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
      font-size: 13px;
    }
    .el-radio-button__orig-radio:checked + .el-radio-button__inner {
      background-color: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }
  }
  ::v-deep .dark-select .el-input__inner {
    background-color: #0f172a;
    border-color: #334155;
    color: #f8fafc;
    border-radius: 6px;
  }
}

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
    &.active {
      color: #3b82f6 !important;
      font-weight: bold;
    }
  }
  .el-input__inner {
    background-color: #1e293b !important;
    border: 1px solid #334155 !important;
    color: #f8fafc !important;
  }
}

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
</style>
