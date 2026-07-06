/**
 * 服务端本地类型（非共享部分）
 * JWT payload 等仅服务端使用的类型放此，禁止与 shared 重复定义共享 DTO。
 */

/** JWT payload（签发 / 校验 token 用） */
export interface JwtPayload {
  /** subject：用户 ID */
  sub: number;
  /** 微信 openid（微信登录用户） */
  openid?: string;
  /** 手机号（手机号登录用户） */
  phone?: string;
  /** 签发时间 */
  iat?: number;
  /** 过期时间 */
  exp?: number;
}
