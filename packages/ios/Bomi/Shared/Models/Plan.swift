// 镜像 @bomi/shared/src/types/plan.ts，整合方同步，禁止 iOS 对话擅自修改结构
// 字段映射: id/userId/age/totalDays/day/mealType→Int, 度量值→Double, string→String, ?→Optional

import Foundation

/// 计划类型（镜像 PlanType）
public enum PlanType: Int, Codable {
    /// 减脂
    case fatLoss = 1
    /// 增肌
    case muscleGain = 2
    /// 维持 / 健康
    case maintain = 3
}

/// 用户健康档案（镜像 HealthProfile，用于生成计划）
public struct HealthProfile: Codable {
    public let userId: Int
    public let gender: Gender
    public let age: Int
    /// 身高 cm
    public let height: Double
    /// 体重 kg
    public let weight: Double
    /// 目标体重 kg
    public let targetWeight: Double?
    public let activityLevel: ActivityLevel
    public let planType: PlanType

    public init(userId: Int,
                gender: Gender,
                age: Int,
                height: Double,
                weight: Double,
                targetWeight: Double? = nil,
                activityLevel: ActivityLevel,
                planType: PlanType) {
        self.userId = userId
        self.gender = gender
        self.age = age
        self.height = height
        self.weight = weight
        self.targetWeight = targetWeight
        self.activityLevel = activityLevel
        self.planType = planType
    }
}

/// 生成计划请求（镜像 GeneratePlanRequest，前端 → server）
public struct GeneratePlanRequest: Encodable {
    /// 健康档案（前端传，或服务端读取已有档案）
    public let profile: HealthProfile

    public init(profile: HealthProfile) {
        self.profile = profile
    }
}

/// 单日计划中的餐次明细（镜像 DayPlan.meals 数组元素）
public struct DayPlanMeal: Codable {
    /// 对应 MealType（TS 中为 number，对齐 MealType 枚举值）
    public let mealType: Int
    public let suggestion: String
    public let targetNutrition: NutritionInfo
}

/// 单日计划（镜像 DayPlan）
public struct DayPlan: Codable {
    /// 第几天
    public let day: Int
    /// 日期 YYYY-MM-DD
    public let date: String
    /// 当日目标营养素
    public let targetNutrition: NutritionInfo
    /// 三餐建议
    public let meals: [DayPlanMeal]
}

/// 生成计划响应（镜像 GeneratePlanResponse）
public struct GeneratePlanResponse: Codable {
    /// 计划 ID
    public let planId: String
    /// 计划名称
    public let planName: String
    /// 计划周期天数
    public let totalDays: Int
    /// 每日目标营养素
    public let dailyTarget: NutritionInfo
    /// 每日明细
    public let days: [DayPlan]
    /// AI 生成的整体建议
    public let advice: String
}

/// 计划列表项（镜像 PlanItem）
public struct PlanItem: Codable {
    public let id: Int
    public let userId: Int
    public let planName: String
    public let planType: PlanType
    public let totalDays: Int
    public let dailyTarget: NutritionInfo
    public let startDate: String
    public let endDate: String
    public let createdAt: String
}

/// 计划列表查询入参（镜像 PlanListRequest）
public struct PlanListRequest: Encodable {
    public let pageNum: Int
    public let pageSize: Int
    public let planType: PlanType?

    public init(pageNum: Int, pageSize: Int, planType: PlanType? = nil) {
        self.pageNum = pageNum
        self.pageSize = pageSize
        self.planType = planType
    }
}

/// 计划列表响应（镜像 PlanListResponse = PageData<PlanItem>）
public typealias PlanListResponse = PageData<PlanItem>
