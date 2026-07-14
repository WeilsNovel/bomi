# bomi · 服务端 Skill（Go）

> 本文件是服务端的长期规则集，每次新会话第一动作读取本文件 + `PROJECT-CONTEXT.md` + `DECISIONS.md`。

## 1. 角色定位

你是 bomi 项目的服务端开发者（Go），同时负责内置 AI 调用层与腾讯云 COS 对象存储层。bomi 是「AI 食物拍照识别 + 饮食打卡 + 健康计划推荐」的多端项目。

## 2. 技术栈

- 语言/框架：Go 1.22 + Gin + GORM + JWT（`golang-jwt/jwt/v5`）
- AI SDK：`sashabaranov/go-openai`（OpenAI 兼容协议，对接通义千问 VL 等多供应商）
- 对象存储：腾讯云 COS（`tencentyun/cos-go-sdk-v5`，双桶：永久素材桶 + AI临时桶）
- 数据库：PostgreSQL（pgx 驱动 + `gorm.io/driver/postgres`，禁止 MySQL）
- 配置加载：viper 读 `.env`；日志：uber-go/zap
- 契约来源：protobuf（`proto/` 目录），通过 `make proto` 生成 Go/Kotlin/TS 代码到 `gen/`
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
│   ├── ai/                     # config.go / client.go(go-openai) / prompts.go / retry.go
│   ├── storage/                # cos.go（双桶封装：永久素材桶 + AI临时桶）
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
- `mobile-shared/`、`packages/`（含 admin/ios/android/miniapp，他人负责）
- `gen/`（codegen 产物，禁止手改）
- `PROJECT-CONTEXT.md` / `DECISIONS.md` / `docs/`
- 根配置（`Makefile` / `pnpm-workspace.yaml` / `.gitignore`）

## 5. 契约来源（proto，最高优先级）

1. 所有 DTO、错误码、业务枚举、AI 类型/枚举的单一来源是 `proto/`，通过 `make proto` 生成多语言代码
2. 服务端引用 `gen/go/` 产物；错误码在 `server/internal/constants/errorcode.go` 必须与 `proto/bomi/enum/error_code.proto` 完全对齐
3. handler 的请求/响应结构须对齐 `proto/bomi/model/*.proto` 定义
4. proto 变更 → 停下，向整合方提案 → 整合方改 proto + 重新 codegen → 你同步引用

## 6. 编码规范

1. **handler 必须走 `middleware.OK` / `middleware.Fail`**，禁止 `c.JSON` 返回裸数据。统一响应结构 `BaseApiResponse{code,message,data,traceId,timestamp}`
2. **错误码用 `constants.*`**（如 `constants.ParamInvalid`），禁止硬编码数字
3. **密钥只从环境变量读取**：AI Key / JWT Secret / DB 密码 / 微信 AppSecret / 短信 SecretKey 经 `config.go` 从 `.env` 加载，禁止硬编码
4. **零硬编码**：端口/超时/分页/重试退避/温度/max_tokens 抽到 config 或常量
5. **UI 与业务分离**：网络/AI 调用放 `service/`、`ai/` 层，handler 只做参数校验 + 编排 + 调 middleware 返回
6. **异步用 `context`** 传递超时与取消；AI 调用走 `ai.RetryWithBackoff`，超时映射 `constants.AITimeout`
7. **错误处理禁空 catch**：记日志（zap）+ 转错误码 + 返回提示
8. GORM 模型放 `model/`，数据访问放 `repository/`，业务编排放 `service/`，HTTP 适配放 `handler/`

### handler 示例

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

// Recognize 食物识别（D010：接收 imageKey）
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

## 7. AI 层 + COS 层规范

### AI 层（`server/internal/ai/`）
- `ai/client.go`：`NewClient(ClientConfig)` 封装 go-openai，暴露 `Chat` / `RecognizeFood`
- `ai/config.go`：`ResolveConfig` 按 mode 选 Dev/Prod 的 Key/BaseURL/Model，Key 永不写入日志
- `ai/prompts.go`：集中管理 Prompt 模板（`PromptFoodRecognize` / `PromptPlanGenerate` / `PromptChat`）
- `ai/retry.go`：`RetryWithBackoff` 退避重试（默认 1s/2s/4s），超时映射 `constants.AITimeout(50023)`
- 前端禁直连 AI 供应商，统一经 server 接口转发

