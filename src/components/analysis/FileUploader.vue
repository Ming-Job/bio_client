<template>
    <div class="file-uploader">
        <div class="upload-area" @drop="handleDrop" @dragover.prevent @dragleave="isDragging = false">
            <input
                type="file"
                ref="fileInput"
                @change="handleFileSelect"
                multiple
                class="file-input"
            />
            <div class="upload-content">
                <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <p class="upload-text">拖拽文件到此或点击选择</p>
                <button @click="$refs.fileInput.click()" class="upload-btn">选择文件</button>
            </div>
        </div>

        <div v-if="files.length > 0" class="file-list">
            <div v-for="(file, index) in files" :key="index" class="file-item">
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
                <button @click="removeFile(index)" class="remove-btn">删除</button>
            </div>
        </div>

        <button v-if="files.length > 0" @click="uploadFiles" class="submit-btn">上传</button>
    </div>
</template>

<script>
export default {
    name: 'FileUploader',
    data() {
        return {
            files: [],
            isDragging: false,
        };
    },
    methods: {
        handleFileSelect(event) {
            this.files = Array.from(event.target.files);
        },
        handleDrop(event) {
            event.preventDefault();
            this.files = Array.from(event.dataTransfer.files);
            this.isDragging = false;
        },
        removeFile(index) {
            this.files.splice(index, 1);
        },
        formatFileSize(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
        },
        uploadFiles() {
            const formData = new FormData();
            this.files.forEach(file => {
                formData.append('files', file);
            });
            // TODO: 调用上传接口
            console.log('Uploading files:', this.files);
        },
    },
};
</script>

<style scoped>
.file-uploader {
    padding: 20px;
}

.upload-area {
    border: 2px dashed #ccc;
    border-radius: 8px;
    padding: 40px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
}

.upload-area:hover {
    border-color: #409eff;
    background-color: #f5f7fa;
}

.file-input {
    display: none;
}

.upload-icon {
    width: 48px;
    height: 48px;
    margin-bottom: 16px;
    color: #409eff;
}

.upload-text {
    font-size: 14px;
    color: #606266;
    margin: 0;
}

.upload-btn {
    margin-top: 12px;
    padding: 8px 16px;
    background: #409eff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.file-list {
    margin-top: 20px;
}

.file-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    margin-bottom: 8px;
}

.file-name {
    flex: 1;
    word-break: break-all;
}

.file-size {
    color: #909399;
    margin: 0 12px;
}

.remove-btn {
    padding: 4px 8px;
    background: #f56c6c;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.submit-btn {
    margin-top: 16px;
    padding: 10px 20px;
    background: #67c23a;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
</style>