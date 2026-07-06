// LoginViewModel - 登录页视图模型
// MVVM: @Observable（iOS 17+ 需降级用 ObservableObject，本项目最低 iOS 16）
// Stage 1 骨架: 三个登录方法占位 TODO，待 Stage 2 接入 SDK
// 调用 APIClient + 镜像 DTO（WxLoginRequest/AppleLoginRequest/PhoneLoginRequest/SendSmsCodeRequest）

import Foundation

/// 登录页视图模型
final class LoginViewModel: ObservableObject {

    /// 加载状态（防重复点击）
    @Published var isLoading: Bool = false
    /// 错误提示文案
    @Published var errorMessage: String?

    // MARK: - Apple 登录（ASAuthorizationAppleIDProvider，App Store 强制要求）

    /// 触发 Apple Sign In
    /// Stage 1 骨架: 待 Stage 2 接入 AuthenticationServices 框架
    func loginWithApple() async {
        // TODO(Stage2): 接入 ASAuthorizationAppleIDProvider
        // 1. 获取 identityToken + authorizationCode + appleIdentifier
        // 2. 构造 AppleLoginRequest（镜像 DTO）
        // 3. 调 APIClient.post<LoginResponse, AppleLoginRequest>(AuthPath.appleLogin, body: req)
        // 4. 成功后 KeychainHelper.saveToken(resp.token)
        await executeLogin {
            // 占位: 抛出未实现错误
            throw BomiError.business(code: ErrorCode.appleLoginFailed,
                                      message: "Apple 登录待 Stage 2 接入")
        }
    }

    // MARK: - 微信登录（微信开放平台 iOS SDK）

    /// 触发微信登录
    /// Stage 1 骨架: 待 Stage 2 接入微信 SDK（需 iOS 专属 AppID，非小程序 AppID）
    func loginWithWeChat() async {
        // TODO(Stage2): 接入微信 SDK
        // 1. WXApi.sendAuthReq 拉 WeChatApp 拿 code
        // 2. 构造 WxLoginRequest(code: code)
        // 3. 调 APIClient.post<LoginResponse, WxLoginRequest>(AuthPath.wxLogin, body: req)
        // 4. 成功后 KeychainHelper.saveToken(resp.token)
        // 注意: wxAppId 从 AppConfig 取，禁止硬编码
        await executeLogin {
            throw BomiError.business(code: ErrorCode.wxLoginFailed,
                                      message: "微信登录待 Stage 2 接入")
        }
    }

    // MARK: - 手机号验证码登录

    /// 发送短信验证码
    /// - Parameter phone: 手机号
    /// Stage 1 骨架: 待 Stage 2 接入真实接口
    func sendSmsCode(phone: String) async {
        // TODO(Stage2): 接入真实接口
        // 1. 构造 SendSmsCodeRequest(phone: phone, scene: "login")
        // 2. 调 APIClient.post<SendSmsResp, SendSmsCodeRequest>(AuthPath.sendSms, body: req, requiresAuth: false)
        isLoading = true
        defer { isLoading = false }
        do {
            // 占位: 模拟发送
            try await Task.sleep(nanoseconds: 300_000_000)
            errorMessage = "验证码发送功能待 Stage 2 接入"
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    /// 手机号 + 验证码登录
    /// - Parameters: phone, code
    /// Stage 1 骨架: 待 Stage 2 接入真实接口
    func loginWithPhone(phone: String, code: String) async {
        // TODO(Stage2): 接入真实接口
        // 1. 构造 PhoneLoginRequest(phone: phone, code: code)
        // 2. 调 APIClient.post<LoginResponse, PhoneLoginRequest>(AuthPath.phoneLogin, body: req, requiresAuth: false)
        // 3. 成功后 KeychainHelper.saveToken(resp.token)
        await executeLogin {
            throw BomiError.business(code: ErrorCode.smsCodeInvalid,
                                      message: "手机号登录待 Stage 2 接入")
        }
    }

    // MARK: - 私有执行包装

    /// 统一执行登录流程，处理 loading 状态与错误
    private func executeLogin(_ action: () async throws -> Void) async {
        guard !isLoading else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            try await action()
        } catch let error as BomiError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
