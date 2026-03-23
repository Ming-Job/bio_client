<template>
  <div class="course-management">
    <div class="page-header">
      <h2>课程资源管理</h2>
    </div>

    <div class="filter-toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="queryParams.searchKey"
          placeholder="搜索课程名称..."
          size="small"
          clearable
          @keyup.enter.native="handleSearch"
          @clear="handleSearch"
          class="search-input"
        >
          <el-button
            slot="append"
            icon="el-icon-search"
            @click="handleSearch"
          ></el-button>
        </el-input>
      </div>

      <div class="toolbar-right">
        <el-button
          type="primary"
          size="small"
          @click="handleAdd"
          icon="el-icon-plus"
          >发布新课程</el-button
        >
      </div>
    </div>

    <el-table
      v-loading="loading"
      :data="courseList"
      style="width: 100%; margin-top: 16px"
      class="custom-table"
    >
      <el-table-column
        label="序号"
        type="index"
        width="60"
        align="center"
        :index="indexMethod"
      ></el-table-column>

      <el-table-column
        label="封面"
        width="110"
        align="center"
      >
        <template slot-scope="scope">
          <el-image
            style="width: 80px; height: 45px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"
            :src="getRealCoverUrl(scope.row.coverImage)"
            fit="cover"
            :preview-src-list="scope.row.coverImage ? [getRealCoverUrl(scope.row.coverImage)] : []"
          >
            <div slot="error" class="image-slot" style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; background: #f5f7fa; color: #909399; font-size: 14px;">
              <i class="el-icon-picture-outline"></i>
            </div>
          </el-image>
        </template>
      </el-table-column>

      <el-table-column
        prop="title"
        label="课程名称"
        min-width="200"
        show-overflow-tooltip
      >
        <template slot-scope="scope">
          <span style="font-weight: 500; color: #303133;">{{ scope.row.title }}</span>
        </template>
      </el-table-column>
      
      <el-table-column
        prop="difficulty"
        label="难度级别"
        width="120"
        align="center"
      >
        <template slot-scope="scope">
          <el-tag
            :type="getDifficultyType(scope.row.difficulty)"
            size="mini"
            effect="plain"
            class="difficulty-tag"
          >
            {{ formatDifficulty(scope.row.difficulty) }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column
        prop="status"
        label="上架状态"
        width="120"
        align="center"
      >
        <template slot-scope="scope">
          <el-switch
            v-model="scope.row.status"
            active-value="PUBLISHED"
            inactive-value="OFFLINE"
            active-color="#10b981"
            inactive-color="#d1d5db"
            @change="handleStatusChange(scope.row)"
          ></el-switch>
        </template>
      </el-table-column>
      
      <el-table-column
        prop="createdAt"
        label="创建时间"
        width="160"
        align="center"
      >
        <template slot-scope="scope">
          <span style="color: #909399; font-size: 13px;">
            {{ scope.row.createdAt ? scope.row.createdAt.substring(0, 16) : "-" }}
          </span>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="120" fixed="right" align="center">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="handleRowCommand('preview', scope.row)">
            预览
          </el-button>
          
          <el-divider direction="vertical"></el-divider>

          <el-dropdown
            @command="cmd => handleRowCommand(cmd, scope.row)"
            trigger="click"
            placement="bottom-end"
          >
            <span class="el-dropdown-link" style="color: #409EFF; cursor: pointer; font-size: 12px; user-select: none;">
              更多<i class="el-icon-arrow-down el-icon--right"></i>
            </span>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="manageLessons" icon="el-icon-reading">管理课时</el-dropdown-item>
              
              <el-dropdown-item command="edit" icon="el-icon-edit">
                编辑资料
              </el-dropdown-item>
              <el-dropdown-item command="delete" divided style="color: #F56C6C;" icon="el-icon-delete">
                删除课程
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        background
        @current-change="handleCurrentChange"
        :current-page="queryParams.pageNum"
        :page-size="6"
        layout="total, prev, pager, next, jumper"
        :total="total"
      >
      </el-pagination>
    </div>

    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="550px"
      @close="resetForm"
      custom-class="clean-dialog"
      :close-on-click-modal="false"
    >
      <el-form ref="courseForm" :model="form" :rules="rules" label-width="85px" label-position="right">
        <el-form-item label="课程标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入课程主标题"></el-input>
        </el-form-item>

        <el-form-item label="难度级别" prop="difficulty">
          <el-select v-model="form.difficulty" placeholder="请评估课程难度" style="width: 100%">
            <el-option label="初级入门 (Beginner)" value="BEGINNER"></el-option>
            <el-option label="中级进阶 (Intermediate)" value="INTERMEDIATE"></el-option>
            <el-option label="高级精通 (Advanced)" value="ADVANCED"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="课程封面" prop="coverImage">
          <el-upload
            class="cover-uploader"
            action="javascript:void(0)"
            :show-file-list="false"
            :before-upload="beforeCoverUpload"
            :http-request="handleCoverUpload"
            :disabled="submitLoading || uploadingCover"
          >
            <div class="cover-container">
              <img v-if="coverPreviewUrl" :src="coverPreviewUrl" class="cover-image" />
              <i v-else class="el-icon-plus cover-uploader-icon"></i>
              <div class="cover-tip" :disabled="submitLoading || uploadingCover">
                <i class="el-icon-camera"></i>
              </div>
              <div class="loading-cover" v-if="uploadingCover">   
                <i class="el-icon-loading"></i>
              </div>
            </div>
            <div slot="tip" class="el-upload__tip hint-text">
              <i class="el-icon-info"></i> 支持 JPG/PNG
            </div>
          </el-upload>
        </el-form-item>

        <el-form-item label="详细介绍" prop="description">
          <el-input type="textarea" :rows="4" v-model="form.description" placeholder="向学员展示这门课程的核心亮点..."></el-input>
        </el-form-item>
      </el-form>
      
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false" size="small">取 消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading" size="small">保 存</el-button>
      </span>
    </el-dialog>
    
    <AdminCourseDetail
        :visible.sync="detailDialogVisible"
        :course="currentDetailCourse"
        @edit="handleEdit" 
      />

    <CourseLessonDrawer 
      :visible.sync="lessonDrawerVisible" 
      :courseId="currentManageCourseId"
      :courseTitle="currentManageCourseTitle"
    />
  </div>
</template>

<script>
import { getAdminCourseList, addCourse, updateCourse, deleteCourse, updateCourseStatus, uploadCourseCover } from "@/api/course";
import { getUserId } from "@/utils/auth"; 
import AdminCourseDetail from "@/views/admin/AdminCourseDetail.vue";
import CourseLessonDrawer from "@/views/admin/CourseLessonDrawer.vue";

export default {
  name: "CourseManagement",
  components: { 
    AdminCourseDetail,
    CourseLessonDrawer,
  },
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
      
      dialogVisible: false,
      dialogTitle: "添加新课程",
      submitLoading: false,
      form: {
        id: null,
        title: "",
        description: "",
        coverImage: "",
        instructorId: null, 
        difficulty: "BEGINNER"
      },
      rules: {
        title: [{ required: true, message: "请输入课程标题", trigger: "blur" }],
        difficulty: [{ required: true, message: "请选择难度", trigger: "change" }]
      },
      detailDialogVisible: false,
      currentDetailCourse: null,
      
      coverPreviewUrl: "",   
      uploadingCover: false, 

      lessonDrawerVisible: false, 
      currentManageCourseId: null, 
      currentManageCourseTitle: "",
    };
  },
  created() {
    this.fetchData();
  },
  methods: {
    indexMethod(index) {
      return (this.queryParams.pageNum - 1) * this.queryParams.pageSize + index + 1;
    },
    
    async fetchData() {
      this.loading = true;
      try {
        const res = await getAdminCourseList(this.queryParams);
        const responseData = res.data && res.data.records !== undefined ? res.data : res;

        if (responseData && responseData.success !== false) {
          if (responseData.data && responseData.data.records) {
            this.courseList = responseData.data.records;
            this.total = responseData.data.total;
          } else if (responseData.records) {
            this.courseList = responseData.records;
            this.total = responseData.total;
          }
        } else {
          this.$message.error(responseData.message || "获取列表失败");
        }
      } catch (error) {
        console.error("获取课程列表失败", error);
        this.$message.error("数据加载中断，请刷新重试");
      } finally {
        this.loading = false;
      }
    },

    getRealCoverUrl(path) {
      if (!path) return '';
      if (path.startsWith('http')) return path;
      const baseUrl = process.env.VUE_APP_BASE_API || 'http://localhost:8080';
      return baseUrl + path;
    },

    handleSearch() {
      this.queryParams.pageNum = 1;
      this.fetchData();
    },
    
    handleCurrentChange(val) {
      this.queryParams.pageNum = val;
      this.fetchData();
    },

    formatDifficulty(val) {
      const map = { "BEGINNER": "初阶", "INTERMEDIATE": "中阶", "ADVANCED": "高阶" };
      return map[val] || val;
    },
    
    getDifficultyType(val) {
      const map = { "BEGINNER": "success", "INTERMEDIATE": "warning", "ADVANCED": "danger" };
      return map[val] || "info";
    },

    async handleStatusChange(row) {
      try {
        await updateCourseStatus(row.id, row.status);
        this.$message.success(`《${row.title}》已${row.status === 'PUBLISHED' ? '成功上架' : '下架隐藏'}`);
      } catch (error) {
        row.status = row.status === 'PUBLISHED' ? 'OFFLINE' : 'PUBLISHED';
        this.$message.error("状态切换失败，请检查网络");
      }
    },

    beforeCoverUpload(file) {
      const isJPG = file.type === "image/jpeg" || file.type === "image/png";
      const isLt5M = file.size / 1024 / 1024 < 5;

      if (!isJPG) {
        this.$message.error("封面图片仅支持 JPG/PNG 格式");
        return false;
      }
      if (!isLt5M) {
        this.$message.error("封面图片大小限 5MB 以内");
        return false;
      }
      return true;
    },

    handleCoverUpload(options) {
      const file = options.file;
      this.uploadingCover = true;

      const formData = new FormData();
      formData.append("cover", file); 

      uploadCourseCover(formData)
        .then((response) => {
          if (response.code === 200) {
            this.form.coverImage = response.data;
            this.coverPreviewUrl = this.getRealCoverUrl(response.data);
            this.$message.success("封面上传成功");
          } else {
            this.$message.error(response.message || "封面上传失败");
          }
        })
        .catch(() => this.$message.error("网络卡顿，封面上传中断"))
        .finally(() => {
          this.uploadingCover = false;
        });
    },

    handleAdd() {
      this.resetForm();
      this.dialogTitle = "发布新课程";
      this.dialogVisible = true;
    },
    
    handleEdit(row) {
      this.dialogTitle = "编辑课程资料";
      this.form = JSON.parse(JSON.stringify(row));
      this.coverPreviewUrl = this.getRealCoverUrl(row.coverImage);
      this.dialogVisible = true;
    },

    handleRowCommand(command, row) {
      if (command === 'delete') {
        this.handleDelete(row);
      } else if (command === 'preview') {
        this.currentDetailCourse = { ...row };
        this.detailDialogVisible = true;
      } else if (command === 'edit') { 
        this.handleEdit(row);
      } else if (command === 'manageLessons') { // 🌟 新增：处理管理大纲命令
        this.currentManageCourseId = row.id;
        this.currentManageCourseTitle = row.title;
        this.lessonDrawerVisible = true;
      }
    },

    resetForm() {
      this.form = { id: null, title: "", description: "", coverImage: "", instructorId: null, difficulty: "BEGINNER" };
      this.coverPreviewUrl = "";
      if (this.$refs.courseForm) {
        this.$refs.courseForm.clearValidate();
      }
    },

    submitForm() {
      this.$refs.courseForm.validate(async (valid) => {
        if (!valid) return;
        
        this.submitLoading = true;
        try {
          if (this.form.id) {
            await updateCourse(this.form.id, this.form);
            this.$message.success("课程资料已更新");
          } else {
            this.form.instructorId = getUserId();
            await addCourse(this.form);
            this.$message.success("新课程已发布");
          }
          this.dialogVisible = false;
          this.fetchData(); 
        } catch (error) {
          this.$message.error("保存失败，请检查填写内容");
        } finally {
          this.submitLoading = false;
        }
      });
    },

    handleDelete(row) {
      this.$confirm(`确定要彻底删除课程《${row.title}》吗？此操作无法撤销！`, "危险操作确认", {
        confirmButtonText: "强制删除",
        cancelButtonText: "取消",
        type: "error",
      }).then(async () => {
        try {
          await deleteCourse(row.id);
          this.$message.success("课程已彻底销毁");
          this.fetchData();
        } catch (error) {
          this.$message.error("删除失败");
        }
      }).catch(() => {});
    }
  }
};
</script>

