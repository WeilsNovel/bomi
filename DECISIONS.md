# bomi · 关键技术决策（DECISIONS.md）

> 整合方维护。每次架构决策落地后追加，含决策结论 + 理由 + 替代方案 + 影响范围。
> 三端对话遇到与本文件冲突的做法须停下来向整合方确认。

## D001 · 技术栈选型（2026-06-29）

**结论**：
- 小程序：Uni-app + Vue3 + TS，编译目标 mp-weixin
- 管理后台：Vue3 + Vite + Element Plus
- 服务端：NestJS + TS
- AI 层：独立 TS 包（被 server 调用）
- 仓库：Monorepo（pnpm workspace）

**理由**：
- 全栈 TS 生态，`shared` 类型可被三端无缝引用，契约漂移风险最低
- Uni-app 与 Vue3/TS 同语法，与 NestJS 类型共享顺畅
- NestJS DTO + 校验 + 拦截器完善，与服务端响应拦截器对齐 `BaseApiResponse<T>` 最严格
- Monorepo 单仓，shared 改动即时同步三端，分支统一管理最省心

**替代方案**：Taro（团队不熟 React）/ 原生小程序（跨端弱）/ 分仓+共享 npm 包（版本管理开销大）—— 均否决

**影响**：所有对话须按 multi-terminal-dev-standard skill 的 references 对应架构执行

## D002 · AI 层与服务端对话合并（2026-06-29）

**结论**：AI 作为独立 `packages/ai` 包（架构清晰），但由「服务端」对话③一并负责（协调效率）

**理由**：
- AI 用途聚焦：食物识别（VLM）+ 计划推荐（LLM），中等复杂度，未到需独立对话的程度
- 识别→记录→打卡紧耦合，合并后内部调用契约自然统一，无跨对话协调开销
- 拆分仅当 AI 工作量极大（多模型 failover、复杂 Agent、独立部署微服务）才划算

**影响**：
- 对话③ prompt 同时覆盖 `packages/server` 与 `packages/ai`
- server controller 禁止直写 SDK 调用，必须调 `@bomi/ai` 暴露的服务
- 后续若 AI 复杂度暴涨，可拆为「服务端」「AI」两个对话，shared/ai-api.ts 契约不变

## D003 · AI 供应商选型（2026-06-29）

**结论**：默认通义千问 VL（qwen-vl-max），AI 层按多供应商设计可随时切换

**理由**：
- 食物识别需 VLM 视觉模型，国内合规稳定优先
- 通义千问 VL 视觉识别能力强，OpenAI 兼容接口接入简单
- AI 层 `core/client.ts` 多供应商适配，`.env` 切 `AI_PROVIDER` 即可换豆包/GLM-4V

**影响**：
- `.env.example` 默认 `AI_PROVIDER=qwen`，`AI_DEFAULT_MODEL_DEV=qwen-vl-max`
- shared/constants/ai.ts 预置 5 个供应商枚举与模型枚举

## D004 · 登录方式（2026-06-29）

**结论**：微信授权登录 + 手机号验证码登录，两者都要

**理由**：小程序场景微信登录最便捷，手机号用于跨端账号统一与运营触达

**影响**：
- server `auth` 模块同时支持 `WxLoginRequest` / `PhoneLoginRequest`（shared/types/user.ts 已定义）
- 接入阿里云短信（`.env` 含 SMS_* 占位）
- 用户表需同时存 `openid` 与 `phone`，支持两种登录方式关联同一账号

## D005 · 分支策略与防乱机制（2026-06-29）

**结论**：特性分支 + 整合方合并；整合方接管分支命名；合并顺序固定。

**5 道防线**：
1. 包路径物理隔离：各端独立目录，合并零冲突
2. shared 整合方独占：单一事实来源不分裂；iOS 镜像结构亦由整合方同步
3. 整合方是合并唯一仲裁者
4. 顺序合并：shared → server → 前端 → ios
5. Conventional Commits 前缀追溯归属

**分支命名**：四端第一动作 `git branch -m trae/agent-* feat/{端}-stageN`，main 受保护。

**四端铁律**：只在 feat 分支提交、禁止碰 main、禁止改 shared（iOS 禁改镜像结构）、禁止跨端、合并由整合方做。

## D006 · iOS 客户端新增（2026-06-29）

