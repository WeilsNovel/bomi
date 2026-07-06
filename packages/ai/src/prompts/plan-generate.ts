/**
 * 健康计划生成 Prompt
 * 基于用户健康档案生成多日饮食计划，要求严格 JSON 输出。
 */
import {
  ACTIVITY_LEVEL_LABEL,
  AI_TASK,
  PLAN_TYPE_LABEL,
  type Gender,
  type HealthProfile,
} from '@bomi/shared';
import type { ChatMessage } from '../types';

/** 计划生成任务标识 */
export const PLAN_GENERATE_TASK = AI_TASK.PLAN_GENERATE;

/** 性别展示文案（shared 未提供 label，本文件作为 Prompt 层局部参数） */
const GENDER_LABEL: Record<Gender, string> = {
  0: '未知',
  1: '男',
  2: '女',
};

/** 默认生成天数（健康档案未指定时兜底） */
const DEFAULT_PLAN_DAYS = 7;

/** 构建系统提示词 */
function buildSystemPrompt(): string {
  return `你是专业的健康饮食计划顾问。根据用户的健康档案，生成科学的多日饮食计划。

必须严格输出 JSON，禁止任何 markdown 标记（如 \`\`\`json）、解释文字或额外字段。JSON 结构：
{
  "planName": "计划名称",
  "totalDays": 7,
  "dailyTarget": { "calories": 0, "protein": 0, "fat": 0, "carbohydrate": 0 },
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "targetNutrition": { "calories": 0, "protein": 0, "fat": 0, "carbohydrate": 0 },
      "meals": [
        { "mealType": 1, "suggestion": "具体饮食建议", "targetNutrition": { "calories": 0, "protein": 0, "fat": 0, "carbohydrate": 0 } }
      ]
    }
  ],
  "advice": "整体饮食与运动建议"
}
规则：
- mealType：1=早餐 2=午餐 3=晚餐 4=加餐，每日至少包含早午晚三餐。
- date 从今天起按日递增，格式 YYYY-MM-DD。
- dailyTarget 等于计划每日总目标；各 day 的 targetNutrition 可围绕 dailyTarget 微调。
- 所有营养素数值为合理估算，单位：calories=kcal，protein/fat/carbohydrate=g。`;
}

/** 构建用户提示词（注入健康档案） */
function buildUserPrompt(profile: HealthProfile): string {
  const genderLabel = GENDER_LABEL[profile.gender] ?? '未知';
  const activityLabel =
    ACTIVITY_LEVEL_LABEL[profile.activityLevel as number] ?? '未知';
  const planTypeLabel = PLAN_TYPE_LABEL[profile.planType as number] ?? '健康维持';
  const targetWeight = profile.targetWeight
    ? `${profile.targetWeight}kg`
    : '未设定';

  return `请根据以下健康档案生成 ${DEFAULT_PLAN_DAYS} 天的饮食计划：
- 性别：${genderLabel}
- 年龄：${profile.age} 岁
- 身高：${profile.height} cm
- 体重：${profile.weight} kg
- 目标体重：${targetWeight}
- 活动水平：${activityLabel}
- 计划类型：${planTypeLabel}

请严格按 JSON 结构输出。`;
}

/**
 * 构建计划生成的消息
 * @param profile 用户健康档案
 */
export function buildPlanGenerateMessages(profile: HealthProfile): ChatMessage[] {
  if (!profile || typeof profile.userId !== 'number') {
    throw new Error('[plan-generate] 健康档案不合法');
  }
  return [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: buildUserPrompt(profile) },
  ];
}
