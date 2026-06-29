<!-- 404 页 -->
<template>
  <div class="not-found-page">
    <el-result
      icon="warning"
      title="404"
      sub-title="页面不存在或无访问权限"
    >
      <template #extra>
        <el-button type="primary" @click="goHome">{{ DEFAULT_TEXT_CONFIG.CONFIRM_TEXT }}</el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { DEFAULT_TEXT_CONFIG, ROUTE_PATH_CONFIG } from '@/config/constants';

const router = useRouter();

function goHome(): void {
  router.push(ROUTE_PATH_CONFIG.DASHBOARD);
}
</script>

<style scoped>
.not-found-page {
  display: flex;
  justify-content: center;
  padding-top: 80px;
}
</style>
