package com.bomi.shared

import kotlinx.serialization.Serializable

/**
 * 数据模型（Stage 0.5 手动镜像，后续由 proto codegen 生成替换）
 * 字段与 proto/bomi/model/*.proto 保持一致，禁止手动偏移。
 * 改字段必须先改 proto，再同步此处（codegen 接入后此文件删除）。
 *
 * D010/D011 修订：
 * - 饮食打卡明细完全本地化（SQLDelight），后端不存
 * - AI 识别返回文字营养数据 + image_key，用户确认后调 deleteImage 删除 COS 临时图
 */

// ===== 通用 =====

@Serializable
data class BaseApiResponse<T>(
    val code: Int,
    val message: String,
    val data: T? = null,
    val traceId: String? = null,
    val timestamp: Long? = null,
)

@Serializable
data class PageQuery(
    val pageNum: Int = 1,
    val pageSize: Int = AppConfig.DEFAULT_PAGE_SIZE,
)

@Serializable
data class IdParam(val id: Long)

// ===== 用户 =====

@Serializable
enum class Gender(val value: Int) {
    UNKNOWN(0), MALE(1), FEMALE(2);
    companion object {
        fun fromValue(v: Int) = entries.firstOrNull { it.value == v } ?: UNKNOWN
    }
}

@Serializable
data class UserItem(
    val id: Long,
    val nickname: String,
    val avatarUrl: String? = null,
    val gender: Int = 0,
    val phone: String? = null,
    val status: Int = 1,
)

// ===== 食物 / 识别（D010：图片临时上传，识别后删除）=====

@Serializable
enum class MealType(val value: Int) {
    BREAKFAST(1), LUNCH(2), DINNER(3), SNACK(4);
}

@Serializable
data class NutritionInfo(
    val calories: Double,
    val protein: Double,
    val fat: Double,
    val carbohydrate: Double,
)

@Serializable
data class FoodItem(
    val name: String,
    val portion: String,
    val nutrition: NutritionInfo,
    val confidence: Double = 0.0,
)

/** 食物识别请求（传 COS 临时图片 key） */
@Serializable
data class FoodRecognizeRequest(
    val imageKey: String,
    val mealType: MealType? = null,
)

/** 食物识别响应（返回文字营养数据 + image_key，用户确认后删图） */
@Serializable
data class FoodRecognizeResponse(
    val recognizeId: String,
    val imageKey: String,
    val foods: List<FoodItem>,
    val totalNutrition: NutritionInfo,
    val durationMs: Int,
)

/** 删除识别图片请求（用户确认打卡后调用） */
@Serializable
data class DeleteRecognizeImageRequest(
    val imageKey: String,
)

/** 删除识别图片响应 */
@Serializable
data class DeleteRecognizeImageResponse(
    val success: Boolean,
)

// ===== 健康计划 =====

@Serializable
enum class PlanType(val value: Int) {
    FAT_LOSS(1), MUSCLE_GAIN(2), MAINTAIN(3);
}

@Serializable
data class HealthProfile(
    val userId: Long = 0,
    val gender: Int,
    val age: Int,
    val height: Double,
    val weight: Double,
    val targetWeight: Double? = null,
    val activityLevel: Int,
    val planType: Int,
)

/**
 * 近期营养汇总（App 从本地 SQLDelight 聚合，传后端用于 AI 个性化推荐）
 * D011：全部为匿名聚合数字，不含食物明细，后端用完即丢不入库
 */
@Serializable
data class RecentNutritionSummary(
    val avgDailyCalories: Double? = null,
    val avgDailyProtein: Double? = null,
    val avgDailyCarbs: Double? = null,
    val avgDailyFat: Double? = null,
    val sampleDays: Int? = null,
)

@Serializable
data class GeneratePlanRequest(
    val profile: HealthProfile,
    val recentNutrition: RecentNutritionSummary? = null,
)

@Serializable
data class PlanItem(
    val planId: String,
    val planName: String,
    val totalDays: Int,
    val dailyTarget: NutritionInfo,
    val advice: String = "",
)
