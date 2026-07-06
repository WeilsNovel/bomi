// 镜像 @bomi/shared/src/types/enum.ts，整合方同步，禁止 iOS 对话擅自修改结构
// 字段映射: TS enum (number) → Swift enum (Int raw value)，自动 Codable

import Foundation

/// 通用启用 / 禁用状态（镜像 EnableStatus）
public enum EnableStatus: Int, Codable {
    case disabled = 0
    case enabled = 1
}

/// 是 / 否（镜像 YesNo）
public enum YesNo: Int, Codable {
    case no = 0
    case yes = 1
}

/// 软删除标记（镜像 DeletedFlag）
public enum DeletedFlag: Int, Codable {
    case normal = 0
    case deleted = 1
}

/// 性别（镜像 Gender）
public enum Gender: Int, Codable {
    case unknown = 0
    case male = 1
    case female = 2
}

/// 活动水平（镜像 ActivityLevel，用于基础代谢 / 计划生成）
public enum ActivityLevel: Int, Codable {
    /// 久坐
    case sedentary = 1
    /// 轻度活动
    case light = 2
    /// 中度活动
    case moderate = 3
    /// 高度活动
    case high = 4
}
