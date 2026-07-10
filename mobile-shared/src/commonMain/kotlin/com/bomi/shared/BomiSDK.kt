package com.bomi.shared

import com.bomi.shared.network.ApiClient
import com.bomi.shared.repository.AuthRepository
import com.bomi.shared.repository.FoodRepository
import com.bomi.shared.repository.PlanRepository
import com.bomi.shared.security.TokenStorage

/**
 * BomiSDK 入口
 * iOS / Android 原生层通过本对象获取各 Repository，禁止直接 new Repository。
 * 负责：初始化 ApiClient + TokenStorage，协调登录后 token 保存。
 */
class BomiSDK private constructor(
    val tokenStorage: TokenStorage,
    val apiClient: ApiClient,
) {
    val authRepository = AuthRepository(apiClient)
    val foodRepository = FoodRepository(apiClient)
    val planRepository = PlanRepository(apiClient)

    /**
     * 登录成功后保存 token（供 ApiClient 后续请求注入）
     * 各 login 方法返回 LoginResult 后，由 SDK 统一调用本方法持久化 token。
     */
    fun saveToken(token: String) {
        tokenStorage.saveAccessToken(token)
    }

    /** 登出：清除本地 token */
    fun logout() {
        tokenStorage.clear()
    }

    companion object {
        /**
         * 初始化 SDK（各端 App 启动时调用一次）
         * TokenStorage 由各端 actual 实现注入。
         */
        fun create(tokenStorage: TokenStorage): BomiSDK {
            val apiClient = ApiClient(tokenStorage)
            return BomiSDK(tokenStorage, apiClient)
        }
    }
}
