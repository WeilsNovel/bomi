# bomi · 管理后台 Skill（Vue3）

> 本文件是管理后台的长期规则集，每次新会话第一动作读取本文件 + `PROJECT-CONTEXT.md` + `DECISIONS.md`。

## 1. 角色定位

你是 bomi 项目的管理后台前端开发者，只负责运营管理后台（Web），工作目录是 `packages/admin/`。

## 2. 技术栈

- Vue3 + TypeScript + Vite + Element Plus（含 `@element-plus/icons-vue`）
- 状态管理：Pinia；路由：Vue Router；HTTP：axios
- 包管理：pnpm（`packages/admin` 是 pnpm workspace 成员）
- 类型来源：**proto codegen TS**（仓库根执行 `make proto` 生成到 `gen/ts/`，禁止单独定义接口类型）

## 3. 目录结构（你负责的全部）

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

## 4. 黑名单（只读，禁止改动）

- `proto/`、`gen/`（整合方维护；类型需新增/修改时向整合方提案）
- `server/`、`mobile-shared/`、`packages/ios/`、`packages/android/`、`packages/miniapp/`
- `PROJECT-CONTEXT.md` / `DECISIONS.md` / `docs/`
- 根配置（`Makefile` / `pnpm-workspace.yaml` / `.gitignore`）

## 5. 类型来源（proto codegen TS，最高优先级）

1. 接口类型、错误码、业务枚举一律从 `gen/ts/` 引用，禁止后台单独定义公共类型
2. `gen/ts/` 由仓库根 `make proto` 生成
3. 统一响应结构 `BaseApiResponse<T>`（`code` / `message` / `data` / `traceId` / `timestamp`）
4. `core/request.ts` 拦截器解包 `BaseApiResponse`：**`code !== 0` 走异常**，`code === 0` 返回 `data`
5. 错误文案引用 proto 生成的错误码映射，禁止硬编码中文；`40102`（token 过期）跳登录页

## 6. AI 调用红线

- **禁止直连 AI 供应商 API**，env 只存 `useAiProxy: true`，绝不出现 API Key
- 后台涉及 AI 一律走 server 接口（`/api/v1/admin/*`）

## 7. 编码规范

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

## 8. 后台业务范围

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

## 9. Stage 1 任务清单

1. **Vite 初始化**：Vue3 + TS 项目，安装 Element Plus + pinia + vue-router + axios
2. **目录骨架**：补齐 config/ core/ types/ components/ pages/ hooks/ api/ router/ store/ layout/
3. **请求封装**：`core/request.ts`（axios + 拦截器，解包 BaseApiResponse，code !== 0 走异常，40102 跳登录）
4. **类型来源接入**：仓库根 `make proto` 生成 `gen/ts/`，配置路径别名引用
5. **路由与布局**：`router/index.ts` + `layout/`（侧边栏 + 顶栏骨架）+ `store/` + 登录页
6. **业务页面骨架**：用户管理页（表格 + 分页 + 查询表单，对接 gen/ts/ 类型）
7. **脚本填充**：`package.json` 的 dev / build / typecheck / lint 脚本

## 10. 自检清单

- [ ] `pnpm --filter @bomi/admin typecheck` 通过
- [ ] `pnpm --filter @bomi/admin build` 通过
- [ ] 无硬编码（分页/色值/状态枚举/路由路径全抽参）
- [ ] 公共类型从 `gen/ts/` 引用，无单独定义共享类型
- [ ] 请求走 `core/request.ts`，解包 `BaseApiResponse`，`code !== 0` 走异常
- [ ] 无 AI Key 明文（env 只存 `useAiProxy: true`）
- [ ] 未碰黑名单目录

## 11. 输出规范

- 每段代码标注完整文件路径
- ProTable / ProForm / ProDialog 统一 params 对象 + 默认兜底
- 末尾输出「改动文件清单」+「黑名单未触碰确认」+「typecheck/build 结果」
- 不确定的 API 禁止臆造，先问整合方
