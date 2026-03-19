<template>
<div class="course-management">
    <h2>课程资源管理</h2>

    <div class="toolbar">
      <el-input
        v-model="queryParams.searchKey"
        placeholder="搜索课程名称"
        style="width: 300px; margin-right: 10px"
        clearable
        @keyup.enter.native="handleSearch"
        @clear="handleSearch"
      ></el-input>

      <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
      <el-button type="success" icon="el-icon-plus" @click="handleAdd">添加新课程</el-button>
    </div>

    <el-table v-loading="loading" :data="courseList" style="width: 100%; margin-top: 20px" border stripe>
      <el-table-column
        label="序号"
        type="index"
        width="60"
        align="center"
        :index="indexMethod"
      ></el-table-column>

      <el-table-column prop="title" label="课程名称" show-overflow-tooltip></el-table-column>
      
      <el-table-column prop="difficulty" label="难度级别" width="120" align="center">
        <template slot-scope="scope">
          <el-tag :type="getDifficultyType(scope.row.difficulty)" size="small">
            {{ formatDifficulty(scope.row.difficulty) }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column prop="status" label="上架状态" width="120" align="center">
        <template slot-scope="scope">
          <el-switch
            v-model="scope.row.status"
            active-value="PUBLISHED"
            inactive-value="OFFLINE"
            active-color="#13ce66"
            inactive-color="#ff4949"
            @change="handleStatusChange(scope.row)"
          ></el-switch>
        </template>
      </el-table-column>
      
      <el-table-column prop="createdAt" label="创建时间" width="180" align="center"></el-table-column>

      <el-table-column label="操作" width="180" fixed="right" align="center">
        <template slot-scope="scope">
          <el-button type="primary" size="mini" icon="el-icon-edit" plain @click="handleEdit(scope.row)">编辑</el-button>
          <el-button type="danger" size="mini" icon="el-icon-delete" plain @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container" style="margin-top: 20px; text-align: right;">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="queryParams.pageNum"
        :page-sizes="[6, 12, 24, 50]" :page-size="queryParams.pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total">
      </el-pagination>
    </div>

    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="600px" @close="resetForm">
      <el-form ref="courseForm" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="课程标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入课程标题"></el-input>
        </el-form-item>
        
        <el-form-item label="讲师ID" prop="instructorId">
          <el-input v-model.number="form.instructorId" placeholder="请输入讲师关联的UserID"></el-input>
        </el-form-item>

        <el-form-item label="难度级别" prop="difficulty">
          <el-select v-model="form.difficulty" placeholder="请选择难度" style="width: 100%">
            <el-option label="初级 (Beginner)" value="BEGINNER"></el-option>
            <el-option label="中级 (Intermediate)" value="INTERMEDIATE"></el-option>
            <el-option label="高级 (Advanced)" value="ADVANCED"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="封面图URL" prop="coverImage">
          <el-input v-model="form.coverImage" placeholder="请输入封面图片地址 (可选)"></el-input>
        </el-form-item>

        <el-form-item label="课程描述" prop="description">
          <el-input type="textarea" :rows="4" v-model="form.description" placeholder="请输入课程详细介绍"></el-input>
        </el-form-item>

        <el-form-item label="排序权重" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" :max="999" label="权重越小越靠前"></el-input-number>
        </el-form-item>
      </el-form>
      
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getAdminCourseList, addCourse, updateCourse, deleteCourse, updateCourseStatus } from "@/api/course";

