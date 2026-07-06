// APIClient - 网络请求封装
// 功能: URLSession 异步请求, 泛型 decode, 解包 BaseApiResponse<T>, code != 0 抛 BomiError
// 鉴权: 自动注入 Authorization: Bearer <token>（从 Keychain 读取）
// 配置: apiBaseUrl / requestTimeout 从 AppConfig 取，禁止硬编码

import Foundation

/// 网络请求客户端（全局单例）
final class APIClient {

    /// 全局共享实例
    static let shared = APIClient()

    /// URL 构造用的 base URL（从 AppConfig 取，禁止硬编码）
    private let baseURL: URL
    /// 请求超时时间（秒，从 AppConfig 取）
    private let timeout: TimeInterval
    /// JSON 解码器
    private let decoder: JSONDecoder
    /// JSON 编码器
    private let encoder: JSONEncoder
    /// URLSession 实例
    private let session: URLSession

    private init() {
        self.baseURL = URL(string: AppConfig.apiBaseUrl)!
        self.timeout = TimeInterval(AppConfig.requestTimeoutSeconds)
        self.decoder = JSONDecoder()
        self.encoder = JSONEncoder()
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = self.timeout
        config.timeoutIntervalForResource = self.timeout
        self.session = URLSession(configuration: config)
    }

    /// 发送请求并解包 BaseApiResponse<T>
    /// - Parameter endpoint: 请求端点描述
    /// - Returns: BaseApiResponse.data 字段（类型 T）
    /// - Throws: BomiError（业务错误 / 网络错误 / 解码错误）
    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> T {
        let urlRequest = try buildRequest(endpoint)
        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: urlRequest)
        } catch {
            throw BomiError.networkFailure(error)
        }

        // HTTP 状态码校验
        guard let httpResponse = response as? HTTPURLResponse else {
            throw BomiError.unknown
        }
        guard (200...299).contains(httpResponse.statusCode) else {
            throw BomiError.httpError(statusCode: httpResponse.statusCode)
        }

        // 解码 BaseApiResponse<T>
        let apiResponse: BaseApiResponse<T>
        do {
            apiResponse = try decoder.decode(BaseApiResponse<T>.self, from: data)
        } catch {
            throw BomiError.decodingFailed(error)
        }

        // 业务码校验
        guard apiResponse.code == ErrorCode.success else {
            // token 失效特殊处理
            if apiResponse.code == ErrorCode.tokenExpired {
                throw BomiError.tokenExpired
            }
            throw BomiError.business(code: apiResponse.code, message: apiResponse.message)
        }

        return apiResponse.data
    }

    /// 构造 URLRequest
    private func buildRequest(_ endpoint: Endpoint) throws -> URLRequest {
        // 拼接 URL + query
        var components = URLComponents(url: baseURL.appendingPathComponent(endpoint.path),
                                       resolvingAgainstBaseURL: false)
        if !endpoint.queryItems.isEmpty {
            components?.queryItems = endpoint.queryItems
        }
        guard let url = components?.url else {
            throw BomiError.unknown
        }

        var request = URLRequest(url: url)
        request.httpMethod = endpoint.method.rawValue
        request.timeoutInterval = timeout

        // 默认 Content-Type
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // 注入鉴权头
        if endpoint.requiresAuth, let token = KeychainHelper.loadToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        // 额外 headers
        for (key, value) in endpoint.additionalHeaders {
            request.setValue(value, forHTTPHeaderField: key)
        }

        // body
        if let bodyData = endpoint.bodyData {
            request.httpBody = bodyData
        }

        return request
    }

    // MARK: - 便利方法

    /// GET 请求便利方法
    func get<T: Decodable>(_ path: String,
                            query: [URLQueryItem] = [],
                            requiresAuth: Bool = true) async throws -> T {
        let endpoint = Endpoint(path: path, method: .GET, queryItems: query, requiresAuth: requiresAuth)
        return try await request(endpoint)
    }

    /// POST 请求便利方法（带 Encodable body）
    func post<T: Decodable, Body: Encodable>(_ path: String,
                                               body: Body,
                                               requiresAuth: Bool = true) async throws -> T {
        let bodyData = try encoder.encode(body)
        let endpoint = Endpoint(path: path, method: .POST, bodyData: bodyData, requiresAuth: requiresAuth)
        return try await request(endpoint)
    }

    /// PUT 请求便利方法（带 Encodable body）
    func put<T: Decodable, Body: Encodable>(_ path: String,
                                              body: Body,
                                              requiresAuth: Bool = true) async throws -> T {
        let bodyData = try encoder.encode(body)
        let endpoint = Endpoint(path: path, method: .PUT, bodyData: bodyData, requiresAuth: requiresAuth)
        return try await request(endpoint)
    }

    /// DELETE 请求便利方法
    func delete<T: Decodable>(_ path: String, requiresAuth: Bool = true) async throws -> T {
        let endpoint = Endpoint(path: path, method: .DELETE, requiresAuth: requiresAuth)
        return try await request(endpoint)
    }
}
