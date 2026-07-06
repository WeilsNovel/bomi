// AppConfig - 全局配置参数（零硬编码）
// 所有色值/尺寸/文案/超时/路径/API base URL 全部抽到此文件
// 修改配置仅改本文件，禁止散落字面量

import Foundation

/// 应用全局配置（D006 决策: AI Key 不在此处，仅存 useAiProxy 标记）
enum AppConfig {

    // MARK: - 网络配置

    /// API 基础地址（占位，需替换为真实 server 地址）
    /// TODO(技术债): 接入 server 后替换为真实地址，建议从 .xcconfig 读取
    static let apiBaseUrl = "https://api.bomi.com"

    /// 请求超时时间（秒）
    static let requestTimeoutSeconds: Int = 30

    // MARK: - AI 调用

    /// 是否走 server 代理调用 AI（D006: iOS 禁直连 AI 供应商，必须为 true）
    /// iOS 配置只存此标记，绝不出现任何 AI 供应商 API Key
    static let useAiProxy: Bool = true

    // MARK: - 第三方登录

    /// 微信开放平台 iOS AppID（占位，需替换为真实 iOS AppID，非小程序 AppID）
    /// TODO(技术债): 接入微信 SDK 前替换为真实 iOS AppID
    static let wxAppId = "wx_placeholder_ios"

    // MARK: - 分页

    /// 默认分页大小
    static let defaultPageSize: Int = 20

    /// 默认页码（从 1 开始）
    static let defaultPageNum: Int = 1

    // MARK: - UI 主题色（Stage 1 占位，后续扩展 Theme 配置）

    /// 主色（健康绿）
    static let primaryColorHex = "4CAF50"
    /// 次要色
    static let secondaryColorHex = "81C784"
    /// 背景色
    static let backgroundColorHex = "F5F5F5"
    /// 错误色
    static let errorColorHex = "F44336"
    /// 文字主色
    static let textPrimaryColorHex = "212121"
    /// 文字次要色
    static let textSecondaryColorHex = "757575"
    /// 微信品牌色（微信登录按钮）
    static let wechatBrandColorHex = "07C160"
    /// Apple 品牌色（Apple 登录按钮，黑色）
    static let appleBrandColorHex = "000000"

    // MARK: - UI 尺寸

    /// Logo 图标尺寸
    static let logoIconSize: Double = 64
    /// 按钮圆角
    static let buttonCornerRadius: Double = 12
    /// 卡片圆角
    static let cardCornerRadius: Double = 16
    /// 标准间距
    static let spacingStandard: Double = 16
    /// 紧凑间距
    static let spacingCompact: Double = 8

    // MARK: - 默认文案

    /// App 名称
    static let appName = "bomi"
    /// 登录页标题
    static let loginTitle = "欢迎使用 bomi"
    /// 登录页副标题
    static let loginSubtitle = "AI 食物识别 · 健康打卡 · 智能计划"
    /// Apple 登录按钮文案
    static let appleLoginText = "使用 Apple 登录"
    /// 微信登录按钮文案
    static let wxLoginText = "使用微信登录"
    /// 手机号登录按钮文案
    static let phoneLoginText = "使用手机号登录"
    /// 用户协议提示文案
    static let loginAgreementText = "登录即代表同意《bomi 用户协议》和《隐私政策》"
}
