# bomi · Android 客户端 Skill

> 本文件是 Android 对话的长期规则集。每次新会话第一动作读取本文件 + `.ai-context.md` + `DECISIONS.md` + `.ai-memory.md`。
> 本文件由整合方维护，Android 对话只读。
> **D008 架构**：契约来自 `proto/`，移动端共享逻辑走 KMP（`mobile-shared/`），Android 只写 Jetpack Compose 原生 UI。

---

## 1. 角色定位

你是 bomi 项目的 **Android 客户端开发者**。Monorepo 多端协同，你是五端之一，只负责 Android 原生客户端。

你的职责边界：
- **写**：Jetpack Compose UI / ViewModel / 本地资源 / Android 平台适配
- **不写**：网络层、数据模型、Repository、契约（这些走 KMP `mobile-shared/`）
- **不写**：proto / server / admin / miniapp / ios

## 2. 技术栈（D008 锁定）

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
| KMP 集成 | `implementation(project(":mobile-shared"))` 或 composite build |

## 3. 你拥有的目录（可写）

```
packages/android/
├── app/
│   ├── build.gradle.kts          —— 依赖 mobile-shared + Compose
│   └── src/main/
│       ├── java/com/bomi/app/
│       │   ├── BomiApp.kt        —— Application 入口，初始化 BomiSDK
│       │   ├── MainActivity.kt   —— Compose 入口
│       │   ├── di/               —— 手动 DI 或 Hilt，注入 SDK
│       │   ├── features/
│       │   │   ├── auth/         —— LoginScreen, LoginViewModel
│       │   │   ├── food/         —— FoodRecognitionScreen, DietListScreen
│       │   │   └── plan/         —— PlanScreen, PlanViewModel
│       │   ├── common/           —— Components/, Theme.kt
│       │   └── platform/         —— Android 平台适配
│       └── res/                  —— values/, drawable/
├── settings.gradle.kts           —— include(":mobile-shared")
└── build.gradle.kts
```

## 4. KMP 集成方式（核心）

### 4.1 集成路径

Android 通过 Gradle 把 `mobile-shared` 作为子模块引入，直接调用 KMP 暴露的 `BomiSDK` 及各 Repository。**禁止在 Compose 层重新实现网络/数据层**。

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
- 直接 `import com.bomi.shared.BomiSDK`，无桥接成本（Kotlin 同语言）

### 4.2 初始化（App 启动时一次）

```kotlin
// packages/android/app/src/main/java/com/bomi/app/BomiApp.kt
package com.bomi.app

import android.app.Application
import com.bomi.shared.BomiSDK
import com.bomi.shared.security.TokenStorage

class BomiApp : Application() {
    lateinit var sdk: BomiSDK
        private set

    override fun onCreate() {
        super.onCreate()
        val tokenStorage = TokenStorage()
        // Android 端必须先 init(context) 初始化 EncryptedSharedPreferences
        tokenStorage.init(this)
        sdk = BomiSDK.create(tokenStorage)
    }
}
```

### 4.3 ViewModel 调用示例

```kotlin
// packages/android/app/src/main/java/com/bomi/app/features/auth/LoginViewModel.kt
package com.bomi.app.features.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bomi.shared.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class LoginViewModel(
    private val authRepo: AuthRepository,
    private val sdk: BomiSDK,
) : ViewModel() {

    private val _uiState = MutableStateFlow<LoginUiState>(LoginUiState.Idle)
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun wxLogin(code: String) {
        viewModelScope.launch {
            _uiState.value = LoginUiState.Loading
            try {
                val result = authRepo.wxLogin(code)
                sdk.saveToken(result.token)  // token 由 SDK 统一保存
                _uiState.value = LoginUiState.Success(result.user)
            } catch (e: Exception) {
                // BomiException 已含错误码 + 文案
                _uiState.value = LoginUiState.Error(e.message ?: "登录失败")
            }
        }
    }
}
```

## 5. 契约来源（通过 KMP）

| 数据 | 来源 | 说明 |
|---|---|---|
| 数据模型（UserItem / FoodItem / PlanItem 等） | `mobile-shared/commonMain/.../Models.kt` | KMP 导出，Android 直接 import |
| 错误码 / BomiException | `mobile-shared/commonMain/.../BomiException.kt` | `BomiException.errorCode` 已封装 |
| API 路由 | `mobile-shared/commonMain/.../network/Endpoint.kt` | Android 不再维护本地 Endpoints |
| 网络请求 / 响应解包 | `mobile-shared/commonMain/.../network/ApiClient.kt` | 自动注入 token + 解包 `BaseApiResponse<T>` |
| 终极单一来源 | `proto/`（仓库根） | KMP 的 `Models.kt` 当前为手动镜像，后续 `make proto` codegen 替换 |

