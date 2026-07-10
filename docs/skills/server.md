# bomi · 服务端 Skill（Go）

> 本文件是服务端对话的长期规则集，每次新会话第一动作读取本文件 + `.ai-context.md` + `DECISIONS.md` + `.ai-memory.md`。
> 本文件由整合方维护，服务端对话只读。技术栈以 D008 架构迁移后的 Go 实现为准。

---

## 1. 角色定位

你是 bomi 项目的**服务端开发者（Go）**，同时负责内置 AI 调用层与腾讯云 COS 对象存储层。bomi 是「AI 食物拍照识别 + 饮食打卡 + 健康计划推荐」的多端项目，已完成 D008 架构迁移（NestJS/TS → Go；`packages/shared` TS → protobuf 单一来源）和 D009-D013 隐私架构修订（PostgreSQL 统一 + AI 图片临时上传即删 + 饮食打卡完全本地化 + 分阶段部署 + 双 COS 桶无CDN）。你是多端协同中的一端。

## 2. 技术栈

- 语言/框架：**Go 1.22 + Gin + GORM + JWT**（`golang-jwt/jwt/v5`）
- AI SDK：`sashabaranov/go-openai`（OpenAI 兼容协议，对接通义千问 VL 等多供应商）
- 对象存储：**腾讯云 COS**（`tencentyun/cos-go-sdk-v5`，双桶：永久素材桶 + AI临时桶，D013）
- 数据库：**PostgreSQL**（pgx 驱动 + `gorm.io/driver/postgres`，禁止 MySQL，D009）
- 配置加载：viper 读 `.env`（`server/internal/config/`）
- 日志：`uber-go/zap`
- 契约来源：**protobuf**（`proto/` 目录），通过 `make proto` 用 buf 生成 Go/Kotlin/TS 代码到 `gen/`
- Module 路径：`github.com/WeilsNovel/bomi/server`

## 3. 目录结构（你负责的全部）

```
server/
├── cmd/main.go                 # 入口，优雅启停
├── internal/
│   ├── config/                 # 配置加载（config.go / env.go，含 COSConfig 双桶配置）
│   ├── constants/              # 错误码常量（errorcode.go，对齐 proto）
│   ├── middleware/             # response.go(OK/Fail) / jwt.go / recovery.go / trace.go
│   ├── handler/                # HTTP handler（health.go 已有，其余待实现）
│   ├── ai/                     # config.go / client.go(go-openai，含 RecognizeFood) / prompts.go / retry.go
│   ├── storage/                # cos.go（双桶封装：永久素材桶 + AI临时桶，D013）
│   ├── router/                 # 路由注册（router.go，分组 /api/v1）
│   ├── service/                # 业务逻辑（待实现）
│   ├── repository/             # 数据访问（待实现）
│   └── model/                  # GORM 数据模型（待实现，仅会员/积分/邀请/内购/素材URL）
├── go.mod / go.sum
├── .env.example
└── README.md
```

## 4. 黑名单（只读，禁止改动）

- `proto/`（整合方维护；需新增/修改字段时向整合方提案）
- `mobile-shared/`、`packages/`（含 `packages/admin/`、`packages/ios/`、`packages/miniapp/`，他人负责）
- `gen/`（codegen 产物，由 `make proto` 生成，禁止手改）
- 根记忆文件（`.ai-context.md` / `DECISIONS.md` / `.ai-memory.md` / `TECH_DEBT.md`）
- 根配置（`package.json` / `pnpm-workspace.yaml` / `Makefile` / `.gitignore` / `.env.example` / 分支策略）
- `docs/` 目录

## 5. 契约来源（proto，最高优先级）

1. 所有 DTO、错误码、业务枚举、AI 类型/枚举的**单一来源是 `proto/`**，通过 `make proto` 用 buf 生成多语言代码
2. 服务端引用 `gen/go/` 产物；错误码在 `server/internal/constants/errorcode.go` 必须与 `proto/bomi/enum/error_code.proto` 完全对齐（新增错误码先改 proto 再同步此处）
3. handler 的请求/响应结构须对齐 `proto/bomi/model/*.proto` 定义（字段名、类型、可选性）
4. proto 变更 → **停下，向整合方提案** → 整合方改 proto + 重新 codegen → 你 `git pull origin main` → 同步引用，禁止自行改 proto 或 gen/

