<template>
    <div class="new-analysis-form">
        <div class="form-container">
            <h2>新建分析</h2>
            
            <form @submit.prevent="submitForm">
                <div class="form-group">
                    <label for="name">分析名称</label>
                    <input
                        id="name"
                        v-model="form.name"
                        type="text"
                        placeholder="请输入分析名称"
                        required
                    />
                </div>

                <div class="form-group">
                    <label for="type">分析类型</label>
                    <select id="type" v-model="form.type" required>
                        <option value="">请选择分析类型</option>
                        <option value="sequence">序列分析</option>
                        <option value="structure">结构分析</option>
                        <option value="alignment">比对分析</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="description">描述</label>
                    <textarea
                        id="description"
                        v-model="form.description"
                        placeholder="请输入分析描述"
                        rows="4"
                    ></textarea>
                </div>

                <div class="form-group">
                    <label for="file">上传文件</label>
                    <input
                        id="file"
                        type="file"
                        accept=".fasta,.pdb,.txt"
                        @change="handleFileChange"
                    />
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">创建分析</button>
                    <button type="button" class="btn btn-secondary" @click="resetForm">
                        重置
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script>
export default {
    name: 'NewAnalysisForm',
    data() {
        return {
            form: {
                name: '',
                type: '',
                description: '',
                file: null,
            },
        };
    },
    methods: {
        handleFileChange(event) {
            this.form.file = event.target.files[0];
        },
        submitForm() {
            this.$emit('submit', this.form);
            this.$message.success('分析已创建');
            this.resetForm();
        },
        resetForm() {
            this.form = {
                name: '',
                type: '',
                description: '',
                file: null,
            };
        },
    },
};
</script>

<style scoped>
.new-analysis-form {
    padding: 20px;
}

.form-container {
    max-width: 600px;
    margin: 0 auto;
    background: #fff;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h2 {
    margin-bottom: 24px;
    font-size: 24px;
    font-weight: 600;
}

.form-group {
    margin-bottom: 16px;
}

label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
}

input,
select,
textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    font-size: 14px;
}

input:focus,
select:focus,
textarea:focus {
    outline: none;
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.form-actions {
    display: flex;
    gap: 10px;
    margin-top: 24px;
}

.btn {
    padding: 10px 24px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s;
}

.btn-primary {
    background: #1890ff;
    color: white;
}

.btn-primary:hover {
    background: #40a9ff;
}

.btn-secondary {
    background: #f0f0f0;
    color: #000;
}

.btn-secondary:hover {
    background: #e6e6e6;
}
</style>