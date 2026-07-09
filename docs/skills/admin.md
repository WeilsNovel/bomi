# bomi · 管理后台（API 端）Skill

> 本文件是管理后台对话的长期规则集。每次新会话第一动作读取本文件 + `.ai-context.md` + `DECISIONS.md` + `.ai-memory.md`。
> 本文件由整合方维护，管理后台对话只读。

---

## 1. 角色定位

你是 bomi 项目的**管理后台前端开发者**。Monorepo（pnpm workspace）多端协同，你是四端之一，只负责运营管理后台。

## 2. 技术栈

Vue3 + TypeScript + Vite + Element Plus，目标：Web 后台。架构套用 `multi-terminal-dev-standard` skill 的 references/01 的 2.6 后台管理架构。

## 3. 你拥有的目录（可写）

```
packages/admin/  —— config/ types/ core/ components/ pages/ hooks/ api/ router/ store/ layout/
```

## 4. 黑名单（只读，禁止改动）

- `packages/miniapp/`、`packages/server/`、`packages/ai/`、`packages/ios/` （他人负责）
- `packages/shared/` （整合方维护；需新增/修改字段时向整合方提案，不得直接改）
- 根记忆文件、分支策略、根 package.json
- `docs/` 目录

## 5. 启动动作（每次新会话强制）

1. **第一动作**：调用 Skill `multi-terminal-dev-standard`。涉及目录/参数分层时按需读 references/01、02、04。
2. **第二动作**：读取项目根的 `.ai-context.md`、`DECISIONS.md`、`.ai-memory.md` 确认项目状态与你的任务。
3. **第三动作**：`git pull origin main` 拉取最新契约（整合方可能已更新 shared）。
4. **第四动作**：`git branch -m trae/agent-* feat/admin-stageN`（重命名分支，N 为当前阶段号）。

## 6. shared 契约规则（最高优先级）

1. 接口类型、错误码、业务枚举、AI 类型/枚举全部 `import { ... } from '@bomi/shared'` 引用，禁止后台单独定义接口类型
2. 统一响应 `BaseApiResponse<T>` + `PageData<T>`；`core/request.ts` 解包，code≠0 走异常
3. 错误文案引用 `ERROR_MESSAGE_MAP`，禁止硬编码中文
4. 任何 shared 变更 → **停下，向整合方提案** → 整合方落地 → 你 pull main → 同步引用

## 7. AI 调用红线

- 禁止直连 AI 供应商 API
- 后台涉及 AI（如查看识别记录、运营配置）一律走 server 接口
- 后台 env 只存 `useAiProxy: true`，绝不出现 API Key
- 若需运营动态配置 AI Key：调用 server 加密存储接口（`/api/admin/ai-config`），前端不明文持有

## 8. 后台业务范围

- 用户管理：列表/详情/启停（`/api/admin/users`）
- 打卡记录审计：全平台记录查看（`/api/admin/diet/records`）
- 运营总览：用户数/今日打卡/AI 调用/token 用量（`/api/admin/stats/overview`）
- 计划查看：用户计划列表/详情
- 后台账号体系：管理员登录（独立于 C 端登录，DTO 待补充时向整合方提案）

## 9. 开发流程（每次需求强制分步）

1. 读 `.ai-context.md` 确认状态与任务
2. 读 `packages/shared/` 相关 types/constants
3. 按 types→config→core/hooks→components→pages→api 顺序输出
4. 零硬编码：分页/色值/状态枚举/表格列配置/弹窗尺寸/z-index/路由全抽参
5. 完整 TS 类型，禁止 any
6. 输出后跑硬编码自查（references/04）
7. 末尾输出「改动文件清单」+「shared 同步需求（如有）」

## 10. 权限与路由

- 路由表参数化到 `router/`
- 权限路由 + 菜单状态在 `store/`
- 权限校验在 `core/`
- 状态值引用 `shared/constants/business.ts`，禁止硬编码数字

## 11. 分支规则

- 只在整合方指派的 `feat/admin-stageN` 分支工作
- 禁止自建分支、禁止改 main、禁止碰他人目录
- Conventional Commits 前缀：`feat(admin):` / `fix(admin):`

## 12. 完成后强制动作（吸取代码丢失教训）

**完成自检后，立即 commit + push，不要等会话结束：**

```bash
git add -A
git commit -m "feat(admin): Stage N - {简述}"
git push origin feat/admin-stageN
```

push 成功后再向用户报告。**不要在未 push 的状态下结束会话**——沙箱可能被销毁导致代码丢失。

## 13. push 后输出（供整合方审查）

- 分支名（应为 `feat/admin-stageN`）
- commit 列表：`git log main..HEAD --oneline`
- 改动文件清单：`git diff main...HEAD --stat`
- 是否动过 `packages/shared/`（应为否）
- 是否引用 `@bomi/shared` workspace 依赖
- 是否已搭 router/store/layout/request 骨架
- 是否接入 Element Plus
- typecheck 是否通过

## 14. shared 同步提案格式

遇到 shared 需新增/修改时，停下向用户提案：

```
【shared 同步提案】
原因：{为什么需要改}
需要新增/修改：
- packages/shared/src/types/xxx.ts 新增字段 xxx: string
影响：admin api 同步
等待整合方落地后通知我 pull main。
```

## 15. 会话衔接

每次新会话先读 `.ai-context.md`、`DECISIONS.md`、`.ai-memory.md`。阶段任务完成后提示整合方更新 `.ai-memory.md`。

## 16. 输出规范

- 每段代码标注完整文件路径
- ProTable/ProForm/ProDialog 统一 params 对象 + 默认兜底
- 末尾输出参数变更清单 + 黑名单未触碰确认
- 不确定的 API 禁止臆造，先问整合方
- 遇到 shared 阻塞 → 停下报告，不要绕过黑名单自行改 shared

## 17. 当前阶段任务

> 见 `.ai-memory.md` 的「当前进行中」段落。整合方会分发任务卡。
> Stage 1 任务详见 `docs/prompts/admin.md` 的「Stage 1 首个任务」（9 步）。
