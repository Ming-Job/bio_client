<template>
  <div class="file-uploader">
    <!-- 上传区域 -->
    <div class="upload-area" @click="triggerFileInput" @dragover.prevent="onDragOver" @drop.prevent="onDrop">
      <input
        ref="fileInput"
        type="file"
        multiple
        :accept="allowedExtensions"
        @change="handleFileChange"
        style="display: none"
      />
      
      <div class="upload-content" :class="{ 'dragover': isDragover }">
        <i class="el-icon-upload upload-icon"></i>
        <h3 class="upload-title">点击或拖拽文件到此区域上传</h3>
        <p class="upload-tips">支持 {{ allowedExtensionsText }} 格式，单个文件最大 {{ maxFileSizeText }}</p>
        <p class="upload-tips small">建议按照项目分类上传，便于管理</p>
      </div>
    </div>

    <!-- 项目选择 -->
    <div class="upload-options">
      <div class="option-item">
        <span class="option-label">选择项目：</span>
        <el-select
          v-model="selectedProject"
          placeholder="请选择项目（可选）"
          style="width: 300px"
          filterable
          clearable
          @change="onProjectChange"
        >
          <el-option
            v-for="project in projectList"
            :key="project.id"
            :label="project.name"
            :value="project.id"
          >
            <div class="project-option">
              <span>{{ project.name }}</span>
              <span class="project-count">（{{ project.fileCount }}个文件）</span>
            </div>
          </el-option>
        </el-select>
        <el-button
          type="text"
          icon="el-icon-plus"
          @click="createNewProject"
          style="margin-left: 10px"
        >
          新建项目
        </el-button>
      </div>

      <div class="option-item">
        <span class="option-label">文件描述：</span>
        <el-input
          v-model="fileDescription"
          type="textarea"
          :rows="3"
          placeholder="请输入文件描述信息（可选）"
          style="width: 300px"
          maxlength="500"
          show-word-limit
        />
      </div>

      <div class="option-item">
        <span class="option-label">标签分类：</span>
        <el-select
          v-model="selectedTags"
          multiple
          placeholder="选择或输入标签（可选）"
          style="width: 300px"
          filterable
          allow-create
          default-first-option
        >
          <el-option
            v-for="tag in commonTags"
            :key="tag.value"
            :label="tag.label"
            :value="tag.value"
          />
        </el-select>
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
          {{ uploading ? `上传中 (${progress}%)` : '开始上传' }}
        </el-button>
      </div>

      <div class="file-items">
        <div
          v-for="(file, index) in fileList"
          :key="file.id"
          class="file-item"
          :class="{
            'uploading': file.status === 'uploading',
            'success': file.status === 'success',
            'error': file.status === 'error'
          }"
        >
          <!-- 文件信息 -->
          <div class="file-info">
            <div class="file-icon">
              <i :class="getFileIcon(file.type)"></i>
            </div>
            <div class="file-details">
              <div class="file-name">
                <span class="name-text">{{ file.name }}</span>
                <el-tag
                  v-if="file.type"
                  size="mini"
                  :type="getFileTypeTag(file.type)"
                >
                  {{ file.type.toUpperCase() }}
                </el-tag>
              </div>
              <div class="file-meta">
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
                <span class="file-status" :class="file.status">
                  {{ getStatusText(file.status) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 进度条 -->
          <div class="file-progress" v-if="file.status === 'uploading'">
            <el-progress
              :percentage="file.progress"
              :stroke-width="4"
              :show-text="false"
            />
          </div>

          <!-- 操作按钮 -->
          <div class="file-actions">
            <el-button
              v-if="file.status === 'pending'"
              type="text"
              icon="el-icon-delete"
              @click="removeFile(index)"
              class="remove-btn"
              title="移除"
            ></el-button>
            <el-button
              v-if="file.status === 'error'"
              type="text"
              icon="el-icon-refresh"
              @click="retryUpload(file, index)"
              class="retry-btn"
              title="重试"
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
      <div class="stats-item">
        <span class="stats-label">总进度：</span>
        <el-progress
          :percentage="progress"
          :stroke-width="12"
          :status="uploadStatus"
          style="width: 200px; margin-left: 10px;"
        />
      </div>
    </div>

    <!-- 新建项目对话框 -->
    <el-dialog
      title="新建项目"
      :visible.sync="showProjectDialog"
      width="400px"
      @close="closeProjectDialog"
    >
      <div class="project-dialog">
        <el-form :model="newProject" label-width="80px">
          <el-form-item label="项目名称" required>
            <el-input
              v-model="newProject.name"
              placeholder="请输入项目名称"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="项目描述">
            <el-input
              v-model="newProject.description"
              type="textarea"
              placeholder="请输入项目描述（可选）"
              :rows="3"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-form>
        <div class="dialog-footer">
          <el-button @click="closeProjectDialog">取消</el-button>
          <el-button type="primary" @click="confirmNewProject">确定</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'FileUploader',
  
  props: {
    // 用户ID（从父组件传入）
    userId: {
      type: Number,
      required: true
    },
    // 最大文件大小（字节）
    maxFileSize: {
      type: Number,
      default: 10 * 1024 * 1024 * 1024 // 10GB
    },
    // 允许的文件扩展名
    allowedExtensions: {
      type: Array,
      default: () => ['.fastq', '.fastq.gz', '.fq', '.fq.gz', '.fasta', '.fa', '.fasta.gz', '.bam', '.sam', '.vcf', '.bed', '.gtf']
    }
  },

  data() {
    return {
      // 文件列表
      fileList: [],
      // 项目列表
      projectList: [
        { id: 1, name: '肝癌转录组分析', fileCount: 12 },
        { id: 2, name: '小麦基因组测序', fileCount: 8 },
        { id: 3, name: '作业：RNA-Seq分析', fileCount: 5 },
        { id: 4, name: '实验数据备份', fileCount: 3 }
      ],
      // 常用标签
      commonTags: [
        { label: 'RNA-Seq', value: 'RNA-Seq' },
        { label: 'WGS', value: 'WGS' },
        { label: 'scRNA-Seq', value: 'scRNA-Seq' },
        { label: 'ChIP-Seq', value: 'ChIP-Seq' },
        { label: '教学项目', value: 'teaching' },
        { label: '科研项目', value: 'research' },
        { label: '作业', value: 'homework' },
        { label: '实验数据', value: 'experiment' }
      ],
      // 选择状态
      selectedProject: null,
      selectedTags: [],
      fileDescription: '',
      // 上传状态
      uploading: false,
      isDragover: false,
      // 新建项目
      showProjectDialog: false,
      newProject: {
        name: '',
        description: ''
      }
    }
  },

  computed: {
    // 格式化允许的文件扩展名文本
    allowedExtensionsText() {
      const exts = this.allowedExtensions.map(ext => ext.replace('.', '').toUpperCase())
      return exts.join('、')
    },

    // 格式化最大文件大小
    maxFileSizeText() {
      return this.formatFileSize(this.maxFileSize)
    },

    // 上传进度
    progress() {
      if (this.fileList.length === 0) return 0
      
      const totalFiles = this.fileList.length
      const completedFiles = this.fileList.filter(file => 
        file.status === 'success' || file.status === 'error'
      ).length
      
      return Math.round((completedFiles / totalFiles) * 100)
    },

    // 上传状态（用于进度条颜色）
    uploadStatus() {
      if (this.errorCount > 0) return 'exception'
      if (this.successCount === this.fileList.length && this.fileList.length > 0) return 'success'
      return ''
    },

    // 统计信息
    totalSize() {
      return this.fileList.reduce((sum, file) => sum + file.size, 0)
    },

    successCount() {
      return this.fileList.filter(file => file.status === 'success').length
    },

    errorCount() {
      return this.fileList.filter(file => file.status === 'error').length
    }
  },

  methods: {
    // 触发文件选择
    triggerFileInput() {
      this.$refs.fileInput.click()
    },

    // 处理文件选择
    handleFileChange(event) {
      const files = Array.from(event.target.files)
      this.addFiles(files)
      // 清空input，以便可以选择相同的文件
      event.target.value = ''
    },

    // 拖拽相关方法
    onDragOver() {
      this.isDragover = true
    },

    onDrop(event) {
      this.isDragover = false
      const files = Array.from(event.dataTransfer.files)
      this.addFiles(files)
    },

    // 添加文件到列表
    addFiles(files) {
      files.forEach(file => {
        // 检查文件大小
        if (file.size > this.maxFileSize) {
          this.$message.error(`文件 ${file.name} 超过最大限制 ${this.maxFileSizeText}`)
          return
        }

        // 检查文件类型
        const fileExt = this.getFileExtension(file.name).toLowerCase()
        if (!this.allowedExtensions.includes(fileExt)) {
          this.$message.error(`不支持的文件类型 ${fileExt}，允许的类型：${this.allowedExtensionsText}`)
          return
        }

        // 检查是否已存在同名文件
        const exists = this.fileList.some(f => f.name === file.name && f.size === file.size)
        if (exists) {
          this.$message.warning(`文件 ${file.name} 已存在列表中`)
          return
        }

        // 添加到文件列表
        const fileType = this.determineFileType(fileExt)
        this.fileList.push({
          id: Date.now() + Math.random(),
          file: file,
          name: file.name,
          size: file.size,
          type: fileType,
          status: 'pending', // pending, uploading, success, error
          progress: 0,
          retryCount: 0
        })
      })

      this.$message.success(`成功添加 ${files.length} 个文件`)
    },

    // 开始上传
    async startUpload() {
      if (this.fileList.length === 0) {
        this.$message.warning('请先选择要上传的文件')
        return
      }

      this.uploading = true
      const pendingFiles = this.fileList.filter(file => file.status === 'pending')

      // 逐个上传文件
      for (let i = 0; i < pendingFiles.length; i++) {
        const fileItem = pendingFiles[i]
        await this.uploadSingleFile(fileItem)
      }

      this.uploading = false
      
      // 所有文件上传完成后通知父组件
      if (this.successCount > 0) {
        this.$emit('success', {
          success: this.successCount,
          total: this.fileList.length,
          files: this.fileList.filter(f => f.status === 'success')
        })
      }
    },

    // 上传单个文件
    async uploadSingleFile(fileItem) {
      const index = this.fileList.findIndex(f => f.id === fileItem.id)
      if (index === -1) return

      // 更新状态为上传中
      this.$set(this.fileList[index], 'status', 'uploading')
      
      try {
        // 构建 FormData
        const formData = new FormData()
        formData.append('file', fileItem.file)
        formData.append('userId', this.userId)
        
        if (this.selectedProject) {
          formData.append('projectId', this.selectedProject)
        }
        
        if (this.fileDescription) {
          formData.append('description', this.fileDescription)
        }
        
        if (this.selectedTags.length > 0) {
          formData.append('tags', JSON.stringify(this.selectedTags))
        }

        // 配置上传进度
        const config = {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            this.$set(this.fileList[index], 'progress', progress)
          }
        }

        // 发送上传请求
        const response = await axios.post('/api/files/upload', formData, config)
        
        // 上传成功
        this.$set(this.fileList[index], 'status', 'success')
        this.$set(this.fileList[index], 'progress', 100)
        this.$set(this.fileList[index], 'response', response.data)
        
        this.$message.success(`文件 ${fileItem.name} 上传成功`)
        
      } catch (error) {
        console.error('文件上传失败:', error)
        
        // 更新状态为失败
        this.$set(this.fileList[index], 'status', 'error')
        this.$set(this.fileList[index], 'error', error.message || '上传失败')
        
        this.$message.error(`文件 ${fileItem.name} 上传失败：${error.response?.data?.message || error.message}`)
      }
    },

    // 重试上传
    async retryUpload(fileItem) {
      const index = this.fileList.findIndex(f => f.id === fileItem.id)
      if (index === -1) return
      
      // 重置状态
      this.$set(this.fileList[index], 'status', 'pending')
      this.$set(this.fileList[index], 'progress', 0)
      this.$set(this.fileList[index], 'retryCount', fileItem.retryCount + 1)
      
      // 开始上传
      await this.uploadSingleFile(fileItem)
    },

    // 移除文件
    removeFile(index) {
      this.fileList.splice(index, 1)
    },

    // 清空所有文件
    clearAllFiles() {
      this.$confirm('确定要清空所有文件吗？', '提示', {
        type: 'warning'
      }).then(() => {
        this.fileList = []
        this.$message.success('已清空文件列表')
      })
    },

    // 选择更多文件
    selectMoreFiles() {
      this.triggerFileInput()
    },

    // 项目相关
    onProjectChange(value) {
      console.log('选择项目:', value)
    },

    createNewProject() {
      this.showProjectDialog = true
    },

    closeProjectDialog() {
      this.showProjectDialog = false
      this.newProject = { name: '', description: '' }
    },

    async confirmNewProject() {
      if (!this.newProject.name.trim()) {
        this.$message.warning('请输入项目名称')
        return
      }

      try {
        // 这里应该调用API创建项目
        // const response = await axios.post('/api/projects', this.newProject)
        
        // 模拟API调用
        const newProject = {
          id: this.projectList.length + 1,
          name: this.newProject.name,
          description: this.newProject.description,
          fileCount: 0
        }
        
        this.projectList.push(newProject)
        this.selectedProject = newProject.id
        
        this.$message.success('项目创建成功')
        this.closeProjectDialog()
      } catch (error) {
        this.$message.error('项目创建失败：' + error.message)
      }
    },

    // 工具方法
    getFileExtension(filename) {
      if (!filename) return ''
      const lastDot = filename.lastIndexOf('.')
      return lastDot === -1 ? '' : filename.substring(lastDot)
    },

    determineFileType(fileExt) {
      fileExt = fileExt.toLowerCase()
      if (fileExt.includes('fastq') || fileExt.includes('fq')) {
        return 'fastq'
      } else if (fileExt.includes('fasta') || fileExt.includes('fa')) {
        return 'fasta'
      } else if (fileExt.includes('bam')) {
        return 'bam'
      } else if (fileExt.includes('sam')) {
        return 'sam'
      } else if (fileExt.includes('vcf')) {
        return 'vcf'
      } else if (fileExt.includes('bed')) {
        return 'bed'
      } else if (fileExt.includes('gtf')) {
        return 'gtf'
      }
      return 'other'
    },

    getFileIcon(fileType) {
      const iconMap = {
        fastq: 'el-icon-document',
        fasta: 'el-icon-files',
        bam: 'el-icon-coin',
        sam: 'el-icon-coin',
        vcf: 'el-icon-s-flag',
        bed: 'el-icon-s-data',
        gtf: 'el-icon-s-data',
        other: 'el-icon-document'
      }
      return iconMap[fileType] || 'el-icon-document'
    },

    getFileTypeTag(fileType) {
      const tagMap = {
        fastq: 'primary',
        fasta: 'success',
        bam: 'warning',
        sam: 'warning',
        vcf: 'danger',
        bed: 'info',
        gtf: 'info'
      }
      return tagMap[fileType] || 'default'
    },

    getStatusText(status) {
      const textMap = {
        pending: '等待上传',
        uploading: '上传中',
        success: '上传成功',
        error: '上传失败'
      }
      return textMap[status] || status
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
  }
}
</script>

<style lang="scss" scoped>
.file-uploader {
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

      &.small {
        font-size: 12px;
      }
    }
  }
}

