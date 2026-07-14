# bomi · iOS 客户端完整文档

> 本文档供 iOS 新对话 0-1 启动使用。完整自包含，包含项目背景 + 长期规则 + Stage 1 任务 + 接口契约附录。

---

## 一、项目介绍

bomi 是「AI 食物拍照识别 + 饮食打卡 + 健康计划推荐」的多端项目。

- 用户用手机拍摄三餐照片 → AI 识别食物 + 营养成分 → 本地记录打卡
- 基于用户健康档案 + 近期饮食数据 → AI 生成个性化健康计划
- **隐私核心承诺**：用户饮食明细/照片完全本地化，不上传后端

已完成 D008 架构迁移（NestJS→Go，纯 Swift→KMP 集成）和 D009-D013 隐私架构修订。

## 二、技术栈

| 层 | 技术栈 | 目录 |
|---|---|---|
| 契约层 | protobuf（单一来源 + buf codegen） | `proto/` |
| 服务端 | Go 1.22 + Gin（REST + JSON） | `server/` |
| 移动端共享 | KMP + ktor + SQLDelight | `mobile-shared/` |
| **iOS** | **KMP 集成 + SwiftUI + CloudKit** | **`packages/ios/`** |
| Android | KMP + Compose + 坚果云WebDAV | `packages/android/` |
| 管理后台 | Vue3 + Vite + Element Plus | `packages/admin/` |

## 三、数据分层（隐私架构核心）

| 数据类型 | 存储位置 | 上传后端 |
|---|---|---|
| 用户饮食明细（食物/照片/体重） | SQLDelight 本地 + iCloud（CloudKit） | 禁止 |
| AI 识别临时图片 | COS 临时桶（5分钟自动清理） | 临时上传，用完即删 |
| 会员/积分/邀请/内购 | 后端 PostgreSQL | 正常存储 |
| 运营素材（海报/主题） | COS 永久桶 | 正常存储 |
| AI 计划生成的营养汇总 | 临时传后端，用完即丢 | 临时传输，不入库 |

## 四、关键决策摘要（与 iOS 相关）

| 决策 | 与 iOS 相关的内容 |
|---|---|
| **D008** | iOS 从纯 Swift + Swift 镜像改为 KMP 共享逻辑 + SwiftUI 原生 UI |
| **D010** | 食物识别：UIImage 压缩 → 上传 COS 临时桶 → recognize → 用户确认 → deleteImage |
| **D011** | 饮食打卡明细存本地 SQLDelight + CloudKit 私有云同步，不调后端 |
| **D013** | COS 原生域名加载素材，无 CDN |

## 五、获取代码

```bash
git clone https://github.com/WeilsNovel/Bomi.git bomi
cd bomi
```

## 六、服务端 API（统一响应 `{code, message, data, traceId, timestamp}`，code=0 成功）

- `POST /api/v1/auth/wx-login` / `phone-login` / `apple-login` / `send-sms`
- `GET /api/v1/user/profile`
- `POST /api/v1/ai/food/recognize`（传 imageKey，D010）
- `POST /api/v1/ai/food/delete-image`（删 COS 临时图，D010）
- `POST /api/v1/ai/plan/generate`（传 HealthProfile + RecentNutritionSummary，D011）
- `POST /api/v1/ai/chat`
- **无 diet 接口**（D011：饮食打卡完全本地化）

---

## 七、你的角色

你是 bomi 项目的 iOS 客户端开发者。只负责 iOS 原生客户端。

- **写**：SwiftUI View / ViewModel / 本地资源 / iOS 平台适配（含 KMP `iosMain` 的 actual 实现）
- **不写**：网络层、数据模型、Repository、契约（这些走 KMP `mobile-shared/`）
- **不写**：proto / server / admin / android

## 八、技术栈详情

| 项 | 选型 |
|---|---|
| 共享逻辑 | Kotlin Multiplatform（`mobile-shared/`），通过 framework 集成 |
| UI 框架 | SwiftUI（iOS 16+） |
| 语言 | Swift 5.9（UI 层）+ Kotlin（KMP `iosMain` actual 实现） |
| 架构 | MVVM（`@Observable` / `ObservableObject`） |
| 状态管理 | `@StateObject` / `@ObservedObject`，禁止滥用 `@State` |
| 异步 | `async/await`，禁止遗留 `completion` 闭包 |
| 工具链 | Xcode 15+ |
| KMP 集成 | CocoaPods 或 SPM 引入 `mobile-shared` 编译产物 |
| 本地数据库 | SQLDelight（封装 SQLite，存饮食打卡明细） |
| 私有云同步 | CloudKit 私有数据库（跨设备同步本地数据） |
| 图片上传 | ImageUploader actual（压缩 + 传 COS 临时桶） |
| 密钥存储 | Keychain |

