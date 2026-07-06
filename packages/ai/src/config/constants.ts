/**
 * AI 层静态参数（第一层：全局静态参数）
 * 模型默认参数引用 shared AI_DEFAULT_PARAMS（单一事实来源），禁止在本文件硬编码温度/token 数。
 */
import {
  AI_DEFAULT_PARAMS,
  AI_MODEL,
  AI_PROVIDER,
  AI_TASK,
} from '@bomi/shared';

/** AI 调用默认参数（兜底值，与 shared 对齐） */
export const AI_CLIENT_CONFIG = {
  /** 默认温度 */
  TEMPERATURE: AI_DEFAULT_PARAMS.TEMPERATURE,
  /** 默认最大 token */
  MAX_TOKENS: AI_DEFAULT_PARAMS.MAX_TOKENS,
  /** 流式默认开关 */
  STREAM: AI_DEFAULT_PARAMS.STREAM,
  /** 重试次数 */
  RETRY_COUNT: AI_DEFAULT_PARAMS.RETRY_COUNT,
  /** 调用超时 ms */
  TIMEOUT_MS: AI_DEFAULT_PARAMS.TIMEOUT_MS,
} as const;

/** 重试退避基数 ms（指数退避：base * 2^attempt） */
export const RETRY_BACKOFF_BASE_MS = 500;

/** OpenAI 兼容接口路径（通义千问 / 豆包 / OpenAI 均走 /chat/completions） */
export const OPENAI_COMPAT_PATH = '/chat/completions';

/** SSE 流式结束标记 */
export const SSE_DONE_MARKER = '[DONE]';

/** 默认食物识别置信度下限（低于此值由 server 决定是否提示用户） */
export const FOOD_CONFIDENCE_FLOOR = 0.3;

/** AI 结果解析失败时回填的合成 HTTP 状态码（等同 500，AI 层不依赖 @nestjs/common） */
export const AI_PARSE_FAILURE_STATUS = 500;

export { AI_DEFAULT_PARAMS, AI_MODEL, AI_PROVIDER, AI_TASK };
