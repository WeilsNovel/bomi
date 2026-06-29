<!-- 运营总览 - Stage 2 接入 getStatsOverviewApi + 图表 -->
<template>
  <div class="placeholder-page">
    <el-result icon="info" title="运营总览" sub-title="Stage 2 接入：用户数 / 打卡 / AI 调用 / Token">
      <template #extra>
        <span class="placeholder-page__endpoint">GET /api/admin/stats/overview</span>
      </template>
    </el-result>
  </div>
</template>

<script setup lang="ts">
// Stage 2 待实现
</script>

<style scoped>
.placeholder-page {
  display: flex;
  justify-content: center;
}

.placeholder-page__endpoint {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
