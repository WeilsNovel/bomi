package com.bomi.shared.security

import platform.Foundation.NSUUID

/**
 * TokenStorage iOS 实现（Stage 0.5 骨架）
 *
 * ⚠️ 当前为内存占位实现，仅保证 expect/actual 契约成立 + 可编译。
 * iOS 开发在 Stage 1 替换为 Keychain（kSecClassGenericPassword）实现：
 *   - saveAccessToken: SecItemAdd
 *   - getAccessToken: SecItemCopyMatching
 *   - clear: SecItemDelete
 * 禁止用 NSUserDefaults 明文存 token。
 */
actual class TokenStorage actual constructor() {

    private var token: String? = null

    actual fun saveAccessToken(token: String) {
        this.token = token
    }

    actual fun getAccessToken(): String? {
        return token
    }

    actual fun clear() {
        token = null
    }

    actual fun newTraceId(): String = NSUUID().UUIDString()
}
