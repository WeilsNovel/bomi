/**
 * Pinia 状态管理入口
 *
 * 导出 createPinia 实例供 main.ts 挂载。
 * 各 store 按模块拆分：user（登录态）/ permission（权限码）/ menu（侧边栏菜单）。
 */

import { createPinia } from 'pinia';

export const pinia = createPinia();

export { useUserStore } from './user';
export { usePermissionStore } from './permission';
export { useMenuStore, type MenuItem, type PermissionChecker } from './menu';
