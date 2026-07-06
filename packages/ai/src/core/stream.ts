/**
 * SSE 流式响应解析
 * 逐行读取 OpenAI 兼容接口的 SSE 流，产出 StreamChunk。
 * server 接收后通过 SSE 转发前端；前端用 core/sse.ts 处理。
 */
import { SSE_DONE_MARKER } from '../config/constants';

/** 单片流式内容 */
export interface StreamChunk {
  /** 本次增量文本 */
  content: string;
  /** 是否结束 */
  done: boolean;
}

/**
 * 解析 SSE 流为异步生成器
 * @param response fetch 返回的 Response（body 为 SSE 文本流）
 */
export async function* parseSseStream(
  response: Response,
): AsyncGenerator<StreamChunk> {
  const body = response.body;
  if (!body) {
    yield { content: '', done: true };
    return;
  }

  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // 最后一行可能不完整，保留到下次
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;

        // SSE data: 前缀
        if (trimmed.startsWith('data:')) {
          const data = trimmed.slice(5).trim();
          if (data === SSE_DONE_MARKER) {
            yield { content: '', done: true };
            return;
          }
          const content = extractDeltaContent(data);
          if (content) {
            yield { content, done: false };
          }
        }
      }
    }
    // 处理缓冲区剩余
    if (buffer.trim().startsWith('data:')) {
      const data = buffer.trim().slice(5).trim();
      if (data && data !== SSE_DONE_MARKER) {
        const content = extractDeltaContent(data);
        if (content) yield { content, done: false };
      }
    }
  } finally {
    reader.releaseLock();
  }

  yield { content: '', done: true };
}

/** 从 SSE data JSON 中提取 delta.content */
function extractDeltaContent(data: string): string {
  try {
    const parsed = JSON.parse(data) as {
      choices?: Array<{
        delta?: { content?: string };
        finish_reason?: string;
      }>;
    };
    const choice = parsed.choices?.[0];
    if (!choice) return '';
    return choice.delta?.content ?? '';
  } catch {
    // 非 JSON 的 data 行忽略
    return '';
  }
}
