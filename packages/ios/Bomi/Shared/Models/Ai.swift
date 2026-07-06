// 镜像 @bomi/shared/src/types/ai.ts，整合方同步，禁止 iOS 对话擅自修改结构
// 字段映射: tokens→Int, temperature→Double, Record<string,unknown>→[String: AnyCodable]

import Foundation

/// AI 消息角色（镜像 AiMessageRole）
public enum AiMessageRole: String, Codable {
    case system
    case user
    case assistant
    case tool
}

/// AI 消息结构（镜像 AiMessage）
public struct AiMessage: Codable {
    public let role: AiMessageRole
    public let content: String
    /// 工具调用 ID（role = tool 时）
    public let toolCallId: String?

    public init(role: AiMessageRole, content: String, toolCallId: String? = nil) {
        self.role = role
        self.content = content
        self.toolCallId = toolCallId
    }
}

/// AI 请求参数（镜像 AiRequest）
public struct AiRequest: Encodable {
    /// 会话 ID
    public let sessionId: String
    /// 消息列表
    public let messages: [AiMessage]
    /// 模型名称（覆盖默认）
    public let model: String?
    /// 温度 0-2
    public let temperature: Double?
    /// 最大 token
    public let maxTokens: Int?
    /// 是否流式返回
    public let stream: Bool?
    /// 启用的工具列表
    public let tools: [String]?

    public init(sessionId: String,
                messages: [AiMessage],
                model: String? = nil,
                temperature: Double? = nil,
                maxTokens: Int? = nil,
                stream: Bool? = nil,
                tools: [String]? = nil) {
        self.sessionId = sessionId
        self.messages = messages
        self.model = model
        self.temperature = temperature
        self.maxTokens = maxTokens
        self.stream = stream
        self.tools = tools
    }
}

/// AI 响应的 token 用量（镜像 AiResponse.usage 嵌套结构）
public struct AiTokenUsage: Codable {
    public let promptTokens: Int
    public let completionTokens: Int
    public let totalTokens: Int
}

/// 工具调用结构（镜像 AiToolCall）
public struct AiToolCall: Codable {
    public let name: String
    /// 原TS: Record<string, unknown>，Swift 用 AnyCodable 包装动态 JSON
    public let arguments: [String: AnyCodable]
}

/// AI 响应结构（镜像 AiResponse）
public struct AiResponse: Decodable {
    public let sessionId: String
    /// 回复内容
    public let content: String
    /// 使用的模型
    public let model: String
    /// token 用量（计费 / 统计）
    public let usage: AiTokenUsage
    /// 工具调用结果（如有）
    public let toolCalls: [AiToolCall]?
}

/// AI 流式响应分片 data 结构（镜像 AiChatEndpoint.streamChunk.data）
public struct AiStreamChunkData: Decodable {
    public let content: String
    public let done: Bool
}
