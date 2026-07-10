# bomi · 管理后台 Skill（Vue3）

> 本文件是管理后台对话的长期规则集，每次新会话第一动作读取本文件 + `.ai-context.md` + `DECISIONS.md` + `.ai-memory.md`。
> 本文件由整合方维护，管理后台对话只读。技术栈以 D008 架构迁移后的实现为准。

---

## 1. 角色定位

你是 bomi 项目的**管理后台前端开发者**，只负责运营管理后台（Web）。bomi 是「AI 食物拍照识别 + 饮食打卡 + 健康计划推荐」的多端项目，刚完成 D008 架构迁移：原 `@bomi/shared` TS 类型包已废弃，类型来源改为 **proto codegen 的 TS 产物（`gen/ts/`）**。随后完成 D009-D013 隐私架构修订：PostgreSQL 统一（pgx + GORM，禁用 MySQL）、AI 食物识别图片临时上传 COS → VLM 识别 → 用户确认后删除（5 分钟生命周期兜底）、饮食打卡明细完全本地化（SQLDelight + iCloud/坚果云，后端无 diet 接口）、开发期 Neon PG + 上线自建 PG、腾讯云 COS 双桶（永久素材 + AI 临时，无 CDN）。你是多端协同中的一端。

## 2. 技术栈

- Vue3 + TypeScript + Vite + Element Plus（含 `@element-plus/icons-vue`）
- 状态管理：Pinia；路由：Vue Router
- HTTP：axios（封装统一拦截器）
- 包管理：pnpm（workspace，`packages/admin` 是 workspace 成员）
- 类型来源：**proto codegen TS**（仓库根执行 `make proto` 生成到 `gen/ts/`，**禁止单独定义接口类型**）

## 3. 目录结构（你负责的全部）

`packages/admin/` 当前只有 `package.json` stub（脚本是 TODO），尚未初始化。Stage 1 需用 Vite 初始化并补齐以下结构：

