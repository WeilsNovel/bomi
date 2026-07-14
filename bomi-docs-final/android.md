# bomi · Android 客户端完整文档

> 本文档供 Android 新对话 0-1 启动使用。完整自包含，包含项目背景 + 长期规则 + Stage 1 任务 + 接口契约附录。全新项目从零开始。

---

## 一、项目介绍

bomi 是「AI 食物拍照识别 + 饮食打卡 + 健康计划推荐」的多端项目。

- 用户用手机拍摄三餐照片 → AI 识别食物 + 营养成分 → 本地记录打卡
- 基于用户健康档案 + 近期饮食数据 → AI 生成个性化健康计划
- **隐私核心承诺**：用户饮食明细/照片完全本地化，不上传后端

已完成 D008 架构迁移和 D009-D013 隐私架构修订。

## 二、技术栈

| 层 | 技术栈 | 目录 |
|---|---|---|
| 契约层 | protobuf（单一来源 + buf codegen） | `proto/` |
| 服务端 | Go 1.22 + Gin（REST + JSON） | `server/` |
| 移动端共享 | KMP + ktor + SQLDelight | `mobile-shared/` |
| iOS | KMP + SwiftUI + CloudKit | `packages/ios/` |
| **Android** | **KMP + Jetpack Compose + 坚果云WebDAV** | **`packages/android/`** |
| 管理后台 | Vue3 + Vite + Element Plus | `packages/admin/` |

## 三、数据分层（隐私架构核心）

| 数据类型 | 存储位置 | 上传后端 |
|---|---|---|
| 用户饮食明细（食物/照片/体重） | SQLDelight 本地 + 坚果云（WebDAV） | 禁止 |
| AI 识别临时图片 | COS 临时桶（5分钟自动清理） | 临时上传，用完即删 |
| 会员/积分/邀请/内购 | 后端 PostgreSQL | 正常存储 |
| 运营素材（海报/主题） | COS 永久桶 | 正常存储 |
| AI 计划生成的营养汇总 | 临时传后端，用完即丢 | 临时传输，不入库 |

## 四、关键决策摘要（与 Android 相关）

| 决策 | 与 Android 相关的内容 |
|---|---|
| **D008** | Android 为全新端，KMP 共享逻辑 + Compose 原生 UI |
| **D010** | 食物识别：BitmapFactory 压缩 → 上传 COS 临时桶 → recognize → 用户确认 → deleteImage |
| **D011** | 饮食打卡明细存本地 SQLDelight + 坚果云 WebDAV 同步，不调后端 |
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

你是 bomi 项目的 Android 客户端开发者。全新项目从零开始。

- **写**：Jetpack Compose UI / ViewModel / 本地资源 / Android 平台适配（含 KMP `androidMain` 的 actual 实现）
- **不写**：网络层、数据模型、Repository、契约（这些走 KMP `mobile-shared/`）
- **不写**：proto / server / admin / ios

## 八、技术栈详情

| 项 | 选型 |
|---|---|
| 共享逻辑 | Kotlin Multiplatform（`mobile-shared/`），作为 Gradle 子模块引入 |
| UI 框架 | Jetpack Compose（minSdk 26 / Android 8+） |
| 语言 | Kotlin（UI 层 + KMP 集成层同语言，无桥接成本） |
| 架构 | MVVM（`ViewModel` + `StateFlow`） |
| 状态管理 | `remember` + `StateFlow.collectAsStateWithLifecycle()` |
| 副作用 | `LaunchedEffect` / `SideEffect`，禁止在 Composable 内直接 IO |
| 工程 | `packages/android/`（全新 Android Studio 项目） |
| 工具链 | Android Studio + JDK 17 + AGP 8+ |
| KMP 集成 | `implementation(project(":mobile-shared"))` |
| 本地数据库 | SQLDelight（封装 SQLite，存饮食打卡明细） |
| 私有云同步 | 坚果云 WebDAV（OkHttp3，分片断点续传） |
| 凭证安全存储 | KeyStore + DataStore |
| 后台同步 | WorkManager |
| 图片上传 | ImageUploader actual（BitmapFactory 压缩 + 传 COS 临时桶） |

## 九、你拥有的目录（可写）

```
packages/android/
├── app/
│   ├── build.gradle.kts          # 依赖 mobile-shared + Compose
│   └── src/main/
│       ├── java/com/bomi/app/
│       │   ├── BomiApp.kt        # Application 入口，初始化 BomiSDK
│       │   ├── MainActivity.kt   # Compose 入口
│       │   ├── di/               # 手动 DI 或 Hilt
│       │   ├── features/
│       │   │   ├── auth/         # LoginScreen, LoginViewModel
│       │   │   ├── food/         # FoodRecognitionScreen, DietListScreen
│       │   │   └── plan/         # PlanScreen, PlanViewModel
│       │   ├── common/           # Components/, Theme.kt
│       │   └── platform/         # Android 平台适配
│       └── res/                  # values/, drawable/
├── settings.gradle.kts           # include(":mobile-shared")
└── build.gradle.kts
```

