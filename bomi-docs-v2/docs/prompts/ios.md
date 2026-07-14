# bomi · iOS Stage 1 任务

> 本文件是 iOS 新对话的首条任务指令。先读 `docs/skills/ios.md`（长期规则）+ `PROJECT-CONTEXT.md` + `DECISIONS.md`，再执行本任务。

# 项目介绍

bomi 是 AI 食物拍照识别 + 饮食打卡 + 健康计划推荐的多端项目。技术栈：

- 契约层：protobuf（`proto/` 目录）
- 服务端：Go 1.22 + Gin（`server/`，REST + JSON）
- 移动端共享：KMP + ktor（`mobile-shared/`）
- iOS：KMP 集成 + SwiftUI（`packages/ios/`）
- Android：KMP 集成 + Compose

服务端 API（统一响应 `{code, message, data, traceId, timestamp}`，code=0 成功）：
- `POST /api/v1/auth/wx-login` / `phone-login` / `apple-login` / `send-sms`
- `GET /api/v1/user/profile`
- `POST /api/v1/ai/food/recognize`（传 imageKey，D010）
- `POST /api/v1/ai/food/delete-image`（删 COS 临时图，D010）
- `POST /api/v1/ai/plan/generate`（传 HealthProfile + RecentNutritionSummary，D011）
- `POST /api/v1/ai/chat`
- **无 diet 接口**（D011：饮食打卡完全本地化）

# 你的角色

你是 bomi 项目的 iOS 客户端开发者。只负责 iOS 原生客户端。

- **写**：SwiftUI View / ViewModel / iOS 平台适配（含 KMP `iosMain` actual）
- **不写**：网络层、数据模型、Repository、契约（走 KMP `mobile-shared/`）

# 第一动作

1. 读取 `docs/skills/ios.md`（长期规则集）+ `PROJECT-CONTEXT.md` + `DECISIONS.md`
2. 读取 `docs/api-contract.md` 了解接口语义（字段以 KMP 导出为准）
3. 浏览 `mobile-shared/src/commonMain/` 确认 KMP 导出的类型/Repository
4. 浏览 `packages/ios/Bomi/` 确认现有 Xcode 项目状态

# KMP 集成

iOS 通过引入 `mobile-shared` 编译出的 framework，调用 `BomiSDK`。**禁止在 Swift 层重新实现网络/数据层**。

集成路径（推荐 CocoaPods）：
- 在 `packages/ios/Bomi/Podfile` 加 `pod 'mobile-shared', :path => '../../../mobile-shared'`
- `BomiSDK.create(tokenStorage, localDietStorage, cloudSync, imageUploader)` 返回各 Repository
- Kotlin `suspend` 在 Swift 侧为 `async`，可直接 `await`

# 契约来源规则

1. 数据模型、错误码、API 路由、网络请求/响应解包全部走 KMP
2. 禁止在 Swift 侧手写 mirror struct，禁止硬编码 API 路径/错误码
3. 发现缺字段/错误码 → 停下，向整合方提案改 proto

# Stage 1 任务

### 1. KMP 集成
- Xcode 引入 `mobile-shared` framework（CocoaPods 或 SPM）
- 验证 `import mobile_shared` 可用，`BomiSDK.create(...)` 可调用

### 2. TokenStorage（Keychain actual）
- 实现 `mobile-shared/src/iosMain/.../TokenStorage.ios.kt` 的 Keychain actual（替换内存骨架）
- `saveAccessToken` → `SecItemAdd`；`getAccessToken` → `SecItemCopyMatching`；`clear` → `SecItemDelete`
- 禁止用 `NSUserDefaults` 明文存 token

### 3. 三个 expect actual 实现

- **LocalDietStorage**（SQLDelight + SQLite，D011）
  - 饮食打卡明细本地持久化（写入 / 查询近 N 日 / 聚合营养均值）
  - 替代原后端 diet 接口，不再调任何后端 diet 接口
- **CloudSync**（CloudKit 私有数据库，D011）
  - 本地数据跨设备同步
- **ImageUploader**（UIImage 压缩 + COS 临时桶直传，D010）
  - 压缩后直传 COS AI 临时桶，返回临时 URL
  - 用户确认后调 `deleteImage` 删除，5 分钟生命周期兜底

### 4. 迁移 Networking/ + Shared/Models
- 删除原 `APIClient.swift`、`Endpoints.swift`、`BomiError.swift`（走 KMP）
- 删除 `Shared/Models/` 手动 Swift 镜像（改用 KMP 导出类型）
- 删除 `Shared/Constants/`（错误码和路径走 KMP）

### 5. SwiftUI View 保留 + 迁移
- `LoginView.swift` 保留 UI，`LoginViewModel` 迁移为调用 `BomiSDK.authRepository`
- `App/BomiApp.swift` 改为初始化 `BomiSDK`，注入 4 个依赖

### 6. 新增页面（D010/D011 新流程）

- **食物拍照识别页**（D010 流程）：
  1. `ImageUploader` 压缩 → 上传 COS 临时桶，拿到临时 URL
  2. 调 `sdk.foodRepository.recognize(imageUrl:)` 识别
  3. 用户确认识别结果
  4. 调 `sdk.foodRepository.deleteImage(imageUrl:)` 删除临时图片
  5. 确认后的打卡明细写入本地 `LocalDietStorage`
- **饮食打卡列表页**（D011）：从本地 `LocalDietStorage` 读取，不调后端
- **健康计划页**：调 `sdk.planRepository.generate(...)`，传 `RecentNutritionSummary`（本地聚合近7日营养均值）

# 输出规范

- 每段代码标注完整文件路径
- 零硬编码（色值/尺寸/文案/路径全抽常量）
- 末尾输出「改动文件清单」+「proto 同步需求（如有）」+「双端对齐自检」+「黑名单未触碰确认」
- 不确定的 API 禁止臆造，先问整合方
