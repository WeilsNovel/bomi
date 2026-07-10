package com.bomi.shared

/**
 * 业务错误码（与 proto/bomi/enum/error_code.proto / 服务端 constants/errorcode.go 对齐）
 * 新增错误码必须先改 proto，再同步本文件。
 */
object ErrorCode {
    const val SUCCESS = 0
    const val PARAM_INVALID = 40001
    const val UNAUTHORIZED = 40101
    const val TOKEN_EXPIRED = 40102
    const val FORBIDDEN = 40301
    const val NOT_FOUND = 40401
    const val SERVER_ERROR = 50001
    const val RATE_LIMIT = 42901
    const val THIRD_PARTY_ERROR = 50002
    const val WX_LOGIN_FAILED = 40111
    const val SMS_CODE_INVALID = 40112
    const val PHONE_ALREADY_BOUND = 40113
    const val APPLE_LOGIN_FAILED = 40114
    const val AI_RECOGNIZE_FAILED = 50021
    const val AI_PLAN_GENERATE_FAILED = 50022
    const val AI_TIMEOUT = 50023
    const val IMAGE_UPLOAD_FAILED = 50031
}

/**
 * 业务异常
 * Repository 解包 BaseApiResponse 时，code != 0 抛此异常，UI 层 catch 后按 code 走对应反馈。
 */
class BomiException(
    val code: Int,
    override val message: String,
    val traceId: String? = null,
) : Exception(message)

/** 网络层异常（连接失败 / 超时，非业务码） */
class NetworkException(override val message: String, cause: Throwable? = null) : Exception(message, cause)
