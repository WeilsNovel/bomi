# bomi · 接口契约（api-contract.md）

> 整合方维护，单一版本。五端联调以此为准。
> **类型来源（D008 后）**：`proto/` 目录（protobuf 单一来源），通过 `make proto` 生成 Go/Kotlin/TS 代码到 `gen/`。
> **接口变更流程**：先改 `proto/` → `buf generate` → 更新本文件 → 同步 server + 前端，统一由整合方执行。
> **D011 修订**：后端不再有饮食打卡接口（diet 模块完全删除），饮食打卡明细完全本地化（SQLDelight + 私有云同步）。

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

## 三、Diet 饮食打卡模块（D011：已移除，完全本地化）

> **D011 决策**：饮食打卡明细完全本地化，后端不存储任何用户饮食隐私数据。
>
> **客户端实现方式**：
> - 完整饮食明细存设备本地 SQLDelight（封装 SQLite）
> - 跨设备同步走用户私有云（iOS iCloud CloudKit / Android 坚果云 WebDAV），不走后端
> - 查询/增删打卡记录通过 `mobile-shared` 的 `LocalDietStorage` 接口（expect/actual）
> - 后端无 `/api/diet/*` 路由，无 `DietService` proto 定义
>
> **AI 计划生成的数据来源**：App 从本地 DB 聚合近7日营养均值（4个匿名数字 + 统计天数），作为 `RecentNutritionSummary` 传后端，后端用完即丢不入库（见五、AI 接口）。

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

### POST `/api/ai/food/recognize` · 食物识别（D010 流程）
- **请求**：`FoodRecognizeRequest`（含 `image_key` + 可选 `meal_type`）
- **响应**：`BaseApiResponse<FoodRecognizeResponse>`（含 `recognize_id` + `image_key` + `foods[]` + `total_nutrition`）
- **流程**（D010）：
  1. 前端压缩图片 → 上传 COS 临时桶 → 获得 `imageKey`
  2. 前端调本接口传 `imageKey`
  3. 后端用 `imageKey` 生成预签名 URL → 调 VLM 识别 → 返回文字营养数据 + `imageKey`
  4. 用户在前端确认/编辑识别结果
  5. 用户点"确认打卡" → 前端调 `delete-image` 接口 → 后端删 COS 原图
  6. 兜底：5 分钟未删除由 COS 生命周期规则自动清理
- **关键约束**：图片不落地数据库、不缓存原图、不做日志留存

### POST `/api/ai/food/delete-image` · 删除识别图片（D010）
- **请求**：`DeleteRecognizeImageRequest`（含 `image_key`）
- **响应**：`BaseApiResponse<DeleteRecognizeImageResponse>`（含 `success`）
- **触发时机**：用户确认打卡后由前端调用，删除 COS 临时桶原图

### POST `/api/ai/plan/generate` · 生成健康计划（D011）
- **请求**：`GeneratePlanRequest`（含 `HealthProfile` + 可选 `RecentNutritionSummary`）
- **响应**：`BaseApiResponse<GeneratePlanResponse>`
- **说明**：`RecentNutritionSummary` 为 App 从本地 DB 聚合的近7日营养均值（匿名数字，不含食物明细）；后端调 LLM 生成计划后**用完即丢，不入库**

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

### GET `/api/admin/diet/records` · 全平台打卡记录（D011：已移除）
> **D011**：饮食打卡明细完全本地化，后端不存储，管理后台不再有此功能。

### GET `/api/admin/stats/overview` · 运营总览
- **响应**：`BaseApiResponse<{ totalUsers: number; totalCalls: number; totalTokens: number }>`
- **说明**：D011 后移除 `todayRecords` 字段（后端无打卡数据）

---

## 错误码（详见 `proto/bomi/enum/error_code.proto`，D008 后单一来源为 proto）

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
