# bomi · 关键技术决策

> 架构决策记录。D001-D007 为早期决策（已被 D008 覆盖），D008-D013 为当前生效决策。

## 早期决策（已废弃，仅存档）

- **D001**（废弃）：原选 NestJS(TS) + Uni-app + pnpm workspace，D008 后改为 Go + KMP
- **D002**（废弃）：AI 层原为独立 TS 包，D008 后合并为 server/internal/ai/（Go）
- **D003**：AI 供应商选通义千问 VL（qwen-vl-max），多供应商设计可切换（仍生效）
- **D004**：登录方式微信 + 手机号 + Apple Sign In（仍生效，用户表需存 openid + phone + appleIdentifier）
- **D005**（部分废弃）：分支策略，本地开发阶段不涉及
- **D006**（废弃）：iOS 原 Swift 镜像方案，D008 后改为 KMP 集成
- **D007**（废弃）：shared TS 包构建配置，D008 后 shared 废弃

---

## D008 · 架构转向：Go 服务端 + KMP 移动端

**结论**：服务端从 NestJS(TS) 改为 Go；iOS/Android 移动端用 KMP 共享业务逻辑，UI 各端原生（SwiftUI + Compose）；契约机制从 TS 单一来源改为 protobuf 单一来源 + 多语言 codegen。

**触发原因**：用户确认有 Android 客户端。KMP 跨 iOS/Android 共享业务逻辑可省 30-50% 重复代码；Go 服务端性能/部署优势。

### 技术栈变更

| 层 | 原方案 | 新方案 |
|---|---|---|
| 服务端 | NestJS + TypeScript | Go（Gin + GORM） |
| AI 调用层 | 独立 TS 包 | Go 内置 ai/ 包（go-openai） |
| iOS | 纯 Swift + Swift 镜像 | KMP 共享逻辑 + SwiftUI |
| Android | 无 | KMP 共享逻辑 + Jetpack Compose（新增） |
| 共享层 | TS 单一来源 | protobuf 单一来源 + codegen |
| Monorepo | pnpm workspace | 混合：pnpm + Go modules + Gradle |

### 契约机制：protobuf 单一来源

`proto/` 目录定义所有 DTO/枚举/错误码/接口契约，通过 `make proto` 生成：
- Go：`gen/go/`（服务端 import）
- Kotlin：`gen/kotlin/`（KMP import）
- TypeScript：`gen/ts/`（admin import）
- Swift：通过 KMP 编译产出 framework（不需单独 codegen）

### 目录结构

```
bomi/
├── proto/                    # protobuf 单一来源（整合方独占）
├── gen/                      # codegen 产物（.gitignore 排除）
├── server/                   # Go 服务端
├── mobile-shared/            # KMP 共享模块
├── packages/
│   ├── admin/                # Vue3 管理后台
│   ├── ios/                  # iOS：KMP + SwiftUI
│   ├── android/              # Android：KMP + Compose
│   └── miniapp/              # Uni-app（搁置）
├── docs/
├── Makefile                  # 跨语言编排
└── PROJECT-CONTEXT.md / DECISIONS.md
```

---

## D009 · 数据库统一 PostgreSQL

**结论**：全程使用 PostgreSQL，禁止 MySQL。Go 后端用 pgx 驱动搭配 GORM，所有业务 SQL 基于 PG 语法。

**理由**：Neon Serverless PG 支持数据库分支功能，多会话并行开发可隔离测试数据；pgx 是 Go 生态最成熟的 PG 驱动。

**影响**：DB 默认端口 5432；所有 migration 用 PG 语法；go.mod 含 `pgx/v5` + `gorm.io/driver/postgres`。

---

## D010 · 食物拍照 AI 识别隐私方案

**结论**：
- 用户拍摄照片 → App 本地压缩 → 临时上传 COS 临时桶 → 后端用预签名 URL 调 VLM 识别
- 识别完成后图片暂存于临时桶，供用户在前端确认/编辑识别结果（不立即删除）
- 用户确认打卡 → App 调 `DeleteRecognizeImage` 接口 → 后端立即删除 COS 临时桶原图
- 兜底：COS 临时桶配置生命周期规则，5 分钟后自动清理未删除的图片
- 识别结果（纯文字营养数据）为隐私数据，存本地 SQLDelight + 私有云，不上传后端

**关键约束**：不缓存原图、不写入数据库、不做日志留存；临时图片独立存储桶，与永久运营素材桶隔离。

**隐私协议措辞**：拍摄的食物照片将临时上传至腾讯云对象存储用于AI识别，识别完成后立即删除，平台不持久存储任何用户照片。

**影响**：proto 新增 `DeleteRecognizeImage` rpc；服务端新增 `storage/cos.go` 双桶封装；mobile-shared 新增 `ImageUploader` expect 抽象。

---

## D011 · 饮食打卡明细完全本地化

**结论**：
- 彻底移除后端 `DietService` 全套 proto、接口逻辑、数据库表
- 完整饮食明细、食物照片缓存仅存设备本地 SQLDelight
- 跨设备同步走用户私有云（iOS iCloud CloudKit / Android 坚果云 WebDAV），不走后端
- 后端仅保留四类非隐私业务数据：米花积分、会员订阅、邀请好友、全局主题素材链接

**AI 计划生成的数据来源**：App 从本地 SQLDelight 聚合近7日营养均值（4个匿名数字 + 统计天数），作为 `RecentNutritionSummary` 传后端，后端调 LLM 生成计划后用完即丢不入库。

**换设备迁移**：App 提供"导出本地数据为加密文件"+"导入"功能，用户手动迁移，零后端依赖。

**影响**：proto 删除 DietService 全部定义；服务端 router 删除 diet 路由；mobile-shared 新增 `LocalDietStorage`（SQLDelight）+ `CloudSync`（iCloud/坚果云）expect 抽象；`BomiSDK.create()` 注入 4 个依赖。

---

## D012 · 分阶段部署策略

**结论**：
- **开发/内测阶段（现阶段）**：1核1G 腾讯轻量 + Neon Serverless PostgreSQL + 腾讯 COS（无CDN）
  - Neon 数据库分支隔离测试数据，免数据库运维，闲置零计费
- **正式上架商用阶段（后期切换）**：2核2G 腾讯轻量 + Docker 自建国内 PostgreSQL + 腾讯 COS（无CDN）
  - 境内全数据存储，上架合规；切换仅修改数据库连接地址，SQL 完全兼容

**影响**：服务端 `.env.example` DB_* 配置项支持两种场景（改连接串即可切换）；不影响客户端代码。

---

## D013 · 存储与 CDN 规则

**结论**：
- 动态运营素材存放 COS 永久桶，基础 UI 资源打包客户端本地
- 全程不开通、不购买 CDN，使用 COS 原生域名加载素材
- 区分双 COS 桶：
  - 桶1 永久素材桶：运营海报/主题素材，长期存储
  - 桶2 AI 临时图片桶：食物识别用，5分钟生命周期自动清理（配合 D010）

**理由**：省去域名备案、CDN 鉴权、缓存配置；前期零成本（COS 新用户 50G 免费 + 10G/月免费下行流量）。

**影响**：服务端 `config.COSConfig` 双桶配置；`storage/cos.go` 双客户端封装；`.env.example` 新增 `COS_MATERIAL_BUCKET` + `COS_AI_TEMP_BUCKET`；禁止将海报/主题大图存放在轻量服务器本地磁盘。
