package com.bomi.shared

/**
 * 全局应用配置
 * BaseURL / 超时等运行时参数集中管理，禁止散落到各 Repository。
 */
object AppConfig {

    /** 服务端 BaseURL（按构建变体注入，此处为 dev 默认值） */
    const val BASE_URL_DEV = "http://10.0.2.2:8080/api/v1/"
    const val BASE_URL_PROD = "https://api.bomi.app/api/v1/"

    /** 网络超时（毫秒） */
    const val CONNECT_TIMEOUT_MS = 10_000L
    const val REQUEST_TIMEOUT_MS = 15_000L

    /** 分页默认每页条数 */
    const val DEFAULT_PAGE_SIZE = 20

    /** 是否为开发环境（由各端构建变体覆盖） */
    var isDebug: Boolean = true

    /** 当前生效的 BaseURL */
    val baseUrl: String
        get() = if (isDebug) BASE_URL_DEV else BASE_URL_PROD
}
