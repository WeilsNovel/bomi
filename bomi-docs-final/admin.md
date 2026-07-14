# bomi · 管理后台完整文档

> 本文档供管理后台新对话 0-1 启动使用。完整自包含，包含项目背景 + 长期规则 + Stage 1 任务 + 接口契约附录。

---

## 一、项目介绍

bomi 是「AI 食物拍照识别 + 饮食打卡 + 健康计划推荐」的多端项目。

- 用户用手机拍摄三餐照片 → AI 识别食物 + 营养成分 → 本地记录打卡
- 基于用户健康档案 + 近期饮食数据 → AI 生成个性化健康计划
- **隐私核心承诺**：用户饮食明细/照片完全本地化，不上传后端

已完成 D008 架构迁移和 D009-D013 隐私架构修订。

## 二、技术栈

| 层 | 技术栈 | 目录 |
|---|---|---|
| 契约层 | protobuf（单一来源 + buf codegen） | `proto/` |
| 服务端 | Go 1.22 + Gin（REST + JSON） | `server/` |
| 移动端共享 | KMP + ktor + SQLDelight | `mobile-shared/` |
| iOS | KMP + SwiftUI + CloudKit | `packages/ios/` |
| Android | KMP + Compose + 坚果云WebDAV | `packages/android/` |
| **管理后台** | **Vue3 + Vite + Element Plus** | **`packages/admin/`** |

## 三、数据分层（隐私架构核心）

| 数据类型 | 存储位置 | 上传后端 |
|---|---|---|
| 用户饮食明细（食物/照片/体重） | 客户端本地 + 私有云 | 禁止 |
| AI 识别临时图片 | COS 临时桶（5分钟自动清理） | 临时上传，用完即删 |
| 会员/积分/邀请/内购 | 后端 PostgreSQL | 正常存储（后台管理） |
| 运营素材（海报/主题） | COS 永久桶 | 正常存储（后台管理） |
| AI 计划生成的营养汇总 | 临时传后端，用完即丢 | 临时传输，不入库 |

## 四、关键决策摘要（与管理后台相关）

| 决策 | 与管理后台相关的内容 |
|---|---|
| **D008** | 原 `@bomi/shared` TS 类型包废弃，类型来源改为 proto codegen 的 TS 产物（`gen/ts/`） |
| **D011** | 饮食打卡明细完全本地化，后端不存储打卡数据，**管理后台无"饮食打卡记录管理"功能** |
| **D013** | COS 素材管理仅管理永久素材桶，不管 AI 临时桶 |

## 五、获取代码

```bash
git clone https://github.com/WeilsNovel/Bomi.git bomi
cd bomi
```

`packages/admin/` 当前状态：只有 `package.json` stub，尚未初始化 Vite 项目。

## 六、服务端 API（统一响应 `{code, message, data, traceId, timestamp}`，code=0 成功）

后台通过 HTTP 调用服务端 `/api/v1/*` 与 `/api/v1/admin/*` 接口。

---

## 七、你的角色

你是 bomi 项目的管理后台前端开发者，只负责运营管理后台（Web），工作目录是 `packages/admin/`。

## 八、技术栈详情

- Vue3 + TypeScript + Vite + Element Plus（含 `@element-plus/icons-vue`）
- 状态管理：Pinia；路由：Vue Router；HTTP：axios
- 包管理：pnpm（`packages/admin` 是 pnpm workspace 成员）
- 类型来源：**proto codegen TS**（仓库根执行 `make proto` 生成到 `gen/ts/`，禁止单独定义接口类型）

## 九、目录结构（你负责的全部）

