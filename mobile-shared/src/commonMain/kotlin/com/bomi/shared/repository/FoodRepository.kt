package com.bomi.shared.repository

import com.bomi.shared.DietLogRequest
import com.bomi.shared.FoodItem
import com.bomi.shared.FoodRecognizeRequest
import com.bomi.shared.FoodRecognizeResponse
import com.bomi.shared.network.ApiClient
import com.bomi.shared.network.Endpoint

/**
 * 食物识别 / 饮食打卡 Repository
 */
class FoodRepository(private val api: ApiClient) {

    /** 食物识别（上传图片 URL，服务端调用 VLM） */
    suspend fun recognize(imageUrl: String): FoodRecognizeResponse {
        return api.post(Endpoint.FOOD_RECOGNIZE, FoodRecognizeRequest(imageUrl))
    }

    /** 提交饮食打卡 */
    suspend fun logDiet(mealType: Int, foods: List<FoodItem>, loggedAt: Long) {
        api.post<Unit, DietLogRequest>(Endpoint.DIET_LOG, DietLogRequest(mealType, foods, loggedAt))
    }

    /** 查询打卡记录（Stage 1 接入） */
    suspend fun listDiet(pageNum: Int = 1, pageSize: Int = 20): List<FoodItem> {
        return api.get(Endpoint.DIET_LIST, mapOf("pageNum" to pageNum, "pageSize" to pageSize))
    }
}
