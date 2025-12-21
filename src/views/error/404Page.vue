<template>
  <div class="not-found">
    <h1>404 - 页面不存在</h1>
    <p>抱歉，您访问的页面不存在。</p>
    <el-link @click="returnLogin">返回首页</el-link>
  </div>
</template>

<script>
export default {
  name: "NotFound",

  methods: {
    returnLogin() {
      this.$router.push({ name: "LoginPage" });
    },
  },
};
</script>

<style scoped>
.not-found {
  text-align: center;
  padding: 100px 20px;
}
</style>
