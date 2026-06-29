<!-- 打卡审计 - Stage 2 接入全平台打卡记录查询 -->
<template>
  <div class="placeholder-page">
    <el-result icon="info" title="打卡审计" sub-title="Stage 2 接入：全平台打卡记录查看">
      <template #extra>
        <span class="placeholder-page__endpoint">GET /api/admin/diet/records</span>
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
