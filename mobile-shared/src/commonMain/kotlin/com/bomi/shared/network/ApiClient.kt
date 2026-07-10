package com.bomi.shared.network

import com.bomi.shared.AppConfig
import com.bomi.shared.BaseApiResponse
import com.bomi.shared.BomiException
import com.bomi.shared.ErrorCode
import com.bomi.shared.NetworkException
import com.bomi.shared.security.TokenStorage
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json

/**
 * 统一 API 客户端（KMP commonMain）
 * 负责：BaseURL / 超时 / JSON 序列化 / Token 注入 / 响应解包 / 错误码映射。
 * 所有 Repository 通过本类发请求，禁止直接 new HttpClient。
 */
class ApiClient(
    private val tokenStorage: TokenStorage,
) {
    val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
        explicitNulls = false
    }

    val httpClient: HttpClient = HttpClient {
        install(ContentNegotiation) { json(this@ApiClient.json) }
        install(Logging)
        install(HttpTimeout) {
            connectTimeoutMillis = AppConfig.CONNECT_TIMEOUT_MS
            requestTimeoutMillis = AppConfig.REQUEST_TIMEOUT_MS
        }
    }

    /** GET 请求，返回解包后的 data */
    suspend inline fun <reified T> get(path: String, params: Map<String, Any?> = emptyMap()): T {
        return request(HttpMethod.Get, path, params, null)
    }

    /** POST 请求 */
    suspend inline fun <reified T, reified B> post(path: String, body: B? = null): T {
        return request(HttpMethod.Post, path, emptyMap(), body)
    }

    /** 统一请求 + 响应解包 */
    suspend inline fun <reified T, reified B> request(
        method: HttpMethod,
        path: String,
        params: Map<String, Any?>,
        body: B?,
    ): T {
        return try {
            val resp = httpClient.request {
                url("${AppConfig.baseUrl}$path")
                this.method = method
                // Token 注入
                tokenStorage.getAccessToken()?.let { token ->
                    header(HttpHeaders.Authorization, "Bearer $token")
                }
                // traceId 透传（KMP 侧生成，服务端优先透传）
                header("X-Trace-Id", tokenStorage.newTraceId())
                // query 参数
                params.forEach { (k, v) ->
                    if (v != null) parameter(k, v.toString())
                }
                // body
                if (body != null) {
                    contentType(ContentType.Application.Json)
                    setBody(body)
                }
            }
            unwrap<T>(resp)
        } catch (e: Exception) {
            throw NetworkException("网络请求失败: ${e.message}", e)
        }
    }

    /** 解包 BaseApiResponse：code != 0 抛 BomiException */
    suspend inline fun <reified T> unwrap(resp: HttpResponse): T {
        val apiResp: BaseApiResponse<T> = resp.body()
        if (apiResp.code != ErrorCode.SUCCESS) {
            throw BomiException(apiResp.code, apiResp.message, apiResp.traceId)
        }
        return apiResp.data ?: throw BomiException(ErrorCode.SERVER_ERROR, "响应数据为空")
    }
}
