// LoginView - 登录页（Stage 1 骨架）
// 三个登录按钮: Apple Sign In / 微信 / 手机号
// 点击回调占位 TODO，UI 参数从 AppConfig 取，禁止硬编码色值/文案/尺寸

import SwiftUI

struct LoginView: View {

    @StateObject private var viewModel = LoginViewModel()

    var body: some View {
        VStack(spacing: AppConfig.spacingStandard) {
            Spacer()

            // MARK: - Logo 区
            VStack(spacing: AppConfig.spacingCompact) {
                Image(systemName: "leaf.fill")
                    .font(.system(size: AppConfig.logoIconSize))
                    .foregroundColor(Color(hex: AppConfig.primaryColorHex))
                Text(AppConfig.loginTitle)
                    .font(.title)
                    .fontWeight(.bold)
                Text(AppConfig.loginSubtitle)
                    .font(.subheadline)
                    .foregroundColor(Color(hex: AppConfig.textSecondaryColorHex))
            }

            Spacer()

            // MARK: - 错误提示
            if let errorMessage = viewModel.errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundColor(Color(hex: AppConfig.errorColorHex))
                    .padding(.horizontal, AppConfig.spacingStandard)
                    .multilineTextAlignment(.center)
            }

            // MARK: - 登录按钮区
            VStack(spacing: AppConfig.spacingCompact) {
                // Apple 登录（App Store 强制要求，有第三方登录必须有 Apple）
                Button {
                    Task { await viewModel.loginWithApple() }
                } label: {
                    HStack {
                        Image(systemName: "applelogo")
                        Text(AppConfig.appleLoginText)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.black)
                    .foregroundColor(.white)
                    .cornerRadius(AppConfig.buttonCornerRadius)
                }
                .disabled(viewModel.isLoading)

                // 微信登录
                Button {
                    Task { await viewModel.loginWithWeChat() }
                } label: {
                    HStack {
                        Image(systemName: "message.fill")
                        Text(AppConfig.wxLoginText)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(hex: AppConfig.wechatBrandColorHex))
                    .foregroundColor(.white)
                    .cornerRadius(AppConfig.buttonCornerRadius)
                }
                .disabled(viewModel.isLoading)

                // 手机号登录
                Button {
                    // TODO(Stage2): 弹出手机号 + 验证码输入弹窗
                    Task { await viewModel.sendSmsCode(phone: "") }
                } label: {
                    HStack {
                        Image(systemName: "phone.fill")
                        Text(AppConfig.phoneLoginText)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(hex: AppConfig.primaryColorHex))
                    .foregroundColor(.white)
                    .cornerRadius(AppConfig.buttonCornerRadius)
                }
                .disabled(viewModel.isLoading)
            }
            .padding(.horizontal, AppConfig.spacingStandard)

            // 用户协议
            Text(AppConfig.loginAgreementText)
                .font(.caption2)
                .foregroundColor(Color(hex: AppConfig.textSecondaryColorHex))
                .padding(.bottom, AppConfig.spacingStandard)
        }
        .background(Color(hex: AppConfig.backgroundColorHex))
        .ignoresSafeArea(edges: .bottom)
    }
}

// MARK: - Color Hex 扩展

/// Color hex 扩展（从 AppConfig 的 hex 字符串构造 Color）
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b: UInt64
        switch hex.count {
        case 6:
            (r, g, b) = (int >> 16, int >> 8 & 0xFF, int & 0xFF)
        default:
            (r, g, b) = (0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: 1
        )
    }
}

// MARK: - 预览

#Preview {
    LoginView()
}
