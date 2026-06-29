<!-- 用户管理 - Stage 2 接入 getUserListApi + ProTable + 启停操作 -->
<template>
  <div class="placeholder-page">
    <el-result icon="info" title="用户管理" sub-title="Stage 2 接入：列表 / 详情 / 启停">
      <template #extra>
        <span class="placeholder-page__endpoint">GET /api/admin/users</span>
      </template>
    </el-result>
  </div>
</template>

<script setup lang="ts">
// Stage 2 待实现：useTable + getUserListApi + ProTable 列配置
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
