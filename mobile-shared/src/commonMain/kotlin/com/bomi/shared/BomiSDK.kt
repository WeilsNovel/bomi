package com.bomi.shared

import com.bomi.shared.cloud.CloudSync
import com.bomi.shared.local.LocalDietStorage
import com.bomi.shared.network.ApiClient
import com.bomi.shared.repository.AuthRepository
import com.bomi.shared.repository.FoodRepository
import com.bomi.shared.repository.PlanRepository
import com.bomi.shared.security.ImageUploader
import com.bomi.shared.security.TokenStorage

/**
 * BomiSDK 入口
 * iOS / Android 原生层通过本对象获取各 Repository，禁止直接 new Repository。
 * 负责：初始化 ApiClient + TokenStorage + 本地存储 + 云同步，协调登录后 token 保存。
 *
 * D011 架构：
 * - 后端 API Repository：Auth / Food(识别+删图) / Plan(生成)
 * - 本地存储 Repository：LocalDietStorage（SQLDelight，完全本地化）
 * - 私有云同步：CloudSync（iCloud / 坚果云，跨设备同步本地数据）
 * - 图片上传：ImageUploader（压缩+传COS临时桶，D010）
 */
class BomiSDK private constructor(
    val tokenStorage: TokenStorage,
    val apiClient: ApiClient,
    val localDietStorage: LocalDietStorage,
    val cloudSync: CloudSync,
    val imageUploader: ImageUploader,
) {
    // 后端 API Repository
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
         * 所有 expect 接口由各端 actual 实现注入。
         */
        fun create(
            tokenStorage: TokenStorage,
            localDietStorage: LocalDietStorage,
            cloudSync: CloudSync,
            imageUploader: ImageUploader,
        ): BomiSDK {
            val apiClient = ApiClient(tokenStorage)
            return BomiSDK(
                tokenStorage = tokenStorage,
                apiClient = apiClient,
                localDietStorage = localDietStorage,
                cloudSync = cloudSync,
                imageUploader = imageUploader,
            )
        }
    }
}