## 九、你拥有的目录（可写）

```
packages/ios/Bomi/
├── App/              —— BomiApp.swift, AppConfig.swift（含 BomiSDK 初始化）
├── Features/         —— 按业务模块分文件夹
│   ├── Auth/         —— LoginView.swift, LoginViewModel.swift
│   ├── Food/         —— FoodRecognitionView.swift, DietListView.swift
│   └── Plan/         —— PlanView.swift
├── Platform/         —— iOS 平台适配层
├── Common/           —— Components/, Extensions/, Theme.swift
└── Resources/        —— Assets.xcassets, Localizable.strings
```

### mobile-shared 的 expect 抽象（iOS 负责 actual）

| expect 抽象 | 职责 | iOS actual 实现 |
|---|---|---|
| `LocalDietStorage` | 饮食打卡明细本地持久化 | SQLDelight + SQLite |
| `CloudSync` | 本地数据跨设备同步 | CloudKit 私有数据库 |
| `ImageUploader` | 图片压缩 + 上传 COS 临时桶 | UIImage 压缩 + COS 直传 |

> expect 接口由整合方在 `commonMain` 定义，iOS 侧只写 `iosMain` actual；expect 接口不得擅改。

## 十、KMP 集成方式

iOS 通过引入 `mobile-shared` 编译出的 framework，调用 KMP 暴露的 `BomiSDK` 及各 Repository。**禁止在 Swift 层重新实现网络/数据层**。

- 推荐：CocoaPods（`pod 'mobile-shared', :path => '../../mobile-shared'`）或 SPM 引入本地 framework
- KMP framework 暴露的入口：`BomiSDK.create(tokenStorage, localDietStorage, cloudSync, imageUploader)`
- Kotlin `suspend` 函数在 Swift 侧表现为 `async`，可直接 `await`

### 初始化（App 启动时一次）

```swift
import mobile_shared

@main
struct BomiApp: App {
    @StateObject private var appState = AppState()

    init() {
        let tokenStorage = TokenStorage()                    // Keychain
        let localDietStorage = LocalDietStorage()            // SQLDelight + SQLite
        let cloudSync = CloudSync()                          // CloudKit
        let imageUploader = ImageUploader()                  // UIImage 压缩 + COS
        let sdk = BomiSDK.create(
            tokenStorage: tokenStorage,
            localDietStorage: localDietStorage,
            cloudSync: cloudSync,
            imageUploader: imageUploader
        )
        appState.bind(sdk: sdk)
    }
}
```

## 十一、契约来源（通过 KMP）

| 数据 | 来源 |
|---|---|
| 数据模型 | `mobile-shared/commonMain/.../Models.kt` |
| 错误码 / BomiException | `mobile-shared/commonMain/.../BomiException.kt` |
| API 路由 | `mobile-shared/commonMain/.../network/Endpoint.kt` |
| 网络请求/响应解包 | `mobile-shared/commonMain/.../network/ApiClient.kt` |
| 终极单一来源 | `proto/`（仓库根） |

**铁律**：
- 发现模型缺字段或错误码缺失 → 停下，向整合方提案改 proto
- 禁止在 Swift 侧手写 mirror struct，禁止硬编码 API 路径/错误码
- 禁止擅自改 `mobile-shared/` 结构（可改 `iosMain` actual，expect 接口不得擅改）

## 十二、TokenStorage（iOS actual）

- `mobile-shared/iosMain/.../TokenStorage.ios.kt` 当前为内存骨架
- **Stage 1 必须替换为 Keychain 实现**：
  - `saveAccessToken` → `SecItemAdd`（`kSecClassGenericPassword`）
  - `getAccessToken` → `SecItemCopyMatching`
  - `clear` → `SecItemDelete`
- 禁止用 `NSUserDefaults` 明文存 token

## 十三、AI 调用红线

- 禁止直连 AI 供应商 API
- 食物识别、计划推荐一律走 `sdk.foodRepository.recognize(...)` / `sdk.planRepository.generate(...)`
- iOS 侧绝不出现任何 AI 供应商 API Key

## 十四、登录模块

通过 `sdk.authRepository` 调用，三选一（App Store 强制要求 Apple）：