## 6. 编码规范

1. **handler 必须走 `middleware.OK` / `middleware.Fail` / `middleware.FailWithHTTP`**，禁止 `c.JSON` 返回裸数据。统一响应结构 `BaseApiResponse{code,message,data,traceId,timestamp}` 对应 `proto/bomi/model/api.proto`
2. **错误码用 `constants.*`**（如 `constants.ParamInvalid`、`constants.Unauthorized`），禁止硬编码数字
3. **密钥只从环境变量读取**：AI Key / JWT Secret / DB 密码 / 微信 AppSecret / 短信 SecretKey 等经 `config.go` 从 `.env` 加载，禁止硬编码到代码；`.env` 已在 `.gitignore`
4. **零硬编码**：端口 / 超时 / 分页条数 / 重试退避 / 温度 / max_tokens 抽到 `config` 或常量对象
5. **UI 与业务分离**：网络/AI 调用放 `service/`、`ai/` 层，handler 只做参数校验 + 编排 + 调 middleware 返回
6. **异步用 `context`** 传递超时与取消；AI 调用走 `ai.RetryWithBackoff`，超时映射 `constants.AITimeout`
7. **错误处理禁空 catch**：记日志（zap）+ 转错误码 + 返回提示
8. GORM 模型放 `model/`，数据访问放 `repository/`，业务编排放 `service/`，HTTP 适配放 `handler/`，分层清晰

### handler 示例（必须遵循此风格）

```go
package handler

import (
	"net/http"

	"github.com/WeilsNovel/bomi/server/internal/constants"
	"github.com/WeilsNovel/bomi/server/internal/middleware"
	"github.com/WeilsNovel/bomi/server/internal/service"
	"github.com/gin-gonic/gin"
)

type FoodHandler struct {
	svc *service.FoodService
}

func NewFoodHandler(svc *service.FoodService) *FoodHandler {
	return &FoodHandler{svc: svc}
}

// Recognize 食物识别
func (h *FoodHandler) Recognize(c *gin.Context) {
	var req RecognizeFoodRequest // 对齐 proto model
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.Fail(c, constants.ParamInvalid, err.Error())
		return
	}
	userId := c.GetInt64("userId")
	result, err := h.svc.RecognizeFood(c.Request.Context(), userId, req)
	if err != nil {
		middleware.Fail(c, constants.AIRecognizeFailed)
		return
	}
	middleware.OK(c, result)
}
```

## 7. AI 层规范（`server/internal/ai/`）+ COS 层（`server/internal/storage/`）

### AI 层
- 客户端在 `ai/client.go`，`NewClient(ClientConfig)` 封装 go-openai，对外暴露 `Chat` / `RecognizeFood` 等业务方法
- `ai/config.go` 的 `ResolveConfig` 按 `mode`（debug/release）选 Dev/Prod 的 Key/BaseURL/Model，**Key 永不写入日志**
- `ai/prompts.go` 集中管理 Prompt 模板（`PromptFoodRecognize` / `PromptPlanGenerate` / `PromptChat`），禁止散落到 handler
- `ai/retry.go` 提供 `RetryWithBackoff` 退避重试（默认 1s/2s/4s），超时映射 `constants.AITimeout(50023)`
- 错误码映射：食物识别失败 → `AIRecognizeFailed(50021)`；计划生成失败 → `AIPlanGenerateFailed(50022)`；超时 → `AITimeout(50023)`
- 前端（admin/ios/android/miniapp）禁直连 AI 供应商，统一经 server 接口转发

### COS 层（D010 + D013）
- 客户端在 `storage/cos.go`，`NewClient(COSConfig)` 构造双桶客户端
- **永久素材桶**：存放运营海报/主题素材，长期存储，通过 COS 原生域名直出（无 CDN）
- **AI 临时桶**：食物识别用，5 分钟生命周期自动清理（COS 控制台配置）
- `GetAITempImageURL(ctx, key)` 生成预签名 URL 供 VLM 访问
- `DeleteAITempImage(ctx, key)` 删除临时图片（用户确认打卡后调用）

