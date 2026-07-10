package com.bomi.shared

import kotlinx.serialization.Serializable

/**
 * 数据模型（Stage 0.5 手动镜像，后续由 proto codegen 生成替换）
 * 字段与 proto/bomi/model/*.proto 保持一致，禁止手动偏移。
 * 改字段必须先改 proto，再同步此处（codegen 接入后此文件删除）。
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

// ===== 食物 / 打卡 =====

@Serializable
enum class MealType(val value: Int) {
    BREAKFAST(1), LUNCH(2), DINNER(3), SNACK(4);
}

@Serializable
data class NutritionInfo(
    val calories: Int,
    val proteinG: Double,
    val carbsG: Double,
    val fatG: Double,
)

@Serializable
data class FoodItem(
    val name: String,
    val weightG: Int,
    val nutrition: NutritionInfo,
)

@Serializable
data class FoodRecognizeRequest(
    val imageUrl: String,
)

@Serializable
data class FoodRecognizeResponse(
    val foods: List<FoodItem>,
)

@Serializable
data class DietLogRequest(
    val mealType: Int,
    val foods: List<FoodItem>,
    val loggedAt: Long,
)

// ===== 健康计划 =====

@Serializable
enum class PlanType(val value: Int) {
    FAT_LOSS(1), MUSCLE_GAIN(2), MAINTAIN(3);
}

@Serializable
data class HealthProfile(
    val age: Int,
    val gender: Int,
    val heightCm: Int,
    val weightKg: Double,
    val activityLevel: Int,
    val targetWeightKg: Double? = null,
)

@Serializable
data class PlanItem(
    val dailyCalories: Int,
    val tips: List<String> = emptyList(),
)
