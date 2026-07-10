package com.bomi.shared.repository

import com.bomi.shared.HealthProfile
import com.bomi.shared.PlanItem
import com.bomi.shared.PlanType
import com.bomi.shared.network.ApiClient
import com.bomi.shared.network.Endpoint
import kotlinx.serialization.Serializable

/**
 * 健康计划 Repository
 */
class PlanRepository(private val api: ApiClient) {

    @Serializable
    data class GeneratePlanRequest(
        val profile: HealthProfile,
        val planType: Int,
    )

    /** 生成健康计划（服务端调用 AI） */
    suspend fun generate(profile: HealthProfile, planType: PlanType): PlanItem {
        return api.post(Endpoint.PLAN_GENERATE, GeneratePlanRequest(profile, planType.value))
    }
}
