/**
 * 路由实例 + 全局守卫
 *
 * 守卫职责（顺序）：
 * 1. 白名单（登录页）直接放行；已登录用户访问登录页 → 跳首页
 * 2. 未登录访问受保护页 → 跳登录页（携带 redirect 回跳参数）
 * 3. 已登录但权限不足 → 跳 404
 * 4. 其余放行
 *
 * 权限校验逻辑集中在 core/permission.ts，守卫只调用 store.check。
 */

import { createRouter, createWebHistory } from 'vue-router';
import type { RouteLocationNormalized } from 'vue-router';
import { routes } from '@/router/routes';
import { ROUTE_PATH_CONFIG } from '@/config/constants';
import { useUserStore } from '@/store/user';
import { usePermissionStore } from '@/store/permission';

/** 路由历史模式 base（暂为根路径，部署到子路径时改此处） */
const ROUTER_BASE = '/';

export const router = createRouter({
  history: createWebHistory(ROUTER_BASE),
  routes,
});

/** 登录页白名单（无需登录即可访问） */
const WHITELIST: readonly string[] = [ROUTE_PATH_CONFIG.LOGIN];

/**
 * 判断目标路由是否需要登录
 */
function requiresAuth(to: RouteLocationNormalized): boolean {
  return !WHITELIST.includes(to.path);
}

/** 全局前置守卫 */
router.beforeEach((to, _from) => {
  const userStore = useUserStore();
  const permissionStore = usePermissionStore();

  // 已登录访问登录页 → 跳首页
  if (to.path === ROUTE_PATH_CONFIG.LOGIN && userStore.isLogged) {
    return { path: ROUTE_PATH_CONFIG.DASHBOARD };
  }

  // 白名单放行
  if (!requiresAuth(to)) {
    return true;
  }

  // 未登录 → 跳登录页并携带 redirect
  if (!userStore.isLogged) {
    return {
      path: ROUTE_PATH_CONFIG.LOGIN,
      query: { redirect: to.fullPath },
    };
  }

  // 权限校验：所需权限未通过 → 跳 404
  if (!permissionStore.check(to.meta.permissions)) {
    return { path: ROUTE_PATH_CONFIG.NOT_FOUND };
  }

  return true;
});

export default router;
