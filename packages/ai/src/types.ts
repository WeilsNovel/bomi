/**
 * AI 层本地类型（非共享部分）
 * ChatMessage 对齐 OpenAI 兼容接口的多模态消息格式。
 */
import type {
  AiMessage,
  AiMessageRole,
  AiToolCall,
} from '@bomi/shared';

/** 聊天消息内容片段（多模态：文本 / 图片 URL） */
export interface ChatMessageContentPart {
  /** 内容类型 */
  type: 'text' | 'image_url';
  /** 文本内容（type=text 时） */
  text?: string;
  /** 图片 URL（type=image_url 时） */
  image_url?: { url: string };
}

/** 聊天消息（OpenAI 兼容格式） */
export interface ChatMessage {
  /** 角色（与 shared AiMessageRole 对齐，含 tool） */
  role: AiMessageRole;
  /** 文本内容（纯文本消息） */
  content?: string;
  /** 多模态内容（图片 + 文本，VLM 用） */
  contentParts?: ChatMessageContentPart[];
  /** 工具调用 ID（role = tool 时） */
  toolCallId?: string;
}

/** token 用量（计费 / 统计） */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/** AI 调用结果（统一包装：data + usage + model + 耗时） */
export interface AiCallResult<T> {
  data: T;
  usage: TokenUsage;
  model: string;
  durationMs: number;
}

/** 食物识别 AI 层结果（解析模型 JSON 输出后） */
export interface FoodRecognizeAiResult {
  foods: import('@bomi/shared').FoodItem[];
  totalNutrition: import('@bomi/shared').NutritionInfo;
}

/** 计划生成 AI 层结果（解析模型 JSON 输出后） */
export interface GeneratePlanAiResult {
  planName: string;
  totalDays: number;
  dailyTarget: import('@bomi/shared').NutritionInfo;
  days: import('@bomi/shared').DayPlan[];
  advice: string;
}

/** 将 shared AiMessage 转为 AI 层 ChatMessage（兼容纯文本消息） */
export function toChatMessage(msg: AiMessage): ChatMessage {
  return {
    role: msg.role,
    content: msg.content,
    toolCallId: msg.toolCallId,
  };
}

/** 工具调用占位类型（与 shared 对齐） */
export type { AiToolCall };
