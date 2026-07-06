// Endpoints - 所有接口路径常量（对照 docs/api-contract.md）
// AI 路径已在 Shared/Constants/AiApiPath.swift 镜像，此处不重复
// 业务路径按模块组织，禁止硬编码字符串散落在调用方

import Foundation

/// HTTP 方法
enum HttpMethod: String {
    case GET
    case POST
    case PUT
    case DELETE
}

/// 请求端点描述（非泛型，泛型在 APIClient.request<T> 声明）
struct Endpoint {
    let path: String
    let method: HttpMethod
    let bodyData: Data?
    let queryItems: [URLQueryItem]
    let additionalHeaders: [String: String]
    let requiresAuth: Bool

    init(path: String,
         method: HttpMethod,
         bodyData: Data? = nil,
         queryItems: [URLQueryItem] = [],
         additionalHeaders: [String: String] = [:],
         requiresAuth: Bool = true) {
        self.path = path
        self.method = method
        self.bodyData = bodyData
        self.queryItems = queryItems
        self.additionalHeaders = additionalHeaders
        self.requiresAuth = requiresAuth
    }
}

/// Auth 认证模块路径
enum AuthPath {
    static let wxLogin = "/api/auth/wx-login"
    static let sendSms = "/api/auth/send-sms"
    static let phoneLogin = "/api/auth/phone-login"
    static let appleLogin = "/api/auth/apple-login"
    static let logout = "/api/auth/logout"
}

/// User 用户模块路径
enum UserPath {
    static let profile = "/api/user/profile"
    static let healthProfile = "/api/user/health-profile"
}

/// Diet 饮食打卡模块路径
enum DietPath {
    static let upload = "/api/diet/upload"
    static let records = "/api/diet/records"
    /// 记录详情/删除（拼接 id）
    static let recordsById = "/api/diet/records/"
    static let dailySummary = "/api/diet/daily-summary"
}

/// Plan 健康计划模块路径
enum PlanPath {
    static let list = "/api/plan/list"
    /// 计划详情/删除（拼接 id）
    static let byId = "/api/plan/"
}

/// Admin 管理后台模块路径
enum AdminPath {
    static let users = "/api/admin/users"
    static let dietRecords = "/api/admin/diet/records"
    static let statsOverview = "/api/admin/stats/overview"
}

/// 路径拼接便利方法
extension String {
    /// 拼接 id 路径，如 "/api/diet/records/" + id(123) → "/api/diet/records/123"
    func appendingId(_ id: Int) -> String {
        return self + String(id)
    }
}
