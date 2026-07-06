// 镜像 @bomi/shared/src/types/api.ts，整合方同步，禁止 iOS 对话擅自修改结构
// 字段映射: number→Int/Double, string→String, ?→Optional, 泛型 T→Swift 泛型 T

import Foundation

/// 统一响应结构（镜像 BaseApiResponse<T>）
/// 服务端全局响应拦截器输出，APIClient 解包后 code != 0 抛 BomiError
public struct BaseApiResponse<T: Decodable>: Decodable {
    /// 业务状态码（0 = 成功，非 0 = 失败，对齐服务端 ERROR_CODE）
    public let code: Int
    /// 提示消息（前端可直出，文案以 ERROR_MESSAGE_MAP 为准）
    public let message: String
    /// 业务数据
    public let data: T
    /// 请求追踪 ID（服务端生成，前端日志记录）
    public let traceId: String?
    /// 服务器时间戳（毫秒，用于时间同步校验）
    public let timestamp: Double?
}

/// 分页响应结构（镜像 PageData<T>）
public struct PageData<T: Decodable>: Decodable {
    public let list: [T]
    public let total: Int
    public let pageNum: Int
    public let pageSize: Int
}

/// 通用分页请求入参（镜像 PageQuery）
public struct PageQuery: Encodable {
    public let pageNum: Int
    public let pageSize: Int

    public init(pageNum: Int, pageSize: Int) {
        self.pageNum = pageNum
        self.pageSize = pageSize
    }
}

/// 通用 ID 入参（镜像 IdParam）
public struct IdParam: Encodable {
    public let id: Int

    public init(id: Int) {
        self.id = id
    }
}
