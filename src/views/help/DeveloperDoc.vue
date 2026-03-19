<template>
  <div class="developer-doc-container">
    <div class="doc-header">
      <div class="header-left">
        <i class="el-icon-document"></i>
        <span>Bio-OS 开发者文档中心</span>
        <el-tag size="small" type="success" effect="dark" class="version-tag">v2.0 API</el-tag>
      </div>
      <div class="header-right">
        <el-input
          v-model="searchDoc"
          placeholder="搜索 API 或开发指南..."
          prefix-icon="el-icon-search"
          size="small"
          class="doc-search"
        />
      </div>
    </div>

    <div class="doc-layout">
      <aside class="doc-sidebar custom-scroll">
        <el-menu
          :default-active="activeDoc"
          class="doc-menu"
          @select="handleMenuSelect"
          :unique-opened="true"
        >
          <el-menu-item-group title="入门指南">
            <el-menu-item index="intro">平台架构与概念</el-menu-item>
            <el-menu-item index="auth">API 鉴权 (Token)</el-menu-item>
          </el-menu-item-group>

          <el-submenu index="api">
            <template slot="title"><i class="el-icon-connection"></i>核心 API 参考</template>
            <el-menu-item index="api-project">工作空间管理 API</el-menu-item>
            <el-menu-item index="api-file">云端文件挂载 API</el-menu-item>
            <el-menu-item index="api-task">算力任务调度 API</el-menu-item>
          </el-submenu>

          <el-submenu index="sandbox">
            <template slot="title"><i class="el-icon-cpu"></i>沙箱引擎开发</template>
            <el-menu-item index="sandbox-env">Python/R 环境白名单</el-menu-item>
            <el-menu-item index="sandbox-io">文件 I/O 规范</el-menu-item>
            <el-menu-item index="sandbox-limit">算力配额与限制</el-menu-item>
          </el-submenu>

          <el-menu-item-group title="开发者资源">
            <el-menu-item index="sdk"><i class="el-icon-download"></i>Python SDK 下载</el-menu-item>
            <el-menu-item index="errors"><i class="el-icon-warning-outline"></i>全局错误码字典</el-menu-item>
          </el-menu-item-group>
        </el-menu>
      </aside>

      <main class="doc-content custom-scroll" ref="docMain">
        <div class="markdown-body">
          <h1>算力任务调度 API (Task Dispatch)</h1>
          <p class="doc-desc">
            通过本接口，开发者可以绕过前端可视化界面，直接通过 HTTP 协议向底层的 Docker 算力集群提交 Python/R 生信分析任务。
          </p>

          <h2>接口描述</h2>
          <div class="api-meta">
            <span class="method post">POST</span>
            <span class="url">/api/v1/tasks/execute</span>
          </div>

          <h2>请求头部 (Headers)</h2>
          <el-table :data="headerData" border size="small" style="width: 100%; margin-bottom: 20px;">
            <el-table-column prop="param" label="参数名" width="150"></el-table-column>
            <el-table-column prop="required" label="必填" width="80">
              <template slot-scope="scope">
                <el-tag :type="scope.row.required ? 'danger' : 'info'" size="mini">
                  {{ scope.row.required ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="类型" width="100"></el-table-column>
            <el-table-column prop="desc" label="说明"></el-table-column>
          </el-table>

          <h2>请求体示例 (JSON)</h2>
          <div class="code-block-wrapper">
            <div class="code-header">
              <span>application/json</span>
              <el-button size="mini" type="text" icon="el-icon-document-copy" @click="copyCode">复制代码</el-button>
            </div>
            <pre><code class="language-json">{
  "projectId": 10086,
  "language": "python",
  "datasetFileName": "Lung_Cancer_Expression.csv",
  "code": "import pandas as pd\ndf = pd.read_csv('/tmp/sandbox/Lung_Cancer_Expression.csv')\nprint(df.head())"
}</code></pre>
          </div>

          <h2>请求参数说明</h2>
          <el-table :data="bodyData" border size="small" style="width: 100%; margin-bottom: 20px;">
            <el-table-column prop="param" label="参数" width="150"></el-table-column>
            <el-table-column prop="type" label="类型" width="100"></el-table-column>
            <el-table-column prop="desc" label="描述"></el-table-column>
          </el-table>

          <h2>返回结果示例</h2>
          <div class="code-block-wrapper">
            <pre><code class="language-json">{
  "success": true,
  "taskId": "python_1773826449818_fb17645e",
  "status": "pending",
  "message": "代码执行任务已放入算力队列"
}</code></pre>
          </div>
        </div>
      </main>

      <aside class="doc-toc">
        <div class="toc-title">本文导读</div>
        <ul class="toc-list">
          <li class="active"><a href="#1">接口描述</a></li>
          <li><a href="#2">请求头部 (Headers)</a></li>
          <li><a href="#3">请求体示例</a></li>
          <li><a href="#4">请求参数说明</a></li>
          <li><a href="#5">返回结果示例</a></li>
        </ul>
      </aside>
    </div>
  </div>
</template>

<script>
export default {
  name: "DeveloperDoc",
  data() {
    return {
      searchDoc: "",
      activeDoc: "api-task",
      // 模拟表格数据
      headerData: [
        { param: "Authorization", required: true, type: "String", desc: "Bearer Token，调用登录接口获取" },
        { param: "Content-Type", required: true, type: "String", desc: "固定为 application/json" }
      ],
      bodyData: [
        { param: "projectId", type: "Long", desc: "归属的科研空间ID" },
        { param: "language", type: "String", desc: "算力引擎枚举：python 或 r" },
        { param: "datasetFileName", type: "String", desc: "需要系统静默挂载的依赖文件名" },
        { param: "code", type: "String", desc: "需要执行的原生 Python/R 脚本代码" }
      ]
    };
  },
  methods: {
    handleMenuSelect(index) {
      this.activeDoc = index;
      // 真实开发中，这里应该根据 index 去请求后端获取 Markdown 文本，
      // 或者动态切换组件。这里仅作交互演示。
      this.$message.info(`正在加载 [${index}] 的文档内容...`);
      // 切换后回到顶部
      this.$refs.docMain.scrollTop = 0;
    },
    copyCode() {
      this.$message.success("代码已复制到剪贴板！");
    }
  }
};
</script>

<style lang="scss" scoped>
/* 整体容器，填充 header 下方的高度 */
.developer-doc-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px); /* 减去 Header 高度 */
  background-color: #ffffff;
}

