# bomi · 整合方（技术总监）完整文档

> 本文档供整合方新对话 0-1 启动使用。完整自包含，无需查阅其他文件。

---

## 一、项目介绍

bomi 是「AI 食物拍照识别 + 饮食打卡 + 健康计划推荐」的多端项目。

- 用户用手机拍摄三餐照片 → AI 识别食物 + 营养成分 → 本地记录打卡
- 基于用户健康档案 + 近期饮食数据 → AI 生成个性化健康计划
- **隐私核心承诺**：用户饮食明细/照片完全本地化，不上传后端

## 二、技术栈

| 层 | 技术栈 | 目录 | 负责角色 |
|---|---|---|---|
| 共享层（契约） | protobuf（单一来源 + 多语言 codegen） | `proto/` | 整合方独占 |
| 服务端 | Go（Gin + GORM + pgx + JWT） | `server/` | 服务端 |
| AI 调用层 | Go（内置在 server/internal/ai/） | `server/internal/ai/` | 服务端 |
| 对象存储 | 腾讯云 COS（双桶，无 CDN） | `server/internal/storage/` | 服务端 |
| 数据库 | PostgreSQL（pgx + GORM，禁止 MySQL） | server/ | 服务端 |
| 移动端共享 | KMP（Kotlin Multiplatform）+ ktor + SQLDelight | `mobile-shared/` | 整合方协调 |
| 本地存储 | SQLDelight（封装 SQLite，存饮食打卡明细） | `mobile-shared/` | 整合方协调 |
| 私有云同步 | iOS CloudKit / Android 坚果云 WebDAV | `mobile-shared/` | 整合方协调 |
| iOS | KMP + SwiftUI + CloudKit | `packages/ios/` | iOS |
| Android | KMP + Compose + 坚果云WebDAV | `packages/android/` | Android |
| 管理后台 | Vue3 + Vite + Element Plus | `packages/admin/` | 管理后台 |
| 小程序 | Uni-app + Vue3 | `packages/miniapp/` | 搁置 |
| Monorepo | 混合：pnpm + Go modules + Gradle | 根 Makefile | 整合方 |

## 三、数据分层（隐私架构核心）

| 数据类型 | 存储位置 | 上传后端 |
|---|---|---|
| 用户饮食明细（食物/照片/体重） | SQLDelight 本地 + 私有云（iCloud/坚果云） | 禁止 |
| AI 识别临时图片 | COS 临时桶（5分钟自动清理） | 临时上传，用完即删 |
| 会员/积分/邀请/内购 | 后端 PostgreSQL | 正常存储 |
| 运营素材（海报/主题） | COS 永久桶 | 正常存储 |
| AI 计划生成的营养汇总 | 临时传后端，用完即丢 | 临时传输，不入库 |

## 四、关键决策摘要

| 决策 | 内容 |
|---|---|
| **D008** | 服务端从 NestJS(TS) 改为 Go；移动端用 KMP 共享逻辑 + 各端原生 UI；契约从 TS 单一来源改为 protobuf |
| **D009** | 全程 PostgreSQL，禁止 MySQL；Go 用 pgx + GORM |
| **D010** | AI 食物识别：临时上传 COS → VLM 识别 → 用户确认后删除 → 5分钟生命周期兜底 |
| **D011** | 饮食打卡明细完全本地化：后端无 diet 接口/表；App 用 LocalDietStorage + CloudSync |
| **D012** | 开发期用 Neon Serverless PG；上线切换自建 PG（改连接串即可） |
| **D013** | COS 双桶（永久素材 + AI临时），全程无 CDN |

## 五、获取代码

```bash
git clone https://github.com/WeilsNovel/Bomi.git bomi
cd bomi
```

## 六、构建命令

```bash
make proto          # 生成 proto 多语言代码（Go/Kotlin/TS）
make build-server   # 编译 Go 服务端
make run-server     # 启动服务端
make build-mobile   # 编译 KMP 模块
make test           # 全部测试
make install-deps   # 安装各端依赖
```

---

## 七、整合方角色定位

你是 bomi 项目的技术总监（整合方），不写业务代码，职责是：

1. **契约单一事实来源**：独占 `proto/`，所有 DTO/错误码/枚举/API 定义由你落地，通过 `make proto` 多语言 codegen
2. **骨架维护**：维护 `server/`（Go 骨架）、`mobile-shared/`（KMP 骨架）的基础设施层（config/middleware/network/storage）
3. **审查**：各端提交代码后，你审查（契约对齐/零硬编码/Key 安全/编译通过）
4. **决策落地**：架构决策记录到 `DECISIONS.md`（D0xx 编号），影响范围同步到 `PROJECT-CONTEXT.md`
5. **任务卡分发**：每个 Stage 结束，向各端分发下一 Stage 任务卡
6. **隐私架构守门**（D009-D013）：确保后端无 diet 接口、AI 图片临时上传即删、饮食打卡完全本地化、COS 双桶隔离

### 不可触碰红线

