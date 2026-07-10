package com.bomi.shared.repository

import com.bomi.shared.GeneratePlanRequest
import com.bomi.shared.HealthProfile
import com.bomi.shared.PlanItem
import com.bomi.shared.PlanType
import com.bomi.shared.RecentNutritionSummary
import com.bomi.shared.network.ApiClient
import com.bomi.shared.network.Endpoint

/**
 * 健康计划 Repository（D011 修订）
 *
 * 生成计划时 App 从本地 DB 聚合近7日营养均值（匿名数字，不含食物明细），
 * 传后端调 LLM 生成计划，后端用完即丢不入库。
 */
class PlanRepository(private val api: ApiClient) {

    /** 生成健康计划（传健康档案 + 近期营养汇总） */
    suspend fun generate(
        profile: HealthProfile,
        recentNutrition: RecentNutritionSummary? = null,
    ): PlanItem {
        return api.post(Endpoint.AI_PLAN_GENERATE, GeneratePlanRequest(profile, recentNutrition))
    }
}