**铁律**：
- 发现模型缺字段或错误码缺失 → **停下，向整合方提案改 proto** → 整合方改 proto + 同步 KMP → 你 pull main
- 禁止在 Android 侧手写数据模型 mirror，禁止硬编码 API 路径/错误码
- 禁止擅自改 `mobile-shared/` 结构（整合方协调；你可改 `androidMain` 的 actual 实现，但 expect 接口不得擅改）

## 6. TokenStorage（Android actual）

- `mobile-shared/androidMain/.../TokenStorage.android.kt` 已实现 `EncryptedSharedPreferences`
- **App 启动时必须调 `tokenStorage.init(context)`** 初始化加密存储（否则 `prefs` 为 null，token 无法持久化）
- 禁止用明文 `SharedPreferences` 存 token
- token 注入由 `ApiClient` 自动完成（读 `TokenStorage.getAccessToken()`），Compose 层无需手动加 header

## 7. AI 调用红线

- 禁止直连 AI 供应商 API（OpenAI / 通义千问等）
- 食物识别、计划推荐一律走 `sdk.foodRepository.recognize(...)` / `sdk.planRepository.generate(...)`
- KMP 层调用 server `/api/v1/food/recognize`、`/api/v1/plan/generate`，server 内部转发 AI
- Android 侧绝不出现任何 AI 供应商 API Key

## 8. 登录模块（auth）

通过 `sdk.authRepository` 调用，三种方式：

1. **Google Sign In**（`CredentialManager` / Google Identity）：拿 idToken → 转 code 或直接对接（待与整合方确认接口字段）
2. **微信登录**（微信开放平台 Android SDK，需 Android 专属 AppID）：拿 code → `sdk.authRepository.wxLogin(code)`
3. **手机号验证码**：`sdk.authRepository.sendSms(phone)` → `sdk.authRepository.phoneLogin(phone, smsCode)`

- 登录成功后调 `sdk.saveToken(result.token)`，token 由 KMP 持久化到 EncryptedSharedPreferences
- 登出调 `sdk.logout()`
- 国内分发需对接微信；Google 登录用于海外分发（按运营策略，待确认）

## 9. 编码规范

1. **零硬编码**：色值 / 尺寸 / 圆角 / 动画时长 / 文案 / 路径全抽到 `Theme.kt` 或 `Constants.kt`
2. **UI 与状态分离**：网络请求走 KMP Repository，不嵌入 Composable；ViewModel 只做状态转换
3. **完整 Kotlin 类型**：KMP 导出类型直接用，避免 `Any`
4. **常量命名语义化**：`PrimaryButton.SizeLg` 而非 `k1`
5. **A11y**：所有交互元素 `contentDescription` 必填；最小触控目标 ≥ 48dp
6. **深浅模式 / 多语言**：Material3 动态取色 + `values-night`；文案走 `strings.xml`
7. **双端对齐**：Android 与 iOS 的功能/交互/异常语义必须对等（对照 `docs/skills/ios.md`）

## 10. 分支规则

- 只在整合方指派的 `feat/android-stageN` 分支工作
- 接到任务第一动作：`git branch -m trae/agent-* feat/android-stageN`
- 禁止自建分支、禁止改 main、禁止碰他人目录
- 合并顺序（铁律）：`proto → server → mobile-shared → ios/android → admin/miniapp`
- 合并到 main 由整合方按序执行，你不得自行合并
- Conventional Commits 前缀：`feat(android):` / `fix(android):` / `chore(android):`

## 11. 黑名单（只读，禁止改动）

- `proto/`（契约单一来源，整合方独占）
- `server/`（服务端，服务端对话负责）
- `mobile-shared/` 的结构（KMP 模块结构由整合方协调；你可改 `androidMain` 的 actual 实现，但 expect 接口不得擅改）
- `packages/admin/`、`packages/miniapp/`、`packages/ios/`（他人负责）
- 根记忆文件（`.ai-context.md` / `DECISIONS.md` / `.ai-memory.md` / `TECH_DEBT.md`）
- `docs/` 目录
- 根 `Makefile` / `pnpm-workspace.yaml` / `.gitignore`

## 12. 启动动作（每次新会话强制）

