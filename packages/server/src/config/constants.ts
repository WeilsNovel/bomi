/**
 * 服务端静态全局参数（第一层：全局静态参数）
 * 端口、超时、分页、全局前缀、JWT 常量等固定值。
 * 环境差异值放 config/env.ts，禁止在此出现密钥。
 */
import { ERROR_CODE } from '@bomi/shared';

/** 服务端基础配置 */
export const SERVER_CONFIG = {
  /** 默认监听端口（env.PORT 优先） */
  DEFAULT_PORT: 3000,
  /** API 全局路由前缀 */
  API_PREFIX: 'api',
  /** CORS 允许来源（生产环境应通过 env 收紧） */
  CORS_ORIGIN: '*',
  /** 请求体大小上限 */
  BODY_LIMIT: '10mb',
  /** 服务优雅关闭超时 ms */
  GRACEFUL_SHUTDOWN_TIMEOUT_MS: 5000,
} as const;

/** 分页默认参数 */
export const PAGINATION = {
  /** 默认页码 */
  DEFAULT_PAGE_NUM: 1,
  /** 默认每页条数 */
  DEFAULT_PAGE_SIZE: 20,
  /** 每页最大条数（防拉全表） */
  MAX_PAGE_SIZE: 100,
} as const;

/** JWT 相关常量 */
export const JWT_CONFIG = {
  /** token 默认有效期（env.JWT_EXPIRES_IN 优先） */
  DEFAULT_EXPIRES_IN: '7d',
  /** Authorization header 的 token 前缀 */
  HEADER_PREFIX: 'Bearer',
  /** Authorization header 字段名（小写匹配） */
  HEADER_NAME: 'authorization',
  /** JWT 算法 */
  ALGORITHM: 'HS256',
} as const;

/** traceId 请求头字段名（前端可传，服务端兜底生成） */
export const TRACE_ID_HEADER = 'x-trace-id';

/** 健康检查响应文本 */
export const HEALTH_CHECK_OK = 'ok';

/** 成功响应兜底文案（shared ERROR_MESSAGE_MAP[SUCCESS] 缺失时使用） */
export const DEFAULT_SUCCESS_MESSAGE = '操作成功';

/** 引用 shared 错误码，业务层直接 import 使用，禁止硬编码数字 */
export { ERROR_CODE };
