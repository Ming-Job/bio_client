<template>
  <div class="case-management">
    <div class="page-header-simple">
      <h2>Bio-OS 案例矩阵管理</h2>
      <el-button type="primary" icon="el-icon-plus" @click="handleAdd">部署新案例</el-button>
    </div>

    <div class="toolbar">
      <el-input
        v-model="queryParams.searchKey"
        placeholder="搜索案例标题"
        style="width: 260px; margin-right: 15px"
        clearable
        @keyup.enter.native="handleSearch"
      ></el-input>
      
      <el-select v-model="queryParams.category" placeholder="算子类别" clearable @change="handleSearch">
        <el-option label="智能分析流 (Pipeline)" value="pipeline"></el-option>
        <el-option label="三维洞察 (Structure)" value="structure"></el-option>
        <el-option label="分析模板 (Template)" value="template"></el-option>
        <el-option label="极客副驾 (Copilot)" value="copilot"></el-option>
      </el-select>
    </div>

    <el-table v-loading="loading" :data="caseList" border stripe style="width: 100%; margin-top: 20px">
      <el-table-column label="序号" type="index" width="60" align="center" :index="indexMethod"></el-table-column>
      
      <el-table-column prop="title" label="案例名称" min-width="200" show-overflow-tooltip></el-table-column>
      
      <el-table-column prop="category" label="算子类别" width="150" align="center">
        <template slot-scope="scope">
          <el-tag :type="getCategoryType(scope.row.category)" size="small" effect="dark">
            {{ getCategoryName(scope.row.category) }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column prop="difficulty" label="难度" width="100" align="center">
        <template slot-scope="scope">
          <span :class="`diff-${scope.row.difficulty}`">{{ scope.row.difficulty.toUpperCase() }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="dataset" label="关联数据舱" width="180" show-overflow-tooltip></el-table-column>
      
      <el-table-column label="操作" width="180" fixed="right" align="center">
        <template slot-scope="scope">
          <el-button type="text" icon="el-icon-edit" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button type="text" icon="el-icon-delete" class="text-danger" @click="handleDelete(scope.row)">销毁</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      class="pagination"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="queryParams.pageNum"
      :page-sizes="[10, 20, 50]"
      :page-size="queryParams.pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
    ></el-pagination>

    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="850px" top="5vh">
      <el-form ref="caseForm" :model="form" :rules="rules" label-width="120px" size="small">
        <el-row :gutter="20">
          <el-col :span="14">
            <el-form-item label="案例标题" prop="title">
              <el-input v-model="form.title" placeholder="例如：16S 扩增子多样性分析管线"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="算子类别" prop="category">
              <el-select v-model="form.category" style="width: 100%">
                <el-option label="智能分析流 (Pipeline)" value="pipeline"></el-option>
                <el-option label="三维洞察 (Structure)" value="structure"></el-option>
                <el-option label="分析模板 (Template)" value="template"></el-option>
                <el-option label="极客副驾 (Copilot)" value="copilot"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="案例难度">
              <el-radio-group v-model="form.difficulty">
                <el-radio label="easy">EASY</el-radio>
                <el-radio label="medium">MEDIUM</el-radio>
                <el-radio label="hard">HARD</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="封面图片路径">
              <el-input v-model="form.imageUrl" placeholder="/img/case/example.jpg"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="案例简介" prop="description">
          <el-input type="textarea" v-model="form.description" :rows="2"></el-input>
        </el-form-item>

        <el-divider content-position="left">算力引擎核心参数</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="挂载数据集">
              <el-input v-model="form.dataset" placeholder="填入云端存储中的文件名"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标签(逗号分隔)">
              <el-input v-model="form.tags" placeholder="生信,分析,Docker"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="预设 Prompt" v-if="form.category === 'copilot'">
          <el-input type="textarea" v-model="form.prompt" :rows="3" placeholder="副驾模式下自动填入的系统指令"></el-input>
        </el-form-item>

        <el-form-item label="解析文档 (MD)">
          <el-input type="textarea" v-model="form.content" :rows="8" placeholder="案例详情页展示的分析协议（支持 Markdown）"></el-input>
        </el-form-item>
      </el-form>
      
      <span slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">确认部署</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getAdminCasePage, addCase, updateCase, deleteCase } from "@/api/case";

export default {
  name: "CaseManagement",
  data() {
    return {
      loading: false,
      submitLoading: false,
      caseList: [],
      total: 0,
      queryParams: { pageNum: 1, pageSize: 10, searchKey: "", category: "" },
      dialogVisible: false,
      dialogTitle: "部署新案例",
      form: {
        id: null, title: "", description: "", category: "pipeline",
        difficulty: "medium", imageUrl: "", dataset: "", prompt: "",
        tags: "", content: ""
      },
      rules: {
        title: [{ required: true, message: "请输入标题", trigger: "blur" }],
        category: [{ required: true, message: "请选择类别", trigger: "change" }],
        description: [{ required: true, message: "请输入简介", trigger: "blur" }]
      }
    };
  },
  created() { this.fetchData(); },
  methods: {
    indexMethod(index) {
      return (this.queryParams.pageNum - 1) * this.queryParams.pageSize + index + 1;
    },
    async fetchData() {
      this.loading = true;
      try {
        const res = await getAdminCasePage(this.queryParams);
        const responseData = res.success !== undefined ? res : res.data;
        if (responseData && responseData.success) {
          this.caseList = responseData.data.records;
          this.total = responseData.data.total;
        }
      } catch (e) { this.$message.error("获取案例矩阵数据失败"); }
      this.loading = false;
    },
    handleSearch() { this.queryParams.pageNum = 1; this.fetchData(); },
    handleSizeChange(val) { this.queryParams.pageSize = val; this.fetchData(); },
    handleCurrentChange(val) { this.queryParams.pageNum = val; this.fetchData(); },
    
    getCategoryName(cat) {
      const map = { pipeline: "智能分析流", structure: "三维洞察", template: "分析模板", copilot: "极客副驾" };
      return map[cat] || cat;
    },
    getCategoryType(cat) {
      const map = { pipeline: "info", structure: "primary", template: "warning", copilot: "success" };
      return map[cat] || "";
    },
    
    handleAdd() {
      this.form = { id: null, title: "", description: "", category: "pipeline", difficulty: "medium", imageUrl: "", dataset: "", prompt: "", tags: "", content: "" };
      this.dialogTitle = "部署新案例算子";
      this.dialogVisible = true;
    },
    handleEdit(row) {
      this.form = { ...row };
      this.dialogTitle = "调整案例引擎参数";
      this.dialogVisible = true;
    },
    async submitForm() {
      this.$refs.caseForm.validate(async (valid) => {
        if (!valid) return;
        this.submitLoading = true;
        try {
          if (this.form.id) {
            await updateCase(this.form.id, this.form);
            this.$message.success("案例参数更新成功");
          } else {
            await addCase(this.form);
            this.$message.success("新案例已成功部署至算子矩阵");
          }
          this.dialogVisible = false;
          this.fetchData();
        } catch (e) { this.$message.error("保存失败"); }
        this.submitLoading = false;
      });
    },
    handleDelete(row) {
      this.$confirm(`警告：确定要从矩阵中移除案例 [${row.title}] 吗？`, "危险操作", {
        type: "warning",
        confirmButtonText: "确认移除",
        cancelButtonText: "保留"
      }).then(async () => {
        await deleteCase(row.id);
        this.$message.success("案例已销毁");
        this.fetchData();
      }).catch(() => {});
    }
  }
};
</script>

<style scoped>
.case-management { padding: 24px; background: #fff; }
.page-header-simple { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.toolbar { margin-bottom: 20px; }
.pagination { margin-top: 20px; text-align: right; }
.text-danger { color: #f56c6c; }
.diff-easy { color: #67c23a; font-weight: bold; }
.diff-medium { color: #e6a23c; font-weight: bold; }
.diff-hard { color: #f56c6c; font-weight: bold; }
</style>