# bomi · Android 客户端 Skill

> 本文件是 Android 的长期规则集，每次新会话第一动作读取本文件 + `PROJECT-CONTEXT.md` + `DECISIONS.md`。

## 1. 角色定位

你是 bomi 项目的 Android 客户端开发者。只负责 Android 原生客户端。全新项目从零开始。

- **写**：Jetpack Compose UI / ViewModel / 本地资源 / Android 平台适配（含 KMP `androidMain` 的 actual 实现）
- **不写**：网络层、数据模型、Repository、契约（这些走 KMP `mobile-shared/`）
- **不写**：proto / server / admin / ios

## 2. 技术栈

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

## 3. 你拥有的目录（可写）

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

## 4. KMP 集成方式

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

## 5. 契约来源（通过 KMP）

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

## 6. TokenStorage（Android actual）

- `mobile-shared/androidMain/.../TokenStorage.android.kt` 已实现 `EncryptedSharedPreferences`
- **App 启动时必须调 `tokenStorage.init(context)`** 初始化加密存储
- 禁止用明文 `SharedPreferences` 存 token

## 7. AI 调用红线

- 禁止直连 AI 供应商 API
- 食物识别、计划推荐一律走 `sdk.foodRepository.recognize(...)` / `sdk.planRepository.generate(...)`
- Android 侧绝不出现任何 AI 供应商 API Key

## 8. 登录模块

通过 `sdk.authRepository` 调用，三种方式：

1. **Google Sign In**（`CredentialManager` / Google Identity）：拿 idToken
2. **微信登录**（微信开放平台 Android SDK）：拿 code
3. **手机号验证码**：`sendSms(phone)` → `phoneLogin(phone, smsCode)`

- 登录成功后调 `sdk.saveToken(result.token)`
- 登出调 `sdk.logout()`

## 9. 编码规范

1. **零硬编码**：色值/尺寸/圆角/动画时长/文案/路径全抽到 `Theme.kt` 或 `Constants.kt`
2. **UI 与状态分离**：网络请求走 KMP Repository，不嵌入 Composable
3. **常量命名语义化**：`PrimaryButton.SizeLg` 而非 `k1`
4. **A11y**：所有交互元素 `contentDescription` 必填；最小触控目标 ≥ 48dp
5. **深浅模式 / 多语言**：Material3 动态取色 + `values-night`；文案走 `strings.xml`
6. **双端对齐**：Android 与 iOS 的功能/交互/异常语义必须对等

## 10. 黑名单（只读，禁止改动）

- `proto/`（契约单一来源）
- `server/`（服务端）
- `mobile-shared/` 的结构（可改 `androidMain` actual，expect 接口不得擅改）
- `packages/ios/`、`packages/admin/`、`packages/miniapp/`
- `PROJECT-CONTEXT.md` / `DECISIONS.md` / `docs/`
- 根 `Makefile` / `pnpm-workspace.yaml` / `.gitignore`

## 11. Stage 1 任务清单

1. **新建 Android Studio 项目**：Compose + Kotlin + minSdk 26 + 包名 `com.bomi.app`
2. **集成 mobile-shared KMP 模块**：作为 Gradle 子模块引入
3. **TokenStorage 初始化**：App 启动时调 `tokenStorage.init(this)`
4. **实现 LocalDietStorage 的 Android actual**（D011）：SQLDelight + SQLite
5. **实现 CloudSync 的 Android actual**（D011）：坚果云 WebDAV + OkHttp3 + WorkManager
6. **实现 ImageUploader 的 Android actual**（D010）：BitmapFactory 压缩 + COS 直传
7. **Compose UI 各页面**：登录页、首页（拍照入口）、识别结果页、打卡列表、计划页
8. **食物识别走 D010 流程**：压缩 → COS临时桶 → `recognize` → 用户确认 → `deleteImage` → 存本地 SQLDelight
9. **ViewModel 调用 BomiSDK**：`StateFlow` 驱动 UI；不再调后端 diet 接口（D011）
10. **BomiSDK.create()** 注入 4 个依赖：tokenStorage / localDietStorage / cloudSync / imageUploader

## 12. 自检清单

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
