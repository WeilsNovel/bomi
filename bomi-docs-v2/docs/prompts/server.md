# bomi · 服务端 Stage 1 任务

> 本文件是服务端新对话的首条任务指令。先读 `docs/skills/server.md`（长期规则）+ `PROJECT-CONTEXT.md` + `DECISIONS.md`，再执行本任务。

# 项目介绍

bomi 是「AI 食物拍照识别 + 饮食打卡 + 健康计划推荐」的多端项目。已完成 D008 架构迁移（NestJS→Go）和 D009-D013 隐私架构修订（PostgreSQL + AI 图片临时上传即删 + 饮食打卡完全本地化 + 分阶段部署 + COS 双桶无CDN）。

# 你的角色

你是 bomi 项目的服务端开发者，负责 `server/` 目录下的全部 Go 代码 + 内置 AI 调用层 + COS 对象存储层。

# 技术栈

- Go 1.22 + Gin + GORM + JWT（`golang-jwt/jwt/v5`）
- AI SDK：`sashabaranov/go-openai`
- 对象存储：腾讯云 COS（双桶）
- 数据库：PostgreSQL（pgx + GORM，禁止 MySQL）
- 配置：viper 读 `.env`；日志：zap
- 契约来源：protobuf（`proto/` → `make proto` → `gen/go`）

服务端骨架已由整合方创建并通过 `go build ./...`。

# 第一动作

1. 读取 `docs/skills/server.md`（长期规则集）+ `PROJECT-CONTEXT.md` + `DECISIONS.md`
2. `cd server && go build ./...` 确认骨架可编译
3. 浏览 `server/internal/middleware/response.go`、`constants/errorcode.go`、`router/router.go`、`ai/`，掌握已有骨架

# 关键规则

1. **契约来源是 proto**：DTO/错误码/枚举单一来源是 `proto/`。proto 需变更时停下向整合方提案
2. **handler 走 middleware**：必须用 `middleware.OK` / `middleware.Fail` 返回 `BaseApiResponse`
3. **错误码用 constants.\***：禁止硬编码数字
4. **密钥只从环境变量读取**：禁止硬编码
5. **零硬编码**：端口/超时/分页/重试抽到 config 或常量
6. **AI 调用红线**：前端禁直连 AI；server 调 `server/internal/ai/` 暴露的方法
7. **分层**：model → repository → service → handler → router

# Stage 1 任务

1. **GORM 接入 PostgreSQL**（D009）：
   - 在 `model/` 定义 `User` / `Membership` / `PointsLog` / `InviteRecord` / `IapOrder` / `MaterialItem`（**无 FoodLog/DietLog**，D011）
   - 用 `gorm.io/driver/postgres` 连 PG；开发期用 Neon Serverless PG
   - `cmd/main.go` 初始化 GORM 连接

2. **COS 双桶接入**（D013）：
   - `cmd/main.go` 初始化 `storage.NewClient(cfg.COS)`
   - 永久素材桶 + AI 临时桶

3. **auth handler**（公开分组）：
   - 微信登录（`code` → `code2session` 换 openid）→ 关联/创建用户 → 签发 JWT
   - 手机号登录（校验短信验证码）→ 关联/创建用户 → 签发 JWT
   - Apple 登录（校验 `identityToken`）→ 关联/创建用户 → 签发 JWT
   - 发送短信验证码
   - 错误码：`WxLoginFailed` / `SmsCodeInvalid` / `PhoneAlreadyBound` / `AppleLoginFailed`

4. **用户 handler**（JWT 分组）：获取/更新 profile（`GET/PUT /api/v1/user/profile`）

5. **AI 食物识别 handler**（D010 流程）：
   - `POST /api/v1/ai/food/recognize`：接收 `imageKey` → `storage.GetAITempImageURL` → `ai.RecognizeFood` → 返回文字营养数据 + `imageKey`
   - `POST /api/v1/ai/food/delete-image`：接收 `imageKey` → `storage.DeleteAITempImage` 删除 COS 原图

6. **AI 计划生成 handler**（D011）：
   - `POST /api/v1/ai/plan/generate`：接收 `HealthProfile + RecentNutritionSummary` → `ai.Chat(PromptPlanGenerate)` → **用完即丢不入库**

7. **所有 handler 走 `middleware.OK` / `middleware.Fail`，错误码用 `constants.*`**；在 `router/router.go` 注册到对应子分组

# 注意事项

- 用户表需同时存 `openid` 与 `phone`，支持多种登录方式关联同一账号
- **禁止实现 diet 相关接口**（D011）
- 每段代码标注完整文件路径
- 不确定的契约/模型能力禁止臆造，先问整合方
- 末尾输出「改动文件清单」+「黑名单未触碰确认」+「AI Key 安全自检」+「go build 结果」
