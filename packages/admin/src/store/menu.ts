/**
 * 菜单状态
 *
 * 从可访问路由派生侧边栏菜单列表。
 * 路由元数据 meta.title / meta.icon / meta.hidden 决定菜单项展示。
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { RouteRecordRaw } from 'vue-router';
import type { RoutePermission } from '@/core/permission';

/** 菜单项结构 */
export interface MenuItem {
  /** 路由路径（完整路径） */
  path: string;
  /** 菜单标题 */
  title: string;
  /** 菜单图标（Element Plus 图标组件名） */
  icon?: string;
}

/** 权限校验函数类型（由调用方注入，避免菜单 store 反向依赖 permission store） */
export type PermissionChecker = (required?: RoutePermission[]) => boolean;

export const useMenuStore = defineStore('menu', () => {
  /** 侧边栏菜单列表 */
  const menus = ref<MenuItem[]>([]);

  /**
   * 从路由表生成菜单
   * @param accessibleRoutes 路由列表
   * @param checker 权限校验函数（可选，传入则按 meta.permissions 过滤）
   */
  function generateMenus(
    accessibleRoutes: RouteRecordRaw[],
    checker?: PermissionChecker,
  ): void {
    const items: MenuItem[] = [];
    accessibleRoutes.forEach((route) => {
      // 仅处理布局父路由的子路由为菜单项
      if (route.children && route.children.length > 0) {
        route.children.forEach((child) => {
          if (child.meta?.hidden) return;
          if (checker && !checker(child.meta?.permissions)) return;
          items.push({
            path: child.path,
            title: child.meta?.title ?? '',
            icon: child.meta?.icon,
          });
        });
      }
    });
    menus.value = items;
  }

  /** 清空菜单（退出登录时调用） */
  function clear(): void {
    menus.value = [];
  }

  return { menus, generateMenus, clear };
});
