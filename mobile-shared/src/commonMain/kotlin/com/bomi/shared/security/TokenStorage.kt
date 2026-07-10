package com.bomi.shared.security

/**
 * Token 存储抽象（expect）
 * 各平台提供 actual 实现：
 * - Android：EncryptedSharedPreferences
 * - iOS：Keychain
 *
 * commonMain 只定义契约，不关心具体存储介质。
 */
expect class TokenStorage() {
    /** 保存访问令牌 */
    fun saveAccessToken(token: String)

    /** 读取访问令牌，未登录返回 null */
    fun getAccessToken(): String?

    /** 清除令牌（登出时调用） */
    fun clear()

    /** 生成 traceId（平台实现可复用 UUID） */
    fun newTraceId(): String
}
