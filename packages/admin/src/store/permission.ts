/**
 * 权限状态
 *
 * 持有当前管理员拥有的权限码集合，提供权限校验包装。
 * 路由守卫与菜单生成均依赖本 store 判断可访问性。
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { hasPermission, type RoutePermission } from '@/core/permission';

export const usePermissionStore = defineStore('permission', () => {
  /** 当前管理员拥有的权限码 */
  const permissions = ref<RoutePermission[]>([]);

  /**
   * 设置权限码集合（登录成功后由 user store 触发）
   * @param perms 权限码数组
   */
  function setPermissions(perms: RoutePermission[]): void {
    permissions.value = perms;
  }

  /**
   * 校验是否拥有目标权限
   * @param required 目标路由所需权限码
   */
  function check(required?: RoutePermission[]): boolean {
    return hasPermission(permissions.value, required);
  }

  /** 重置权限（退出登录时调用） */
  function reset(): void {
    permissions.value = [];
  }

  return { permissions, setPermissions, check, reset };
});
