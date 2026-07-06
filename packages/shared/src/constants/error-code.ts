/**
 * 业务错误码 - 前后端共享
 * 服务端抛错必须使用此枚举；前端异常处理引用 ERROR_MESSAGE_MAP。
 * 新增错误码必须先改本文件，再前后端同步升级。
 */
export const ERROR_CODE = {
  /** 成功 */
  SUCCESS: 0,
  /** 参数校验失败 */
  PARAM_INVALID: 40001,
  /** 未登录 */
  UNAUTHORIZED: 40101,
  /** token 失效 */
  TOKEN_EXPIRED: 40102,
  /** 无权限 */
  FORBIDDEN: 40301,
  /** 资源不存在 */
  NOT_FOUND: 40401,
  /** 服务器错误 */
  SERVER_ERROR: 50001,
  /** 业务限流 */
  RATE_LIMIT: 42901,
  /** 第三方服务异常（短信 / AI / OSS 等） */
  THIRD_PARTY_ERROR: 50002,
  /** 微信登录失败 */
  WX_LOGIN_FAILED: 40111,
  /** 短信验证码错误或已过期 */
  SMS_CODE_INVALID: 40112,
  /** 手机号已被绑定 */
  PHONE_ALREADY_BOUND: 40113,
  /** Apple 登录失败（iOS 客户端） */
  APPLE_LOGIN_FAILED: 40114,
  /** AI 识别失败（图片无法识别 / 供应商返回错误） */
  AI_RECOGNIZE_FAILED: 50021,
  /** AI 计划生成失败 */
  AI_PLAN_GENERATE_FAILED: 50022,
  /** AI 调用超时 */
  AI_TIMEOUT: 50023,
  /** 图片上传失败 */
  IMAGE_UPLOAD_FAILED: 50031,
} as const;

/** 错误码对应文案 - 前端展示用 */
export const ERROR_MESSAGE_MAP: Record<number, string> = {
  [ERROR_CODE.SUCCESS]: '操作成功',
  [ERROR_CODE.PARAM_INVALID]: '参数错误',
  [ERROR_CODE.UNAUTHORIZED]: '请先登录',
  [ERROR_CODE.TOKEN_EXPIRED]: '登录已过期，请重新登录',
  [ERROR_CODE.FORBIDDEN]: '无操作权限',
  [ERROR_CODE.NOT_FOUND]: '资源不存在',
  [ERROR_CODE.SERVER_ERROR]: '服务器异常，请稍后重试',
  [ERROR_CODE.RATE_LIMIT]: '操作过于频繁，请稍后再试',
  [ERROR_CODE.THIRD_PARTY_ERROR]: '服务暂时不可用，请稍后重试',
  [ERROR_CODE.WX_LOGIN_FAILED]: '微信登录失败，请重试',
  [ERROR_CODE.SMS_CODE_INVALID]: '验证码错误或已过期',
  [ERROR_CODE.PHONE_ALREADY_BOUND]: '该手机号已被其他账号绑定',
  [ERROR_CODE.APPLE_LOGIN_FAILED]: 'Apple 登录失败，请重试',
  [ERROR_CODE.AI_RECOGNIZE_FAILED]: '识别失败，请重新拍摄清晰的食物照片',
  [ERROR_CODE.AI_PLAN_GENERATE_FAILED]: '计划生成失败，请稍后重试',
  [ERROR_CODE.AI_TIMEOUT]: '识别超时，请稍后重试',
  [ERROR_CODE.IMAGE_UPLOAD_FAILED]: '图片上传失败，请重试',
};

/** 业务错误码类型 */
export type BusinessErrorCode = typeof ERROR_CODE[keyof typeof ERROR_CODE];