1. **Apple Sign In**（`ASAuthorizationAppleIDProvider`）：拿 `identityToken` + `authCode`
2. **微信登录**（微信开放平台 iOS SDK）：拿 code
3. **手机号验证码**：`sendSms(phone:)` → `phoneLogin(phone:smsCode:)`

- 登录成功后调 `sdk.saveToken(result.token)`
- 登出调 `sdk.logout()`
- App Store 审核：有微信登录就必须提供 Apple Sign In

## 十五、编码规范

1. **零硬编码**：色值/尺寸/圆角/动画时长/文案/路径全抽到 `Theme.swift` 或 `AppConfig.swift`
2. **UI 与状态分离**：网络请求走 KMP Repository，不嵌入 View；ViewModel 只做状态转换
3. **常量命名语义化**：`PrimaryButton.sizeLg` 而非 `k1`
4. **A11y**：所有交互元素 `accessibilityLabel` 必填；最小触控目标 ≥ 44pt
5. **深浅模式 / 多语言**：封装在组件内部，文案走 `Localizable.strings`
6. **双端对齐**：iOS 与 Android 的功能/交互/异常语义必须对等

## 十六、黑名单（只读，禁止改动）

- `proto/`（契约单一来源）
- `server/`（服务端）
- `mobile-shared/` 的结构（可改 `iosMain` actual，expect 接口不得擅改）
- `packages/android/`、`packages/admin/`、`packages/miniapp/`
- `PROJECT-CONTEXT.md` / `DECISIONS.md` / `docs/`
- 根 `Makefile` / `pnpm-workspace.yaml` / `.gitignore`

---

## 十七、Stage 1 任务

### 第一动作

1. 浏览本完整文档，掌握项目背景 + 规则 + 任务
2. 浏览 `mobile-shared/src/commonMain/` 确认 KMP 导出的类型/Repository
3. 浏览 `packages/ios/Bomi/` 确认现有 Xcode 项目状态

### 任务清单

1. **KMP 集成**：Xcode 引入 `mobile-shared` framework（CocoaPods 或 SPM）
   - 验证 `import mobile_shared` 可用，`BomiSDK.create(...)` 可调用

2. **TokenStorage（Keychain actual）**
   - 实现 `mobile-shared/src/iosMain/.../TokenStorage.ios.kt` 的 Keychain actual（替换内存骨架）
   - `saveAccessToken` → `SecItemAdd`；`getAccessToken` → `SecItemCopyMatching`；`clear` → `SecItemDelete`
   - 禁止用 `NSUserDefaults` 明文存 token

3. **三个 expect actual 实现**
   - **LocalDietStorage**（SQLDelight + SQLite，D011）
     - 饮食打卡明细本地持久化（写入 / 查询近 N 日 / 聚合营养均值）
     - 替代原后端 diet 接口，不再调任何后端 diet 接口
   - **CloudSync**（CloudKit 私有数据库，D011）
     - 本地数据跨设备同步
   - **ImageUploader**（UIImage 压缩 + COS 临时桶直传，D010）
     - 压缩后直传 COS AI 临时桶，返回临时 URL
     - 用户确认后调 `deleteImage` 删除，5 分钟生命周期兜底

4. **迁移 Networking/ + Shared/Models**
   - 删除原 `APIClient.swift`、`Endpoints.swift`、`BomiError.swift`（走 KMP）
   - 删除 `Shared/Models/` 手动 Swift 镜像（改用 KMP 导出类型）
   - 删除 `Shared/Constants/`（错误码和路径走 KMP）

5. **SwiftUI View 保留 + 迁移**
   - `LoginView.swift` 保留 UI，`LoginViewModel` 迁移为调用 `BomiSDK.authRepository`
   - `App/BomiApp.swift` 改为初始化 `BomiSDK`，注入 4 个依赖

6. **新增页面（D010/D011 新流程）**
   - **食物拍照识别页**（D010 流程）：
     1. `ImageUploader` 压缩 → 上传 COS 临时桶，拿到临时 URL
     2. 调 `sdk.foodRepository.recognize(imageUrl:)` 识别
     3. 用户确认识别结果
     4. 调 `sdk.foodRepository.deleteImage(imageUrl:)` 删除临时图片
     5. 确认后的打卡明细写入本地 `LocalDietStorage`
   - **饮食打卡列表页**（D011）：从本地 `LocalDietStorage` 读取，不调后端
   - **健康计划页**：调 `sdk.planRepository.generate(...)`，传 `RecentNutritionSummary`（本地聚合近7日营养均值）

