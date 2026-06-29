<!--
  仪表盘（首页）
  - Stage 1：展示运营总览四个指标卡片（数据待 server 接口就绪后接入）
  - Stage 2：接入 getStatsOverviewApi + 图表
-->
<template>
  <div class="dashboard-page">
    <el-row :gutter="GUTTER">
      <el-col v-for="card in statCards" :key="card.key" :span="6">
        <el-card shadow="hover">
          <div class="stat-card__label">{{ card.label }}</div>
          <div class="stat-card__value">{{ card.value }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="dashboard-page__tip" shadow="never">
      <el-empty :description="DEFAULT_TEXT_CONFIG.EMPTY_TEXT" />
      <div class="dashboard-page__hint">Stage 1 骨架就绪，待 server 接口接入后填充运营数据与图表。</div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { DEFAULT_TEXT_CONFIG } from '@/config/constants';

/** 卡片间距（px） */
const GUTTER = 16;

/** 运营指标卡片配置（Stage 1 占位，Stage 2 接入 getStatsOverviewApi） */
const statCards: { key: string; label: string; value: string }[] = [
  { key: 'totalUsers', label: '总用户数', value: '-' },
  { key: 'todayRecords', label: '今日打卡', value: '-' },
  { key: 'totalCalls', label: 'AI 调用次数', value: '-' },
  { key: 'totalTokens', label: 'Token 用量', value: '-' },
];
</script>

<style scoped>
.stat-card__label {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.stat-card__value {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 600;
}

.dashboard-page__tip {
  margin-top: 16px;
}

.dashboard-page__hint {
  margin-top: 8px;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