<style lang="scss" scoped>
.course-management {
  padding: 24px;
  background-color: #f4f6f8;
  min-height: calc(100vh - 120px);

  .page-header {
    margin-bottom: 20px;
    h2 {
      margin: 0 0 8px 0;
      font-size: 22px;
      color: #1f2937;
      font-weight: 600;
    }
  }
}

.filter-toolbar {
  background: #ffffff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #e5e7eb;

  .toolbar-left {
    display: flex;
    align-items: center;
    .search-input {
      width: 320px;
      :deep(.el-input__inner) {
        border-radius: 4px 0 0 4px;
      }
    }
  }
}

::v-deep .custom-table {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  
  th.el-table__cell {
    background-color: #f9fafb !important;
    color: #4b5563;
    font-weight: 600;
    height: 48px;
    border-bottom: 1px solid #e5e7eb !important;
  }
  td.el-table__cell {
    border-bottom: 1px solid #f3f4f6;
    padding: 8px 0; 
  }
  .el-table__row:hover > td.el-table__cell {
    background-color: #f0fdf4 !important;
  }
}

.difficulty-tag {
  border-radius: 4px;
  font-weight: 500;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  background: #fff;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border: 1px solid #e5e7eb;
}

::v-deep .clean-dialog {
  border-radius: 12px;
  .el-dialog__header {
    border-bottom: 1px solid #f3f4f6;
    padding: 20px 24px;
    .el-dialog__title {
      font-weight: 600;
      color: #1f2937;
    }
  }
  .el-dialog__body {
    padding: 30px 40px 10px 20px;
  }
  .el-dialog__footer {
    border-top: 1px solid #f3f4f6;
    padding: 15px 24px;
  }
}

.cover-uploader {
  :deep(.el-upload) {
    border: 1px dashed #dcdfe6;
    border-radius: 8px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: 0.2s;
    background-color: #fbfdff;
    width: 240px; 
    height: 135px;
    display: flex;
    justify-content: center;
    align-items: center;

    &:hover {
      border-color: #409EFF;
      background-color: #ecf5ff;
    }
  }
}

.cover-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;

  .cover-image {
    width: 100%;
    height: 100%;
    object-fit: cover; 
  }

  .cover-uploader-icon {
    font-size: 28px;
    color: #8c939d;
  }

  .cover-tip {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-size: 24px;
    opacity: 0; 
    transition: 0.2s;
  }

  &:hover .cover-tip {
    opacity: 1; 
  }
  
  .loading-cover {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 24px;
    color: #409EFF;
  }
}

.hint-text {
  margin-top: 6px;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.4;
  i {
    margin-right: 3px;
    color: #cbd5e1;
  }
}
</style>