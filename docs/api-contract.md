# bomi · 接口契约（api-contract.md）

> 整合方维护，单一版本。三端联调以此为准，与 `packages/shared/types/*` 字段一致。
> 任何接口变更：先改 shared/types → 更新本文件 → 同步 server → 同步前端，三处同提交。

## 通用约定

### 统一响应结构（所有接口）
```typescript
interface BaseApiResponse<T> {
  code: number;       // 0=成功，非0=失败（见 ERROR_CODE）
  message: string;    // 提示文案（前端可直出，以 ERROR_MESSAGE_MAP 为准）
  data: T;
  traceId?: string;   // 服务端生成
  timestamp?: number; // 服务器时间戳 ms
}
```

### 鉴权
- 除登录/发送验证码外，所有接口需在 header 携带 `Authorization: Bearer <token>`
- token 失效返回 `ERROR_CODE.TOKEN_EXPIRED (40102)`，前端跳登录页

### 路径前缀
- 业务接口：`/api/<module>/<action>`
- AI 接口：`/api/ai/<...>`

---

## 一、Auth 认证模块

### POST `/api/auth/wx-login` · 微信登录
- **请求**：`WxLoginRequest`（shared/types/user.ts）
- **响应**：`BaseApiResponse<LoginResponse>`

### POST `/api/auth/send-sms` · 发送短信验证码
- **请求**：`SendSmsCodeRequest`
- **响应**：`BaseApiResponse<{ expireSeconds: number }>`
- **限流**：60s 内同手机号 1 次，同 IP 10 次/小时

### POST `/api/auth/phone-login` · 手机号验证码登录
- **请求**：`PhoneLoginRequest`
- **响应**：`BaseApiResponse<LoginResponse>`

### POST `/api/auth/apple-login` · Apple 登录（iOS 客户端专用）
- **请求**：`AppleLoginRequest`（shared/types/user.ts）
- **响应**：`BaseApiResponse<LoginResponse>`
- **说明**：App Store 强制要求——有第三方登录（微信）就必须提供 Apple Sign In；server 校验 identityToken 后建号/登录

### POST `/api/auth/logout` · 退出登录
- **请求**：无
- **响应**：`BaseApiResponse<null>`

---

## 二、User 用户模块

### GET `/api/user/profile` · 获取当前用户信息
- **响应**：`BaseApiResponse<UserItem>`

### PUT `/api/user/profile` · 更新当前用户信息
- **请求**：`{ nickname?: string; avatar?: string; gender?: Gender }`
- **响应**：`BaseApiResponse<UserItem>`

### GET `/api/user/health-profile` · 获取健康档案
- **响应**：`BaseApiResponse<HealthProfile | null>`

### PUT `/api/user/health-profile` · 更新健康档案
- **请求**：`Omit<HealthProfile, 'userId'>`
- **响应**：`BaseApiResponse<HealthProfile>`

---

## 三、Diet 饮食打卡模块

### POST `/api/diet/upload` · 上传食物图片
- **请求**：`multipart/form-data`，字段 `file`
- **响应**：`BaseApiResponse<{ url: string }>`（OSS URL）

### GET `/api/diet/records` · 打卡记录列表
- **请求**：`DietRecordListRequest`（query）
- **响应**：`BaseApiResponse<DietRecordListResponse>`

### GET `/api/diet/records/:id` · 打卡记录详情
- **响应**：`BaseApiResponse<DietRecordItem>`

### GET `/api/diet/daily-summary` · 每日营养汇总
- **请求**：`{ startDate: string; endDate: string }`（query，YYYY-MM-DD）
- **响应**：`BaseApiResponse<DailyNutritionSummary[]>`

### DELETE `/api/diet/records/:id` · 删除打卡记录
- **响应**：`BaseApiResponse<null>`

---

## 四、Plan 健康计划模块

### GET `/api/plan/list` · 计划列表
- **请求**：`PlanListRequest`（query）
- **响应**：`BaseApiResponse<PlanListResponse>`

### GET `/api/plan/:id` · 计划详情
- **响应**：`BaseApiResponse<GeneratePlanResponse>`（含每日明细）

### DELETE `/api/plan/:id` · 删除计划
- **响应**：`BaseApiResponse<null>`

---

## 五、AI 接口（前端经 server 转发，禁直连供应商）

### POST `/api/ai/food/recognize` · 食物识别
- **请求**：`FoodRecognizeRequest`
- **响应**：`BaseApiResponse<FoodRecognizeResponse>`
- **说明**：仅识别返回结果，不落库；用户确认后调用 `/api/diet/records` 落库

### POST `/api/ai/plan/generate` · 生成健康计划
- **请求**：`GeneratePlanRequest`
- **响应**：`BaseApiResponse<GeneratePlanResponse>`
- **说明**：服务端调用 ai 层生成，并落库为 PlanItem

### POST `/api/ai/chat` · 通用 AI 对话（可选，支持流式）
- **请求**：`AiRequest`
- **响应**：非流式 `BaseApiResponse<AiResponse>`；流式 SSE 分片 `BaseApiResponse<{ content: string; done: boolean }>`
- **header**：`Accept: text/event-stream` 触发流式

---

## 六、Admin 管理后台接口（需管理员权限）

### GET `/api/admin/users` · 用户列表
- **请求**：`UserListRequest`（query）
- **响应**：`BaseApiResponse<UserListResponse>`

### PUT `/api/admin/users/:id` · 更新用户
- **请求**：`UserUpdateRequest`
- **响应**：`BaseApiResponse<UserItem>`

### GET `/api/admin/diet/records` · 全平台打卡记录（运营审计）
- **请求**：`DietRecordListRequest` + `{ userId?: number }`
- **响应**：`BaseApiResponse<DietRecordListResponse>`

### GET `/api/admin/stats/overview` · 运营总览
- **响应**：`BaseApiResponse<{ totalUsers: number; todayRecords: number; totalCalls: number; totalTokens: number }>`

---

## 错误码（详见 `packages/shared/src/constants/error-code.ts`）

| code | 含义 | 前端处理 |
|---|---|---|
| 0 | 成功 | 正常处理 data |
| 40001 | 参数错误 | 表单回显 |
| 40101 | 未登录 | 跳登录页 |
| 40102 | token 失效 | 清 token 跳登录页 |
| 40301 | 无权限 | 提示无权限 |
| 42901 | 限流 | 提示稍后重试 |
| 40111 | 微信登录失败 | 提示重试 |
| 40112 | 验证码错误 | 输入框回显 |
| 40113 | 手机号已绑定 | 提示换号 |
| 40114 | Apple 登录失败 | 提示重试 |
| 50021 | AI 识别失败 | 提示重拍 |
| 50022 | 计划生成失败 | 提示重试 |
| 50023 | AI 超时 | 提示稍后重试 |
