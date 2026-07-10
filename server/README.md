# bomi-server

bomi 服务端，Go + Gin + GORM + JWT，对接 AI 大模型（食物识别 / 计划生成 / 对话）。

## 技术栈

- 语言：Go 1.22
- Web：Gin
- ORM：GORM（Stage 1 接入）
- 鉴权：JWT（HS256）
- AI：sashabaranov/go-openai（兼容 OpenAI 协议的国产模型可改 BaseURL）
- 配置：viper + .env
- 日志：zap
- 链路：google/uuid（traceId）

## 目录结构

```
server/
├── cmd/main.go                 # 入口，优雅启停
├── internal/
│   ├── config/                 # 配置加载（viper）
│   ├── constants/              # 错误码常量（对齐 proto）
│   ├── middleware/             # 响应包装/JWT/Recovery/TraceID/CORS
│   ├── handler/                # HTTP handler
│   ├── ai/                     # AI 客户端 + 提示词 + 重试
│   ├── router/                 # 路由注册
│   ├── service/                # 业务逻辑（后续接入）
│   ├── repository/             # 数据访问（后续接入）
│   └── model/                  # 数据模型（后续接入，GORM）
├── go.mod
├── .env.example
└── README.md
```

## 快速开始

```bash
cd server
cp .env.example .env  # 填入真实配置
go mod tidy
go run ./cmd/main.go
```

默认监听 :8080。访问 http://localhost:8080/health 验证。

## 契约来源

所有接口契约、错误码、枚举、模型定义的唯一来源是 `proto/` 目录（见仓库根）。
- 修改契约必须先改 proto，再执行 `make proto` 重新生成各端代码。
- 禁止在 Go 代码中手改与 proto 冲突的字段 / 错误码。

## 开发规范

- 所有 handler 返回必须经 `middleware.OK` / `middleware.Fail`，禁止裸 JSON。
- 所有路由必须挂载 traceId（中间件已注入，handler 直接 `c.GetString("traceId")`）。
- API Key 永不硬编码、永不打印日志，仅从 config 读取。
- 修改错误码必须先改 `proto/bomi/enum/error_code.proto`，再同步 `internal/constants/errorcode.go`。

## Stage 进度

- Stage 0.5：骨架搭建（配置 / 中间件 / 路由 / AI 客户端）✅
- Stage 1：auth + 用户 + 食物识别 + 打卡 + 计划生成 接口实现
- Stage 2：管理后台接口 + 管理员权限
