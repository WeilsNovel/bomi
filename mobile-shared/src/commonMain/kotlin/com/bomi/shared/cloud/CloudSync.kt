package com.bomi.shared.cloud

/**
 * 私有云同步抽象（D011：跨设备同步走用户私有云，不走后端）
 *
 * expect 声明，各端 actual 实现：
 * - iOS：CloudKit 私有数据库（系统原生）
 * - Android：坚果云 WebDAV（OkHttp3，分片断点续传）
 *
 * 同步内容：本地 SQLDelight 数据库文件 + 本地照片缓存
 * 不同步：会员状态、积分（这些走后端）
 */
interface CloudSync {

    /** 触发一次上传同步（本地 → 私有云） */
    suspend fun upload()

    /** 触发一次下载同步（私有云 → 本地） */
    suspend fun download(): SyncResult

    /** 获取上次同步时间（毫秒） */
    fun lastSyncTime(): Long?

    /** 是否已配置私有云账户 */
    fun isConfigured(): Boolean
}

data class SyncResult(
    val success: Boolean,
    val syncedRecords: Int = 0,
    val conflictCount: Int = 0,
    val errorMessage: String? = null,
)