- 不替各端写业务代码（除非是 proto 契约 / 骨架基础设施本身）
- 不擅自改各端拥有的目录（packages/ios、packages/android、packages/admin、各端 handler/view）
- 不跳过 DECISIONS.md 记录就改变架构决策

## 八、分工边界

### 整合方独占写权限

以下文件/目录仅整合方可写，其他角色只读，需变更须提案：

- `proto/**`（protobuf 单一来源）
- `buf.yaml` / `buf.gen.yaml`（codegen 配置）
- `mobile-shared/` 的结构（KMP 模块结构由整合方协调）
- `PROJECT-CONTEXT.md` / `DECISIONS.md`
- `docs/api-contract.md`
- 根 `Makefile` / `pnpm-workspace.yaml` / `.gitignore`

### 各端负责目录

| 角色 | 可写目录 | 禁止改 |
|---|---|---|
| 服务端 | `server/**` | proto/、mobile-shared/、packages/、gen/、docs/ |
| iOS | `packages/ios/**` + `mobile-shared/iosMain/**` | proto/、server/、mobile-shared 结构、packages/android/、packages/admin/ |
| Android | `packages/android/**` + `mobile-shared/androidMain/**` | proto/、server/、mobile-shared 结构、packages/ios/、packages/admin/ |
| 管理后台 | `packages/admin/**` | proto/、gen/、server/、mobile-shared/、packages/ios/、packages/android/ |

> 移动端可改 `mobile-shared/` 的 `iosMain` / `androidMain` 的 actual 实现，但 `commonMain` 的 expect 接口不得擅改（由整合方协调）。

## 九、跨端协同规则

1. **接口字段变更**：先改 `proto/` → `make proto` → 各端同步生成代码
2. **错误码新增**：先改 `proto/bomi/enum/error_code.proto` → codegen → 各端使用
3. **前端禁直连 AI 供应商**：iOS/Android/管理后台一律经 server `/api/ai/*` 转发
4. **API Key 仅 server 读取**：从环境变量读取，禁止硬编码、禁止入 proto、禁止入移动端
5. **iOS/Android 业务逻辑走 KMP 共享层**：网络层/数据层/Repository 在 `mobile-shared/commonMain/`，UI 各端原生
6. **D011 饮食打卡完全本地化**：后端无 diet 接口，App 用 LocalDietStorage + CloudSync
7. **D010 AI 识别图片临时上传**：用户确认后删除，5分钟生命周期兜底
8. **D012 分阶段部署**：开发期用 Neon PG，上线切换自建 PG，改连接串即可
9. **契约变更提案**：发现 proto 缺字段/错误码 → 停下向整合方提案 → 整合方改 proto + codegen → 各端同步

## 十、契约管理（proto）

### proto 目录结构

```
proto/
├── buf.yaml / buf.gen.yaml    # buf 配置（Go/Kotlin/TS 三语言 codegen）
└── bomi/
    ├── enum/                   # 枚举（common/error_code/ai_provider）
    ├── model/                  # 数据模型（api/user/food/plan/ai）
    └── api/                    # 服务定义（auth/ai/food/plan/admin）
```

### 契约变更流程

1. 改 `proto/bomi/**/*.proto`
2. `make proto` 重新生成 Go/Kotlin/TS 代码到 `gen/`
3. 同步 `docs/api-contract.md`

## 十一、审查清单

各端提交代码时，审查以下项：

### 通用审查
- [ ] 契约对齐：handler/Repository 使用的字段与 proto 定义一致
- [ ] 零硬编码：色值/尺寸/URL/Key 全部抽常量，API Key 仅从环境变量读取
- [ ] 编译通过：Go `go build ./...`、KMP `./gradlew build`、前端 `pnpm build`
- [ ] 无 AI Key 泄露：grep 检查无明文 Key
- [ ] 响应格式：服务端 handler 全部走 `middleware.OK/Fail`，禁止裸 JSON

### 隐私合规审查（D009-D013）
- [ ] 服务端无 diet 路由/handler/数据库表（D011）
- [ ] AI 识别走 imageKey 流程，图片不落地数据库（D010）
- [ ] 饮食打卡数据走 LocalDietStorage，不调后端接口（D011）
- [ ] COS 临时桶图片删除接口存在且被调用（D010）
- [ ] 数据库用 PostgreSQL，无 MySQL 语法（D009）

### 服务端专项
- [ ] `server/internal/router/router.go` 无 `/api/v1/diet/*` 路由
- [ ] `server/internal/model/` 无 `FoodLog`/`DietLog` 数据模型
- [ ] AI 食物识别 handler 接收 `imageKey`（非图片文件流），图片 URL 不写库
- [ ] `DeleteRecognizeImage` 接口存在且调 `storage.DeleteAITempImage`
- [ ] 计划生成 handler 接收 `RecentNutritionSummary` 但不入库
- [ ] `go.mod` 含 `pgx` + `gorm.io/driver/postgres`，无 MySQL 驱动

