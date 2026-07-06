// 镜像 @bomi/shared/src/types/food.ts，整合方同步，禁止 iOS 对话擅自修改结构
// 字段映射: id/userId/mealType→Int, 营养素/confidence→Double, string→String, ?→Optional

import Foundation

/// 营养素信息（镜像 NutritionInfo，按份量估算）
public struct NutritionInfo: Codable {
    /// 热量 kcal
    public let calories: Double
    /// 蛋白质 g
    public let protein: Double
    /// 脂肪 g
    public let fat: Double
    /// 碳水 g
    public let carbohydrate: Double

    public init(calories: Double, protein: Double, fat: Double, carbohydrate: Double) {
        self.calories = calories
        self.protein = protein
        self.fat = fat
        self.carbohydrate = carbohydrate
    }
}

/// 用餐类型（镜像 MealType）
public enum MealType: Int, Codable {
    case breakfast = 1
    case lunch = 2
    case dinner = 3
    case snack = 4
}

/// 食物项（镜像 FoodItem，AI 识别结果中的单条食物）
public struct FoodItem: Codable {
    /// 食物名称
    public let name: String
    /// 估算份量描述，如 "1 个中等大小 / 150g"
    public let portion: String
    /// 营养素（按份量估算）
    public let nutrition: NutritionInfo
    /// AI 置信度 0-1
    public let confidence: Double
}

/// 食物识别请求入参（镜像 FoodRecognizeRequest，前端 → server）
public struct FoodRecognizeRequest: Encodable {
    /// 图片 URL（已上传后），或本次上传的临时标识
    public let imageUrl: String
    /// 用餐类型
    public let mealType: MealType
    /// 拍照时间（缺省用服务端时间）
    public let takenAt: String?

    public init(imageUrl: String, mealType: MealType, takenAt: String? = nil) {
        self.imageUrl = imageUrl
        self.mealType = mealType
        self.takenAt = takenAt
    }
}

/// 食物识别响应（镜像 FoodRecognizeResponse，server → 前端）
public struct FoodRecognizeResponse: Decodable {
    /// 识别 ID（用于关联打卡记录）
    public let recognizeId: String
    /// 识别到的食物列表
    public let foods: [FoodItem]
    /// 本次总营养素
    public let totalNutrition: NutritionInfo
    /// AI 识别耗时 ms
    public let durationMs: Int
    /// 识别日期 YYYY-MM-DD
    public let date: String
}

/// 饮食打卡记录（镜像 DietRecordItem，落库 + 前端展示）
public struct DietRecordItem: Codable {
    public let id: Int
    public let userId: Int
    /// 用餐类型
    public let mealType: MealType
    /// 图片 URL
    public let imageUrl: String
    /// 识别结果摘要
    public let foods: [FoodItem]
    /// 本次总营养素
    public let totalNutrition: NutritionInfo
    /// 拍照日期 YYYY-MM-DD
    public let date: String
    /// 拍照时间
    public let takenAt: String
    public let createdAt: String
}

/// 打卡列表查询入参（镜像 DietRecordListRequest）
public struct DietRecordListRequest: Encodable {
    public let pageNum: Int
    public let pageSize: Int
    /// 单日筛选 YYYY-MM-DD
    public let date: String?
    /// 日期范围起
    public let startDate: String?
    /// 日期范围止
    public let endDate: String?
    public let mealType: MealType?

    public init(pageNum: Int,
                pageSize: Int,
                date: String? = nil,
                startDate: String? = nil,
                endDate: String? = nil,
                mealType: MealType? = nil) {
        self.pageNum = pageNum
        self.pageSize = pageSize
        self.date = date
        self.startDate = startDate
        self.endDate = endDate
        self.mealType = mealType
    }
}

/// 打卡列表响应（镜像 DietRecordListResponse = PageData<DietRecordItem>）
public typealias DietRecordListResponse = PageData<DietRecordItem>

/// 单餐明细（镜像 DailyNutritionSummary.meals 数组元素）
public struct DailyMealSummary: Codable {
    public let mealType: MealType
    public let nutrition: NutritionInfo
    public let records: [DietRecordItem]
}

/// 每日营养汇总（镜像 DailyNutritionSummary）
public struct DailyNutritionSummary: Codable {
    public let date: String
    public let nutrition: NutritionInfo
    /// 各餐明细
    public let meals: [DailyMealSummary]
}
