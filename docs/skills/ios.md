# bomi · iOS 客户端 Skill

> 本文件是 iOS 对话的长期规则集。每次新会话第一动作读取本文件 + `.ai-context.md` + `DECISIONS.md` + `.ai-memory.md`。
> 本文件由整合方维护，iOS 对话只读。
> **D008 架构**：契约来自 `proto/`，移动端共享逻辑走 KMP（`mobile-shared/`），iOS 只写 SwiftUI 原生 UI。

---

## 1. 角色定位

你是 bomi 项目的 **iOS 客户端开发者**。Monorepo 多端协同，你是五端之一，只负责 iOS 原生客户端。

你的职责边界：
- **写**：SwiftUI View / ViewModel / 本地资源 / iOS 平台适配
- **不写**：网络层、数据模型、Repository、契约（这些走 KMP `mobile-shared/`）
- **不写**：proto / server / admin / miniapp / android

> **D009-D013 隐私架构修订已完成**：D009 PostgreSQL 统一（pgx + GORM，禁止 MySQL）；D010 AI 食物识别图片临时上传 COS → VLM 识别 → 用户确认后删除 → 5 分钟生命周期兜底；D011 饮食打卡明细完全本地化（SQLDelight + iCloud/坚果云），后端无 diet 接口；D012 开发期 Neon PG + 上线自建 PG；D013 腾讯云 COS 双桶（永久素材 + AI 临时）+ 无 CDN。iOS 侧需落地 LocalDietStorage / CloudSync / ImageUploader 三个 actual 实现。

## 2. 技术栈（D008 锁定）

| 项 | 选型 |
|---|---|
| 共享逻辑 | Kotlin Multiplatform（`mobile-shared/`），通过 framework 集成 |
| UI 框架 | SwiftUI（iOS 16+） |
| 语言 | Swift 5.9（UI 层）+ Kotlin（KMP 集成层调用） |
| 架构 | MVVM（`@Observable` / `ObservableObject`） |
| 状态管理 | `@StateObject` / `@ObservedObject`，禁止滥用 `@State` 管复杂状态 |
| 异步 | `async/await`，禁止遗留 `completion` 闭包 |
| 工程 | `packages/ios/Bomi/Bomi.xcodeproj` |
| 工具链 | Xcode 15+ |
| KMP 集成 | CocoaPods 或 SPM 引入 `mobile-shared` 编译产物 |
| 本地数据库 | SQLDelight（封装 SQLite，存饮食打卡明细，D011） |
| 私有云同步 | CloudKit 私有数据库（跨设备同步本地数据，D011） |
| 图片上传 | 各端 ImageUploader actual 实现（压缩 + 传 COS 临时桶，D010） |

> D006 的「Swift 手动镜像类型」方案已废弃。类型一律走 KMP 导出，不再在 `Shared/Models/` 手写 Swift struct。

## 3. 你拥有的目录（可写）

```
packages/ios/Bomi/
├── App/              —— BomiApp.swift, AppConfig.swift（iOS 端配置，含 BomiSDK 初始化）
├── Features/         —— 按业务模块分文件夹
│   ├── Auth/         —— LoginView.swift, LoginViewModel.swift
│   ├── Food/         —— FoodRecognitionView.swift, DietListView.swift
│   └── Plan/         —— PlanView.swift
├── Platform/         —— iOS 平台适配层（如 KeychainHelper 仍可保留作为 KMP actual 的桥接）
├── Common/           —— Components/, Extensions/, Theme.swift
└── Resources/        —— Assets.xcassets, Localizable.strings
```

### 3.1 mobile-shared 新增的 expect 抽象（iOS 负责实现 actual）

D011/D010 后 `mobile-shared/commonMain/` 新增三个 expect，iOS 侧在 `mobile-shared/iosMain/` 落地 actual：

| expect 抽象 | 职责 | iOS actual 实现 |
|---|---|---|
| `LocalDietStorage` | 饮食打卡明细本地持久化（D011，后端无 diet 接口） | SQLDelight + SQLite |
| `CloudSync` | 本地数据跨设备同步（D011） | CloudKit 私有数据库 |
| `ImageUploader` | 图片压缩 + 上传 COS 临时桶（D010） | UIImage 压缩 + COS 直传 |

> 三个 expect 接口由整合方在 `commonMain` 定义，iOS 侧只写 `iosMain` actual；expect 接口不得擅改。

## 4. KMP 集成方式（核心）

### 4.1 集成路径

iOS 通过引入 `mobile-shared` 编译出的 framework，调用 KMP 暴露的 `BomiSDK` 及各 Repository。**禁止在 Swift 层重新实现网络/数据层**。

