# bomi · 管理后台 Stage 1 任务

> 本文件是管理后台新对话的首条任务指令。先读 `docs/skills/admin.md`（长期规则）+ `PROJECT-CONTEXT.md` + `DECISIONS.md`，再执行本任务。

# 项目介绍

bomi 是「AI 食物拍照识别 + 饮食打卡 + 健康计划推荐」的多端项目。已完成 D008 架构迁移 + D009-D013 隐私架构修订。

原 `@bomi/shared` TS 类型包已废弃，**类型来源改为 proto codegen 的 TS 产物（仓库根执行 `make proto` 生成到 `gen/ts/`）**。服务端为 Go（Gin+GORM），后台通过 HTTP 调用其 `/api/v1/*` 与 `/api/v1/admin/*` 接口。

# 你的角色

你是 bomi 项目的管理后台前端开发者，工作目录是 `packages/admin/`。

# 技术栈

- Vue3 + TypeScript + Vite + Element Plus
- 状态管理：Pinia；路由：Vue Router；HTTP：axios
- 类型来源：proto codegen TS（`gen/ts/`）

`packages/admin/` 当前状态：只有 `package.json` stub，尚未初始化 Vite 项目。

# 第一动作

1. 读取 `docs/skills/admin.md`（长期规则集）+ `PROJECT-CONTEXT.md` + `DECISIONS.md`
2. 在仓库根执行 `make proto` 生成 `gen/ts/`（若已存在则浏览其导出的类型）
3. 确认 `packages/admin/package.json` 现状（stub，脚本为 TODO）

# 关键规则

1. **类型来源是 proto codegen**：接口类型、错误码、业务枚举一律从 `gen/ts/` 引用，禁止单独定义公共类型
2. **统一响应解包**：`core/request.ts` 拦截器解包 `BaseApiResponse`，`code === 0` 返回 `data`，`code !== 0` 走异常；`40102` 跳登录页
3. **请求统一走 `core/request.ts`**：axios 实例 + 请求拦截器（注入 `Authorization`）+ 响应拦截器
4. **零硬编码**：分页/色值/状态枚举/路由路径全抽到 `config/constants.ts`
5. **完整 TS 类型，禁止 any**
6. **AI 调用红线**：env 只存 `useAiProxy: true`，绝不出现 API Key

# Stage 1 任务

1. **Vite 初始化**：`npm create vite@latest` 初始化 Vue3 + TS，合并到 `packages/admin`（保留已有 package.json 的 name/private/description，合并 scripts 与 dependencies）；安装 Element Plus + `@element-plus/icons-vue` + pinia + vue-router + axios

2. **目录骨架**：补齐 `config/` `core/` `types/` `components/` `pages/` `hooks/` `api/` `router/` `store/` `layout/`

3. **请求封装**：`core/request.ts`（axios + 拦截器，解包 BaseApiResponse，code !== 0 走异常弹提示，40102 跳登录页）

4. **类型来源接入**：仓库根 `make proto` 生成 `gen/ts/`，在 `vite.config.ts` / `tsconfig.json` 配置路径别名（如 `@gen`）引用

5. **配置**：`config/env.ts`（`apiBaseUrl`、`useAiProxy: true`、`tokenKey`）+ `config/constants.ts`（分页默认值、状态枚举映射、路由路径）

6. **路由与布局**：`router/index.ts`（路由表参数化）+ `layout/`（侧边栏 + 顶栏骨架）+ `store/`（user / permission / menu）+ 登录页

7. **业务页面骨架**：用户管理页（表格 + 分页 + 查询表单，对接 `gen/ts/` 类型；接口联调留 Stage 2）

8. **脚本填充**：`package.json` 的 `dev` / `build` / `typecheck`（`vue-tsc --noEmit`）/ `lint` 脚本

# 注意事项

- **D011 说明**：饮食打卡明细完全本地化，后端不存储打卡数据，**管理后台无"饮食打卡记录管理"功能**
- server 端 `/api/v1/admin/*` 在 Stage 2 才接入鉴权 + 管理员权限。Stage 1 先搭好前端骨架与请求封装
- 每段代码标注完整文件路径
- 不确定的 API 禁止臆造，先问整合方
- 末尾输出「改动文件清单」+「黑名单未触碰确认」+「typecheck/build 结果」
