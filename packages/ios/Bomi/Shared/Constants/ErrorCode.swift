// 镜像 @bomi/shared/src/constants/error-code.ts，整合方同步，禁止 iOS 对话擅自修改结构
// 镜像 ERROR_CODE 常量 + ERROR_MESSAGE_MAP 文案映射
// BomiError 从本文件取错误码与文案，禁止硬编码中文

import Foundation

/// 业务错误码（镜像 ERROR_CODE，对齐服务端）
public enum ErrorCode {
    /// 成功
    public static let success = 0
    /// 参数校验失败
    public static let paramInvalid = 40001
    /// 未登录
    public static let unauthorized = 40101
    /// token 失效
    public static let tokenExpired = 40102
    /// 无权限
    public static let forbidden = 40301
    /// 资源不存在
    public static let notFound = 40401
    /// 服务器错误
    public static let serverError = 50001
    /// 业务限流
    public static let rateLimit = 42901
    /// 第三方服务异常（短信 / AI / OSS 等）
    public static let thirdPartyError = 50002
    /// 微信登录失败
    public static let wxLoginFailed = 40111
    /// 短信验证码错误或已过期
    public static let smsCodeInvalid = 40112
    /// 手机号已被绑定
    public static let phoneAlreadyBound = 40113
    /// Apple 登录失败（iOS 客户端）
    public static let appleLoginFailed = 40114
    /// AI 识别失败（图片无法识别 / 供应商返回错误）
    public static let aiRecognizeFailed = 50021
    /// AI 计划生成失败
    public static let aiPlanGenerateFailed = 50022
    /// AI 调用超时
    public static let aiTimeout = 50023
    /// 图片上传失败
    public static let imageUploadFailed = 50031
}

/// 错误码对应文案映射（镜像 ERROR_MESSAGE_MAP，前端展示用）
/// 注意：文案由整合方同步，禁止 iOS 对话擅自修改
public enum ErrorMessageMap {
    public static let map: [Int: String] = [
        ErrorCode.success: "操作成功",
        ErrorCode.paramInvalid: "参数错误",
        ErrorCode.unauthorized: "请先登录",
        ErrorCode.tokenExpired: "登录已过期，请重新登录",
        ErrorCode.forbidden: "无操作权限",
        ErrorCode.notFound: "资源不存在",
        ErrorCode.serverError: "服务器异常，请稍后重试",
        ErrorCode.rateLimit: "操作过于频繁，请稍后再试",
        ErrorCode.thirdPartyError: "服务暂时不可用，请稍后重试",
        ErrorCode.wxLoginFailed: "微信登录失败，请重试",
        ErrorCode.smsCodeInvalid: "验证码错误或已过期",
        ErrorCode.phoneAlreadyBound: "该手机号已被其他账号绑定",
        ErrorCode.appleLoginFailed: "Apple 登录失败，请重试",
        ErrorCode.aiRecognizeFailed: "识别失败，请重新拍摄清晰的食物照片",
        ErrorCode.aiPlanGenerateFailed: "计划生成失败，请稍后重试",
        ErrorCode.aiTimeout: "识别超时，请稍后重试",
        ErrorCode.imageUploadFailed: "图片上传失败，请重试",
    ]

    /// 根据错误码取文案，未命中返回默认文案
    public static func message(for code: Int) -> String {
        map[code] ?? "操作失败，请稍后重试"
    }
}
