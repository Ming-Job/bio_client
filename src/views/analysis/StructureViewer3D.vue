<template>
  <el-dialog
    title="三维分子结构预览 (3D Structure Viewer)"
    :visible.sync="dialogVisible"
    width="800px"
    custom-class="bio-dark-dialog"
    append-to-body
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div
      class="structure-viewer-container"
      v-loading="loading"
      element-loading-background="rgba(11, 15, 25, 0.9)"
      element-loading-text="解析分子拓扑并初始化 WebGL 引擎..."
    >
      <div class="viewer-controls">
        <el-select
          v-model="selectedStructure"
          placeholder="选择系统内的结构文件 (PDB/SDF)"
          size="small"
          class="dark-select"
          style="width: 350px"
          @change="loadStructure"
          popper-class="bio-dark-select-dropdown"
        >
          <el-option
            v-for="file in files"
            :key="file.id"
            :label="file.originalName || file.name"
            :value="file.id"
          >
            <span style="float: left">
              <i class="el-icon-help" style="color: #14b8a6"></i>
              {{ file.originalName || file.name }}
            </span>
          </el-option>
        </el-select>

        <div class="render-tools" v-if="selectedStructure">
          <el-radio-group
            v-model="renderStyle"
            size="mini"
            class="dark-radio-group"
            @change="updateRenderStyle"
          >
            <el-radio-button label="cartoon">Cartoon</el-radio-button>
            <el-radio-button label="stick">Stick</el-radio-button>
            <el-radio-button label="sphere">Sphere</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <div class="viewer-stage" id="3d-stage">
        <div v-if="!selectedStructure" class="empty-stage">
          <i class="el-icon-discover empty-icon"></i>
          <p>请选择结构文件以启动预览</p>
          <span class="support-text">支持格式：.pdb, .sdf, .mol2</span>
        </div>
        <div v-else class="stage-overlay">
          <div class="overlay-info">
            <span class="info-item"
              ><i class="el-icon-cpu"></i> WebGL Render Active</span
            >
            <span class="info-item"
              ><i class="el-icon-aim"></i> Auto Focused</span
            >
          </div>
          <div
            id="glcontainer"
            style="width: 100%; height: 100%; position: relative"
          ></div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: "StructureViewer3D",
  props: {
    // 控制弹窗显示
    visible: {
      type: Boolean,
      default: false,
    },
    // 供选择的文件列表
    files: {
      type: Array,
      default: () => [],
    },
    // 用户ID，用于下载文件
    userId: {
      type: [String, Number],
      required: true,
    },
  },
  data() {
    return {
      loading: false,
      selectedStructure: "",
      renderStyle: "cartoon",
      viewer3D: null,
      currentMolData: "",
    };
  },
  computed: {
    // 优雅实现双向绑定控制弹窗
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit("update:visible", val);
      },
    },
  },
  watch: {
    // 每次打开弹窗时重置状态
    visible(newVal) {
      if (newVal) {
        this.selectedStructure = "";
        this.renderStyle = "cartoon";
      }
    },
  },
  beforeDestroy() {
    this.cleanUpViewer();
  },
  methods: {
    handleClosed() {
      this.cleanUpViewer();
    },
    cleanUpViewer() {
      if (this.viewer3D) {
        this.viewer3D.clear();
        this.viewer3D = null;
      }
      const el = document.getElementById("glcontainer");
      if (el) el.innerHTML = "";
    },
    async loadStructure(fileId) {
      if (!fileId) return;
      this.loading = true;

      try {
        const fileUrl = `/api/files/download/${fileId}?userId=${this.userId}`;
        const response = await fetch(fileUrl);

        if (!response.ok) throw new Error("文件获取失败");

        this.currentMolData = await response.text();

        if (
          this.currentMolData.includes("【Bio-OS 系统提示】") ||
          this.currentMolData.includes("<!DOCTYPE html>")
        ) {
          this.$message.warning(
            "提示：当前选中的文件不是合法的结构文件，无法预览。",
          );
          this.loading = false;
          return;
        }

        this.$nextTick(() => {
          let element = document.getElementById("glcontainer");

          if (!this.viewer3D) {
            element.innerHTML = "";
            this.viewer3D = window.$3Dmol.createViewer(element, {
              backgroundColor: "black",
            });
          }

          this.viewer3D.clear();

          const fileObj = this.files.find((f) => f.id === fileId);
          const format = (fileObj.originalName || fileObj.name)
            .toLowerCase()
            .endsWith("sdf")
            ? "sdf"
            : "pdb";

          this.viewer3D.addModel(this.currentMolData, format);
          this.updateRenderStyle();
          this.viewer3D.zoomTo();

          this.$message.success("结构解析完毕，预览已就绪");
        });
      } catch (error) {
        console.error("3D 预览失败:", error);
        this.$message.error("无法读取结构文件，预览失败");
      } finally {
        this.loading = false;
      }
    },
    updateRenderStyle() {
      if (!this.viewer3D) return;

      this.viewer3D.removeAllLabels();
      this.viewer3D.setStyle({}, {});

      if (this.renderStyle === "cartoon") {
        this.viewer3D.setStyle({}, { cartoon: { color: "spectrum" } });
      } else if (this.renderStyle === "stick") {
        this.viewer3D.setStyle({}, { stick: { radius: 0.15 } });
      } else if (this.renderStyle === "sphere") {
        this.viewer3D.setStyle({}, { sphere: { radius: 1.0 } });
      }
      this.viewer3D.render();
    },
  },
};
</script>

<style lang="scss" scoped>
.structure-viewer-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 10px 0;
}
.viewer-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #0f172a;
  border: 1px solid #1f2937;
  border-radius: 8px;
}
.viewer-stage {
  height: 480px;
  background: #000000;
  border: 1px solid #1f2937;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 60px rgba(20, 184, 166, 0.05);
}
.empty-stage {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #64748b;
  .empty-icon {
    font-size: 54px;
    margin-bottom: 16px;
    opacity: 0.5;
    color: #14b8a6;
  }
  p {
    margin: 0 0 8px 0;
    font-size: 15px;
    color: #94a3b8;
    font-weight: 500;
  }
  .support-text {
    font-size: 12px;
    font-family: Consolas, monospace;
  }
}
.stage-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  .overlay-info {
    position: absolute;
    top: 16px;
    left: 16px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
    .info-item {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid #1e293b;
      color: #2dd4bf;
      font-size: 11px;
      padding: 6px 10px;
      border-radius: 4px;
      font-family: Consolas, monospace;
      backdrop-filter: blur(4px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    }
  }
}
</style>

<style>
/* 保证子组件的弹窗也能应用极客暗黑风 */
.bio-dark-dialog {
  background-color: #0f172a !important;
  border: 1px solid #1e293b;
  border-radius: 12px;
}
.bio-dark-dialog .el-dialog__title {
  color: #f8fafc;
  font-weight: 600;
  font-family: Consolas, monospace;
}
.bio-dark-dialog .el-dialog__header {
  border-bottom: 1px solid #1e293b;
  padding: 16px 20px;
}
.bio-dark-dialog .el-dialog__body {
  padding: 20px;
  background: #0b0f19;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}
.dark-radio-group .el-radio-button__inner {
  background: #1e293b;
  border-color: #334155;
  color: #94a3b8;
  box-shadow: none !important;
}
.dark-radio-group
  .el-radio-button__orig-radio:checked
  + .el-radio-button__inner {
  background-color: #14b8a6;
  border-color: #14b8a6;
  color: white;
}
</style>
