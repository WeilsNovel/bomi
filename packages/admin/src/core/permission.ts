/**
 * 权限校验 - 底层通用工具
 *
 * 权限路由 + 菜单状态在 store/，权限校验逻辑集中在本模块。
 * 路由守卫调用 hasPermission 判断当前用户是否可访问目标路由。
 */

/** 路由元数据中声明的权限码类型 */
export type RoutePermission = string;

/**
 * 判断当前权限集合是否满足目标所需权限
 *
 * 规则：
 * - 目标路由未声明 permissions → 任何已登录用户均可访问
 * - 目标路由声明 permissions → 当前权限集合需包含其全部权限码
 *
 * @param currentPermissions 当前用户拥有的权限码集合
 * @param requiredPermissions 目标路由所需权限码数组
 * @returns 是否放行
 */
export function hasPermission(
  currentPermissions: RoutePermission[],
  requiredPermissions?: RoutePermission[],
): boolean {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }
  if (currentPermissions.length === 0) {
    return false;
  }
  const currentSet = new Set(currentPermissions);
  return requiredPermissions.every((perm) => currentSet.has(perm));
}
