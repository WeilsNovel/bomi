// BomiError - 网络层统一错误类型
// 错误码与文案从 ErrorCode.swift / ErrorMessageMap 镜像取，禁止硬编码中文

import Foundation

/// 网络层错误文案常量（Networking 层本地常量，不依赖 AppConfig 避免层级倒置）
private enum NetworkErrorMessage {
    static let networkFailure = "网络连接失败，请检查网络后重试"
    static let decodingFailed = "数据解析失败，请稍后重试"
    static let unknown = "操作失败，请稍后重试"
    static func httpError(_ statusCode: Int) -> String {
        return "服务器异常（HTTP \(statusCode)），请稍后重试"
    }
}

/// iOS 客户端统一错误（业务错误码 + 网络层错误）
enum BomiError: Error, LocalizedError {
    /// 业务错误（code != 0，文案来自 ErrorMessageMap 镜像）
    case business(code: Int, message: String)
    /// token 失效，需跳登录页（监听 ErrorCode.tokenExpired）
    case tokenExpired
    /// 网络请求失败（连接错误 / 超时）
    case networkFailure(Error)
    /// 响应解码失败（JSON 结构不匹配）
    case decodingFailed(Error)
    /// HTTP 状态码非 2xx
    case httpError(statusCode: Int)
    /// 未知错误
    case unknown

    var errorDescription: String? {
        switch self {
        case let .business(code, message):
            return ErrorMessageMap.message(for: code).isEmpty ? message : ErrorMessageMap.message(for: code)
        case .tokenExpired:
            return ErrorMessageMap.message(for: ErrorCode.tokenExpired)
        case .networkFailure:
            return NetworkErrorMessage.networkFailure
        case .decodingFailed:
            return NetworkErrorMessage.decodingFailed
        case let .httpError(statusCode):
            return NetworkErrorMessage.httpError(statusCode)
        case .unknown:
            return NetworkErrorMessage.unknown
        }
    }

    /// 是否需要跳登录页（token 失效 / 未登录）
    var requiresReauth: Bool {
        switch self {
        case .tokenExpired:
            return true
        case let .business(code, _):
            return code == ErrorCode.tokenExpired || code == ErrorCode.unauthorized
        default:
            return false
        }
    }
}
