# bomi 项目文档包

> 本文档包供各端新对话 0-1 启动使用。读取本 README 后，找到你所属端的 skill + prompt 开始工作。

## 项目介绍

bomi 是「AI 食物拍照识别 + 饮食打卡 + 健康计划推荐」的多端项目。

- 用户用手机拍摄三餐照片 → AI 识别食物 + 营养成分 → 本地记录打卡
- 基于用户健康档案 + 近期饮食数据 → AI 生成个性化健康计划
- 隐私核心承诺：用户饮食明细/照片完全本地化，不上传后端

## 技术栈（D008 + D009-D013）

| 层 | 技术栈 | 目录 |
|---|---|---|
| 契约层 | protobuf 单一来源 + buf codegen | `proto/` |
| 服务端 | Go 1.22 + Gin + GORM + pgx + JWT | `server/` |
| AI 调用层 | Go 内置（go-openai，对接通义千问 VL 等） | `server/internal/ai/` |
| 对象存储 | 腾讯云 COS（双桶：永久素材 + AI临时，无 CDN） | `server/internal/storage/` |
| 数据库 | PostgreSQL（pgx + GORM，禁止 MySQL） | server/ |
| 移动端共享 | Kotlin Multiplatform + ktor + SQLDelight | `mobile-shared/` |
| iOS | KMP + SwiftUI + CloudKit | `packages/ios/` |
| Android | KMP + Jetpack Compose + 坚果云WebDAV | `packages/android/` |
| 管理后台 | Vue3 + Vite + Element Plus | `packages/admin/` |
| 小程序 | Uni-app（暂缓） | `packages/miniapp/` |

## 获取代码

```bash
git clone https://github.com/WeilsNovel/Bomi.git bomi
cd bomi
```

## 环境准备

| 工具 | 用途 | 安装 |
|---|---|---|
| Go 1.22+ | 服务端编译 | https://go.dev/dl/ |
| buf + protoc | proto codegen | `brew install bufbuild/buf/buf`（Mac） |
| JDK 17 + Android Studio | Android + KMP | https://developer.android.com/studio |
| Xcode 15+ | iOS | Mac App Store |
| Node 18+ + pnpm | 管理后台 | `npm i -g pnpm` |
| Docker | 本地 PG（可选） | https://docker.com |
| PostgreSQL | 数据库（开发期可用 Neon Serverless） | https://neon.tech |

## 初始化依赖

```bash
# proto codegen（生成 gen/go/ gen/kotlin/ gen/ts/）
make proto

# 服务端
cd server && go mod tidy && cd ..

# 管理后台
cd packages/admin && pnpm install && cd ..
```

## 构建命令

```bash
make proto          # 生成 proto 多语言代码
make build-server   # 编译 Go 服务端
make run-server     # 启动服务端
make build-mobile   # 编译 KMP 模块
make test           # 全部测试
```

## 文档导航

### 你是哪个角色？

| 角色 | 先读 skill（长期规则） | 再读 prompt（Stage 1 任务） |
|---|---|---|
| 整合方（技术总监） | `docs/skills/integrator.md` | — |
| 服务端 | `docs/skills/server.md` | `docs/prompts/server.md` |
| iOS | `docs/skills/ios.md` | `docs/prompts/ios.md` |
| Android | `docs/skills/android.md` | `docs/prompts/android.md` |
| 管理后台 | `docs/skills/admin.md` | `docs/prompts/admin.md` |

### 共享文档（所有角色必读）

| 文档 | 用途 |
|---|---|
| `PROJECT-CONTEXT.md` | 项目现状 + 技术栈 + 数据分层 + 跨端协同规则 |
| `DECISIONS.md` | 架构决策记录（D008-D013） |
| `docs/api-contract.md` | 接口契约（类型来源 proto） |

## 数据分层（隐私架构核心）

| 数据类型 | 存储位置 | 上传后端 |
|---|---|---|
| 用户饮食明细（食物/照片/体重） | SQLDelight 本地 + 私有云（iCloud/坚果云） | 禁止 |
| AI 识别临时图片 | COS 临时桶（5分钟自动清理） | 临时上传，用完即删 |
| 会员/积分/邀请/内购 | 后端 PostgreSQL | 正常存储 |
| 运营素材（海报/主题） | COS 永久桶 | 正常存储 |
| AI 计划生成的营养汇总 | 临时传后端，用完即丢 | 临时传输，不入库 |

## 项目当前阶段

Stage 0.5（架构骨架）已完成，包含：
- `proto/`：15 个 proto 文件（契约定义）
- `server/`：16 个 Go 文件（骨架，`go build` 通过）
- `mobile-shared/`：19 个 KMP 文件（commonMain + iosMain + androidMain 骨架）

各端待启动 Stage 1 开发。
