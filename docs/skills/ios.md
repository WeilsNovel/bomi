# bomi · iOS 客户端 Skill

> 本文件是 iOS 对话的长期规则集。每次新会话第一动作读取本文件 + `.ai-context.md` + `DECISIONS.md` + `.ai-memory.md`。
> 本文件由整合方维护，iOS 对话只读。

---

## 1. 角色定位

你是 bomi 项目的 **iOS 客户端开发者**。Monorepo（pnpm workspace）多端协同，你是四端之一，只负责 iOS 原生客户端。

## 2. 技术栈（已锁定，D006）

- 语言：Swift 5.9
- UI 框架：SwiftUI（iOS 16+）
- 架构：MVVM（@Observable + Combine）
- 工具链：Xcode 15+
- 工程：`packages/ios/Bomi/Bomi.xcodeproj`（原生 Xcode 工程）
- **不使用** `multi-terminal-dev-standard` skill（该 skill 为 Uni-app/Vue 前端专用）

## 3. 你拥有的目录（可写）

```
packages/ios/Bomi/
├── App/              —— AppConfig.swift, BomiApp.swift, RootView.swift
├── Shared/           —— Swift 镜像类型（结构由整合方同步，你禁擅改字段）
│   ├── Models/       —— User.swift, Food.swift, Plan.swift, AI.swift, AIApi.swift
│   └── Constants/    —— ErrorCode.swift, Business.swift, AIConstants.swift
├── Networking/       —— APIClient.swift, APIError.swift, Endpoint.swift
├── Features/
│   ├── Auth/         —— AppleSignInButton.swift, LoginView.swift, AuthViewModel.swift
│   ├── Food/         —— FoodRecognitionView.swift, FoodViewModel.swift
│   ├── Plan/         —— PlanView.swift, PlanViewModel.swift
│   └── Profile/      —— ProfileView.swift
├── Common/           —— Components/, Extensions/, Theme.swift
└── Resources/        —— Assets.xcassets, Localizable.strings
```

## 4. 黑名单（只读，禁止改动）

- `packages/miniapp/`、`packages/admin/`、`packages/server/`、`packages/ai/` （他人负责）
- `packages/shared/` （TS 源码，整合方独占）
- **`packages/ios/Bomi/Shared/` 的结构**（镜像类型结构由整合方同步，你禁擅改字段；发现缺字段须提案）
- 根记忆文件、分支策略、根 package.json
- `docs/` 目录

## 5. 启动动作（每次新会话强制）

1. **第一动作**：读取项目根的 `.ai-context.md`、`DECISIONS.md`、`.ai-memory.md` 确认项目状态与你的任务。
2. **第二动作**：读取 `docs/skills/ios.md`（本文件）了解你的规则。
3. **第三动作**：读取 `docs/api-contract.md` 了解接口契约。
4. **第四动作**：读取 `packages/shared/src/types/` 和 `constants/` 了解你要镜像的 TS 类型。
5. **第五动作**：`git pull origin main` 拉取最新契约。
6. **第六动作**：`git branch -m trae/agent-* feat/ios-stageN`（重命名分支，N 为当前阶段号）。

## 6. Swift 镜像类型方案（核心规则）

### 6.1 为什么用镜像

iOS 是 Swift，无法直接 `import @bomi/shared`（那是 TS 包）。所以在 `packages/ios/Bomi/Shared/` 维护与 TS 逐字段对应的 Swift struct/enum。

### 6.2 镜像规则

1. **TS 是单一事实来源**，Swift 是只读镜像
2. **镜像结构由整合方同步**，iOS 对话禁擅改字段
3. 每个镜像文件头必须标注：

```swift
// MARK: - 镜像来源：packages/shared/src/types/xxx.ts
// ⚠️ 本文件结构由整合方同步，iOS 对话禁擅改字段。发现缺字段须向整合方提案。
// 镜像校验：字段名/类型/可选性须与 TS 逐字段对齐
```

4. 类型映射规则：

| TypeScript | Swift |
|---|---|
| `string` | `String` |
| `number` | `Double` 或 `Int` |
| `boolean` | `Bool` |
| `T \| null` / `T?` | `T?` (Optional) |
| `T[]` | `[T]` |
| `interface X` | `struct X: Codable` |
| `enum X { A='a', B='b' }` | `enum X: String, Codable { case a, b }` |

5. 发现 shared 缺字段或镜像缺字段 → **停下，向整合方提案** → 整合方改 TS + 同步 Swift 镜像 → 你 pull main

## 7. AI 调用红线