**结论**：新增第四端 iOS 客户端，技术栈 Swift 5.9 + SwiftUI（iOS 16+），功能与小程序一致，复用同一套 server API。

**技术决策**：
- **技术栈**：Swift + SwiftUI 原生（非 RN/Flutter）。理由：bomi 健康饮食 App 重体验，原生上架最稳
- **shared 对接**：Swift 镜像类型方案。`packages/ios/Bomi/Shared/` 维护与 `@bomi/shared` 逐字段对应的 Swift struct/enum；镜像文件头标注来源；**镜像结构由整合方同步，iOS 对话禁擅改**
- **登录**：Apple Sign In（App Store 强制）+ 微信 SDK + 手机号验证码。Apple 登录已落地 DTO `AppleLoginRequest`（shared/types/user.ts）+ 路径 `/api/auth/apple-login`（api-contract.md）+ 错误码 `APPLE_LOGIN_FAILED: 40114`
- **token 存储**：Keychain（非 UserDefaults）
- **包位置**：packages/ios，不接入 pnpm workspace（非 JS 包）

**影响**：
- shared/types/user.ts 新增 `AppleLoginRequest`
- shared/constants/error-code.ts 新增 `APPLE_LOGIN_FAILED: 40114` + 文案
- docs/api-contract.md 新增 `POST /api/auth/apple-login`
- docs/prompts/ios.md 新增 iOS 对话 prompt
- 合并顺序更新：shared → server → 前端 → ios
- server `auth` 模块需补 `/api/auth/apple-login` 实现（校验 identityToken）
- 用户表需存 `appleIdentifier` 字段

**理由**：用户要求新增 iOS 端并追平现有进度。选原生 Swift 是因 App Store 上架与体验最佳；镜像类型方案保证 shared 仍是单一事实来源（TS），iOS 是只读镜像，契约不漂移。

**替代方案**：React Native（可直接 import @bomi/shared 但上架体积大，否决）/ Flutter（需 TS→Dart 代码生成，monorepo 集成复杂，否决）

## D007 · shared 包构建配置修复（2026-07-06）

**结论**：shared 包从「TS 源码直接暴露」改为「tsc 构建 dist/ + CommonJS 输出」，解决 Node runtime 无法加载的问题。

**根因**：
- 原配置 `"type": "module"` + `"main": "./src/index.ts"`（TS 源码 + 扩展名省略导入）
- 前端走 bundler（Vite/Webpack）可正常消费 TS 源码
- 但 Node runtime 的 server 无法 `require()` 加载 TS 源码 —— 报 `ERR_REQUIRE_ESM`
- 服务端对话 Stage 1 发现此问题并提案（方案 A），整合方采纳

**修复内容**：
- `packages/shared/tsconfig.json`：`module: "CommonJS"` + `moduleResolution: "Node"`（原 ESNext/Bundler）
- `packages/shared/package.json`：移除 `"type": "module"`，`main/types/exports` 全部指向 `dist/`
- 新增 `dev: "tsc --watch"` 脚本（开发期 shared 变更热重建）
- `.gitignore` 已排除 `dist/`（构建产物不入库，按需构建）
- 验证：`pnpm build` 成功，`node -e "require('./dist/index.js')"` 加载通过

**使用方式**：
- server 启动前需先构建 shared：`pnpm --filter @bomi/shared build`
- server 的 `start:dev` 脚本建议加前缀：`pnpm --filter @bomi/shared build && nest start --watch`
- 前端（miniapp/admin）bundler 自动解析到 dist/，无需额外操作
- iOS 用 Swift 镜像类型，不受影响

**影响**：
- 解除 server runtime 启动阻塞
- shared 源码变更后需重建 dist/（开发期用 `pnpm --filter @bomi/shared dev` 热重建）
- 不影响前端消费方式（bundler 兼容 CommonJS）

**替代方案**：shared 内部导入补 .js 扩展名（原生 ESM 强制，侵入性大，否决）/ shared 改 type:commonjs 但不构建（TS 源码仍不能被 Node 直接加载，否决）

## D008 · 架构转向：Go 服务端 + KMP 移动端（2026-06-30）

**结论**：服务端从 NestJS(TS) 改为 Go；iOS/Android 移动端用 KMP 共享业务逻辑，UI 各端原生（SwiftUI + Compose）；契约机制从 TS 单一来源改为 protobuf 单一来源 + 多语言 codegen。

