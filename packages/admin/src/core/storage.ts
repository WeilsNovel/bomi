/**
 * 本地存储封装 - 底层通用工具
 *
 * 统一管理 token 与管理员信息的持久化，避免散落的 localStorage 调用。
 * 存储键集中在本模块定义，禁止业务代码直接读写 localStorage。
 */

/** 存储键集中定义（避免魔法字符串散落） */
const STORAGE_KEYS = {
  /** 管理员 token */
  TOKEN: 'bomi_admin_token',
  /** 管理员信息（JSON 序列化） */
  USER_INFO: 'bomi_admin_user',
} as const;

/**
 * 读取 token
 * @returns token 字符串，不存在返回空字符串
 */
export function getToken(): string {
  return localStorage.getItem(STORAGE_KEYS.TOKEN) ?? '';
}

/**
 * 写入 token
 * @param token JWT token
 */
export function setToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
}

/** 清除 token */
export function removeToken(): void {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
}

/**
 * 读取管理员信息
 * @returns 管理员对象，不存在或解析失败返回 null
 */
export function getUserInfo<T>(): T | null {
  const raw = localStorage.getItem(STORAGE_KEYS.USER_INFO);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // 容错：历史脏数据解析失败时清除，避免反复抛错
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);
    return null;
  }
}

/**
 * 写入管理员信息
 * @param info 管理员信息对象
 */
export function setUserInfo<T>(info: T): void {
  localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(info));
}

/** 清除管理员信息 */
export function removeUserInfo(): void {
  localStorage.removeItem(STORAGE_KEYS.USER_INFO);
}

/** 清除全部登录态（token + 用户信息） */
export function clearAuth(): void {
  removeToken();
  removeUserInfo();
}
