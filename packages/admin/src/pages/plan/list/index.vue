<!-- 计划查看 - Stage 2 接入用户计划列表 / 详情 -->
<template>
  <div class="placeholder-page">
    <el-result icon="info" title="计划查看" sub-title="Stage 2 接入：用户计划列表 / 详情">
      <template #extra>
        <span class="placeholder-page__endpoint">GET /api/plan/list</span>
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
