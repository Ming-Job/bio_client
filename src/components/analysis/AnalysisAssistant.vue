<template>
    <div class="assistant">
    <el-input
        v-model="userInput"
        placeholder="例如：请用R语言对组A和组B进行差异表达分析，并绘制火山图"
        @keyup.enter="askAssistant"
    ></el-input>
    <el-button type="primary" @click="askAssistant" :loading="loading">分析</el-button>

    <el-card v-if="code" class="code-card">
        <div slot="header">生成的代码</div>
        <pre>{{ code }}</pre>
        <el-button type="success" @click="executeCode">执行代码</el-button>
    </el-card>
    </div>
</template>

<script>
export default {
    name: "AnalysisAssistant",
    data() {
        return {
        userInput: "",
        code: "",
        loading: false,
        };
    },
    methods: {
        async askAssistant() {
        this.loading = true;
        try {
            const response = await fetch("http://localhost:3000/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: this.userInput }),
            });
            const data = await response.json();
            this.code = data.code;
        } catch (error) {
            this.$message.error("请求失败");
        } finally {
            this.loading = false;
        }
        },
        executeCode() {
        // 这里需要连接到一个安全的代码执行环境（见下文警告）
        this.$message.warning("执行代码需要安全的后端沙箱环境！");
        },
    },
};
</script>