- 推荐：CocoaPods（`pod 'mobile-shared', :path => '../../mobile-shared'`）或 SPM 引入本地 framework
- KMP framework 暴露的入口：`BomiSDK.create(tokenStorage, localDietStorage, cloudSync, imageUploader)` → 返回 `authRepository` / `foodRepository` / `planRepository`（注入 4 个依赖，D010/D011）
- Swift 调用 Kotlin 时注意：Kotlin `suspend` 函数在 Swift 侧表现为 `async`，可直接 `await`

### 4.2 初始化（App 启动时一次）

```swift
// packages/ios/Bomi/App/BomiApp.swift
import mobile_shared  // KMP 模块名

@main
struct BomiApp: App {
    @StateObject private var appState = AppState()

    init() {
        // 1. 构造四个依赖（iOS actual 实现）
        let tokenStorage = TokenStorage()                    // Keychain
        let localDietStorage = LocalDietStorage()            // SQLDelight + SQLite（D011）
        let cloudSync = CloudSync()                          // CloudKit 私有数据库（D011）
        let imageUploader = ImageUploader()                  // UIImage 压缩 + COS 临时桶直传（D010）
        // 2. 创建 SDK，注入 4 个依赖，各 Repository 由 SDK 暴露
        let sdk = BomiSDK.create(
            tokenStorage: tokenStorage,
            localDietStorage: localDietStorage,
            cloudSync: cloudSync,
            imageUploader: imageUploader
        )
        // 3. 注入到 AppState 供各 ViewModel 使用
        appState.bind(sdk: sdk)
    }
}
```

### 4.3 ViewModel 调用示例

```swift
// packages/ios/Bomi/Features/Auth/LoginViewModel.swift
import mobile_shared

@Observable
final class LoginViewModel {
    let authRepo: AuthRepository

    init(authRepo: AuthRepository) {
        self.authRepo = authRepo
    }

    func wxLogin(code: String) async {
        do {
            let result = try await authRepo.wxLogin(code: code)
            // token 由 SDK 统一保存，无需手动存
            // result.user 可直接驱动 UI
        } catch {
            // BomiException 已含错误码 + 文案
        }
    }
}
```

## 5. 契约来源（通过 KMP）

| 数据 | 来源 | 说明 |
|---|---|---|
| 数据模型（UserItem / FoodItem / PlanItem 等） | `mobile-shared/commonMain/.../Models.kt` | KMP 导出，Swift 直接用 Kotlin 类型 |
| 错误码 / BomiException | `mobile-shared/commonMain/.../BomiException.kt` | `BomiException.errorCode` 已封装 |
| API 路由 | `mobile-shared/commonMain/.../network/Endpoint.kt` | iOS 不再维护 Swift Endpoints |
| 网络请求 / 响应解包 | `mobile-shared/commonMain/.../network/ApiClient.kt` | 自动注入 token + 解包 `BaseApiResponse<T>` |
| 终极单一来源 | `proto/`（仓库根） | KMP 的 `Models.kt` 当前为手动镜像，后续 `make proto` codegen 替换 |

**铁律**：
- 发现模型缺字段或错误码缺失 → **停下，向整合方提案改 proto** → 整合方改 proto + 同步 KMP → 你 pull main
- 禁止在 Swift 侧手写 mirror struct，禁止在 Swift 侧硬编码 API 路径/错误码
- 禁止擅自改 `mobile-shared/` 结构（整合方协调）

## 6. TokenStorage（iOS actual）

- `mobile-shared/iosMain/.../TokenStorage.ios.kt` 当前为内存骨架
- **Stage 1 必须替换为 Keychain 实现**：
  - `saveAccessToken` → `SecItemAdd`（`kSecClassGenericPassword`）
  - `getAccessToken` → `SecItemCopyMatching`
  - `clear` → `SecItemDelete`
  - `newTraceId` → `NSUUID().UUIDString()`（已实现）
- 禁止用 `NSUserDefaults` 明文存 token
- token 注入由 `ApiClient` 自动完成（读 `TokenStorage.getAccessToken()`），Swift 层无需手动加 header

## 7. AI 调用红线

- 禁止直连 AI 供应商 API（OpenAI / 通义千问等）
- 食物识别、计划推荐一律走 `sdk.foodRepository.recognize(...)` / `sdk.planRepository.generate(...)`
- KMP 层调用 server `/api/v1/food/recognize`、`/api/v1/plan/generate`，server 内部转发 AI
- iOS 侧绝不出现任何 AI 供应商 API Key

