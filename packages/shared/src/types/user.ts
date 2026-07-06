/**
 * 用户模块 DTO - 前后端共享
 * 字段必须与 server NestJS DTO 完全一致，前端禁止单独定义。
 */
import type { PageData, PageQuery } from './api';
import type { Gender } from './enum';

/** 用户实体 */
export interface UserItem {
  id: number;
  /** 昵称 */
  nickname: string;
  /** 头像 URL */
  avatar: string;
  /** 手机号（脱敏后返回前端，如 138****8888） */
  phone: string;
  /** 性别 */
  gender: Gender;
  /** 用户状态：1 启用 / 0 禁用 */
  status: number;
  createdAt: string;
  updatedAt: string;
}

/** 微信登录入参 */
export interface WxLoginRequest {
  /** wx.login 返回的 code */
  code: string;
  /** 用户授权昵称（新版小程序通过按钮授权获取） */
  nickname?: string;
  /** 用户授权头像 URL */
  avatar?: string;
}

/** 手机号验证码登录入参 */
export interface PhoneLoginRequest {
  phone: string;
  /** 短信验证码 */
  code: string;
}

/** Apple 登录入参（iOS 客户端专用，App Store 强制要求） */
export interface AppleLoginRequest {
  /** Apple 返回的 JWT identityToken */
  identityToken: string;
  /** Apple 返回的授权码 */
  authorizationCode: string;
  /** Apple 用户唯一标识（同 Apple ID 跨 App 稳定） */
  appleIdentifier: string;
  /** 首次授权才有，后续授权返回空 */
  fullName?: {
    givenName?: string;
    familyName?: string;
  };
  /** 用户自填昵称（Apple 不返回昵称，需客户端引导用户设置） */
  nickname?: string;
}

/** 发送短信验证码入参 */
export interface SendSmsCodeRequest {
  phone: string;
  /** 场景：login 登录 / bind 绑定 */
  scene: 'login' | 'bind';
}

/** 登录响应 */
export interface LoginResponse {
  /** JWT token */
  token: string;
  /** 用户信息 */
  user: UserItem;
}

/** 用户列表查询入参（管理后台用） */
export interface UserListRequest extends PageQuery {
  keyword?: string;
  status?: number;
}

/** 用户列表响应 */
export type UserListResponse = PageData<UserItem>;

/** 更新用户入参（管理后台用） */
export interface UserUpdateRequest {
  nickname?: string;
  status?: number;
}