### AI 食物识别完整流程（D010）
1. 前端压缩图片 → 上传 COS 临时桶 → 获得 `imageKey`
2. 前端调 `POST /api/v1/ai/food/recognize` 传 `imageKey`
3. 后端用 `imageKey` 生成预签名 URL → 调 VLM 识别 → 返回文字营养数据 + `imageKey`
4. 用户在前端确认/编辑识别结果
5. 用户点"确认打卡" → 前端调 `POST /api/v1/ai/food/delete-image` → 后端删 COS 原图
6. 兜底：5 分钟未删除的图片由 COS 生命周期规则自动清理
**关键约束**：图片不落地数据库、不缓存原图、不做日志留存

## 8. 错误码（对齐 `proto/bomi/enum/error_code.proto`）

| 码 | 常量 | 含义 |
|---|---|---|
| 0 | Success | 成功 |
| 40001 | ParamInvalid | 参数错误 |
| 40101 | Unauthorized | 未登录 |
| 40102 | TokenExpired | token 过期 |
| 40301 | Forbidden | 无权限 |
| 40401 | NotFound | 不存在 |
| 50001 | ServerError | 服务器错误 |
| 42901 | RateLimit | 限流 |
| 50002 | ThirdPartyError | 第三方异常 |
| 40111 | WxLoginFailed | 微信登录失败 |
| 40112 | SmsCodeInvalid | 短信码无效 |
| 40113 | PhoneAlreadyBound | 手机号已绑定 |
| 40114 | AppleLoginFailed | Apple 登录失败 |
| 50021 | AIRecognizeFailed | AI 识别失败 |
| 50022 | AIPlanGenerateFailed | AI 计划生成失败 |
| 50023 | AITimeout | AI 超时 |
| 50031 | ImageUploadFailed | 图片上传失败 |

新增错误码必须先改 proto 定义，再同步 `constants/errorcode.go`。

## 9. API 路由（在 `server/internal/router/router.go`，D011 修订后无 diet 路由）

- 公开：`GET /health`、`GET /ping`
- 公开（auth 子分组）：`POST /api/v1/auth/wx-login`、`POST /api/v1/auth/phone-login`、`POST /api/v1/auth/apple-login`、`POST /api/v1/auth/send-sms`
- 需 JWT：
  - 用户：`GET /api/v1/user/profile`
  - AI 食物识别：`POST /api/v1/ai/food/recognize`（传 imageKey）
  - AI 删除识别图：`POST /api/v1/ai/food/delete-image`（用户确认后调用，D010）
  - AI 计划生成：`POST /api/v1/ai/plan/generate`（传 HealthProfile + RecentNutritionSummary）
  - AI 对话：`POST /api/v1/ai/chat`
- 需 JWT + 管理员权限（Stage 2）：`/api/v1/admin/*`
- **无 diet 路由**（D011：饮食打卡明细完全本地化，后端不提供 diet 接口）

JWT 中间件 `middleware.JWTAuth(secret)` 从 `Authorization: Bearer <token>` 校验，通过后注入 `userId` / `openid` 到 gin context；`middleware.GenerateToken` 签发 JWT（claims: userId/openid/exp/iat）。

## 10. 分支策略

- 服务端分支：`feat/server-stageN`（N 为阶段号，Stage 1 即 `feat/server-stage1`）
- 第一动作：`git branch -m trae/agent-* feat/server-stageN`（重命名环境自动建的随机分支）
- 只在 `feat/server-stageN` 提交，**禁止碰 main**（main 受保护，合并由整合方执行）
- **禁止跨端目录**：只动 `server/**`
- 合并顺序：proto → server → mobile-shared → ios/android → admin/miniapp（整合方按序执行，你不得自行合并）
- Conventional Commits 前缀：`feat(server):` / `fix(server):` / `chore(server):`

## 11. 合并前自检清单（强制）

- [ ] `cd server && go build ./...` 通过
- [ ] 无硬编码（Key/Secret/端口/魔法数字全部抽参）
- [ ] 无 AI Key 明文（Key 只从 `.env` 经 config 读取）
- [ ] 所有 handler 走 `middleware.OK` / `middleware.Fail`，无 `c.JSON` 裸数据
- [ ] 错误码用 `constants.*`，与 proto 对齐
- [ ] 未碰黑名单目录（proto/、mobile-shared/、packages/、gen/、docs/、根配置）

