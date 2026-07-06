/**
 * AI 客户端封装（多供应商适配）
 * 通过 OpenAI 兼容接口调用供应商（默认通义千问 VL，见 DECISIONS.md D003）。
 * 统一暴露 recognizeFood / generatePlan / chat / chatStream 方法。
 *
 * 安全：API Key 仅从 config/env.ts 读取，本文件不持有任何硬编码密钥。
 * 可靠：所有调用经 core/retry.ts 包裹（超时 + 指数退避重试）。
 * 计费：每次调用返回 token 用量（usage）+ 耗时（durationMs）。
 */
import {
  type AiRequest,
  type AiResponse,
  type AiToolCall,
  type FoodItem,
  type HealthProfile,
  type NutritionInfo,
} from '@bomi/shared';
import { AI_CLIENT_CONFIG, AI_PARSE_FAILURE_STATUS, OPENAI_COMPAT_PATH } from '../config/constants';
import { getAiEnvConfig, type AiEnvConfig } from '../config/env';
import { withRetry, type RetryOptions } from './retry';
import { parseSseStream, type StreamChunk } from './stream';
import { buildFoodRecognizeMessages } from '../prompts/food-recognize';
import { buildPlanGenerateMessages } from '../prompts/plan-generate';
import type {
  AiCallResult,
  ChatMessage,
  FoodRecognizeAiResult,
  GeneratePlanAiResult,
  TokenUsage,
} from '../types';

/** 调用选项（覆盖默认参数） */
export interface AiCallOptions {
  /** 覆盖模型 */
  model?: string;
  /** 覆盖温度 */
  temperature?: number;
  /** 覆盖最大 token */
  maxTokens?: number;
  /** 重试选项 */
  retry?: RetryOptions;
}

/** OpenAI 兼容接口的请求体 */
interface ChatCompletionRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  }>;
  temperature: number;
  max_tokens: number;
  stream: boolean;
}

/** OpenAI 兼容接口的非流式响应 */
interface ChatCompletionResponse {
  model?: string;
  choices?: Array<{
    message?: { role?: string; content?: string; tool_calls?: unknown };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

/** 零值营养素（解析失败兜底） */
const ZERO_NUTRITION: NutritionInfo = {
  calories: 0,
  protein: 0,
  fat: 0,
  carbohydrate: 0,
};

export class AiClient {
  private readonly env: AiEnvConfig;

  constructor(env?: AiEnvConfig) {
    this.env = env ?? getAiEnvConfig();
  }

  /** 当前供应商 */
  get provider(): string {
    return this.env.provider;
  }

  /** 默认模型 */
  get defaultModel(): string {
    return this.env.defaultModel;
  }

  /**
   * 食物识别（VLM）
   * @param imageUrl 食物图片 URL
   */
  async recognizeFood(
    imageUrl: string,
    opts?: AiCallOptions,
  ): Promise<AiCallResult<FoodRecognizeAiResult>> {
    const messages = buildFoodRecognizeMessages(imageUrl);
    const { content, usage, model, durationMs } = await this.callCompletion(
      messages,
      opts,
    );
    const data = parseFoodRecognizeResult(content);
    return { data, usage, model, durationMs };
  }

  /**
   * 健康计划生成
   * @param profile 用户健康档案
   */
  async generatePlan(
    profile: HealthProfile,
    opts?: AiCallOptions,
  ): Promise<AiCallResult<GeneratePlanAiResult>> {
    const messages = buildPlanGenerateMessages(profile);
    const { content, usage, model, durationMs } = await this.callCompletion(
      messages,
      opts,
    );
    const data = parsePlanGenerateResult(content);
    return { data, usage, model, durationMs };
  }

  /**
   * 通用对话（非流式）
   * 入参 / 出参对齐 shared AiRequest / AiResponse
   */
  async chat(
    request: AiRequest,
    opts?: AiCallOptions,
  ): Promise<AiCallResult<AiResponse>> {
    const messages = request.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const { content, usage, model, durationMs } = await this.callCompletion(
      messages,
      {
        ...opts,
        model: opts?.model ?? request.model,
        temperature: opts?.temperature ?? request.temperature,
        maxTokens: opts?.maxTokens ?? request.maxTokens,
      },
    );

    const response: AiResponse = {
      sessionId: request.sessionId,
      content,
      model,
      usage,
      toolCalls: extractToolCalls(request.tools),
    };
    return { data: response, usage, model, durationMs };
  }

  /**
   * 通用对话（流式）
   * 逐片产出 StreamChunk，server 通过 SSE 转发前端。
   */
  async *chatStream(
    request: AiRequest,
    opts?: AiCallOptions,
  ): AsyncGenerator<StreamChunk> {
    const body = this.buildRequestBody(
      request.messages.map((m) => ({ role: m.role, content: m.content })),
      {
        model: opts?.model ?? request.model,
        temperature: opts?.temperature ?? request.temperature,
        maxTokens: opts?.maxTokens ?? request.maxTokens,
      },
      true,
    );

    const response = await this.fetchCompletion(body, true);
    yield* parseSseStream(response);
  }

  // ===== 内部方法 =====

  /** 非流式调用 chat/completions */
  private async callCompletion(
    messages: ChatMessage[],
    opts?: AiCallOptions,
  ): Promise<{
    content: string;
    usage: TokenUsage;
    model: string;
    durationMs: number;
  }> {
    const body = this.buildRequestBody(messages, opts, false);
    const start = Date.now();

    const response = await withRetry(
      (signal) => this.fetchCompletion(body, false, signal),
      opts?.retry,
    );

    const json = (await response.json()) as ChatCompletionResponse;
    const content = json.choices?.[0]?.message?.content ?? '';
    const usage: TokenUsage = {
      promptTokens: json.usage?.prompt_tokens ?? 0,
      completionTokens: json.usage?.completion_tokens ?? 0,
      totalTokens: json.usage?.total_tokens ?? 0,
    };

    return {
      content,
      usage,
      model: json.model ?? this.env.defaultModel,
      durationMs: Date.now() - start,
    };
  }

  /** 构造请求体 */
  private buildRequestBody(
    messages: ChatMessage[],
    opts: AiCallOptions | undefined,
    stream: boolean,
  ): ChatCompletionRequest {
    return {
      model: opts?.model ?? this.env.defaultModel,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.contentParts ?? m.content ?? '',
      })),
      temperature: opts?.temperature ?? AI_CLIENT_CONFIG.TEMPERATURE,
      max_tokens: opts?.maxTokens ?? AI_CLIENT_CONFIG.MAX_TOKENS,
      stream,
    };
  }

  /** 发起 fetch 请求到 OpenAI 兼容接口 */
  private async fetchCompletion(
    body: ChatCompletionRequest,
    stream: boolean,
    signal?: AbortSignal,
  ): Promise<Response> {
    const url = `${this.env.baseUrl}${OPENAI_COMPAT_PATH}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.env.apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const errText = await safeReadText(response);
      throw new AiApiError(
        `AI 接口返回 ${response.status}: ${errText}`,
        response.status,
      );
    }

    // 流式响应直接返回（body 由调用方解析）
    if (stream && !response.body) {
      throw new AiApiError('AI 流式响应缺少 body', response.status);
    }
    return response;
  }
}

/** AI 接口异常（携带 HTTP 状态码，便于上层映射错误码） */
export class AiApiError extends Error {
  readonly statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'AiApiError';
    this.statusCode = statusCode;
  }
}

/** 安全读取响应文本（不抛二次异常） */
async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

/** 从模型输出中提取 JSON 文本（兼容 ```json 包裹 / 裸 JSON） */
function extractJsonText(text: string): string {
  const trimmed = text.trim();
  // ```json ... ``` 包裹
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    return fenceMatch[1].trim();
  }
  // 裸 JSON：截取首个 { 到末个 }
  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    return trimmed.slice(first, last + 1);
  }
  return trimmed;
}

