/**
 * 管理后台本地接口类型 - 仅存放 shared 尚未定义、且后台必需的过渡类型
 *
 * ⚠️ 规则：接口 DTO 一律从 @bomi/shared 引用，禁止本文件重复定义已有 shared 类型。
 *    本文件仅用于「shared 待补充」的过渡类型，必须配套向整合方提案，落地后迁移至 shared。
 *
 * 当前过渡项（待提案）：
 *   - AdminLoginRequest / AdminLoginResponse：后台管理员登录 DTO（独立于 C 端登录）
 *     详见「改动文件清单」末尾的 shared 同步需求。
 */

import type { UserItem } from '@bomi/shared';

/**
 * 管理员登录入参（过渡类型，待整合方补充至 shared/types/user.ts）
 * FIXME(技术债): shared 未定义 AdminLoginRequest，临时本地定义，待提案落地后改为 import
 */
export interface AdminLoginRequest {
  /** 管理员账号 */
  username: string;
  /** 密码（明文传输，由 HTTPS 保护；后续可升级为加密传输） */
  password: string;
}

/**
 * 管理员登录响应（过渡类型，待整合方补充至 shared/types/user.ts）
 * FIXME(技术债): shared 未定义 AdminLoginResponse，临时本地定义，待提案落地后改为 import
 */
export interface AdminLoginResponse {
  /** JWT token */
  token: string;
  /** 管理员信息（复用 UserItem，后续如需管理员专属字段再提案扩展） */
  user: UserItem;
}