**触发原因**：用户确认有 Android 客户端。KMP 跨 iOS/Android 共享业务逻辑可省 30-50% 重复代码；Go 服务端性能/部署优势。

### 技术栈变更

| 层 | 原方案（D001/D006） | 新方案（D008） |
|---|---|---|
| 服务端 | NestJS + TypeScript | **Go**（Gin/Echo + GORM） |
| AI 调用层 | 独立 TS 包 @bomi/ai | **Go 内置 ai/ 包**（sashabaranov/go-openai 或通义千问 Go SDK） |
| iOS | 纯 Swift + SwiftUI + Swift 镜像 | **KMP 共享逻辑 + SwiftUI** |
| Android | 无 | **KMP 共享逻辑 + Jetpack Compose**（新增端） |
| 管理后台 | Vue3 + Element Plus | 不变 |
| 小程序 | Uni-app + Vue3 | 不变 |
| 共享层 | TS 单一来源（@bomi/shared） | **protobuf 单一来源** + 多语言 codegen |
| Monorepo | pnpm workspace | **混合**：pnpm（前端）+ Go modules（服务端）+ Gradle（KMP） |

### 契约机制：protobuf 单一来源

**proto/ 目录**定义所有 DTO/枚举/错误码/接口契约：
- `proto/bomi/api/*.proto` —— 接口定义（gRPC gateway 或 REST 注解）
- `proto/bomi/model/*.proto` —— 数据模型（User/Food/Plan/AI 等）
- `proto/bomi/enum/*.proto` —— 枚举（ErrorCode/BusinessStatus/AIProvider 等）

**codegen 产物**（不入库，按需生成）：
- Go：`buf generate` → `gen/go/`（服务端直接 import）
- Kotlin：`buf generate` → `gen/kotlin/`（KMP 模块 import）
- TypeScript：`buf generate` → `gen/ts/`（admin/miniapp import）
- Swift：通过 KMP 编译产出 Swift framework（Kotlin/Native → Swift interop，不需单独 codegen）

**整合方独占**：`proto/` 目录 + codegen 配置（buf.yaml/buf.gen.yaml），与原 `packages/shared/` 同级。

### 目录结构（新）

```
bomi/
├── proto/                    # 🆕 protobuf 单一来源（整合方独占）
│   ├── bomi/api/             # 接口定义
│   ├── bomi/model/           # 数据模型
│   ├── bomi/enum/            # 枚举
│   ├── buf.yaml              # buf 配置
│   └── buf.gen.yaml          # codegen 配置（Go/Kotlin/TS）
├── gen/                      # 🆕 codegen 产物（.gitignore 排除）
│   ├── go/
│   ├── kotlin/
│   └── ts/
├── packages/                 # 前端（pnpm workspace）
│   ├── admin/                # Vue3 + Element Plus（不变）
│   └── miniapp/              # Uni-app（不变，暂时搁置）
├── server/                   # 🆕 Go 服务端（go modules，不在 pnpm workspace）
│   ├── cmd/                  # main.go
│   ├── internal/
│   │   ├── config/           # 配置（env）
│   │   ├── handler/          # HTTP handler
│   │   ├── service/          # 业务逻辑
│   │   ├── repository/       # 数据访问
│   │   ├── middleware/        # JWT/响应包装/异常处理
│   │   └── ai/               # AI 调用层（Go 实现）
│   ├── go.mod
│   └── go.sum
├── mobile-shared/            # 🆕 KMP 共享模块（Gradle）
│   ├── build.gradle.kts
│   └── src/
│       ├── commonMain/       # 共享逻辑（网络/仓库/用例/模型）
│       ├── iosMain/
│       └── androidMain/
├── ios/                      # iOS：KMP 集成 + SwiftUI
│   └── Bomi.xcodeproj
├── android/                  # 🆕 Android：KMP 集成 + Compose
│   └── app/
├── docs/
├── Makefile                  # 🆕 跨语言编排（proto gen / build / test）
└── .ai-context.md / DECISIONS.md / .ai-memory.md
```

### 迁移影响评估

