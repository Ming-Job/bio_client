<!-- views/admin/CourseManagement.vue -->
<template>
  <div class="course-management">
    <h2>课程管理</h2>

    <div class="toolbar">
      <el-input
        v-model="searchKey"
        placeholder="搜索课程名称"
        style="width: 300px; margin-right: 10px"
        clearable
      ></el-input>

      <el-button type="primary" icon="el-icon-search" @click="handleSearch"
        >搜索</el-button
      >
      <el-button type="success" icon="el-icon-plus" @click="handleAdd"
        >添加课程</el-button
      >
    </div>

    <el-table :data="courseList" style="width: 100%; margin-top: 20px" border>
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="title" label="课程名称"></el-table-column>
      <el-table-column
        prop="category"
        label="分类"
        width="120"
      ></el-table-column>
      <el-table-column prop="level" label="难度" width="100">
        <template slot-scope="scope">
          <el-tag :type="getLevelType(scope.row.level)">
            {{ scope.row.level }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="students"
        label="学生数"
        width="100"
      ></el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template slot-scope="scope">
          <el-switch
            v-model="scope.row.status"
            @change="handleStatusChange(scope.row)"
            active-text="上架"
            inactive-text="下架"
          ></el-switch>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="handleEdit(scope.row)"
            >编辑</el-button
          >
          <el-button type="text" size="small" @click="handleDelete(scope.row)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  name: "CourseManagement",
  data() {
    return {
      searchKey: "",
      courseList: [
        {
          id: 1,
          title: "生物信息学入门",
          category: "基础课程",
          level: "初级",
          students: 156,
          status: true,
        },
        {
          id: 2,
          title: "Python数据分析",
          category: "编程课程",
          level: "中级",
          students: 89,
          status: true,
        },
        {
          id: 3,
          title: "基因组学应用",
          category: "专业课程",
          level: "高级",
          students: 42,
          status: false,
        },
      ],
    };
  },
  methods: {
    getLevelType(level) {
      const map = {
        初级: "success",
        中级: "warning",
        高级: "danger",
      };
      return map[level] || "info";
    },
    handleSearch() {
      console.log("搜索关键词:", this.searchKey);
      // 这里可以调用搜索API
    },
    handleAdd() {
      this.$message.info("添加课程功能开发中");
    },
    handleEdit(row) {
      this.$message.info(`编辑课程: ${row.title}`);
    },
    handleDelete(row) {
      this.$confirm(`确定删除课程 "${row.title}" 吗？`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        this.$message.success("删除成功");
      });
    },
    handleStatusChange(row) {
      const statusText = row.status ? "上架" : "下架";
      this.$message.success(`课程 "${row.title}" 已${statusText}`);
    },
  },
};
</script>

<style scoped>
.course-management {
  padding: 20px;
}

.toolbar {
  margin: 20px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
</style>
