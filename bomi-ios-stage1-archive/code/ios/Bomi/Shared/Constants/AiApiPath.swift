// 镜像 @bomi/shared/src/types/ai-api.ts 的 AI_API_PATH，整合方同步，禁止 iOS 对话擅自修改结构
// 所有 AI 接口路径常量从此引用，禁止硬编码字符串

import Foundation

/// AI 接口路径集合（镜像 AI_API_PATH）
/// iOS 调用 server 转发，禁直连 AI 供应商
public enum AiApiPath {
    /// 通用 AI 对话（支持流式）
    public static let chat = "/api/ai/chat"
    /// 食物识别
    public static let foodRecognize = "/api/ai/food/recognize"
    /// 健康计划生成
    public static let planGenerate = "/api/ai/plan/generate"
}
