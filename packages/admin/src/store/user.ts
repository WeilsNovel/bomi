/**
 * 管理员用户状态
 *
 * 持有 token + 管理员信息，提供登录 / 退出 / 持久化恢复。
 * token 与用户信息同步写入 localStorage（core/storage），刷新页面后可恢复。
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UserItem } from '@bomi/shared';
import { adminLoginApi, adminLogoutApi } from '@/api/auth';
import type { AdminLoginRequest } from '@/types/api';
import {
  clearAuth,
  getToken,
  getUserInfo,
  setToken,
  setUserInfo,
} from '@/core/storage';

export const useUserStore = defineStore('user', () => {
  /** 管理员 token（初始化时从 localStorage 恢复） */
  const token = ref<string>(getToken());
  /** 管理员信息（初始化时从 localStorage 恢复） */
  const userInfo = ref<UserItem | null>(getUserInfo<UserItem>());

  /** 是否已登录 */
  const isLogged = computed(() => !!token.value);

  /**
   * 管理员登录
   * @param params 登录入参
   */
  async function login(params: AdminLoginRequest): Promise<void> {
    const res = await adminLoginApi(params);
    token.value = res.token;
    userInfo.value = res.user;
    setToken(res.token);
    setUserInfo(res.user);
  }

  /**
   * 退出登录（接口失败也清本地态，避免卡死）
   */
  async function logout(): Promise<void> {
    try {
      await adminLogoutApi();
    } finally {
      token.value = '';
      userInfo.value = null;
      clearAuth();
    }
  }

  /** 从 localStorage 恢复登录态（刷新后调用） */
  function restore(): void {
    token.value = getToken();
    userInfo.value = getUserInfo<UserItem>();
  }

  return { token, userInfo, isLogged, login, logout, restore };
});