.upload-options {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;

  .option-item {
    display: flex;
    align-items: center;
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }

    .option-label {
      width: 100px;
      text-align: right;
      color: #606266;
      font-size: 14px;
      flex-shrink: 0;
    }

    .project-option {
      display: flex;
      justify-content: space-between;
      width: 100%;

      .project-count {
        color: #909399;
        font-size: 12px;
      }
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
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 6px;

            .name-text {
              font-weight: 500;
              color: #303133;
              flex: 1;
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

      .file-progress {
        width: 150px;
        margin: 0 20px;
      }

      .file-actions {
        .remove-btn {
          color: #f56c6c;
          &:hover {
            background-color: rgba(245, 108, 108, 0.1);
          }
        }

        .retry-btn {
          color: #409eff;
          &:hover {
            background-color: rgba(64, 158, 255, 0.1);
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

.project-dialog {
  .dialog-footer {
    text-align: right;
    margin-top: 20px;

    .el-button {
      margin-left: 10px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .upload-options {
    .option-item {
      flex-direction: column;
      align-items: flex-start;

      .option-label {
        width: 100%;
        text-align: left;
        margin-bottom: 8px;
      }
    }
  }

  .file-item {
    flex-direction: column;
    align-items: flex-start;

    .file-progress {
      width: 100% !important;
      margin: 12px 0 !important;
    }

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