package com.bomi.shared.security

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.util.UUID

/**
 * TokenStorage Android 实现
 * 使用 EncryptedSharedPreferences 存储 access token，禁止明文 SharedPreferences。
 *
 * 注意：actual class 构造需 Context，因此实际构造由 Android 端注入，
 * commonMain 的 expect class 无参构造在此通过伴生工厂补充。
 */
actual class TokenStorage actual constructor() {
    private var prefs: EncryptedSharedPreferences? = null

    /**
     * 注入 Android Context 初始化加密存储
     * Android 端 create 时调用一次。
     */
    fun init(context: Context) {
        val masterKey = MasterKey.Builder(context)
            .setEncryptionScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        @Suppress("UNCHECKED_CAST")
        prefs = EncryptedSharedPreferences.create(
            context,
            "bomi_secure_prefs",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        ) as? EncryptedSharedPreferences
    }

    actual fun saveAccessToken(token: String) {
        prefs?.edit()?.putString(KEY_ACCESS_TOKEN, token)?.apply()
    }

    actual fun getAccessToken(): String? {
        return prefs?.getString(KEY_ACCESS_TOKEN, null)
    }

    actual fun clear() {
        prefs?.edit()?.clear()?.apply()
    }

    actual fun newTraceId(): String = UUID.randomUUID().toString()

    private companion object {
        const val KEY_ACCESS_TOKEN = "access_token"
    }
}
