# bomi · iOS 客户端 Skill

> 本文件是 iOS 的长期规则集，每次新会话第一动作读取本文件 + `PROJECT-CONTEXT.md` + `DECISIONS.md`。

## 1. 角色定位

你是 bomi 项目的 iOS 客户端开发者。只负责 iOS 原生客户端。

- **写**：SwiftUI View / ViewModel / 本地资源 / iOS 平台适配（含 KMP `iosMain` 的 actual 实现）
- **不写**：网络层、数据模型、Repository、契约（这些走 KMP `mobile-shared/`）
- **不写**：proto / server / admin / android

## 2. 技术栈

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

## 3. 你拥有的目录（可写）

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

## 4. KMP 集成方式

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
- 禁止在 Swift 侧手写 mirror struct，禁止硬编码 API 路径/错误码
- 禁止擅自改 `mobile-shared/` 结构（可改 `iosMain` actual，expect 接口不得擅改）

## 6. TokenStorage（iOS actual）

- `mobile-shared/iosMain/.../TokenStorage.ios.kt` 当前为内存骨架
- **Stage 1 必须替换为 Keychain 实现**：
  - `saveAccessToken` → `SecItemAdd`（`kSecClassGenericPassword`）
  - `getAccessToken` → `SecItemCopyMatching`
  - `clear` → `SecItemDelete`
- 禁止用 `NSUserDefaults` 明文存 token

## 7. AI 调用红线

- 禁止直连 AI 供应商 API
- 食物识别、计划推荐一律走 `sdk.foodRepository.recognize(...)` / `sdk.planRepository.generate(...)`
- iOS 侧绝不出现任何 AI 供应商 API Key

## 8. 登录模块

通过 `sdk.authRepository` 调用，三选一（App Store 强制要求 Apple）：

1. **Apple Sign In**（`ASAuthorizationAppleIDProvider`）：拿 `identityToken` + `authCode`
2. **微信登录**（微信开放平台 iOS SDK）：拿 code
3. **手机号验证码**：`sendSms(phone:)` → `phoneLogin(phone:smsCode:)`

- 登录成功后调 `sdk.saveToken(result.token)`
- 登出调 `sdk.logout()`
- App Store 审核：有微信登录就必须提供 Apple Sign In

## 9. 编码规范

1. **零硬编码**：色值/尺寸/圆角/动画时长/文案/路径全抽到 `Theme.swift` 或 `AppConfig.swift`
2. **UI 与状态分离**：网络请求走 KMP Repository，不嵌入 View；ViewModel 只做状态转换
3. **常量命名语义化**：`PrimaryButton.sizeLg` 而非 `k1`
4. **A11y**：所有交互元素 `accessibilityLabel` 必填；最小触控目标 ≥ 44pt
5. **深浅模式 / 多语言**：封装在组件内部，文案走 `Localizable.strings`
6. **双端对齐**：iOS 与 Android 的功能/交互/异常语义必须对等

## 10. 黑名单（只读，禁止改动）

- `proto/`（契约单一来源）
- `server/`（服务端）
- `mobile-shared/` 的结构（可改 `iosMain` actual，expect 接口不得擅改）
- `packages/android/`、`packages/admin/`、`packages/miniapp/`
- `PROJECT-CONTEXT.md` / `DECISIONS.md` / `docs/`
- 根 `Makefile` / `pnpm-workspace.yaml` / `.gitignore`

## 11. Stage 1 任务清单

1. **KMP 集成**：Xcode 引入 `mobile-shared` framework（CocoaPods 或 SPM）
2. **TokenStorage**：实现 `iosMain` 的 Keychain actual（替换内存骨架）
3. **LocalDietStorage**：实现 iOS actual（SQLDelight + SQLite，存饮食打卡明细）
4. **CloudSync**：实现 iOS actual（CloudKit 私有数据库，跨设备同步）
5. **ImageUploader**：实现 iOS actual（UIImage 压缩 + COS 临时桶直传）
6. **迁移 Networking/**：删除原 `APIClient.swift`，改为调用 `BomiSDK` 各 Repository
7. **迁移 Shared/Models**：删除手动 Swift 镜像，改用 KMP 导出类型
8. **SwiftUI View**：`LoginView` / `LoginViewModel` 迁移为调用 `BomiSDK.authRepository`
9. **食物识别流程**（D010）：压缩 → 上传 COS → `recognize` → 用户确认 → `deleteImage` → 存本地
10. **饮食打卡列表**：从本地 `LocalDietStorage` 读取，不调后端（D011）
11. **健康计划页**：调 `planRepository.generate`，传 `RecentNutritionSummary`（本地聚合近7日营养均值）
12. **BomiSDK.create()** 注入 4 个依赖：tokenStorage / localDietStorage / cloudSync / imageUploader

## 12. 自检清单

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
