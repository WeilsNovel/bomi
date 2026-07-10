package com.bomi.shared.repository

import com.bomi.shared.UserItem
import com.bomi.shared.network.ApiClient
import com.bomi.shared.network.Endpoint
import kotlinx.serialization.Serializable

/**
 * 鉴权 Repository
 * 登录成功后保存 token；登出清除 token。
 */
class AuthRepository(private val api: ApiClient) {

    @Serializable
    data class WxLoginRequest(val code: String)

    @Serializable
    data class PhoneLoginRequest(val phone: String, val code: String)

    @Serializable
    data class AppleLoginRequest(val identityToken: String, val authCode: String?)

    @Serializable
    data class SendSmsRequest(val phone: String)

    @Serializable
    data class LoginResult(
        val token: String,
        val user: UserItem,
    )

    suspend fun wxLogin(code: String): LoginResult {
        return api.post(Endpoint.WX_LOGIN, WxLoginRequest(code))
    }

    suspend fun phoneLogin(phone: String, smsCode: String): LoginResult {
        return api.post(Endpoint.PHONE_LOGIN, PhoneLoginRequest(phone, smsCode))
    }

    suspend fun appleLogin(identityToken: String, authCode: String?): LoginResult {
        return api.post(Endpoint.APPLE_LOGIN, AppleLoginRequest(identityToken, authCode))
    }

    suspend fun sendSms(phone: String) {
        api.post<Unit, SendSmsRequest>(Endpoint.SEND_SMS, SendSmsRequest(phone))
    }
}
