package com.bomi.shared.security

/**
 * 图片临时上传 + COS Key 管理（D010）
 *
 * expect 声明，各端 actual 实现：
 * - 图片压缩：各端用原生 API（iOS UIImage / Android BitmapFactory）
 * - COS 直传：各端用 OkHttp / URLSession 直传临时桶
 * - imageKey 返回后传给 FoodRepository.recognize()
 *
 * 流程：
 * 1. 用户拍照 → 压缩 → 上传 COS 临时桶 → 获得 imageKey
 * 2. 调 FoodRepository.recognize(imageKey) 识别
 * 3. 用户确认 → 调 FoodRepository.deleteImage(imageKey) 删除原图
 * 4. 兜底：5 分钟未删除由 COS 生命周期规则自动清理
 */
interface ImageUploader {

    /**
     * 压缩并上传图片到 COS 临时桶
     * @param localPath 本地图片路径
     * @return COS imageKey（用于后续识别 + 删除）
     */
    suspend fun uploadTempImage(localPath: String): String
}