/** 解析食物识别结果 */
function parseFoodRecognizeResult(content: string): FoodRecognizeAiResult {
  const jsonText = extractJsonText(content);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    // 解析失败：返回空结果，由 server 据错误码处理
    return { foods: [], totalNutrition: { ...ZERO_NUTRITION } };
  }

  const obj = parsed as { foods?: unknown; totalNutrition?: unknown };
  const foods = Array.isArray(obj.foods)
    ? (obj.foods as unknown[])
        .map(normalizeFoodItem)
        .filter((f): f is FoodItem => f !== null)
    : [];
  const totalNutrition = normalizeNutrition(obj.totalNutrition);

  return { foods, totalNutrition };
}

/** 解析计划生成结果 */
function parsePlanGenerateResult(content: string): GeneratePlanAiResult {
  const jsonText = extractJsonText(content);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new AiApiError(
      'AI 计划生成结果 JSON 解析失败',
      AI_PARSE_FAILURE_STATUS,
    );
  }

  const obj = parsed as Partial<GeneratePlanAiResult>;
  return {
    planName: typeof obj.planName === 'string' ? obj.planName : '饮食计划',
    totalDays: typeof obj.totalDays === 'number' ? obj.totalDays : 0,
    dailyTarget: normalizeNutrition(obj.dailyTarget),
    days: Array.isArray(obj.days) ? obj.days : [],
    advice: typeof obj.advice === 'string' ? obj.advice : '',
  };
}

/** 规范化单个 FoodItem（防御性，确保字段类型正确） */
function normalizeFoodItem(raw: unknown): FoodItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r['name'] !== 'string') return null;
  return {
    name: r['name'],
    portion: typeof r['portion'] === 'string' ? r['portion'] : '',
    nutrition: normalizeNutrition(r['nutrition']),
    confidence:
      typeof r['confidence'] === 'number'
        ? Math.max(0, Math.min(1, r['confidence']))
        : 0,
  };
}

/** 规范化 NutritionInfo（缺字段补 0） */
function normalizeNutrition(raw: unknown): NutritionInfo {
  if (!raw || typeof raw !== 'object') return { ...ZERO_NUTRITION };
  const r = raw as Record<string, unknown>;
  return {
    calories: toNumber(r['calories']),
    protein: toNumber(r['protein']),
    fat: toNumber(r['fat']),
    carbohydrate: toNumber(r['carbohydrate']),
  };
}

/** 安全转 number */
function toNumber(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

/** 工具调用占位（Stage 1 未启用 Function Calling，预留接口） */
function extractToolCalls(tools?: string[]): AiToolCall[] | undefined {
  if (!tools || tools.length === 0) return undefined;
  return undefined;
}
