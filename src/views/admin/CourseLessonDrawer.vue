<template>
  <el-drawer
    :title="`【${courseTitle}】 - 课时管理`"
    :visible="visible"
    @close="handleClose"
    size="800px"
    @opened="fetchLessons"
    append-to-body
  >
    <div class="lesson-container">
      <div class="toolbar">
        <el-button type="primary" size="small" icon="el-icon-plus" @click="handleAdd">
          新增课时
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="lessonList"
        style="width: 100%"
        border
        size="small"
      >
        <el-table-column prop="chapterName" label="归属章节" width="150" show-overflow-tooltip></el-table-column>
        <el-table-column prop="title" label="课时标题" min-width="180" show-overflow-tooltip></el-table-column>
        
        <el-table-column prop="contentType" label="内容类型" width="100" align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.contentType === 'VIDEO'" type="primary" size="mini">视频</el-tag>
            <el-tag v-else-if="scope.row.contentType === 'ARTICLE'" type="success" size="mini">图文</el-tag>
            <el-tag v-else-if="scope.row.contentType === 'PRACTICE'" type="warning" size="mini">实操</el-tag>
            <el-tag v-else type="info" size="mini">未知</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="sortOrder" label="排序" width="60" align="center"></el-table-column>

        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="handleEdit(scope.row)">编辑</el-button>
            <el-divider direction="vertical"></el-divider>
            <el-button type="text" size="mini" style="color: #F56C6C" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-dialog
        :title="dialogTitle"
        :visible.sync="innerDialogVisible"
        width="500px"
        append-to-body
        @close="resetForm"
        :close-on-click-modal="false"
      >
        <el-form ref="lessonForm" :model="form" :rules="rules" label-width="90px">
          <el-form-item label="章节名称" prop="chapterName">
            <el-input v-model="form.chapterName" placeholder="例如：第一章 测序原理基础"></el-input>
          </el-form-item>
          
          <el-form-item label="课时标题" prop="title">
            <el-input v-model="form.title" placeholder="请输入具体的课时名称"></el-input>
          </el-form-item>

          <el-form-item label="内容类型" prop="contentType">
            <el-select v-model="form.contentType" style="width: 100%">
              <el-option label="视频录播 (VIDEO)" value="VIDEO"></el-option>
              <el-option label="图文阅读 (ARTICLE)" value="ARTICLE"></el-option>
              <el-option label="实操练习 (PRACTICE)" value="PRACTICE"></el-option>
            </el-select>
          </el-form-item>

         <el-form-item label="视频文件" prop="videoUrl" v-if="form.contentType === 'VIDEO'">
            <el-input v-model="form.videoUrl" placeholder="点击右侧上传本地视频">
              <el-upload
                slot="append"
                action="javascript:void(0)"
                :show-file-list="false"
                :before-upload="beforeVideoUpload"
                :http-request="handleVideoUpload"
                :disabled="videoUploading"
                accept=".mp4"
              >
                <el-button icon="el-icon-upload" :loading="videoUploading">
                  {{ videoUploading ? '上传中...' : '本地上传' }}
                </el-button>
              </el-upload>
            </el-input>
            
            <el-progress 
              v-if="videoUploading" 
              :percentage="videoUploadPercent" 
              :status="videoUploadPercent === 100 ? 'success' : null"
              style="margin-top: 8px;">
            </el-progress>
          </el-form-item>

         <el-form-item label="文档/课件" prop="content" v-if="form.contentType === 'ARTICLE'">
            <el-input v-model="form.content" placeholder="可手动填入文档，或点击右侧上传本地 PPT/PDF">
              <el-upload
                slot="append"
                action="javascript:void(0)"
                :show-file-list="false"
                :before-upload="beforePptUpload"
                :http-request="handlePptUpload"
                :disabled="pptUploading"
                accept=".ppt,.pptx,.pdf"
              >
                <el-button icon="el-icon-upload" :loading="pptUploading">
                  {{ pptUploading ? '上传中...' : '上传文档' }}
                </el-button>
              </el-upload>
            </el-input>
            
            <el-progress 
              v-if="pptUploading" 
              :percentage="pptUploadPercent" 
              :status="pptUploadPercent === 100 ? 'success' : null"
              style="margin-top: 8px;">
            </el-progress>
          </el-form-item>

          <el-form-item label="实操指导" prop="content" v-if="form.contentType === 'PRACTICE'">
            <el-input type="textarea" :rows="3" v-model="form.content" placeholder="输入详细的实操步骤与指导..."></el-input>
          </el-form-item>

          <el-form-item label="排序权重" prop="sortOrder">
            <el-input-number v-model="form.sortOrder" :min="0" :max="999" size="small"></el-input-number>
            <span style="margin-left: 10px; font-size: 12px; color: #999;">数字越小越靠前</span>
          </el-form-item>
        </el-form>

       
        
        <span slot="footer">
          <el-button @click="innerDialogVisible = false" size="small">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading" size="small">保存</el-button>
        </span>
      </el-dialog>
    </div>
  </el-drawer>
</template>

<script>
import { getCourseLessons, addCourseLesson, updateCourseLesson, deleteCourseLesson, uploadCourseVideo, uploadCourseDocument } from "@/api/course";

