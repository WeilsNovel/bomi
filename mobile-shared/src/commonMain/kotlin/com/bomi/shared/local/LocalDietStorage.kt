package com.bomi.shared.local

import com.bomi.shared.FoodItem
import com.bomi.shared.NutritionInfo
import com.bomi.shared.RecentNutritionSummary
import kotlinx.datetime.LocalDate

/**
 * 饮食打卡本地存储抽象（D011：完全本地化，不上传后端）
 *
 * 各端用 SQLDelight 实现（封装手机原生 SQLite），
 * expect/actual 模式让 commonMain 只定义接口，平台层提供实际实现。
 *
 * 数据特征：
 * - 饮食明细、食物照片缓存仅存设备本地
 * - 跨设备同步走用户私有云（iCloud / 坚果云 WebDAV），不走后端
 * - 后端只存会员/积分/邀请/内购/素材URL，不含任何饮食隐私数据
 */
interface LocalDietStorage {

    /** 保存一条打卡记录（含食物明细） */
    suspend fun saveRecord(record: DietRecord)

    /** 查询某日全部打卡 */
    suspend fun getRecordsByDate(date: LocalDate): List<DietRecord>

    /** 查询日期范围 */
    suspend fun getRecordsByRange(start: LocalDate, end: LocalDate): List<DietRecord>

    /** 删除一条记录 */
    suspend fun deleteRecord(id: Long)

    /**
     * 聚合近 N 日日均营养（用于生成 AI 计划时传后端，D011）
     * 返回匿名聚合数字，不含食物明细
     */
    suspend fun getRecentNutritionSummary(days: Int = 7): RecentNutritionSummary
}

/** 本地打卡记录（D011：仅存设备本地 + 私有云同步） */
data class DietRecord(
    val id: Long = 0,
    val date: LocalDate,
    val mealType: Int,       // 1早 2午 3晚 4加餐
    val foods: List<FoodItem>,
    val totalNutrition: NutritionInfo,
    val photoLocalPath: String? = null,  // 本地照片路径（不上传后端）
    val createdAt: Long,
)