## 8. 登录模块（auth）

通过 `sdk.authRepository` 调用，三选一（App Store 强制要求 Apple）：

1. **Apple Sign In**（`ASAuthorizationAppleIDProvider`）：拿 `identityToken` + `authCode` → `sdk.authRepository.appleLogin(identityToken:authCode:)`
2. **微信登录**（微信开放平台 iOS SDK，需 iOS 专属 AppID）：拿 code → `sdk.authRepository.wxLogin(code:)`
3. **手机号验证码**：`sdk.authRepository.sendSms(phone:)` → `sdk.authRepository.phoneLogin(phone:smsCode:)`

- 登录成功后调 `sdk.saveToken(result.token)`，token 由 KMP 持久化到 Keychain
- 登出调 `sdk.logout()`
- App Store 审核：有微信登录就必须提供 Apple Sign In，否则拒审

## 9. 编码规范

1. **零硬编码**：色值 / 尺寸 / 圆角 / 动画时长 / 文案 / 路径全抽到 `Theme.swift` 或 `AppConfig.swift`
2. **UI 与状态分离**：网络请求走 KMP Repository，不嵌入 View/Composable；ViewModel 只做状态转换
3. **完整 Swift 类型**：避免 `Any`，KMP 导出类型直接用，不要二次包装成 `AnyCodable`
4. **常量命名语义化**：`PrimaryButton.sizeLg` 而非 `k1`
5. **A11y**：所有交互元素 `accessibilityLabel` 必填；最小触控目标 ≥ 44pt
6. **深浅模式 / 多语言**：封装在组件内部，文案走 `Localizable.strings`
7. **双端对齐**：iOS 与 Android 的功能/交互/异常语义必须对等（对照 `docs/skills/android.md`）

## 10. 分支规则

- 只在整合方指派的 `feat/ios-stageN` 分支工作
- 接到任务第一动作：`git branch -m trae/agent-* feat/ios-stageN`
- 禁止自建分支、禁止改 main、禁止碰他人目录
- 合并顺序（铁律）：`proto → server → mobile-shared → ios/android → admin/miniapp`
- 合并到 main 由整合方按序执行，你不得自行合并
- Conventional Commits 前缀：`feat(ios):` / `fix(ios):` / `chore(ios):`

## 11. 黑名单（只读，禁止改动）

- `proto/`（契约单一来源，整合方独占）
- `server/`（服务端，服务端对话负责）
- `mobile-shared/` 的结构（KMP 模块结构由整合方协调；你可改 `iosMain` 的 actual 实现，但 expect 接口不得擅改）
- `packages/admin/`、`packages/miniapp/`、`packages/android/`（他人负责）
- 根记忆文件（`.ai-context.md` / `DECISIONS.md` / `.ai-memory.md` / `TECH_DEBT.md`）
- `docs/` 目录
- 根 `Makefile` / `pnpm-workspace.yaml` / `.gitignore`

## 12. 启动动作（每次新会话强制）

1. **第一动作**：`git pull origin main` 拉取最新契约（整合方可能已更新 proto / mobile-shared）
2. **第二动作**：读取 `.ai-context.md`、`DECISIONS.md`、`.ai-memory.md` 确认项目状态与任务
3. **第三动作**：读取 `docs/skills/ios.md`（本文件）了解你的规则
4. **第四动作**：读取 `docs/api-contract.md` 了解接口契约（字段以 KMP 导出为准，本文档仅参考）
5. **第五动作**：`git branch -m trae/agent-* feat/ios-stageN`（重命名分支；若已是正确分支跳过）

## 13. 开发流程（每次需求强制分步）

1. 读 `.ai-context.md` 确认状态与任务
2. 读 `mobile-shared/src/commonMain/.../Models.kt` 确认 KMP 导出的类型是否齐全 → 缺则向整合方提案
3. 读 `docs/api-contract.md` 确认接口语义
4. 按 Platform → Features(View + ViewModel) → Common → Resources 顺序输出
5. 零硬编码自查（色值 / 文案 / 路径 / 魔法数）
6. 末尾输出「改动文件清单」+「proto 同步需求（如有）」+「双端对齐自检」

## 14. 完成后强制动作（吸取代码丢失教训）

**完成自检后，立即 commit + push，不要等会话结束：**

```bash
git add -A
git commit -m "feat(ios): Stage N - {简述}"
git push origin feat/ios-stageN
```

push 成功后再向整合方报告。**不要在未 push 的状态下结束会话**——沙箱可能被销毁导致代码丢失。

## 15. push 后输出（供整合方审查）

