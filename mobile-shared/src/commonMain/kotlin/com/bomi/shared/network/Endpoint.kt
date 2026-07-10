package com.bomi.shared.network

/**
 * API 端点定义（对应服务端 router.go 的路由）
 * 改路由必须先改服务端 router，再同步此处。
 *
 * D011 修订：删除 diet 相关端点，饮食打卡明细完全本地化
 * D010 新增：AI 识别 + 删除临时图片
 */
object Endpoint {
    // 公开（无需鉴权）
    const val WX_LOGIN = "auth/wx-login"
    const val PHONE_LOGIN = "auth/phone-login"
    const val APPLE_LOGIN = "auth/apple-login"
    const val SEND_SMS = "auth/send-sms"

    // 需鉴权 - 用户
    const val USER_PROFILE = "user/profile"

    // 需鉴权 - AI 服务
    const val AI_CHAT = "ai/chat"
    const val AI_FOOD_RECOGNIZE = "ai/food/recognize"
    const val AI_FOOD_DELETE_IMAGE = "ai/food/delete-image"
    const val AI_PLAN_GENERATE = "ai/plan/generate"

    // 注：饮食打卡明细完全本地化（D011），无 diet 端点
}