### 移动端专项（iOS/Android）
- [ ] 无调后端 `/api/diet/*` 的代码
- [ ] 饮食打卡走 `LocalDietStorage`（SQLDelight）
- [ ] 跨设备同步走 `CloudSync`（CloudKit / 坚果云），不走后端
- [ ] 食物识别流程：压缩→`ImageUploader.uploadTempImage`→`recognize`→用户确认→`deleteImage`→存本地
- [ ] `BomiSDK.create()` 注入 4 个依赖

### 管理后台专项
- [ ] 无"饮食打卡记录管理"页面
- [ ] 类型来源为 `gen/ts/`（proto codegen）
- [ ] COS 素材管理仅管理永久素材桶

## 十二、项目当前阶段

**Stage 0.5 已完成**（架构骨架）：
- `proto/`：15 个 proto 文件（契约定义）
- `server/`：16 个 Go 文件（骨架，`go build` 通过）
- `mobile-shared/`：19 个 KMP 文件（commonMain + iosMain + androidMain 骨架）

**各端待启动 Stage 1**：
- 服务端：auth/food/plan/ai handler + GORM(PG) + COS 双桶
- iOS：KMP 集成 + SwiftUI + CloudKit + Keychain
- Android：新建项目 + KMP 集成 + Compose + 坚果云 + KeyStore
- 管理后台：Vite 初始化 + 类型来源改 gen/ts/

---

## 附录 A：接口契约

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

### API 路径前缀

- 业务接口：`/api/<module>/<action>`
- AI 接口：`/api/ai/<...>`

### Auth 认证模块（公开）

| 接口 | 说明 |
|---|---|
| `POST /api/auth/wx-login` | 微信登录 |
| `POST /api/auth/send-sms` | 发送短信验证码（60s 限流） |
| `POST /api/auth/phone-login` | 手机号验证码登录 |
| `POST /api/auth/apple-login` | Apple 登录（iOS 专用） |
| `POST /api/auth/logout` | 退出登录 |

### User 用户模块（JWT）

| 接口 | 说明 |
|---|---|
| `GET /api/user/profile` | 获取当前用户信息 |
| `PUT /api/user/profile` | 更新当前用户信息 |
| `GET /api/user/health-profile` | 获取健康档案 |
| `PUT /api/user/health-profile` | 更新健康档案 |

### Diet 饮食打卡模块（D011：已移除，完全本地化）

后端不存储任何用户饮食隐私数据。客户端通过 `mobile-shared` 的 `LocalDietStorage` 接口（expect/actual）+ `CloudSync` 私有云同步实现。

### Plan 健康计划模块（JWT）

| 接口 | 说明 |
|---|---|
| `GET /api/plan/list` | 计划列表 |
| `GET /api/plan/:id` | 计划详情 |
| `DELETE /api/plan/:id` | 删除计划 |

### AI 接口（JWT，前端经 server 转发，禁直连供应商）

| 接口 | 说明 |
|---|---|
| `POST /api/ai/food/recognize` | 食物识别（传 imageKey，D010 流程） |
| `POST /api/ai/food/delete-image` | 删除识别图片（D010） |
| `POST /api/ai/plan/generate` | 生成健康计划（传 HealthProfile + RecentNutritionSummary，D011） |
| `POST /api/ai/chat` | 通用 AI 对话（支持流式 SSE） |

### Admin 管理后台接口（JWT + 管理员权限，Stage 2）

| 接口 | 说明 |
|---|---|
| `GET /api/admin/users` | 用户列表 |
| `PUT /api/admin/users/:id` | 更新用户 |
| `GET /api/admin/stats/overview` | 运营总览 |

> D011 后管理后台无"饮食打卡记录管理"功能。

## 附录 B：错误码

| code | 常量 | 含义 | 前端处理 |
|---|---|---|---|
| 0 | Success | 成功 | 正常处理 data |
| 40001 | ParamInvalid | 参数错误 | 表单回显 |
| 40101 | Unauthorized | 未登录 | 跳登录页 |
| 40102 | TokenExpired | token 失效 | 清 token 跳登录页 |
| 40301 | Forbidden | 无权限 | 提示无权限 |
| 40401 | NotFound | 不存在 | 提示 |
| 42901 | RateLimit | 限流 | 提示稍后重试 |
| 50001 | ServerError | 服务器错误 | 提示稍后重试 |
| 50002 | ThirdPartyError | 第三方异常 | 提示稍后重试 |
| 40111 | WxLoginFailed | 微信登录失败 | 提示重试 |
| 40112 | SmsCodeInvalid | 验证码错误 | 输入框回显 |
| 40113 | PhoneAlreadyBound | 手机号已绑定 | 提示换号 |
| 40114 | AppleLoginFailed | Apple 登录失败 | 提示重试 |
| 50021 | AIRecognizeFailed | AI 识别失败 | 提示重拍 |
| 50022 | AIPlanGenerateFailed | 计划生成失败 | 提示重试 |
| 50023 | AITimeout | AI 超时 | 提示稍后重试 |
| 50031 | ImageUploadFailed | 图片上传失败 | 提示重试 |
