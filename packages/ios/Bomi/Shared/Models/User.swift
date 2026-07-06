// 镜像 @bomi/shared/src/types/user.ts，整合方同步，禁止 iOS 对话擅自修改结构
// 字段映射: id/status→Int, number→Int/Double, string→String, ?→Optional, union→String+注释

import Foundation

/// 用户实体（镜像 UserItem）
public struct UserItem: Codable {
    public let id: Int
    /// 昵称
    public let nickname: String
    /// 头像 URL
    public let avatar: String
    /// 手机号（脱敏后返回前端，如 138****8888）
    public let phone: String
    /// 性别
    public let gender: Gender
    /// 用户状态：1 启用 / 0 禁用
    public let status: Int
    public let createdAt: String
    public let updatedAt: String
}

/// 微信登录入参（镜像 WxLoginRequest）
public struct WxLoginRequest: Encodable {
    /// wx.login 返回的 code
    public let code: String
    /// 用户授权昵称（新版小程序通过按钮授权获取）
    public let nickname: String?
    /// 用户授权头像 URL
    public let avatar: String?

    public init(code: String, nickname: String? = nil, avatar: String? = nil) {
        self.code = code
        self.nickname = nickname
        self.avatar = avatar
    }
}

/// Apple 登录入参（镜像 AppleLoginRequest，iOS 客户端专用，App Store 强制要求）
public struct AppleLoginRequest: Encodable {
    /// Apple 返回的 JWT identityToken
    public let identityToken: String
    /// Apple 返回的授权码
    public let authorizationCode: String
    /// Apple 用户唯一标识（同 Apple ID 跨 App 稳定）
    public let appleIdentifier: String
    /// 首次授权才有，后续授权返回空
    public let fullName: AppleFullName?
    /// 用户自填昵称（Apple 不返回昵称，需客户端引导用户设置）
    public let nickname: String?

    public init(identityToken: String,
                authorizationCode: String,
                appleIdentifier: String,
                fullName: AppleFullName? = nil,
                nickname: String? = nil) {
        self.identityToken = identityToken
        self.authorizationCode = authorizationCode
        self.appleIdentifier = appleIdentifier
        self.fullName = fullName
        self.nickname = nickname
    }
}

/// Apple 返回的用户姓名（镜像 AppleLoginRequest.fullName 嵌套结构）
public struct AppleFullName: Encodable {
    public let givenName: String?
    public let familyName: String?

    public init(givenName: String? = nil, familyName: String? = nil) {
        self.givenName = givenName
        self.familyName = familyName
    }
}

/// 手机号验证码登录入参（镜像 PhoneLoginRequest）
public struct PhoneLoginRequest: Encodable {
    public let phone: String
    /// 短信验证码
    public let code: String

    public init(phone: String, code: String) {
        self.phone = phone
        self.code = code
    }
}

/// 发送短信验证码入参（镜像 SendSmsCodeRequest）
/// 注: TS scene 为 'login' | 'bind' 联合类型，对应 business.ts 的 SMS_SCENE 常量
public struct SendSmsCodeRequest: Encodable {
    public let phone: String
    /// 场景：login 登录 / bind 绑定（对应 SMS_SCENE，见 Shared/Constants 暂未镜像 business.ts）
    public let scene: String

    public init(phone: String, scene: String) {
        self.phone = phone
        self.scene = scene
    }
}

/// 登录响应（镜像 LoginResponse）
public struct LoginResponse: Decodable {
    /// JWT token
    public let token: String
    /// 用户信息
    public let user: UserItem
}

/// 用户列表查询入参（镜像 UserListRequest，管理后台用）
public struct UserListRequest: Encodable {
    public let pageNum: Int
    public let pageSize: Int
    public let keyword: String?
    public let status: Int?

    public init(pageNum: Int, pageSize: Int, keyword: String? = nil, status: Int? = nil) {
        self.pageNum = pageNum
        self.pageSize = pageSize
        self.keyword = keyword
        self.status = status
    }
}

/// 用户列表响应（镜像 UserListResponse = PageData<UserItem>）
public typealias UserListResponse = PageData<UserItem>

/// 更新用户入参（镜像 UserUpdateRequest，管理后台用）
public struct UserUpdateRequest: Encodable {
    public let nickname: String?
    public let status: Int?

    public init(nickname: String? = nil, status: Int? = nil) {
        self.nickname = nickname
        self.status = status
    }
}
