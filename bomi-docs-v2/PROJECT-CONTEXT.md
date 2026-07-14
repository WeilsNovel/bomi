# bomi · 项目现状

> 所有角色必读。确认项目状态、技术栈、分工边界、跨端协同规则。

## 项目概览

- **名称**：bomi
- **定位**：AI 食物拍照识别 + 饮食打卡 + 健康计划推荐
- **目标用户**：注重饮食健康的 C 端用户（iOS + Android）+ 运营人员（管理后台）
- **核心隐私承诺**：用户饮食明细、照片等隐私数据完全本地化，不上传后端

## 技术栈

| 层 | 技术栈 | 路径 | 负责角色 |
|---|---|---|---|
| 共享层（契约） | protobuf（单一来源 + 多语言 codegen） | `proto/` | 整合方独占 |
| 服务端 | Go（Gin + GORM + pgx） | `server/` | 服务端 |
| AI 调用层 | Go（内置在 server/internal/ai/） | `server/internal/ai/` | 服务端 |
| 对象存储 | 腾讯云 COS（双桶，无 CDN） | `server/internal/storage/` | 服务端 |
| iOS | KMP + SwiftUI + CloudKit | `packages/ios/` + `mobile-shared/` | iOS |
| Android | KMP + Compose + 坚果云WebDAV | `packages/android/` + `mobile-shared/` | Android |
| 管理后台 | Vue3 + Vite + Element Plus | `packages/admin/` | 管理后台 |
| 小程序 | Uni-app + Vue3 | `packages/miniapp/` | 搁置 |
| 移动端共享 | KMP（Kotlin Multiplatform） | `mobile-shared/` | 整合方协调 |
| 本地数据库 | SQLDelight（封装 SQLite，存隐私数据） | `mobile-shared/` | 整合方协调 |
| Monorepo | 混合：pnpm + Go modules + Gradle | 根 Makefile | 整合方 |

## 数据分层（隐私架构核心）

| 数据类型 | 存储位置 | 上传后端 |
|---|---|---|
| 用户饮食明细（食物/照片/体重） | SQLDelight 本地 + 私有云（iCloud/坚果云） | 禁止 |
| AI 识别临时图片 | COS 临时桶（5分钟自动清理） | 临时上传，用完即删 |
| 会员/积分/邀请/内购 | 后端 PostgreSQL | 正常存储 |
| 运营素材（海报/主题） | COS 永久桶 | 正常存储 |
| AI 计划生成的营养汇总 | 临时传后端，用完即丢 | 临时传输，不入库 |

## 分工边界

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

## 跨端协同规则

1. **接口字段变更**：先改 `proto/` → `make proto` → 各端同步生成代码
2. **错误码新增**：先改 `proto/bomi/enum/error_code.proto` → codegen → 各端使用
3. **前端禁直连 AI 供应商**：iOS/Android/管理后台一律经 server `/api/ai/*` 转发
4. **API Key 仅 server 读取**：从环境变量读取，禁止硬编码、禁止入 proto、禁止入移动端
5. **iOS/Android 业务逻辑走 KMP 共享层**：网络层/数据层/Repository 在 `mobile-shared/commonMain/`，UI 各端原生
6. **D011 饮食打卡完全本地化**：后端无 diet 接口，App 用 LocalDietStorage + CloudSync
7. **D010 AI 识别图片临时上传**：用户确认后删除，5分钟生命周期兜底
8. **D012 分阶段部署**：开发期用 Neon PG，上线切换自建 PG，改连接串即可
9. **契约变更提案**：发现 proto 缺字段/错误码 → 停下向整合方提案 → 整合方改 proto + codegen → 各端同步

## 移动端专属约定

- **iOS**：KMP + SwiftUI；Apple Sign In + 微信 SDK + 手机号；CloudKit 私有同步；Keychain
- **Android**：KMP + Compose；Google Sign In + 微信 SDK + 手机号；坚果云 WebDAV 同步；KeyStore + DataStore
- **本地存储**：SQLDelight 封装 SQLite，存饮食打卡明细
- **私有云同步**：iOS iCloud CloudKit / Android 坚果云 WebDAV，跨设备同步本地数据
- **图片上传**：各端 ImageUploader actual 实现，压缩 + 传 COS 临时桶
- **KMP 共享**：网络层、数据层、用例层在 `mobile-shared/src/commonMain/`；iOS/Android 各自实现 UI

## 当前阶段

**Stage 0.5 已完成**（架构骨架）：
- `proto/`：15 个 proto 文件
- `server/`：16 个 Go 文件（`go build` 通过）
- `mobile-shared/`：19 个 KMP 文件（commonMain + iosMain + androidMain）

**各端待启动 Stage 1**：
- 服务端：auth/food/plan/ai handler + GORM(PG) + COS 双桶
- iOS：KMP 集成 + SwiftUI + CloudKit + Keychain
- Android：新建项目 + KMP 集成 + Compose + 坚果云 + KeyStore
- 管理后台：Vite 初始化 + 类型来源改 gen/ts/