| 已有工作 | 影响 | 处理 |
|---|---|---|
| `packages/shared/`（TS types） | ❌ 废弃 | 迁移到 `proto/` 定义，TS 产物走 codegen |
| `packages/server/`（NestJS 占位） | ❌ 废弃 | 改为 `server/`（Go） |
| `packages/ai/`（TS 包占位） | ❌ 废弃 | 合并到 `server/internal/ai/`（Go） |
| iOS Stage 1（Swift 镜像 + Networking） | ⚠️ 部分重构 | Shared/ 改为 KMP 集成，Networking 迁到 KMP，SwiftUI View 保留 |
| `packages/admin/`（Vue3 占位） | ✅ 保留 | 类型来源从 @bomi/shared 改为 gen/ts/ |
| D006 iOS 决策（Swift 镜像方案） | ❌ 废弃 | 改为 KMP 集成，D008 覆盖 |
| D007 shared 构建配置 | ❌ 废弃 | 不再有 TS shared 包 |
| `docs/prompts/`（server/ios） | ❌ 需重写 | 技术栈变了 |
| `docs/skills/`（四端） | ❌ 需重写 | 技术栈变了 |

### 新的合并顺序

```
proto（整合方）→ server（Go）→ mobile-shared（KMP）→ ios/android → admin/miniapp
```

### 工具链要求

- **buf**（protobuf 管理 + codegen）：`brew install bufbuild/buf/buf`
- **Go**：1.22+
- **Kotlin/KMP**：1.9.20+，Android Studio / Xcode
- **pnpm**：前端 workspace
- **Makefile**：跨语言编排

**理由**：
- Go 服务端：性能/部署/并发优势，适合未来扩展
- KMP：iOS/Android 共享业务逻辑，省重复代码，UI 各端原生保证体验
- protobuf 契约：跨 4 语言唯一可靠的单一来源方案，codegen 保证一致性
- AI 层用 Go：sashabaranov/go-openai 成熟，通义千问有 Go SDK，无需跨语言调用

**替代方案**：
- 方案 B（KMP + NestJS）：保留 TS 服务端，AI 生态好但用户选 Go
- 方案 C（双原生 + NestJS）：最低门槛但移动端逻辑写两遍，否决

## D009 · 数据库统一 PostgreSQL（2026-07-10）

**结论**：
- 全程使用 PostgreSQL，禁止 MySQL
- Go 后端用 pgx 驱动搭配 GORM，所有业务 SQL 基于 PG 语法编写
- go.mod 依赖 `github.com/jackc/pgx/v5` + `gorm.io/driver/postgres`

**理由**：
- Neon Serverless PG 支持数据库分支功能，TRAE 多会话并行开发可隔离测试数据
- PG 与 MySQL 在 JSONB、序列、布尔等类型上有差异，统一 PG 避免后续切换时大规模改写 SQL
- pgx 是 Go 生态最成熟的 PG 驱动，性能与功能兼顾

**影响**：
- 服务端 DB 配置默认端口改为 5432（D009 前为 MySQL 的 3306）
- 所有 migration 用 PG 语法
- .env.example DB_* 配置项已更新

## D010 · 食物拍照 AI 识别隐私方案（2026-07-10）

**结论**：
- 用户拍摄三餐照片 → App 本地压缩 → 临时上传 COS 临时桶（独立桶）→ 后端用预签名 URL 调 VLM 识别
- 识别完成后图片**暂存于临时桶**，供用户在前端确认/编辑识别结果（不立即删除）
- 用户确认打卡 → App 调 DeleteRecognizeImage 接口 → 后端立即删除 COS 临时桶原图
- 兜底：COS 临时桶配置生命周期规则，**5 分钟后自动清理**未删除的图片
- 识别结果（纯文字营养数据）为隐私数据，存本地 SQLDelight + 私有云，**不上传后端**

**关键约束**：
- 不缓存原图、不写入数据库、不做日志留存
- 临时图片独立存储桶，与永久运营素材桶隔离，便于一键清理
- 双删除机制：用户确认主动删 + 5分钟生命周期兜底删
- 后端只接收 imageKey，不存图片 URL 到数据库

**隐私协议措辞**：
> 拍摄的食物照片将临时上传至腾讯云对象存储用于AI识别，识别完成后立即删除，平台不持久存储任何用户照片。

**影响**：
- proto 新增 `DeleteRecognizeImage` rpc（`POST /api/ai/food/delete-image`）
- `FoodRecognizeResponse` 新增 `image_key` 字段回传前端
- 服务端新增 `storage/cos.go` 双桶封装（永久素材桶 + AI临时桶）
- mobile-shared 新增 `ImageUploader` expect 抽象（压缩+上传+返回 imageKey）

