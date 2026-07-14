# bomi · Android Stage 1 任务

> 本文件是 Android 新对话的首条任务指令。先读 `docs/skills/android.md`（长期规则）+ `PROJECT-CONTEXT.md` + `DECISIONS.md`，再执行本任务。

# 项目介绍

bomi 是 AI 食物拍照识别 + 饮食打卡 + 健康计划推荐的多端项目。技术栈：

- 契约层：protobuf（`proto/` 目录）
- 服务端：Go 1.22 + Gin（`server/`，REST + JSON）
- 移动端共享：KMP + ktor（`mobile-shared/`）
- Android：KMP 集成 + Jetpack Compose（`packages/android/`）
- iOS：KMP 集成 + SwiftUI

服务端 API（统一响应 `{code, message, data, traceId, timestamp}`，code=0 成功）：
- `POST /api/v1/auth/wx-login` / `phone-login` / `apple-login` / `send-sms`
- `GET /api/v1/user/profile`
- `POST /api/v1/ai/food/recognize`（传 imageKey，D010）
- `POST /api/v1/ai/food/delete-image`（删 COS 临时图，D010）
- `POST /api/v1/ai/plan/generate`（传 HealthProfile + RecentNutritionSummary，D011）
- `POST /api/v1/ai/chat`
- **无 diet 接口**（D011：饮食打卡完全本地化）

# 你的角色

你是 bomi 项目的 Android 客户端开发者。全新项目从零开始。

- **写**：Jetpack Compose UI / ViewModel / Android 平台适配（含 KMP `androidMain` actual）
- **不写**：网络层、数据模型、Repository、契约（走 KMP `mobile-shared/`）

# 第一动作

1. 读取 `docs/skills/android.md`（长期规则集）+ `PROJECT-CONTEXT.md` + `DECISIONS.md`
2. 读取 `docs/api-contract.md` 了解接口语义（字段以 KMP 导出为准）
3. 浏览 `mobile-shared/src/commonMain/` 确认 KMP 导出的类型/Repository
4. 浏览 `mobile-shared/src/androidMain/` 确认已有 actual 实现

# KMP 集成

Android 通过 Gradle 把 `mobile-shared` 作为子模块引入。**禁止在 Compose 层重新实现网络/数据层**。

- `settings.gradle.kts`：`include(":mobile-shared")` + `projectDir = File(rootDir, "../../mobile-shared")`
- `app/build.gradle.kts`：`implementation(project(":mobile-shared"))`
- `BomiSDK.create(tokenStorage, localDietStorage, cloudSync, imageUploader)` 返回各 Repository

# 契约来源规则

1. 数据模型、错误码、API 路由、网络请求/响应解包全部走 KMP
2. 禁止在 Android 侧手写数据模型 mirror，禁止硬编码 API 路径/错误码
3. 发现缺字段/错误码 → 停下，向整合方提案改 proto

# Stage 1 任务

### 1. 新建 Android Studio 项目
- Compose + Kotlin + minSdk 26（Android 8+）
- 包名 `com.bomi.app`，JDK 17 + AGP 8+
- 确保空模板可编译

### 2. 集成 mobile-shared KMP 模块
- `settings.gradle.kts` 加 include + projectDir
- `app/build.gradle.kts` 加 `implementation(project(":mobile-shared"))`
- 验证 `import com.bomi.shared.BomiSDK` 可用

### 3. TokenStorage 初始化
- `TokenStorage.android.kt` 已实现 `EncryptedSharedPreferences`
- App 启动时（`BomiApp.onCreate()`）必须调 `tokenStorage.init(this)`

### 4. 实现 LocalDietStorage 的 Android actual（D011）
- SQLDelight + SQLite
- `logDiet(mealType, foods, loggedAt)` / `listDiet(pageNum, pageSize)` / `recentNutritionSummary(days)`
- 后端不再提供 diet 接口，所有打卡数据读写走本地

### 5. 实现 CloudSync 的 Android actual（D011）
- 坚果云 WebDAV + OkHttp3，支持分片断点续传
- WorkManager 注册后台定时同步任务
- 坚果云账号凭证存 KeyStore + DataStore

### 6. 实现 ImageUploader 的 Android actual（D010）
- BitmapFactory 解码 → 压缩 → 直传腾讯云 COS 临时桶
- 返回 COS 临时 URL 供 `food/recognize` 调用
- 临时图 5 分钟生命周期兜底

### 7. Compose UI 各页面
- **登录页**：三个按钮（微信 / 手机号 / Google）
- **首页**：拍照入口 + 底部导航骨架
- **识别结果页**：展示识别到的食物列表 + 用户确认按钮
- **打卡列表页**：历史打卡记录（**从本地 SQLDelight 读取，不调后端**）
- **计划页**：健康计划展示
- 每个页面配对应 `ViewModel`，`StateFlow` 驱动 UI

### 8. ViewModel 调用 BomiSDK（D010/D011 新流程）
- `FoodRecognitionViewModel`（D010 流程）：
  1. `imageUploader.compressAndUpload(bitmap)` → COS 临时 URL
  2. `sdk.foodRepository.recognize(cosUrl)` → VLM 识别返回 foods
  3. 用户确认 → `sdk.foodRepository.deleteImage(cosUrl)` 删除临时图
  4. `localDietStorage.logDiet(mealType, foods, loggedAt)` 存本地
  5. 用户取消 → 同样调 `deleteImage` 清理
- `DietListViewModel`：调 `localDietStorage.listDiet()`（本地读取）
- `PlanViewModel`：调 `sdk.planRepository.generate(profile, planType, recentNutritionSummary)`

### 9. Application + 主题 + 资源
- `BomiApp.kt`：初始化 TokenStorage + 构造 3 个 actual + `BomiSDK.create(4 个依赖)`
- `MainActivity.kt`：Compose 入口
- `Theme.kt`：Material3，深浅模式 + 动态取色
- `strings.xml`：文案抽离

# 输出规范

- 每段代码标注完整文件路径
- 零硬编码（色值/尺寸/文案/路径全抽常量）
- 末尾输出「改动文件清单」+「proto 同步需求（如有）」+「双端对齐自检」+「黑名单未触碰确认」
- 不确定的 API 禁止臆造，先问整合方
