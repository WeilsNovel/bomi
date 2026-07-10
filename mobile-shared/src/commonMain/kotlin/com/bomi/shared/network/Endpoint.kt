package com.bomi.shared.network

/**
 * API 端点定义（对应服务端 router.go 的路由）
 * 改路由必须先改服务端 router，再同步此处。
 */
object Endpoint {
    // 公开（无需鉴权）
    const val WX_LOGIN = "auth/wx-login"
    const val PHONE_LOGIN = "auth/phone-login"
    const val APPLE_LOGIN = "auth/apple-login"
    const val SEND_SMS = "auth/send-sms"

    // 需鉴权
    const val USER_PROFILE = "user/profile"
    const val FOOD_RECOGNIZE = "food/recognize"
    const val DIET_LOG = "diet/log"
    const val DIET_LIST = "diet/list"
    const val PLAN_GENERATE = "plan/generate"
    const val AI_CHAT = "ai/chat"
}