## D011 · 饮食打卡明细完全本地化（2026-07-10）

**结论**：
- 彻底移除后端 `DietService` 全套 proto、接口逻辑、数据库表
- 完整饮食明细、食物照片缓存仅存设备本地 SQLDelight
- 跨设备同步走用户私有云（iOS iCloud CloudKit / Android 坚果云 WebDAV），**不走后端**
- 后端仅保留四类非隐私业务数据：米花积分、会员订阅、邀请好友、全局主题素材链接
- 无强制云端上传逻辑，不存在用户饮食明细同步至我方服务器的行为

**AI 计划生成的数据来源**：
- App 从本地 SQLDelight 聚合近7日营养均值（4个匿名数字：热量/蛋白质/碳水/脂肪 + 统计天数）
- 作为 `RecentNutritionSummary` 可选字段传后端
- 后端调 LLM 生成计划后**用完即丢，不入库**
- 传的是聚合数字不是食物明细，隐私风险极低

**影响**：
- proto 删除 `DietService`、`DietRecordItem`、`DietRecordListRequest/Response`、`DailyNutritionSummary` 等全部饮食打卡相关结构
- proto `GeneratePlanRequest` 新增 `recent_nutrition` 可选字段
- 服务端 router 删除 diet 路由
- mobile-shared `Endpoint` 删除 diet 端点
- mobile-shared `FoodRepository` 删除 logDiet/listDiet，新增 `deleteImage`
- mobile-shared 新增 `LocalDietStorage`（expect，SQLDelight 实现）
- mobile-shared 新增 `CloudSync`（expect，iCloud/坚果云 实现）
- `BomiSDK.create()` 注入 4 个依赖：tokenStorage / localDietStorage / cloudSync / imageUploader

**换设备迁移（iOS↔Android）**：
- App 提供"导出本地数据为加密文件"+"导入"功能，用户手动迁移
- 零后端依赖，隐私完全本地

## D012 · 分阶段部署策略（2026-07-10）

**结论**：
- **当前开发/内测阶段（现阶段执行）**：场景二
  - 低配 1核1G 腾讯轻量服务器 + Neon Serverless PostgreSQL + 腾讯 COS（无CDN）
  - 适配 TRAE 三会话并行开发，Neon 数据库分支隔离测试数据
  - 免数据库运维、闲置零计费
- **正式上架商用阶段（后期切换）**：场景一
  - 已购 2核2G 腾讯轻量主机 + Docker 自建国内 PostgreSQL + 腾讯 COS（无CDN）
  - 境内全数据存储，上架合规无额外隐私标注
  - 切换仅修改数据库连接地址，SQL 完全兼容，无大规模业务重构

**理由**：
- 开发期：Neon 免运维 + 分支隔离 + 闲置零计费，适合长期迭代
- 上线期：境内 PG 满足国内合规，充分利用已购服务器硬件
- D009 统一 PG 语法保证两阶段切换零业务重构

**影响**：
- 服务端 `.env.example` DB_* 配置项支持两种场景（改连接串即可切换）
- 不影响客户端代码（客户端只调 API，不关心数据库部署形态）

## D013 · 存储与 CDN 规则（2026-07-10）

**结论**：
- 动态运营素材存放 COS 永久桶，基础 UI 资源打包客户端本地
- 全程不开通、不购买 CDN，使用 COS 原生域名加载素材
- 区分双 COS 桶：
  - 桶1 永久素材桶：存放运营海报/主题素材，长期存储
  - 桶2 AI 临时图片桶：食物识别用，5分钟生命周期自动清理（配合 D010）

**理由**：
- 省去域名备案、CDN 鉴权、缓存配置等额外开发工作
- 前期零成本（COS 新用户 50G 免费 + 10G/月免费下行流量）
- 内测阶段免费额度足够使用

**影响**：
- 服务端 `config.COSConfig` 双桶配置（MaterialBucket + AITempBucket）
- 服务端 `storage/cos.go` 双客户端封装
- `.env.example` 新增 `COS_MATERIAL_BUCKET` + `COS_AI_TEMP_BUCKET` 配置项
- 硬性约束：禁止将海报、主题大图存放在轻量服务器本地磁盘