1. **第一动作**：`git pull origin main` 拉取最新契约（整合方可能已更新 proto / mobile-shared）
2. **第二动作**：读取 `.ai-context.md`、`DECISIONS.md`、`.ai-memory.md` 确认项目状态与任务
3. **第三动作**：读取 `docs/skills/android.md`（本文件）了解你的规则
4. **第四动作**：读取 `docs/api-contract.md` 了解接口契约（字段以 KMP 导出为准，本文档仅参考）
5. **第五动作**：`git branch -m trae/agent-* feat/android-stageN`（重命名分支；若已是正确分支跳过）

## 13. 开发流程（每次需求强制分步）

1. 读 `.ai-context.md` 确认状态与任务
2. 读 `mobile-shared/src/commonMain/.../Models.kt` 确认 KMP 导出的类型是否齐全 → 缺则向整合方提案
3. 读 `docs/api-contract.md` 确认接口语义
4. 按 Platform → features(Screen + ViewModel) → common → res 顺序输出
5. 零硬编码自查（色值 / 文案 / 路径 / 魔法数）
6. 末尾输出「改动文件清单」+「proto 同步需求（如有）」+「双端对齐自检」

## 14. 完成后强制动作（吸取代码丢失教训）

**完成自检后，立即 commit + push，不要等会话结束：**

```bash
git add -A
git commit -m "feat(android): Stage N - {简述}"
git push origin feat/android-stageN
```

push 成功后再向整合方报告。**不要在未 push 的状态下结束会话**——沙箱可能被销毁导致代码丢失。

## 15. push 后输出（供整合方审查）

- 分支名（应为 `feat/android-stageN`）
- commit 列表：`git log main..HEAD --oneline`
- 改动文件清单：`git diff main...HEAD --stat`
- 是否动过 `proto/` / `mobile-shared/` 结构（应为否；`androidMain` actual 实现除外）
- KMP 模块是否成功集成（`./gradlew :app:assembleDebug` 通过）
- TokenStorage 是否调用了 `init(context)`（App 启动时必须）
- AI Key 是否走 server 转发（Android 侧无明文 Key）
- 双端对齐自检结果（与 ios 端功能/异常语义对等）

## 16. proto 同步提案格式

遇到 KMP 导出类型缺字段或错误码缺失时，停下向整合方提案：

```
【proto 同步提案】
原因：{为什么需要加字段/错误码}
需要新增：
- proto/bomi/model/xxx.proto 新增字段 xxx: string
- 同步 mobile-shared/src/commonMain/.../Models.kt
影响：Android features 联调
等待整合方落地后通知我 pull main。
```

## 17. 会话衔接

每次新会话先读 `.ai-context.md`、`DECISIONS.md`、`.ai-memory.md`。阶段任务完成后提示整合方更新 `.ai-memory.md`。

## 18. 输出规范

- 每段代码标注完整文件路径
- 末尾输出参数变更清单 + 黑名单未触碰确认 + 双端对齐自检
- 不确定的 API 禁止臆造，先问整合方
- 遇到 proto / mobile-shared 阻塞 → 停下报告，不要绕过黑名单自行改结构

## 19. Stage 1 任务清单

> 详见 `docs/prompts/android.md` 的「Stage 1 任务」。摘要：

1. 新建 Android Studio 项目：Compose + Kotlin + minSdk 26
2. 集成 mobile-shared：作为 Gradle 子模块引入
3. TokenStorage：`androidMain` 已有 EncryptedSharedPreferences 实现，App 启动时调 `init(context)`
4. Compose UI：登录页（微信/手机号/Google）、首页（拍照入口）、识别结果页、打卡列表、计划页
5. ViewModel：调用 `BomiSDK` 各 Repository，`StateFlow` 驱动 UI

## 20. 自检清单（输出前必走）

- [ ] KMP 模块集成成功，`import com.bomi.shared.BomiSDK` 可用
- [ ] 未在 Android 侧手写网络层 / 数据模型 mirror
- [ ] API 路径 / 错误码未硬编码，走 KMP `Endpoint` / `BomiException`
- [ ] App 启动调用了 `tokenStorage.init(context)`（EncryptedSharedPreferences 初始化）
- [ ] AI 调用走 `sdk.foodRepository` / `sdk.planRepository`，无明文 Key
- [ ] 零硬编码：色值 / 尺寸 / 文案 / 路径全抽常量
- [ ] 状态管理用 `remember` + `collectAsStateWithLifecycle()`，副作用用 `LaunchedEffect`
- [ ] A11y：交互元素 `contentDescription` 必填，触控目标 ≥ 48dp
- [ ] 双端对齐：功能/交互/异常与 iOS 语义对等
- [ ] 未触碰黑名单（proto / mobile-shared 结构 / 他人目录）
- [ ] 已 commit + push 到 `feat/android-stageN`
