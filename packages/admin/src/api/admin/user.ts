/**
 * 用户管理接口（管理后台）
 *
 * 契约对齐 api-contract.md §六：
 * - GET    /api/admin/users       用户列表
 * - PUT    /api/admin/users/:id   更新用户
 *
 * DTO 全部从 @bomi/shared 引用，禁止本地定义。
 */

import { request } from '@/core/request';
import { PAGINATION_CONFIG } from '@/config/constants';
import type { UserItem, UserListRequest, UserListResponse, UserUpdateRequest } from '@bomi/shared';

/** 用户列表接口路径 */
const ADMIN_USERS_URL = '/api/admin/users';

/**
 * 获取用户列表
 * @param params 查询参数（含分页 / 关键词 / 状态）
 */
export function getUserListApi(params: UserListRequest): Promise<UserListResponse> {
  return request<UserListResponse>({
    url: ADMIN_USERS_URL,
    method: 'GET',
    data: {
      pageNum: params.pageNum ?? PAGINATION_CONFIG.DEFAULT_PAGE_NUM,
      pageSize: params.pageSize ?? PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
      keyword: params.keyword,
      status: params.status,
    },
  });
}

/**
 * 更新用户信息（启停 / 改昵称）
 * @param id 用户 ID
 * @param params 更新入参
 */
export function updateUserApi(id: number, params: UserUpdateRequest): Promise<UserItem> {
  return request<UserItem>({
    url: `${ADMIN_USERS_URL}/${id}`,
    method: 'PUT',
    data: params as unknown as Record<string, unknown>,
  });
}
