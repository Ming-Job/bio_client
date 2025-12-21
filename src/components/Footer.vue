<template>
  <footer class="minimal-footer">
    <div class="footer-content">
      <div class="footer-copyright">
        <span>&copy; 2025 生物科教信息平台</span>
        <span class="separator">|</span>
        <span class="contact-email">
          <i class="el-icon-message"></i>
          contact@bioedu.com
        </span>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: "MinimalFooter",
  data() {
    return {};
  },
};
</script>

<style scoped>
.minimal-footer {
  background: #2c3e50;
  color: white;
  padding: 12px 0;
  width: 100%;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.footer-copyright {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
  gap: 15px;
  flex-wrap: wrap;
}

.separator {
  color: rgba(255, 255, 255, 0.3);
}

.contact-email {
  display: flex;
  align-items: center;
  gap: 5px;
  color: rgba(255, 255, 255, 0.6);
}

.contact-email i {
  color: #42b983;
  font-size: 0.8rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .minimal-footer {
    padding: 10px 0;
  }

  .footer-copyright {
    gap: 10px;
    font-size: 0.7rem;
  }
}

@media (max-width: 480px) {
  .footer-copyright {
    flex-direction: column;
    gap: 3px;
  }

  .separator {
    display: none;
  }
}
</style>