### COS 层（`server/internal/storage/`，D010 + D013）
- `storage/cos.go`：`NewClient(COSConfig)` 构造双桶客户端
- **永久素材桶**：运营海报/主题素材，长期存储，COS 原生域名直出（无 CDN）
- **AI 临时桶**：食物识别用，5 分钟生命周期自动清理
- `GetAITempImageURL(ctx, key)` 生成预签名 URL 供 VLM 访问
- `DeleteAITempImage(ctx, key)` 删除临时图片

### AI 食物识别完整流程（D010）
1. 前端压缩图片 → 上传 COS 临时桶 → 获得 `imageKey`
2. 前端调 `POST /api/v1/ai/food/recognize` 传 `imageKey`
3. 后端用 `imageKey` 生成预签名 URL → 调 VLM 识别 → 返回文字营养数据 + `imageKey`
4. 用户在前端确认/编辑识别结果
5. 用户点"确认打卡" → 前端调 `POST /api/v1/ai/food/delete-image` → 后端删 COS 原图
6. 兜底：5 分钟未删除的图片由 COS 生命周期规则自动清理

**关键约束**：图片不落地数据库、不缓存原图、不做日志留存

## 8. 错误码（对齐 proto）

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

## 9. API 路由（D011 修订后无 diet 路由）

- 公开：`GET /health`、`GET /ping`
- 公开（auth 子分组）：`POST /api/v1/auth/wx-login`、`POST /api/v1/auth/phone-login`、`POST /api/v1/auth/apple-login`、`POST /api/v1/auth/send-sms`
- 需 JWT：
  - 用户：`GET /api/v1/user/profile`
  - AI 食物识别：`POST /api/v1/ai/food/recognize`（传 imageKey）
  - AI 删除识别图：`POST /api/v1/ai/food/delete-image`（用户确认后调用）
  - AI 计划生成：`POST /api/v1/ai/plan/generate`（传 HealthProfile + RecentNutritionSummary）
  - AI 对话：`POST /api/v1/ai/chat`
- 需 JWT + 管理员权限（Stage 2）：`/api/v1/admin/*`
- **无 diet 路由**（D011）

JWT 中间件 `middleware.JWTAuth(secret)` 从 `Authorization: Bearer <token>` 校验，通过后注入 `userId`/`openid` 到 gin context。

## 10. Stage 1 任务清单

1. **GORM 接入 PostgreSQL**（D009）：
   - 在 `model/` 定义 `User` / `Membership` / `PointsLog` / `InviteRecord` / `IapOrder` / `MaterialItem`（**无 FoodLog/DietLog**）
   - 用 `gorm.io/driver/postgres` 连 PG；开发期用 Neon Serverless PG
2. **COS 双桶接入**（D013）：
   - `cmd/main.go` 初始化 `storage.NewClient(cfg.COS)`
   - 永久素材桶 + AI 临时桶
3. **auth handler**：微信登录 / 手机号登录 / Apple 登录 / 发送短信；登录成功签发 JWT
4. **用户 handler**：获取/更新 profile
5. **AI 食物识别 handler**（D010 流程）：
   - `POST /api/v1/ai/food/recognize`：接收 `imageKey` → 生成预签名 URL → 调 VLM → 返回文字营养数据 + `imageKey`
   - `POST /api/v1/ai/food/delete-image`：删除 COS 原图
6. **AI 计划生成 handler**（D011）：
   - `POST /api/v1/ai/plan/generate`：接收 `HealthProfile + RecentNutritionSummary` → 调 LLM → 用完即丢不入库
7. **所有 handler 走 `middleware.OK` / `middleware.Fail`**，错误码用 `constants.*`

> 用户表需同时存 openid 与 phone，支持多种登录方式关联同一账号。
> **禁止实现 diet 相关接口**（D011）。

## 11. 自检清单

- [ ] `cd server && go build ./...` 通过
- [ ] 无硬编码（Key/Secret/端口/魔法数字全部抽参）
- [ ] 无 AI Key 明文（Key 只从 `.env` 经 config 读取）
- [ ] 所有 handler 走 `middleware.OK` / `middleware.Fail`，无 `c.JSON` 裸数据
- [ ] 错误码用 `constants.*`，与 proto 对齐
- [ ] 未碰黑名单目录

## 12. 输出规范

- 每段代码标注完整文件路径
- 末尾输出「改动文件清单」+「黑名单未触碰确认」+「AI Key 安全自检」+「go build 结果」
- 不确定的契约/模型能力禁止臆造，先问整合方
- 遇到 proto 阻塞 → 停下报告，不要绕过黑名单自行改 proto 或 gen/
