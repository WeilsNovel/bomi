package com.bomi.shared.repository

import com.bomi.shared.DeleteRecognizeImageRequest
import com.bomi.shared.DeleteRecognizeImageResponse
import com.bomi.shared.FoodRecognizeRequest
import com.bomi.shared.FoodRecognizeResponse
import com.bomi.shared.network.ApiClient
import com.bomi.shared.network.Endpoint

/**
 * 食物识别 Repository（D010 修订）
 *
 * 流程：
 * 1. App 压缩图片 → 上传 COS 临时桶获得 imageKey（上传逻辑在各端 actual 实现）
 * 2. 调 recognize(imageKey) → 后端调 VLM 识别 → 返回文字营养数据 + imageKey
 * 3. 用户在前端确认/编辑识别结果
 * 4. 用户点"确认打卡" → 调 deleteImage(imageKey) 删除 COS 临时图
 * 5. App 把文字数据存入本地 SQLDelight（D011：不上传后端）
 *
 * 兜底：COS 临时桶 5 分钟生命周期自动清理未删除的图片
 */
class FoodRepository(private val api: ApiClient) {

    /** 食物识别（传 imageKey，后端调 VLM） */
    suspend fun recognize(imageKey: String, mealType: Int? = null): FoodRecognizeResponse {
        val req = FoodRecognizeRequest(
            imageKey = imageKey,
            mealType = mealType?.let { com.bomi.shared.MealType.entries.firstOrNull { m -> m.value == it } },
        )
        return api.post(Endpoint.AI_FOOD_RECOGNIZE, req)
    }

    /** 删除识别图片（用户确认打卡后调用，删除 COS 临时桶原图） */
    suspend fun deleteImage(imageKey: String): DeleteRecognizeImageResponse {
        return api.post(Endpoint.AI_FOOD_DELETE_IMAGE, DeleteRecognizeImageRequest(imageKey))
    }

    // 注：饮食打卡明细完全本地化（D011），无 logDiet/listDiet 方法
    // 本地存储 + 私有云同步在 LocalDietRepository（SQLDelight + CloudSync）
}