### mobile-shared 的 expect 抽象（Android 负责 actual）

| expect 抽象 | Android actual 实现 | 说明 |
|---|---|---|
| `LocalDietStorage` | SQLDelight + SQLite | 饮食打卡明细本地存储 |
| `CloudSync` | 坚果云 WebDAV + OkHttp3 | 分片断点续传，私有云备份 |
| `ImageUploader` | BitmapFactory 压缩 + COS 直传 | AI 识别图片临时上传 |

> expect 接口由整合方在 `commonMain` 定义，不得擅改。

## 十、KMP 集成方式

Android 通过 Gradle 把 `mobile-shared` 作为子模块引入。**禁止在 Compose 层重新实现网络/数据层**。

- 在 `packages/android/settings.gradle.kts`：
  ```kotlin
  include(":mobile-shared")
  project(":mobile-shared").projectDir = File(rootDir, "../../mobile-shared")
  ```
- 在 `app/build.gradle.kts`：
  ```kotlin
  dependencies {
      implementation(project(":mobile-shared"))
  }
  ```
- 直接 `import com.bomi.shared.BomiSDK`，无桥接成本

### 初始化（App 启动时一次）

```kotlin
class BomiApp : Application() {
    lateinit var sdk: BomiSDK
        private set

    override fun onCreate() {
        super.onCreate()
        val tokenStorage = TokenStorage()
        tokenStorage.init(this)  // Android 必须先 init(context)
        val localDietStorage = LocalDietStorage(this)
        val cloudSync = CloudSync(this)
        val imageUploader = ImageUploader(this)
        sdk = BomiSDK.create(
            tokenStorage = tokenStorage,
            localDietStorage = localDietStorage,
            cloudSync = cloudSync,
            imageUploader = imageUploader,
        )
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
- 禁止在 Android 侧手写数据模型 mirror，禁止硬编码 API 路径/错误码
- 禁止擅自改 `mobile-shared/` 结构（可改 `androidMain` actual，expect 接口不得擅改）

## 十二、TokenStorage（Android actual）

- `mobile-shared/androidMain/.../TokenStorage.android.kt` 已实现 `EncryptedSharedPreferences`
- **App 启动时必须调 `tokenStorage.init(context)`** 初始化加密存储
- 禁止用明文 `SharedPreferences` 存 token

## 十三、AI 调用红线

- 禁止直连 AI 供应商 API
- 食物识别、计划推荐一律走 `sdk.foodRepository.recognize(...)` / `sdk.planRepository.generate(...)`
- Android 侧绝不出现任何 AI 供应商 API Key

## 十四、登录模块

通过 `sdk.authRepository` 调用，三种方式：

1. **Google Sign In**（`CredentialManager` / Google Identity）：拿 idToken
2. **微信登录**（微信开放平台 Android SDK）：拿 code
3. **手机号验证码**：`sendSms(phone)` → `phoneLogin(phone, smsCode)`

- 登录成功后调 `sdk.saveToken(result.token)`
- 登出调 `sdk.logout()`

## 十五、编码规范

1. **零硬编码**：色值/尺寸/圆角/动画时长/文案/路径全抽到 `Theme.kt` 或 `Constants.kt`
2. **UI 与状态分离**：网络请求走 KMP Repository，不嵌入 Composable
3. **常量命名语义化**：`PrimaryButton.SizeLg` 而非 `k1`
4. **A11y**：所有交互元素 `contentDescription` 必填；最小触控目标 ≥ 48dp
5. **深浅模式 / 多语言**：Material3 动态取色 + `values-night`；文案走 `strings.xml`
6. **双端对齐**：Android 与 iOS 的功能/交互/异常语义必须对等

## 十六、黑名单（只读，禁止改动）

- `proto/`（契约单一来源）
- `server/`（服务端）
- `mobile-shared/` 的结构（可改 `androidMain` actual，expect 接口不得擅改）
- `packages/ios/`、`packages/admin/`、`packages/miniapp/`
- `PROJECT-CONTEXT.md` / `DECISIONS.md` / `docs/`
- 根 `Makefile` / `pnpm-workspace.yaml` / `.gitignore`

---

## 十七、Stage 1 任务

### 第一动作

1. 浏览本完整文档，掌握项目背景 + 规则 + 任务
2. 浏览 `mobile-shared/src/commonMain/` 确认 KMP 导出的类型/Repository
3. 浏览 `mobile-shared/src/androidMain/` 确认已有 actual 实现

### 任务清单

1. **新建 Android Studio 项目**
   - Compose + Kotlin + minSdk 26（Android 8+）
   - 包名 `com.bomi.app`，JDK 17 + AGP 8+
   - 确保空模板可编译

2. **集成 mobile-shared KMP 模块**
   - `settings.gradle.kts` 加 `include(":mobile-shared")` + `projectDir = File(rootDir, "../../mobile-shared")`
   - `app/build.gradle.kts` 加 `implementation(project(":mobile-shared"))`
   - 验证 `import com.bomi.shared.BomiSDK` 可用

3. **TokenStorage 初始化**
   - `TokenStorage.android.kt` 已实现 `EncryptedSharedPreferences`
   - App 启动时（`BomiApp.onCreate()`）必须调 `tokenStorage.init(this)`

4. **实现 LocalDietStorage 的 Android actual**（D011）
   - SQLDelight + SQLite
   - `logDiet(mealType, foods, loggedAt)` / `listDiet(pageNum, pageSize)` / `recentNutritionSummary(days)`
   - 后端不再提供 diet 接口，所有打卡数据读写走本地

5. **实现 CloudSync 的 Android actual**（D011）
   - 坚果云 WebDAV + OkHttp3，支持分片断点续传
   - WorkManager 注册后台定时同步任务
   - 坚果云账号凭证存 KeyStore + DataStore

6. **实现 ImageUploader 的 Android actual**（D010）
   - BitmapFactory 解码 → 压缩 → 直传腾讯云 COS 临时桶
   - 返回 COS 临时 URL 供 `food/recognize` 调用
   - 临时图 5 分钟生命周期兜底

7. **Compose UI 各页面**
   - **登录页**：三个按钮（微信 / 手机号 / Google）
   - **首页**：拍照入口 + 底部导航骨架
   - **识别结果页**：展示识别到的食物列表 + 用户确认按钮
   - **打卡列表页**：历史打卡记录（**从本地 SQLDelight 读取，不调后端**）
   - **计划页**：健康计划展示
   - 每个页面配对应 `ViewModel`，`StateFlow` 驱动 UI

8. **ViewModel 调用 BomiSDK（D010/D011 新流程）**
   - `FoodRecognitionViewModel`（D010 流程）：
     1. `imageUploader.compressAndUpload(bitmap)` → COS 临时 URL
     2. `sdk.foodRepository.recognize(cosUrl)` → VLM 识别返回 foods
     3. 用户确认 → `sdk.foodRepository.deleteImage(cosUrl)` 删除临时图
     4. `localDietStorage.logDiet(mealType, foods, loggedAt)` 存本地
     5. 用户取消 → 同样调 `deleteImage` 清理
   - `DietListViewModel`：调 `localDietStorage.listDiet()`（本地读取）
   - `PlanViewModel`：调 `sdk.planRepository.generate(profile, planType, recentNutritionSummary)`

9. **Application + 主题 + 资源**
   - `BomiApp.kt`：初始化 TokenStorage + 构造 3 个 actual + `BomiSDK.create(4 个依赖)`
   - `MainActivity.kt`：Compose 入口
   - `Theme.kt`：Material3，深浅模式 + 动态取色
   - `strings.xml`：文案抽离

10. **BomiSDK.create()** 注入 4 个依赖：tokenStorage / localDietStorage / cloudSync / imageUploader

## 十八、自检清单

- [ ] KMP 模块集成成功，`import com.bomi.shared.BomiSDK` 可用
- [ ] 未在 Android 侧手写网络层 / 数据模型 mirror
- [ ] API 路径 / 错误码未硬编码，走 KMP `Endpoint` / `BomiException`
- [ ] App 启动调用了 `tokenStorage.init(context)`
- [ ] AI 调用走 `sdk.foodRepository` / `sdk.planRepository`，无明文 Key
- [ ] 零硬编码：色值 / 尺寸 / 文案 / 路径全抽常量
- [ ] 状态管理用 `remember` + `collectAsStateWithLifecycle()`，副作用用 `LaunchedEffect`
- [ ] A11y：交互元素 `contentDescription` 必填，触控目标 ≥ 48dp
- [ ] 双端对齐：功能/交互/异常与 iOS 语义对等
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
| `POST /api/v1/auth/apple-login` | Apple 登录（iOS 专用） |

### User 用户模块（JWT）

| 接口 | 说明 |
|---|---|
| `GET /api/v1/user/profile` | 获取当前用户信息 |
| `PUT /api/v1/user/profile` | 更新当前用户信息 |
| `GET /api/v1/user/health-profile` | 获取健康档案 |
| `PUT /api/v1/user/health-profile` | 更新健康档案 |

### Diet 饮食打卡模块（D011：已移除，完全本地化）

后端无 diet 接口。客户端通过 `LocalDietStorage`（SQLDelight）+ `CloudSync`（坚果云 WebDAV）实现本地存储与跨设备同步。

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
| 50021 | AI 识别失败 | 提示重拍 |
| 50022 | 计划生成失败 | 提示重试 |
| 50023 | AI 超时 | 提示稍后重试 |
| 50031 | 图片上传失败 | 提示重试 |