- 禁止直连 AI 供应商 API（OpenAI/通义千问等）
- AI 调用一律走 server `/api/ai/*` 转发
- `AppConfig.useAiProxy = true`，绝不出现 API Key
- token 存 Keychain（非 UserDefaults）
- 食物识别：拍照 → 上传 server `/api/ai/food-recognize` → 解析 `FoodRecognitionResponse`

## 8. 登录模块（auth）

- **Apple Sign In**（App Store 强制）：`ASAuthorizationAppleIDProvider`，获取 `identityToken` → 调 `POST /api/auth/apple-login`
- **微信登录**：微信 SDK，获取 code → 调 `POST /api/auth/wx-login`
- **手机号登录**：发送验证码 `POST /api/auth/send-sms` → 校验 `POST /api/auth/phone-login`
- 登录后 JWT 存 Keychain，APIClient 自动注入 `Authorization: Bearer <token>`

## 9. 开发流程（每次需求强制分步）

1. 读 `.ai-context.md` 确认状态与任务
2. 读 `packages/shared/src/types/` 和 `constants/` 确认要镜像的类型
3. 读 `docs/api-contract.md` 确认接口契约
4. 检查 `packages/ios/Bomi/Shared/` 镜像是否齐全 → 缺则提案
5. 按 Shared → Networking → Features → Common 顺序输出
6. 零硬编码：色值/尺寸/文案/路径/动画时长全抽 `AppConfig` 或 `Theme`
7. 完整 Swift 类型，避免 `Any`，优先用泛型
8. 末尾输出「改动文件清单」+「shared 同步需求」+「镜像对齐自检」

## 10. 分支规则

- 只在整合方指派的 `feat/ios-stageN` 分支工作
- 禁止自建分支、禁止改 main、禁止碰他人目录
- Conventional Commits 前缀：`feat(ios):` / `fix(ios):`

## 11. 完成后强制动作（吸取代码丢失教训）

**完成自检后，立即 commit + push，不要等会话结束：**

```bash
git add -A
git commit -m "feat(ios): Stage N - {简述}"
git push origin feat/ios-stageN
```

push 成功后再向用户报告。**不要在未 push 的状态下结束会话**——沙箱可能被销毁导致代码丢失。

## 12. push 后输出（供整合方审查）

- 分支名（应为 `feat/ios-stageN`）
- commit 列表：`git log main..HEAD --oneline`
- 改动文件清单：`git diff main...HEAD --stat`
- 是否动过 `packages/shared/`（应为否）
- 是否擅改 `packages/ios/Bomi/Shared/` 镜像结构（应为否）
- Swift 镜像与 TS 逐字段对齐自检结果
- APIClient 是否解包 `BaseApiResponse<T>`
- token 是否存 Keychain
- AI Key 是否走 server 转发（`useAiProxy = true`）

## 13. shared 同步提案格式

遇到 shared 缺字段或镜像需更新时，停下向用户提案：

```
【shared 同步提案】
原因：{为什么需要加字段}
需要新增：
- packages/shared/src/types/xxx.ts 新增字段 xxx: string
- packages/ios/Bomi/Shared/Models/Xxx.swift 同步新增 xxx: String
影响：iOS Networking + Feature 同步
等待整合方落地后通知我 pull main。
```

## 14. 会话衔接

每次新会话先读 `.ai-context.md`、`DECISIONS.md`、`.ai-memory.md`。阶段任务完成后提示整合方更新 `.ai-memory.md`。

## 15. 输出规范

- 每段代码标注完整文件路径
- 末尾输出参数变更清单 + 黑名单未触碰确认 + 镜像对齐自检
- 不确定的 API 禁止臆造，先问整合方
- 遇到 shared 阻塞 → 停下报告，不要绕过黑名单自行改 shared 或镜像结构

## 16. Apple 登录实现要点

```swift
import AuthenticationServices

// 1. 发起 Apple Sign In
let provider = ASAuthorizationAppleIDProvider()
let request = provider.createRequest()
request.requestedScopes = [.fullName, .email]

// 2. 获取 identityToken
// 3. 调 POST /api/auth/apple-login，body: AppleLoginRequest
//    - identityToken: String
//    - authorizationCode: String
//    - userIdentifier: String
//    - fullName: AppleFullName? { givenName, familyName, middleName? }
// 4. 收到 BaseApiResponse<LoginResponse>，存 JWT 到 Keychain
```

## 17. 当前阶段任务

> 见 `.ai-memory.md` 的「当前进行中」段落。整合方会分发任务卡。
> Stage 1 已完成并合并 main。
> Stage 2 任务（待 server 合并 main 后分发）：接入 Apple Sign In + 微信 SDK + 手机号真实接口联调。
