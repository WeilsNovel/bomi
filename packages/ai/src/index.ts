/**
 * @bomi/ai - AI 调用层入口（被 server 调用）
 *
 * 对外暴露：
 * - AiClient：统一客户端（recognizeFood / generatePlan / chat / chatStream）
 * - config：env / constants
 * - prompts：food-recognize / plan-generate
 * - core：retry / stream
 * - types：AI 层本地类型
 *
 * 真实 API Key 在 config/env.ts 从 process.env 读取，禁止硬编码。
 * server controller 禁止直接调用供应商 SDK，必须经本包暴露的服务。
 */

// 客户端
export { AiClient, AiApiError } from './core/client';
export type { AiCallOptions } from './core/client';

// 配置
export {
  AI_CLIENT_CONFIG,
  OPENAI_COMPAT_PATH,
  SSE_DONE_MARKER,
  FOOD_CONFIDENCE_FLOOR,
  AI_PARSE_FAILURE_STATUS,
} from './config/constants';
export {
  getAiEnvConfig,
  getAiApiKey,
  validateAiEnv,
} from './config/env';
export type { AiEnvConfig, AiProvider } from './config/env';

// Prompts
export {
  buildFoodRecognizeMessages,
  FOOD_RECOGNIZE_TASK,
} from './prompts/food-recognize';
export {
  buildPlanGenerateMessages,
  PLAN_GENERATE_TASK,
} from './prompts/plan-generate';

// core 工具
export { withRetry, isAbortError } from './core/retry';
export type { RetryOptions } from './core/retry';
export { parseSseStream } from './core/stream';
export type { StreamChunk } from './core/stream';

// 类型
export type {
  ChatMessage,
  ChatMessageContentPart,
  TokenUsage,
  AiCallResult,
  FoodRecognizeAiResult,
  GeneratePlanAiResult,
} from './types';