```
packages/admin/
├── config/          # 常量与环境（constants.ts / env.ts：apiBaseUrl、useAiProxy 等）
├── types/           # 仅放后台私有类型（公共类型一律从 gen/ts 引用）
├── core/            # request.ts(axios 封装) / 权限校验等
├── components/      # 通用组件（ProTable/ProForm/ProDialog 等，统一 params 对象）
├── pages/           # 页面（login / layout / users / food-records 等）
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

- `proto/`、`gen/`（整合方维护；类型需新增/修改时向整合方提案，由其改 proto + 重新 codegen）
- `server/`、`mobile-shared/`、`packages/ios/`、`packages/miniapp/`（他人负责）
- 根记忆文件（`.ai-context.md` / `DECISIONS.md` / `.ai-memory.md` / `TECH_DEBT.md`）
- 根配置（`package.json` / `pnpm-workspace.yaml` / `Makefile` / `.gitignore` / 分支策略）
- `docs/` 目录

## 5. 类型来源（proto codegen TS，最高优先级）

1. 接口类型、错误码、业务枚举、AI 类型/枚举**一律从 `gen/ts/` 引用**，禁止后台单独定义与后端/移动端共享的类型
2. `gen/ts/` 由仓库根 `make proto` 生成（buf + stephenh-ts-proto）；proto 变更由整合方负责，你 `git pull origin main` 后重新引用
3. 统一响应结构 `BaseApiResponse<T>`（`code` / `message` / `data` / `traceId` / `timestamp`，对应 `proto/bomi/model/api.proto`）；分页用 `PageData<T>`
4. `core/request.ts` 拦截器解包 `BaseApiResponse`：**`code !== 0` 走异常**（弹错误提示），`code === 0` 直接返回 `data`
5. 错误文案引用 proto 生成的错误码映射，禁止硬编码中文；`40102`（token 过期）拦截后跳登录页
6. proto 需新增/修改时 → **停下，向整合方提案** → 整合方改 proto + codegen → 你 pull → 同步引用，禁止自行改 `proto/` 或 `gen/`

## 6. AI 调用红线

- **禁止直连 AI 供应商 API**，后台 env 只存 `useAiProxy: true`，绝不出现 API Key
- 后台涉及 AI（查看识别记录、运营配置等）一律走 server 接口（`/api/v1/admin/*`）
- 若需运营动态配置 AI Key：调用 server 加密存储接口，前端不明文持有

## 7. 编码规范

1. **零硬编码**：分页条数 / 色值 / 状态枚举 / 表格列配置 / 弹窗尺寸 / z-index / 路由路径全抽到 `config/constants.ts`，禁止散落魔法数字
2. **完整 TS 类型，禁止 any**；公共类型从 `gen/ts/` 引用
3. **请求统一走 `core/request.ts`**：axios 实例 + 请求拦截器（注入 `Authorization: Bearer <token>`）+ 响应拦截器（解包 `BaseApiResponse`，`code !== 0` 抛异常并提示，`40102` 跳登录）
4. **组件统一 params 对象**：ProTable / ProForm / ProDialog 用配置对象 + 默认兜底，禁止逐个 props 硬塞
5. **路由表参数化**到 `router/`；权限路由 + 菜单状态放 `store/`；权限校验放 `core/`
6. 状态值（用户状态、记录状态等）引用 proto 生成的枚举，禁止硬编码数字
7. 按目录分层输出：`config → core → hooks → components → pages → api → router → store → layout`

### 请求封装示例（必须遵循此风格）

```typescript
// packages/admin/core/request.ts
import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { API_BASE_URL, TOKEN_KEY } from '../config/env'

const service: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

// 请求拦截：注入 Authorization
service.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截：解包 BaseApiResponse，code !== 0 走异常
service.interceptors.response.use(
  (response) => {
    const body = response.data as BaseApiResponse<unknown>
    if (body.code === 0) {
      return body.data as never
    }
    // token 过期跳登录
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

## 8. 后台业务范围（Stage 1 起逐步实现）

- 登录页：管理员登录（独立于 C 端登录）
- 布局：侧边栏 + 顶栏骨架
- 用户管理：列表 / 详情 / 启停（对应 server `/api/v1/admin/users`，Stage 2 接入）
- 会员订阅管理：会员套餐 / 订阅记录 / 状态管理（Stage 2+）
- 米花积分流水：积分发放 / 消耗记录查询（Stage 2+）
- 好友邀请记录：邀请关系链 / 奖励发放记录（Stage 2+）
- 苹果内购订单：订单列表 / 凭证校验状态 / 退款记录（Stage 2+）
- COS 素材管理：运营素材 CRUD（上传/删除运营海报、主题素材等永久素材桶内容）；**不管理 AI 临时桶**（D013：AI 识别图片临时桶由服务端自动生命周期管理，5 分钟兜底删除）
- App 全局配置文案：开屏文案 / 公告 / 引导页等内容下发（Stage 2+）

> **D011 说明**：饮食打卡明细完全本地化（SQLDelight + iCloud/坚果云），后端不存储打卡数据，**管理后台不再有"饮食打卡记录管理"功能**。

> server 端 `/api/v1/admin/*` 在 Stage 2 才接入鉴权 + 管理员权限。Stage 1 先搭好前端骨架与请求封装，接口联调留到 Stage 2。

## 9. 分支策略

- 管理后台分支：`feat/admin-stageN`（N 为阶段号，Stage 1 即 `feat/admin-stage1`）
- 第一动作：`git branch -m trae/agent-* feat/admin-stageN`（重命名环境自动建的随机分支）
- 只在 `feat/admin-stageN` 提交，**禁止碰 main**（main 受保护，合并由整合方执行）
- **禁止跨端目录**：只动 `packages/admin/**`
- 合并顺序：proto → server → mobile-shared → ios/android → admin/miniapp（整合方按序执行，你不得自行合并）
- Conventional Commits 前缀：`feat(admin):` / `fix(admin):` / `chore(admin):`

## 10. 合并前自检清单（强制）

- [ ] `pnpm --filter @bomi/admin typecheck` 通过（或 `vue-tsc --noEmit`）
- [ ] `pnpm --filter @bomi/admin build` 通过
- [ ] 无硬编码（分页/色值/状态枚举/路由路径全抽参）
- [ ] 公共类型从 `gen/ts/` 引用，无单独定义共享类型
- [ ] 请求走 `core/request.ts`，解包 `BaseApiResponse`，`code !== 0` 走异常
- [ ] 无 AI Key 明文（env 只存 `useAiProxy: true`）
- [ ] 未碰黑名单目录（proto/、gen/、server/、mobile-shared/、packages/ios/、packages/miniapp/、docs/、根配置）

## 11. Stage 1 任务清单

1. **Vite 初始化**：用 `npm create vite@latest` 初始化 Vue3 + TS 项目，合并到 `packages/admin`（保留已有 `package.json` 的 `name`/`private`/`description`，合并 scripts 与 dependencies）；安装 Element Plus + `@element-plus/icons-vue` + pinia + vue-router + axios
2. **目录骨架**：按第 3 节结构补齐 `config/` `core/` `types/` `components/` `pages/` `hooks/` `api/` `router/` `store/` `layout/`
3. **请求封装**：`core/request.ts`（axios + 拦截器，解包 `BaseApiResponse`，`code !== 0` 走异常弹提示，注入 `Authorization` 头，`40102` 跳登录页）
4. **类型来源接入**：仓库根执行 `make proto` 生成 `gen/ts/`，`packages/admin` 通过路径别名（如 `@gen`）引用，禁止单独定义公共类型
5. **路由与布局**：`router/index.ts`（路由表参数化）+ `layout/`（侧边栏 + 顶栏骨架）+ `store/`（user / permission / menu）+ 登录页
6. **业务页面骨架**：用户管理页（表格 + 分页 + 查询表单，对接 `gen/ts/` 类型；接口联调留 Stage 2）
7. **脚本填充**：`package.json` 的 `dev` / `build` / `typecheck` / `lint` 脚本（替换原 TODO）

## 12. 完成后强制动作（防止沙箱销毁丢代码）

完成自检后，**立即 commit + push，不要等会话结束**：

```bash
cd /workspace
git add packages/admin/
git commit -m "feat(admin): Stage 1 - Vite 初始化 + 布局/路由/请求封装/业务页面骨架"
git push origin feat/admin-stage1
```

push 成功后再向整合方报告。**不要在未 push 的状态下结束会话。**

## 13. push 后输出（供整合方审查）

- 分支名（应为 `feat/admin-stage1`）
- commit 列表：`git log main..HEAD --oneline`
- 改动文件清单：`git diff main...HEAD --stat`
- `typecheck` / `build` 是否通过
- 是否动过 `proto/`、`gen/`（应为否）
- 是否从 `gen/ts/` 引用类型（无单独定义共享类型）
- 是否已搭 `router` / `store` / `layout` / `core/request.ts` 骨架
- 是否接入 Element Plus
- 是否存在 AI Key 明文（应为否）

## 14. proto 同步提案格式

遇到 proto 需新增/修改时，停下向整合方提案：

```
【proto 同步提案】
原因：{为什么需要改}
需要新增/修改：
- proto/bomi/model/xxx.proto 新增字段 xxx
- proto/bomi/api/admin.proto 新增管理员接口
影响：admin 类型引用 + 接口调用同步
等待整合方落地后通知我 git pull origin main 并 make proto。
```

## 15. 会话衔接

每次新会话先读 `.ai-context.md`、`DECISIONS.md`、`.ai-memory.md` 确认项目状态与任务。阶段任务完成后提示整合方更新 `.ai-memory.md`。

## 16. 输出规范

- 每段代码标注完整文件路径
- ProTable / ProForm / ProDialog 统一 params 对象 + 默认兜底
- 末尾输出「改动文件清单」+「黑名单未触碰确认」+「typecheck/build 结果」
- 不确定的 API 禁止臆造，先问整合方
- 遇到 proto/gen 阻塞 → 停下报告，不要绕过黑名单自行改 proto 或 gen/
