/**
 * 运营总览接口（管理后台）
 *
 * 契约对齐 api-contract.md §六：
 * - GET /api/admin/stats/overview  运营总览
 *
 * 响应类型 AdminStatsOverview 暂未在 shared 定义，本地过渡定义并提案。
 * FIXME(技术债): 待整合方将 AdminStatsOverview 补充至 shared/types，落地后改为 import
 */

import { request } from '@/core/request';

/** 运营总览接口路径 */
const ADMIN_STATS_OVERVIEW_URL = '/api/admin/stats/overview';

/**
 * 运营总览响应（过渡类型，待提案至 shared）
 */
export interface AdminStatsOverview {
  /** 总用户数 */
  totalUsers: number;
  /** 今日打卡数 */
  todayRecords: number;
  /** AI 调用总次数 */
  totalCalls: number;
  /** AI token 用量 */
  totalTokens: number;
}

/**
 * 获取运营总览数据
 */
export function getStatsOverviewApi(): Promise<AdminStatsOverview> {
  return request<AdminStatsOverview>({
    url: ADMIN_STATS_OVERVIEW_URL,
    method: 'GET',
  });
}
