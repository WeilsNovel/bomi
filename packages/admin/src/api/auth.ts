/**
 * 管理员认证接口
 *
 * 路径与 DTO 均为待提案项（shared 暂未定义管理员登录契约）：
 * - 提案路径：POST /api/admin/auth/login（独立于 C 端 /api/auth/*）
 * - 提案 DTO：AdminLoginRequest / AdminLoginResponse（见 src/types/api.ts）
 *
 * 退出登录复用 C 端契约 POST /api/auth/logout（api-contract.md 已定义）。
 */

import { request } from '@/core/request';
import type { AdminLoginRequest, AdminLoginResponse } from '@/types/api';

/** 管理员登录接口路径（待整合方确认落地） */
const ADMIN_LOGIN_URL = '/api/admin/auth/login';

/** 退出登录接口路径（对齐 api-contract.md） */
const LOGOUT_URL = '/api/auth/logout';

/**
 * 管理员登录
 * @param params 登录入参
 * @returns 登录响应（token + 管理员信息）
 */
export function adminLoginApi(params: AdminLoginRequest): Promise<AdminLoginResponse> {
  return request<AdminLoginResponse>({
    url: ADMIN_LOGIN_URL,
    method: 'POST',
    data: params as unknown as Record<string, unknown>,
  });
}

/**
 * 退出登录
 */
export function adminLogoutApi(): Promise<null> {
  return request<null>({ url: LOGOUT_URL, method: 'POST' });
}