7. **BomiSDK.create()** 注入 4 个依赖：tokenStorage / localDietStorage / cloudSync / imageUploader

## 十八、自检清单

- [ ] KMP framework 集成成功，`import mobile_shared` 可用
- [ ] 未在 Swift 侧手写网络层 / 数据模型 mirror
- [ ] API 路径 / 错误码未硬编码，走 KMP `Endpoint` / `BomiException`
- [ ] TokenStorage 已用 Keychain（非 NSUserDefaults / 非内存）
- [ ] AI 调用走 `sdk.foodRepository` / `sdk.planRepository`，无明文 Key
- [ ] 零硬编码：色值 / 尺寸 / 文案 / 路径全抽常量
- [ ] 状态管理用 `@StateObject` / `@ObservedObject`，异步用 `async/await`
- [ ] A11y：交互元素 `accessibilityLabel` 必填，触控目标 ≥ 44pt
- [ ] 双端对齐：功能/交互/异常与 Android 语义对等
- [ ] 未触碰黑名单
- [ ] 末尾输出「改动文件清单」+「proto 同步需求（如有）」+「双端对齐自检」+「黑名单未触碰确认」

## 十九、输出规范

- 每段代码标注完整文件路径
- 不确定的 API 禁止臆造，先问整合方

---

## 附录：接口契约

### 统一响应结构

```typescript
interface BaseApiResponse<T> {
  code: number;       // 0=成功，非0=失败
  message: string;    // 提示文案
  data: T;
  traceId?: string;   // 服务端生成
  timestamp?: number; // 服务器时间戳 ms
}
```

### 鉴权

除登录/发送验证码外，所有接口需在 header 携带 `Authorization: Bearer <token>`。token 失效返回 `40102`，前端跳登录页。

### Auth 认证模块（公开）

| 接口 | 说明 |
|---|---|
| `POST /api/v1/auth/wx-login` | 微信登录 |
| `POST /api/v1/auth/send-sms` | 发送短信验证码（60s 限流） |
| `POST /api/v1/auth/phone-login` | 手机号验证码登录 |
| `POST /api/v1/auth/apple-login` | Apple 登录（iOS 专用，App Store 强制） |

### User 用户模块（JWT）

| 接口 | 说明 |
|---|---|
| `GET /api/v1/user/profile` | 获取当前用户信息 |
| `PUT /api/v1/user/profile` | 更新当前用户信息 |
| `GET /api/v1/user/health-profile` | 获取健康档案 |
| `PUT /api/v1/user/health-profile` | 更新健康档案 |

### Diet 饮食打卡模块（D011：已移除，完全本地化）

后端无 diet 接口。客户端通过 `LocalDietStorage`（SQLDelight）+ `CloudSync`（CloudKit）实现本地存储与跨设备同步。

### Plan 健康计划模块（JWT）

| 接口 | 说明 |
|---|---|
| `GET /api/v1/plan/list` | 计划列表 |
| `GET /api/v1/plan/:id` | 计划详情 |
| `DELETE /api/v1/plan/:id` | 删除计划 |

### AI 接口（JWT，前端经 server 转发，禁直连供应商）

| 接口 | 说明 |
|---|---|
| `POST /api/v1/ai/food/recognize` | 食物识别（传 imageKey，D010 流程） |
| `POST /api/v1/ai/food/delete-image` | 删除识别图片（D010） |
| `POST /api/v1/ai/plan/generate` | 生成健康计划（传 HealthProfile + RecentNutritionSummary，D011） |
| `POST /api/v1/ai/chat` | 通用 AI 对话（支持流式 SSE） |

### 错误码

| code | 含义 | 前端处理 |
|---|---|---|
| 0 | 成功 | 正常处理 data |
| 40001 | 参数错误 | 表单回显 |
| 40101 | 未登录 | 跳登录页 |
| 40102 | token 失效 | 清 token 跳登录页 |
| 40301 | 无权限 | 提示无权限 |
| 42901 | 限流 | 提示稍后重试 |
| 40111 | 微信登录失败 | 提示重试 |
| 40112 | 验证码错误 | 输入框回显 |
| 40113 | 手机号已绑定 | 提示换号 |
| 40114 | Apple 登录失败 | 提示重试 |
| 50021 | AI 识别失败 | 提示重拍 |
| 50022 | 计划生成失败 | 提示重试 |
| 50023 | AI 超时 | 提示稍后重试 |
| 50031 | 图片上传失败 | 提示重试 |