/* 顶部极简栏 */
.doc-header {
  height: 50px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  background-color: #f9fafb;

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    color: #374151;
    font-size: 15px;

    i { color: #3b82f6; font-size: 18px; }
    .version-tag { border-radius: 12px; }
  }

  .doc-search { width: 260px; }
}

/* 核心三栏布局 */
.doc-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 左侧导航树 */
.doc-sidebar {
  width: 280px;
  border-right: 1px solid #e5e7eb;
  background: #ffffff;
  overflow-y: auto;
  
  ::v-deep .el-menu {
    border-right: none;
    .el-menu-item-group__title {
      font-size: 13px;
      font-weight: 600;
      color: #9ca3af;
      margin-top: 10px;
    }
    .el-submenu__title, .el-menu-item {
      font-size: 14px;
      height: 44px;
      line-height: 44px;
    }
    .el-menu-item.is-active {
      background-color: #eef2ff;
      color: #3b82f6;
      border-right: 3px solid #3b82f6;
      font-weight: 600;
    }
  }
}

/* 中间内容区 */
.doc-content {
  flex: 1;
  padding: 40px 60px;
  overflow-y: auto;
  scroll-behavior: smooth;
}

/* 右侧 TOC 大纲导航 */
.doc-toc {
  width: 240px;
  padding: 40px 20px;
  border-left: 1px solid #e5e7eb;
  background: #fafafa;
  
  .toc-title {
    font-size: 13px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 16px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  .toc-list {
    list-style: none;
    padding: 0;
    margin: 0;
    
    li {
      margin-bottom: 12px;
      a {
        text-decoration: none;
        color: #6b7280;
        font-size: 13px;
        transition: color 0.2s;
        &:hover { color: #3b82f6; }
      }
      &.active a {
        color: #3b82f6;
        font-weight: 600;
      }
    }
  }
}

/* 🌟 Markdown 内容深度排版 */
.markdown-body {
  max-width: 800px;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

  h1 { font-size: 32px; font-weight: 700; color: #111827; margin-bottom: 16px; }
  h2 { font-size: 20px; font-weight: 600; color: #1f2937; margin-top: 40px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
  
  .doc-desc { font-size: 15px; color: #4b5563; line-height: 1.7; background: #f3f4f6; padding: 16px; border-left: 4px solid #3b82f6; border-radius: 4px; }

  /* API 徽标 */
  .api-meta {
    display: flex;
    align-items: center;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 12px 16px;
    margin-bottom: 20px;
    font-family: Consolas, monospace;
    
    .method {
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: bold;
      color: #fff;
      margin-right: 12px;
      &.post { background-color: #10b981; }
      &.get { background-color: #3b82f6; }
      &.delete { background-color: #ef4444; }
    }
    .url { font-size: 15px; color: #0f172a; font-weight: 600; }
  }

  /* 代码块封装 */
  .code-block-wrapper {
    background: #1e1e1e;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 24px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);

    .code-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #2d2d2d;
      padding: 6px 16px;
      color: #9ca3af;
      font-size: 12px;
      font-family: Consolas, monospace;
    }

    pre {
      margin: 0;
      padding: 16px;
      overflow-x: auto;
      
      code {
        font-family: Consolas, Monaco, "Courier New", monospace;
        font-size: 14px;
        color: #d4d4d4;
        line-height: 1.6;
      }
    }
  }

  ::v-deep .el-table {
    th { background-color: #f9fafb !important; color: #4b5563; }
  }
}

/* 自定义滚动条 */
.custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
.custom-scroll::-webkit-scrollbar-track { background: transparent; }
</style>