/**
 * 重试 / 超时 / 限流降级
 * 统一包裹 AI 供应商调用：AbortSignal 超时 + 指数退避重试。
 * 默认次数 / 超时引用 shared AI_DEFAULT_PARAMS。
 */
import { AI_DEFAULT_PARAMS } from '@bomi/shared';
import { RETRY_BACKOFF_BASE_MS } from '../config/constants';

/** 重试选项 */
export interface RetryOptions {
  /** 最大重试次数（不含首次） */
  retries?: number;
  /** 单次调用超时 ms */
  timeoutMs?: number;
  /** 每次重试前的回调（记录日志 / 计费） */
  onRetry?: (err: Error, attempt: number) => void;
  /** 是否可重试判定（默认所有异常都重试） */
  shouldRetry?: (err: unknown) => boolean;
}

/**
 * 带超时 + 重试执行异步任务
 * @param fn 接收 AbortSignal，内部 fetch 应传入 signal
 */
export async function withRetry<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const retries = opts.retries ?? AI_DEFAULT_PARAMS.RETRY_COUNT;
  const timeoutMs = opts.timeoutMs ?? AI_DEFAULT_PARAMS.TIMEOUT_MS;
  const shouldRetry = opts.shouldRetry ?? (() => true);

  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await fn(controller.signal);
      clearTimeout(timer);
      return result;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;

      const canRetry = attempt < retries && shouldRetry(err);
      if (!canRetry) break;

      const retryErr = err instanceof Error ? err : new Error(String(err));
      opts.onRetry?.(retryErr, attempt + 1);

      // 指数退避：base * 2^attempt
      await delay(RETRY_BACKOFF_BASE_MS * 2 ** attempt);
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error('ai retry exhausted');
}

/** 延迟工具 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 判断是否为超时 / 中断异常（此类异常可重试） */
export function isAbortError(err: unknown): boolean {
  if (err instanceof Error) {
    return err.name === 'AbortError' || err.name === 'TimeoutError';
  }
  return false;
}