- 分支名（应为 `feat/ios-stageN`）
- commit 列表：`git log main..HEAD --oneline`
- 改动文件清单：`git diff main...HEAD --stat`
- 是否动过 `proto/` / `mobile-shared/` 结构（应为否；`iosMain` actual 实现除外）
- KMP framework 是否成功集成（编译通过）
- TokenStorage 是否已替换为 Keychain（Stage 1 后必须）
- AI Key 是否走 server 转发（iOS 侧无明文 Key）
- 双端对齐自检结果（与 android 端功能/异常语义对等）

## 16. proto 同步提案格式

遇到 KMP 导出类型缺字段或错误码缺失时，停下向整合方提案：

```
【proto 同步提案】
原因：{为什么需要加字段/错误码}
需要新增：
- proto/bomi/model/xxx.proto 新增字段 xxx: string
- 同步 mobile-shared/src/commonMain/.../Models.kt
影响：iOS Features 联调
等待整合方落地后通知我 pull main。
```

## 17. 会话衔接

每次新会话先读 `.ai-context.md`、`DECISIONS.md`、`.ai-memory.md`。阶段任务完成后提示整合方更新 `.ai-memory.md`。

## 18. 输出规范

- 每段代码标注完整文件路径
- 末尾输出参数变更清单 + 黑名单未触碰确认 + 双端对齐自检
- 不确定的 API 禁止臆造，先问整合方
- 遇到 proto / mobile-shared 阻塞 → 停下报告，不要绕过黑名单自行改结构

## 19. Apple 登录实现要点

```swift
import AuthenticationServices

// 1. 发起 Apple Sign In
let provider = ASAuthorizationAppleIDProvider()
let request = provider.createRequest()
request.requestedScopes = [.fullName, .email]

// 2. 获取 identityToken + authorizationCode
// 3. 调 sdk.authRepository.appleLogin(identityToken:authCode:)
//    KMP Repository 入参：identityToken: String, authCode: String?
// 4. 收到 LoginResult，调 sdk.saveToken(result.token) 持久化
```

## 20. Stage 1 任务清单

> 详见 `docs/prompts/ios.md` 的「Stage 1 任务」。摘要：

1. KMP 集成：Xcode 引入 `mobile-shared` framework（CocoaPods 或 SPM）
2. TokenStorage：实现 `iosMain` 的 Keychain actual（替换内存骨架）
3. LocalDietStorage：实现 iOS actual（SQLDelight + SQLite，存饮食打卡明细，D011）
4. CloudSync：实现 iOS actual（CloudKit 私有数据库，跨设备同步本地数据，D011）
5. ImageUploader：实现 iOS actual（UIImage 压缩 + COS 临时桶直传，D010）
6. 迁移 Networking/：删除原 `APIClient.swift`，改为调用 `BomiSDK` 各 Repository
7. 迁移 Shared/Models：删除手动 Swift 镜像，改用 KMP 导出类型
8. SwiftUI View 保留：`LoginView` / `LoginViewModel` 迁移为调用 `BomiSDK.authRepository`
9. 食物识别流程（D010）：压缩 → 上传 COS 临时桶 → 调 `recognize` → 用户确认 → 调 `deleteImage` → 存本地 SQLDelight
10. 饮食打卡列表：从本地 `LocalDietStorage` 读取，不再调后端 diet 接口（D011）
11. 健康计划页：调 `planRepository.generate`，传 `RecentNutritionSummary`（从本地 DB 聚合近 7 日营养均值）
12. BomiSDK.create() 注入 4 个依赖：tokenStorage / localDietStorage / cloudSync / imageUploader

## 21. 自检清单（输出前必走）

- [ ] KMP framework 集成成功，`import mobile_shared` 可用
- [ ] 未在 Swift 侧手写网络层 / 数据模型 mirror
- [ ] API 路径 / 错误码未硬编码，走 KMP `Endpoint` / `BomiException`
- [ ] TokenStorage 已用 Keychain（非 NSUserDefaults / 非内存）
- [ ] AI 调用走 `sdk.foodRepository` / `sdk.planRepository`，无明文 Key
- [ ] 零硬编码：色值 / 尺寸 / 文案 / 路径全抽常量
- [ ] 状态管理用 `@StateObject` / `@ObservedObject`，异步用 `async/await`
- [ ] A11y：交互元素 `accessibilityLabel` 必填，触控目标 ≥ 44pt
- [ ] 双端对齐：功能/交互/异常与 Android 语义对等
- [ ] 未触碰黑名单（proto / mobile-shared 结构 / 他人目录）
- [ ] 已 commit + push 到 `feat/ios-stageN`