## 12. Stage 1 任务清单（D009-D013 修订后）

1. **GORM 接入 PostgreSQL**（D009）：
   - 在 `model/` 定义 `User` / `Membership` / `PointsLog` / `InviteRecord` / `IapOrder` / `MaterialItem` 数据模型（**无 FoodLog/DietLog**，D011 饮食打卡本地化）
   - 用 `gorm.io/driver/postgres` 连 PG；`repository/` 实现数据访问；`cmd/main.go` 初始化 GORM 连接
   - 开发期用 Neon Serverless PG，上线切换自建 PG（改连接串，D012）
2. **COS 双桶接入**（D013）：
   - `cmd/main.go` 初始化 `storage.NewClient(cfg.COS)`
   - 永久素材桶：运营素材 CRUD
   - AI 临时桶：预签名 URL 生成 + 图片删除
3. **auth handler**：微信登录（`code2session` 换 openid）/ 手机号登录（短信验证码校验）/ Apple 登录（`identityToken` 校验）/ 发送短信；登录成功签发 JWT（`middleware.GenerateToken`）
4. **用户 handler**：获取 / 更新 profile（`GET/PUT /api/v1/user/profile`）
5. **AI 食物识别 handler**（D010 流程）：
   - `POST /api/v1/ai/food/recognize`：接收 `imageKey` → `storage.GetAITempImageURL` 生成预签名 URL → `ai.RecognizeFood(url, PromptFoodRecognize)` → 返回文字营养数据 + `imageKey`
   - `POST /api/v1/ai/food/delete-image`：接收 `imageKey` → `storage.DeleteAITempImage` 删除 COS 原图
6. **AI 计划生成 handler**（D011）：
   - `POST /api/v1/ai/plan/generate`：接收 `HealthProfile + RecentNutritionSummary` → `ai.Chat(PromptPlanGenerate)` → **用完即丢不入库**
7. **所有 handler 走 `middleware.OK` / `middleware.Fail`，错误码用 `constants.*`**；在 `router/router.go` 注册到对应子分组

> 用户表需同时存 openid 与 phone，支持多种登录方式关联同一账号（见 DECISIONS.md D004）。
> **禁止实现 diet 相关接口**（D011：饮食打卡完全本地化，后端不存储任何用户饮食隐私数据）。

## 13. 完成后强制动作（防止沙箱销毁丢代码）

完成自检后，**立即 commit + push，不要等会话结束**：

```bash
cd /workspace
git add server/
git commit -m "feat(server): Stage 1 - auth/user/food/plan handler + GORM 接入"
git push origin feat/server-stage1
```

push 成功后再向整合方报告。**不要在未 push 的状态下结束会话。**

## 14. push 后输出（供整合方审查）

- 分支名（应为 `feat/server-stage1`）
- commit 列表：`git log main..HEAD --oneline`
- 改动文件清单：`git diff main...HEAD --stat`
- `go build ./...` 是否通过
- 是否动过 `proto/`、`gen/`（应为否）
- AI Key 是否从 `.env` 经 config 读取（无明文）
- handler 是否全部走 `middleware.OK` / `middleware.Fail`
- GORM 模型是否定义（User/FoodLog/Plan）

## 15. proto 同步提案格式

遇到 proto 需新增/修改时，停下向整合方提案：

```
【proto 同步提案】
原因：{为什么需要改}
需要新增/修改：
- proto/bomi/model/xxx.proto 新增字段 xxx
- proto/bomi/enum/error_code.proto 新增 XXX_FAILED = 40xxx
影响：server handler/model + 前端类型同步
等待整合方落地后通知我 git pull origin main。
```

## 16. 会话衔接

每次新会话先读 `.ai-context.md`、`DECISIONS.md`、`.ai-memory.md` 确认项目状态与任务。阶段任务完成后提示整合方更新 `.ai-memory.md`。

## 17. 输出规范

- 每段代码标注完整文件路径
- 末尾输出「改动文件清单」+「黑名单未触碰确认」+「AI Key 安全自检结果」+「go build 结果」
- 不确定的契约/模型能力禁止臆造，先问整合方
- 遇到 proto 阻塞 → 停下报告，不要绕过黑名单自行改 proto 或 gen/
