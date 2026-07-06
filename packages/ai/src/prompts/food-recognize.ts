/**
 * 食物识别 Prompt（VLM 视觉模型）
 * 要求模型输出严格 JSON：{ foods: FoodItem[], totalNutrition: NutritionInfo }
 * 禁止 markdown 标记 / 解释文字，确保可程序化解析。
 */
import { AI_TASK } from '@bomi/shared';
import type { ChatMessage } from '../types';

/** 食物识别任务标识 */
export const FOOD_RECOGNIZE_TASK = AI_TASK.FOOD_RECOGNIZE;

/** 系统提示词（要求严格 JSON 输出） */
const FOOD_RECOGNIZE_SYSTEM_PROMPT = `你是专业的食物营养识别助手。用户会上传一张食物照片，你需要：
1. 识别照片中的所有食物
2. 估算每份食物的份量（如 "1 个中等大小 / 150g"）
3. 估算每份食物的营养素（热量 kcal、蛋白质 g、脂肪 g、碳水 g）
4. 给出每项的识别置信度（0-1，1 最确信）

必须严格输出 JSON，禁止任何 markdown 标记（如 \`\`\`json）、解释文字或额外字段。JSON 结构：
{
  "foods": [
    {
      "name": "食物名称",
      "portion": "份量描述",
      "nutrition": { "calories": 0, "protein": 0, "fat": 0, "carbohydrate": 0 },
      "confidence": 0.9
    }
  ],
  "totalNutrition": { "calories": 0, "protein": 0, "fat": 0, "carbohydrate": 0 }
}
totalNutrition 必须等于 foods 中各项 nutrition 之和。
若照片中无食物或无法识别，返回 { "foods": [], "totalNutrition": { "calories": 0, "protein": 0, "fat": 0, "carbohydrate": 0 } }。`;

/** 用户侧文本指令 */
const FOOD_RECOGNIZE_USER_TEXT =
  '请识别这张食物照片中的所有食物，估算份量与营养素，并严格按 JSON 结构输出。';

/**
 * 构建食物识别的 VLM 消息（OpenAI 兼容多模态格式）
 * @param imageUrl 食物图片 URL（OSS / 临时可访问地址）
 */
export function buildFoodRecognizeMessages(imageUrl: string): ChatMessage[] {
  if (!imageUrl) {
    throw new Error('[food-recognize] imageUrl 不能为空');
  }
  return [
    { role: 'system', content: FOOD_RECOGNIZE_SYSTEM_PROMPT },
    {
      role: 'user',
      contentParts: [
        { type: 'image_url', image_url: { url: imageUrl } },
        { type: 'text', text: FOOD_RECOGNIZE_USER_TEXT },
      ],
    },
  ];
}