```
packages/admin/
├── config/          # 常量与环境（constants.ts / env.ts）
├── types/           # 仅放后台私有类型（公共类型从 gen/ts 引用）
├── core/            # request.ts(axios 封装) / 权限校验
├── components/      # 通用组件（ProTable/ProForm/ProDialog 等）
├── pages/           # 页面（login / layout / users 等）
├── hooks/           # 组合式函数
├── api/             # 接口调用层（按模块组织）
├── router/          # 路由表（参数化）
├── store/           # Pinia（user / permission / menu）
├── layout/          # 布局骨架（侧边栏 + 顶栏）
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 十、黑名单（只读，禁止改动）

- `proto/`、`gen/`（整合方维护；类型需新增/修改时向整合方提案）
- `server/`、`mobile-shared/`、`packages/ios/`、`packages/android/`、`packages/miniapp/`
- `PROJECT-CONTEXT.md` / `DECISIONS.md` / `docs/`
- 根配置（`Makefile` / `pnpm-workspace.yaml` / `.gitignore`）

## 十一、类型来源（proto codegen TS，最高优先级）

1. 接口类型、错误码、业务枚举一律从 `gen/ts/` 引用，禁止后台单独定义公共类型
2. `gen/ts/` 由仓库根 `make proto` 生成
3. 统一响应结构 `BaseApiResponse<T>`（`code` / `message` / `data` / `traceId` / `timestamp`）
4. `core/request.ts` 拦截器解包 `BaseApiResponse`：**`code !== 0` 走异常**，`code === 0` 返回 `data`
5. 错误文案引用 proto 生成的错误码映射，禁止硬编码中文；`40102`（token 过期）跳登录页

## 十二、AI 调用红线

- **禁止直连 AI 供应商 API**，env 只存 `useAiProxy: true`，绝不出现 API Key
- 后台涉及 AI 一律走 server 接口（`/api/v1/admin/*`）

## 十三、编码规范

1. **零硬编码**：分页条数/色值/状态枚举/表格列配置/弹窗尺寸/z-index/路由路径全抽到 `config/constants.ts`
2. **完整 TS 类型，禁止 any**；公共类型从 `gen/ts/` 引用
3. **请求统一走 `core/request.ts`**：axios 实例 + 请求拦截器（注入 `Authorization`）+ 响应拦截器（解包 + 异常处理）
4. **组件统一 params 对象**：ProTable / ProForm / ProDialog 用配置对象 + 默认兜底
5. **路由表参数化**到 `router/`；权限路由 + 菜单状态放 `store/`；权限校验放 `core/`
6. 状态值引用 proto 生成的枚举，禁止硬编码数字

### 请求封装示例

```typescript
import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { API_BASE_URL, TOKEN_KEY } from '../config/env'

const service: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

service.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

service.interceptors.response.use(
  (response) => {
    const body = response.data as BaseApiResponse<unknown>
    if (body.code === 0) {
      return body.data as never
    }
    if (body.code === 40102) {
      localStorage.removeItem(TOKEN_KEY)
      window.location.href = '/login'
    }
    ElMessage.error(body.message || '请求失败')
    return Promise.reject(new Error(body.message))
  },
  (error) => {
    ElMessage.error(error.message || '网络异常')
    return Promise.reject(error)
  },
)

export function request<T>(config: AxiosRequestConfig): Promise<T> {
  return service.request<unknown, T>(config)
}
```

## 十四、后台业务范围

- 登录页：管理员登录（独立于 C 端登录）
- 布局：侧边栏 + 顶栏骨架
- 用户管理：列表 / 详情 / 启停
- 会员订阅管理：会员套餐 / 订阅记录 / 状态管理
- 米花积分流水：积分发放 / 消耗记录查询
- 好友邀请记录：邀请关系链 / 奖励发放记录
- 苹果内购订单：订单列表 / 凭证校验状态 / 退款记录
- COS 素材管理：运营素材 CRUD（上传/删除运营海报、主题素材等永久素材桶内容）；**不管理 AI 临时桶**
- App 全局配置文案：开屏文案 / 公告 / 引导页

> **D011 说明**：饮食打卡明细完全本地化，后端不存储打卡数据，**管理后台无"饮食打卡记录管理"功能**。

---

## 十五、Stage 1 任务

### 第一动作

1. 浏览本完整文档，掌握项目背景 + 规则 + 任务
2. 在仓库根执行 `make proto` 生成 `gen/ts/`（若已存在则浏览其导出的类型）
3. 确认 `packages/admin/package.json` 现状（stub，脚本为 TODO）

### 任务清单

1. **Vite 初始化**：`npm create vite@latest` 初始化 Vue3 + TS，合并到 `packages/admin`（保留已有 package.json 的 name/private/description，合并 scripts 与 dependencies）；安装 Element Plus + `@element-plus/icons-vue` + pinia + vue-router + axios

2. **目录骨架**：补齐 `config/` `core/` `types/` `components/` `pages/` `hooks/` `api/` `router/` `store/` `layout/`

3. **请求封装**：`core/request.ts`（axios + 拦截器，解包 BaseApiResponse，code !== 0 走异常弹提示，40102 跳登录）

4. **类型来源接入**：仓库根 `make proto` 生成 `gen/ts/`，在 `vite.config.ts` / `tsconfig.json` 配置路径别名（如 `@gen`）引用

5. **配置**：`config/env.ts`（`apiBaseUrl`、`useAiProxy: true`、`tokenKey`）+ `config/constants.ts`（分页默认值、状态枚举映射、路由路径）

6. **路由与布局**：`router/index.ts`（路由表参数化）+ `layout/`（侧边栏 + 顶栏骨架）+ `store/`（user / permission / menu）+ 登录页

7. **业务页面骨架**：用户管理页（表格 + 分页 + 查询表单，对接 `gen/ts/` 类型；接口联调留 Stage 2）

8. **脚本填充**：`package.json` 的 `dev` / `build` / `typecheck`（`vue-tsc --noEmit`）/ `lint` 脚本

### 注意事项

- **D011 说明**：饮食打卡明细完全本地化，后端不存储打卡数据，**管理后台无"饮食打卡记录管理"功能**
- server 端 `/api/v1/admin/*` 在 Stage 2 才接入鉴权 + 管理员权限。Stage 1 先搭好前端骨架与请求封装
- 每段代码标注完整文件路径
- 不确定的 API 禁止臆造，先问整合方

## 十六、自检清单

- [ ] `pnpm --filter @bomi/admin typecheck` 通过
- [ ] `pnpm --filter @bomi/admin build` 通过
- [ ] 无硬编码（分页/色值/状态枚举/路由路径全抽参）
- [ ] 公共类型从 `gen/ts/` 引用，无单独定义共享类型
- [ ] 请求走 `core/request.ts`，解包 `BaseApiResponse`，`code !== 0` 走异常
- [ ] 无 AI Key 明文（env 只存 `useAiProxy: true`）
- [ ] 未碰黑名单目录
- [ ] 末尾输出「改动文件清单」+「黑名单未触碰确认」+「typecheck/build 结果」

## 十七、输出规范

- 每段代码标注完整文件路径
- ProTable / ProForm / ProDialog 统一 params 对象 + 默认兜底
- 不确定的 API 禁止臆造，先问整合方

---

## 附录：接口契约

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

除登录外，所有接口需在 header 携带 `Authorization: Bearer <token>`。token 失效返回 `40102`，跳登录页。

### Admin 管理后台接口（需管理员权限，Stage 2 联调）

| 接口 | 说明 |
|---|---|
| `GET /api/v1/admin/users` | 用户列表 |
| `PUT /api/v1/admin/users/:id` | 更新用户 |
| `GET /api/v1/admin/stats/overview` | 运营总览（totalUsers / totalCalls / totalTokens） |

> D011 后管理后台无"饮食打卡记录管理"功能（`/api/admin/diet/records` 已移除）。
> Stage 1 先搭前端骨架与请求封装，Stage 2 联调 server 接口。

### 错误码

| code | 含义 | 前端处理 |
|---|---|---|
| 0 | 成功 | 正常处理 data |
| 40001 | 参数错误 | 表单回显 |
| 40101 | 未登录 | 跳登录页 |
| 40102 | token 失效 | 清 token 跳登录页 |
| 40301 | 无权限 | 提示无权限 |
| 40401 | 不存在 | 提示 |
| 42901 | 限流 | 提示稍后重试 |
| 50001 | 服务器错误 | 提示稍后重试 |
| 50002 | 第三方异常 | 提示稍后重试 |
