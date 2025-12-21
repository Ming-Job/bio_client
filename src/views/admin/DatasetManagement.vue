<!-- views/admin/DatasetManagement.vue -->
<template>
  <div class="dataset-management">
    <h2>数据集管理</h2>

    <div class="toolbar">
      <el-button type="primary" icon="el-icon-upload" @click="handleUpload"
        >上传数据集</el-button
      >
      <el-button type="success" icon="el-icon-plus" @click="handleCreate"
        >创建数据集</el-button
      >
    </div>

    <el-table :data="datasetList" style="width: 100%; margin-top: 20px" border>
      <el-table-column prop="name" label="数据集名称"></el-table-column>
      <el-table-column prop="type" label="类型" width="120"></el-table-column>
      <el-table-column prop="size" label="大小" width="100"></el-table-column>
      <el-table-column
        prop="downloads"
        label="下载次数"
        width="100"
      ></el-table-column>
      <el-table-column
        prop="createTime"
        label="创建时间"
        width="180"
      ></el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="handlePreview(scope.row)"
            >预览</el-button
          >
          <el-button type="text" size="small" @click="handleEdit(scope.row)"
            >编辑</el-button
          >
          <el-button type="text" size="small" @click="handleDownload(scope.row)"
            >下载</el-button
          >
          <el-button
            type="text"
            size="small"
            @click="handleDelete(scope.row)"
            style="color: #f56c6c"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  name: "DatasetManagement",
  data() {
    return {
      datasetList: [
        {
          id: 1,
          name: "人类基因组数据",
          type: "基因组数据",
          size: "2.3GB",
          downloads: 156,
          createTime: "2024-01-01 10:00:00",
        },
        {
          id: 2,
          name: "蛋白质结构数据",
          type: "蛋白质数据",
          size: "890MB",
          downloads: 89,
          createTime: "2024-01-02 11:00:00",
        },
        {
          id: 3,
          name: "RNA测序数据",
          type: "RNA数据",
          size: "1.5GB",
          downloads: 45,
          createTime: "2024-01-03 12:00:00",
        },
      ],
    };
  },
  methods: {
    handleUpload() {
      this.$message.info("上传数据集功能开发中");
    },
    handleCreate() {
      this.$message.info("创建数据集功能开发中");
    },
    handlePreview(row) {
      this.$message.info(`预览数据集: ${row.name}`);
    },
    handleEdit(row) {
      this.$message.info(`编辑数据集: ${row.name}`);
    },
    handleDownload(row) {
      this.$message.info(`下载数据集: ${row.name}`);
    },
    handleDelete(row) {
      this.$confirm(`确定删除数据集 "${row.name}" 吗？`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        this.$message.success("删除成功");
      });
    },
  },
};
</script>

<style scoped>
.dataset-management {
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