export default {
  name: "CourseLessonDrawer",
  props: {
    visible: { type: Boolean, default: false },
    courseId: { type: Number, default: null },
    courseTitle: { type: String, default: "" }
  },
  data() {
    return {
      loading: false,
      lessonList: [],
      
      innerDialogVisible: false,
      dialogTitle: "新增课时",
      submitLoading: false,
      
      form: {
        id: null,
        courseId: null, 
        chapterName: "",
        title: "",
        contentType: "VIDEO",
        content: "",
        videoUrl: "",
        isFreePreview: 1, // 🌟 默认直接设为 1 (免费看)，前端不展示，后端默默存为免费
        sortOrder: 0
      },
      rules: {
        chapterName: [{ required: true, message: "请输入归属的章节名称", trigger: "blur" }],
        title: [{ required: true, message: "请输入课时标题", trigger: "blur" }],
        contentType: [{ required: true, message: "请选择内容类型", trigger: "change" }]
      },

      videoUploading: false,
      videoUploadPercent: 0,

      pptUploading: false,
      pptUploadPercent: 0,
    };
  },
  methods: {
    handleClose() {
      this.$emit("update:visible", false);
      this.$emit("close");
    },
    
    async fetchLessons() {
      if (!this.courseId) return;
      this.loading = true;
      try {
        const res = await getCourseLessons(this.courseId);
        this.lessonList = res.data || []; 
      } catch (error) {
        this.$message.error("获取课时列表失败");
      } finally {
        this.loading = false;
      }
    },

    beforeVideoUpload(file) {
      const isMP4 = file.type === 'video/mp4';
      const isLt2G = file.size / 1024 / 1024 / 1024 < 2; 

      if (!isMP4) {
        this.$message.error('只能上传 MP4 格式的视频！');
        return false;
      }
      if (!isLt2G) {
        this.$message.error('视频大小不能超过 2GB！');
        return false;
      }
      return true;
    },

    handleVideoUpload(options) {
      const file = options.file;
      const formData = new FormData();
      formData.append("file", file);

      this.videoUploading = true;
      this.videoUploadPercent = 0;

      uploadCourseVideo(formData, (progressEvent) => {
        let percent = Math.floor((progressEvent.loaded / progressEvent.total) * 100);
        this.videoUploadPercent = percent;
      }).then(res => {
        if (res.code === 200) {
          this.form.videoUrl = res.data; 
          this.$message.success("视频上传成功！");
        } else {
          this.$message.error(res.message || "视频上传失败");
        }
      }).catch(() => {
        this.$message.error("网络异常，视频上传中断");
      }).finally(() => {
        setTimeout(() => {
          this.videoUploading = false;
          this.videoUploadPercent = 0;
        }, 1000);
      });
    },

    // 🌟 1. PPT/文档上传前校验
    beforePptUpload(file) {
      // 允许的格式：PPT, PPTX, PDF
      const isDoc = file.name.endsWith('.ppt') || file.name.endsWith('.pptx') || file.name.endsWith('.pdf') || file.type === 'application/pdf';
      const isLt100M = file.size / 1024 / 1024 < 100; // 限制 100MB 以内

      if (!isDoc) {
        this.$message.error('只能上传 PPT, PPTX 或 PDF 格式的文档！');
        return false;
      }
      if (!isLt100M) {
        this.$message.error('文档大小不能超过 100MB！');
        return false;
      }
      return true;
    },


    // 🌟 2. 执行文档上传
    handlePptUpload(options) {
      const file = options.file;
      const formData = new FormData();
      formData.append("file", file);

      this.pptUploading = true;
      this.pptUploadPercent = 0;

      uploadCourseDocument(formData, (progressEvent) => {
        let percent = Math.floor((progressEvent.loaded / progressEvent.total) * 100);
        this.pptUploadPercent = percent;
      }).then(res => {
        if (res.code === 200) {
          this.form.content = res.data; // 将返回的路径塞入 content 字段
          this.$message.success("文档上传成功！");
        } else {
          this.$message.error(res.message || "文档上传失败");
        }
      }).catch(() => {
        this.$message.error("网络异常，文档上传中断");
      }).finally(() => {
        setTimeout(() => {
          this.pptUploading = false;
          this.pptUploadPercent = 0;
        }, 1000);
      });
    },

    handleAdd() {
      this.resetForm();
      this.form.courseId = this.courseId; 
      this.dialogTitle = "新增课时";
      this.innerDialogVisible = true;
    },

    handleEdit(row) {
      this.dialogTitle = "修改课时信息";
      this.form = JSON.parse(JSON.stringify(row));
      this.innerDialogVisible = true;
    },

    resetForm() {
      this.form = { id: null, courseId: this.courseId, chapterName: "", title: "", contentType: "VIDEO", content: "", videoUrl: "", isFreePreview: 1, sortOrder: 0 };
      if (this.$refs.lessonForm) {
        this.$refs.lessonForm.clearValidate();
      }
    },

    submitForm() {
      this.$refs.lessonForm.validate(async valid => {
        if (!valid) return;
        this.submitLoading = true;
        try {
          if (this.form.id) {
            await updateCourseLesson(this.form.id, this.form);
            this.$message.success("课时修改成功");
          } else {
            await addCourseLesson(this.form);
            this.$message.success("新课时添加成功");
          }
          this.innerDialogVisible = false;
          this.fetchLessons(); 
        } catch (error) {
          this.$message.error("保存失败");
        } finally {
          this.submitLoading = false;
        }
      });
    },

    handleDelete(row) {
      this.$confirm(`确定删除课时【${row.title}】吗？`, "警告", { type: "warning" })
        .then(async () => {
          await deleteCourseLesson(row.id);
          this.$message.success("删除成功");
          this.fetchLessons();
        })
        .catch(() => {});
    }
  }
};
</script>

<style scoped>
.lesson-container {
  padding: 0 20px 20px;
}
.toolbar {
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>