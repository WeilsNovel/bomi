/**
 * AI 层环境动态参数（第二层：环境动态参数）
 * API Key / Base URL / 模型版本从 process.env 读取，禁止硬编码。
 * Key 仅本文件读取，shared / 前端均不持有任何密钥。
 */
import { AI_PROVIDER } from '@bomi/shared';

/** AI 供应商类型（与 shared AI_PROVIDER 对齐） */
export type AiProvider = (typeof AI_PROVIDER)[keyof typeof AI_PROVIDER];

/** AI 环境配置 */
export interface AiEnvConfig {
  /** 当前启用的供应商 */
  provider: AiProvider;
  /** API Key（从 process.env 读取，禁止硬编码） */
  apiKey: string;
  /** Base URL */
  baseUrl: string;
  /** 默认模型版本 */
  defaultModel: string;
  /** 是否启用流式 */
  enableStream: boolean;
}

/** 是否生产环境 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/** 解析供应商（缺省默认通义千问，见 DECISIONS.md D003） */
function resolveProvider(): AiProvider {
  const raw = process.env.AI_PROVIDER;
  const valid: string[] = Object.values(AI_PROVIDER);
  if (raw && valid.includes(raw)) return raw as AiProvider;
  return AI_PROVIDER.QWEN;
}

/** 读取当前环境的 AI 配置（dev / prod 区分） */
export function getAiEnvConfig(): AiEnvConfig {
  const prod = isProduction();
  const apiKey =
    (prod ? process.env.AI_API_KEY_PROD : process.env.AI_API_KEY_DEV) ?? '';
  const baseUrl =
    (prod ? process.env.AI_BASE_URL_PROD : process.env.AI_BASE_URL_DEV) ?? '';
  const defaultModel =
    (prod
      ? process.env.AI_DEFAULT_MODEL_PROD
      : process.env.AI_DEFAULT_MODEL_DEV) ?? '';
  return {
    provider: resolveProvider(),
    apiKey,
    baseUrl,
    defaultModel,
    enableStream: true,
  };
}

/** 获取 API Key（仅 server/ai 层可调用） */
export function getAiApiKey(): string {
  return getAiEnvConfig().apiKey;
}

/** 启动期校验：生产环境缺失 Key 即抛错，开发环境告警 */
export function validateAiEnv(): void {
  const { apiKey, baseUrl, defaultModel } = getAiEnvConfig();
  const missing: string[] = [];
  if (!apiKey) missing.push('AI_API_KEY_' + (isProduction() ? 'PROD' : 'DEV'));
  if (!baseUrl)
    missing.push('AI_BASE_URL_' + (isProduction() ? 'PROD' : 'DEV'));
  if (!defaultModel)
    missing.push('AI_DEFAULT_MODEL_' + (isProduction() ? 'PROD' : 'DEV'));

  if (missing.length === 0) return;

  if (isProduction()) {
    throw new Error(`[ai/env] 缺失必填 AI 环境变量: ${missing.join(', ')}`);
  }
  // eslint-disable-next-line no-console
  console.warn(
    `[ai/env][warn] 缺失 AI 环境变量: ${missing.join(', ')}（参考根目录 .env.example）`,
  );
}