export default {
  name: "CourseManagement",
  data() {
    return {
      loading: false,
      courseList: [],
      total: 0,
      queryParams: {
        pageNum: 1,
        pageSize: 6,
        searchKey: ""
      },
      
      // 弹窗相关
      dialogVisible: false,
      dialogTitle: "添加课程",
      submitLoading: false,
      form: {
        id: null,
        title: "",
        description: "",
        coverImage: "",
        instructorId: null,
        difficulty: "BEGINNER",
        sortOrder: 0
      },
      rules: {
        title: [{ required: true, message: "请输入课程标题", trigger: "blur" }],
        instructorId: [{ required: true, message: "请输入讲师ID", trigger: "blur" }],
        difficulty: [{ required: true, message: "请选择难度", trigger: "change" }]
      }
    };
  },
  created() {
    this.fetchData();
  },
  methods: {
    // 🌟 计算分页后的连续序号
    indexMethod(index) {
      return (this.queryParams.pageNum - 1) * this.queryParams.pageSize + index + 1;
    },
    // 拉取真实数据
    async fetchData() {
      this.loading = true;
      try {
        const res = await getAdminCourseList(this.queryParams);
        
        // 🛠️ 调试神器：把它打印出来看看究竟长什么样
        console.log("后端返回的课程列表数据:", res);

        // 高容错解析逻辑 (兼容不同的 Axios 拦截器写法)
        const responseData = res.data && res.data.records !== undefined ? res.data : res;

        if (responseData && responseData.success !== false) {
          // 如果数据在 data 里面 (例如 responseData.data.records)
          if (responseData.data && responseData.data.records) {
            this.courseList = responseData.data.records;
            this.total = responseData.data.total;
          } 
          // 如果数据直接在顶层 (例如 responseData.records)
          else if (responseData.records) {
            this.courseList = responseData.records;
            this.total = responseData.total;
          }
        } else {
          this.$message.error(responseData.message || "获取列表失败");
        }
      } catch (error) {
        console.error("获取课程列表失败", error);
        this.$message.error("数据加载失败");
      } finally {
        this.loading = false;
      }
    },

    // 搜索与分页
    handleSearch() {
      this.queryParams.pageNum = 1;
      this.fetchData();
    },
    handleSizeChange(val) {
      this.queryParams.pageSize = val;
      this.fetchData();
    },
    handleCurrentChange(val) {
      this.queryParams.pageNum = val;
      this.fetchData();
    },

    // 格式化难度显示
    formatDifficulty(val) {
      const map = { "BEGINNER": "初级", "INTERMEDIATE": "中级", "ADVANCED": "高级" };
      return map[val] || val;
    },
    getDifficultyType(val) {
      const map = { "BEGINNER": "success", "INTERMEDIATE": "warning", "ADVANCED": "danger" };
      return map[val] || "info";
    },

    // 上下架状态切换
    async handleStatusChange(row) {
      try {
        await updateCourseStatus(row.id, row.status);
        this.$message.success(`课程已${row.status === 'PUBLISHED' ? '上架' : '下架'}`);
      } catch (error) {
        // 失败时把开关状态拨回去
        row.status = row.status === 'PUBLISHED' ? 'OFFLINE' : 'PUBLISHED';
        this.$message.error("状态切换失败");
      }
    },

    // 弹窗表单处理
    handleAdd() {
      this.resetForm();
      this.dialogTitle = "添加新课程";
      this.dialogVisible = true;
    },
    handleEdit(row) {
      this.dialogTitle = "编辑课程";
      // 深拷贝一份数据给表单，避免直接修改表格数据
      this.form = JSON.parse(JSON.stringify(row));
      this.dialogVisible = true;
    },
    resetForm() {
      this.form = { id: null, title: "", description: "", coverImage: "", instructorId: null, difficulty: "BEGINNER", sortOrder: 0 };
      if (this.$refs.courseForm) {
        this.$refs.courseForm.clearValidate();
      }
    },

    // 提交表单
    submitForm() {
      this.$refs.courseForm.validate(async (valid) => {
        if (!valid) return;
        
        this.submitLoading = true;
        try {
          if (this.form.id) {
            await updateCourse(this.form.id, this.form);
            this.$message.success("更新成功");
          } else {
            await addCourse(this.form);
            this.$message.success("添加成功");
          }
          this.dialogVisible = false;
          this.fetchData(); // 刷新列表
        } catch (error) {
          this.$message.error("操作失败，请检查网络或日志");
        } finally {
          this.submitLoading = false;
        }
      });
    },

    // 删除
    handleDelete(row) {
      this.$confirm(`确定要彻底删除课程 "${row.title}" 吗？此操作不可逆！`, "危险警告", {
        confirmButtonText: "确认删除",
        cancelButtonText: "取消",
        type: "error",
      }).then(async () => {
        try {
          await deleteCourse(row.id);
          this.$message.success("删除成功");
          this.fetchData();
        } catch (error) {
          this.$message.error("删除失败");
        }
      }).catch(() => {});
    }
  }
};
</script>

<style scoped>
.course-management {
  padding: 24px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.toolbar {
  margin: 20px 0;
  display: flex;
  align-items: center;
}
</style>