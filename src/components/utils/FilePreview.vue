<template>
  <el-dialog
    :title="title"
    :visible.sync="dialogVisible"
    width="dialogWidth"
    :before-close="handleClose"
    :append-to-body="true"
    :close-on-click-modal="false"
    class="file-preview-dialog"
    @close="handleClosed"
  >
    <div v-loading="loading" element-loading-text="正在加载文件内容...">
      <!-- 文本文件 -->
      <div v-if="isTextFile" class="text-preview">
        <pre>{{ fileContent }}</pre>
      </div>

      <!-- 图片文件 -->
      <div v-else-if="isImageFile" class="image-preview">
        <img :src="fileUrl" alt="图片预览" style="max-width: 100%" />
      </div>

      <!-- PDF 文件 -->
      <div v-else-if="isPdfFile" class="pdf-preview">
        <embed
          :src="fileUrl"
          type="application/pdf"
          width="100%"
          height="600px"
        />
      </div>

      <!-- 不支持预览的文件类型 -->
      <div v-else class="unsupported-preview">
        <i class="el-icon-warning"></i>
        <p>该文件类型暂不支持在线预览</p>
        <el-button type="primary" @click="handleDownload">下载文件</el-button>
      </div>
    </div>

    <!-- 底部按钮插槽，允许扩展 -->
    <span slot="footer" class="dialog-footer">
      <slot name="footer" :file="file" :close="close">
        <el-button @click="close">关闭</el-button>
        <el-button
          v-if="isTextFile || isImageFile || isPdfFile"
          type="primary"
          @click="handleDownload"
        >
          下载
        </el-button>
      </slot>
    </span>
  </el-dialog>
</template>

<script></script>

<style lang="scss" scoped></style>
