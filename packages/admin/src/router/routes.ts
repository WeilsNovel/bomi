/**
 * 路由表 - 参数化（路径 / 名称全部引用 config/constants.ts，禁止硬编码字符串）
 *
 * 路由元数据 meta：
 * - title：菜单标题 / 浏览器标签
 * - icon：菜单图标（Element Plus 图标组件名，由 layout 映射渲染）
 * - hidden：是否在侧边栏菜单隐藏
 * - permissions：访问所需权限码（留空表示任何已登录用户可访问）
 */

import type { RouteRecordRaw } from 'vue-router';
import { ROUTE_NAME_CONFIG, ROUTE_PATH_CONFIG } from '@/config/constants';
import type { RoutePermission } from '@/core/permission';

/** 路由元数据类型扩展（声明到 vue-router 模块） */
declare module 'vue-router' {
  interface RouteMeta {
    /** 菜单标题 */
    title?: string;
    /** 菜单图标（Element Plus 图标组件名） */
    icon?: string;
    /** 是否在侧边栏隐藏 */
    hidden?: boolean;
    /** 访问所需权限码 */
    permissions?: RoutePermission[];
  }
}

/** 布局父路由（懒加载） */
const Layout = () => import('@/layout/index.vue');

/**
 * 完整路由表
 *
 * Stage 1 采用静态路由表（所有路由前端已知）。
 * 后续如需按角色动态加载，改为 asyncRoutes + 服务端下发权限码过滤。
 */
export const routes: RouteRecordRaw[] = [
  {
    path: ROUTE_PATH_CONFIG.LOGIN,
    name: ROUTE_NAME_CONFIG.LOGIN,
    component: () => import('@/pages/login/index.vue'),
    meta: { title: '登录', hidden: true },
  },
  {
    path: '/',
    name: ROUTE_NAME_CONFIG.LAYOUT,
    component: Layout,
    redirect: ROUTE_PATH_CONFIG.DASHBOARD,
    children: [
      {
        path: ROUTE_PATH_CONFIG.DASHBOARD,
        name: ROUTE_NAME_CONFIG.DASHBOARD,
        component: () => import('@/pages/dashboard/index.vue'),
        meta: { title: '仪表盘', icon: 'Odometer' },
      },
      {
        path: ROUTE_PATH_CONFIG.USER_LIST,
        name: ROUTE_NAME_CONFIG.USER_LIST,
        component: () => import('@/pages/system/user-list/index.vue'),
        // permissions: ['user:view'],  // TODO(Stage2): 角色权限体系建立后补充
        meta: { title: '用户管理', icon: 'User' },
      },
      {
        path: ROUTE_PATH_CONFIG.DIET_RECORDS,
        name: ROUTE_NAME_CONFIG.DIET_RECORDS,
        component: () => import('@/pages/audit/diet-records/index.vue'),
        // permissions: ['diet:audit'],  // TODO(Stage2): 角色权限体系建立后补充
        meta: { title: '打卡审计', icon: 'Camera' },
      },
      {
        path: ROUTE_PATH_CONFIG.STATS_OVERVIEW,
        name: ROUTE_NAME_CONFIG.STATS_OVERVIEW,
        component: () => import('@/pages/stats/overview/index.vue'),
        // permissions: ['stats:view'],  // TODO(Stage2): 角色权限体系建立后补充
        meta: { title: '运营总览', icon: 'DataLine' },
      },
      {
        path: ROUTE_PATH_CONFIG.PLAN_LIST,
        name: ROUTE_NAME_CONFIG.PLAN_LIST,
        component: () => import('@/pages/plan/list/index.vue'),
        // permissions: ['plan:view'],  // TODO(Stage2): 角色权限体系建立后补充
        meta: { title: '计划查看', icon: 'Notebook' },
      },
    ],
  },
  {
    path: ROUTE_PATH_CONFIG.NOT_FOUND,
    name: ROUTE_NAME_CONFIG.NOT_FOUND,
    component: () => import('@/pages/error/404.vue'),
    meta: { title: '404', hidden: true },
  },
  // 兜底：未匹配路由统一跳 404
  { path: '/:pathMatch(.*)*', redirect: ROUTE_PATH_CONFIG.NOT_FOUND },
];
