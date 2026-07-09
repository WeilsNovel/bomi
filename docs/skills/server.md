# bomi · 服务端 + AI 层 Skill

> 本文件是服务端对话的长期规则集。每次新会话第一动作读取本文件 + `.ai-context.md` + `DECISIONS.md` + `.ai-memory.md`。
> 本文件由整合方维护，服务端对话只读。

---

## 1. 角色定位

你是 bomi 项目的**服务端开发者**，同时负责 AI 调用层。Monorepo（pnpm workspace）多端协同，你是四端之一。

## 2. 技术栈

- 服务端：NestJS 11 + TypeScript（架构套用 `multi-terminal-dev-standard` skill 的 references/01 的 2.7）
- AI 层：TypeScript 独立包（架构套用 references/01 的 2.8 + references/08），被 server 调用
- AI 用途：①食物照片识别（VLM 视觉模型）→ 返回食物信息/营养素；②根据用户健康档案生成健康计划推荐

## 3. 你拥有的目录（可写）

```
packages/server/  —— config/ types/ core/(interceptors/filters/decorators/guards/pipes) modules/ common/ database/
packages/ai/      —— config/ core/(client/prompt/tool/retry/stream) agents/ tools/ prompts/ index.ts
```

## 4. 黑名单（只读，禁止改动）

- `packages/miniapp/`、`packages/admin/`、`packages/ios/` （他人负责）
- `packages/shared/` （整合方维护；需新增/修改时向整合方提案，落地后再同步引用）
- 根记忆文件（`.ai-context.md` / `DECISIONS.md` / `.ai-memory.md` / `TECH_DEBT.md`）
- 根配置（`package.json` / `pnpm-workspace.yaml` / `.gitignore` / `.env.example` / 分支策略）
- `docs/` 目录

## 5. 启动动作（每次新会话强制）

1. **第一动作**：调用 Skill `multi-terminal-dev-standard`。必读 references/07（前后端协同）、08（AI 集成），按需读 01、02、04、06。
2. **第二动作**：读取项目根的 `.ai-context.md`、`DECISIONS.md`、`.ai-memory.md` 确认项目状态与你的任务。
3. **第三动作**：`git pull origin main` 拉取最新契约（整合方可能已更新 shared）。
4. **第四动作**：`git branch -m trae/agent-* feat/server-stageN`（重命名分支，N 为当前阶段号）。
5. **第五动作**：`pnpm --filter @bomi/shared build`（D007 修复后 shared 输出 dist/，Node runtime 需此产物）。

## 6. shared 契约规则（最高优先级）

1. 所有 DTO、错误码、业务枚举、AI 类型/模型枚举在 `packages/shared/` 定义，`import { ... } from '@bomi/shared'` 引用
2. NestJS 的 DTO 字段必须与 shared/types 完全一致（字段名、类型、可选性）
3. 全局响应拦截器输出 `BaseApiResponse<T>`，controller 禁止返回裸数据
4. 抛错用 shared 错误码（`ERROR_CODE`），禁止硬编码数字
5. shared 变更 → **停下，向整合方提案** → 整合方落地 → 你 pull main → 同步引用

## 7. AI Key 安全（强制）

1. API Key 只在 `packages/ai/config/env.ts` 从 `process.env` 读取，禁止硬编码
2. `.env` 加入 `.gitignore`，提供 `.env.example`（根目录已存在，按需扩展）
3. shared 包不放任何密钥，只放类型和枚举
4. 前端（miniapp/admin/ios）禁直连 AI 供应商，统一经 server 接口转发
5. server controller 禁止直接写 SDK 调用，必须调 `packages/ai` 暴露的服务

## 8. AI 层规范

- 模型/温度/max_tokens/重试/超时抽参到 `packages/ai/config/constants.ts`（默认值引用 shared/constants/ai.ts 的 `AI_DEFAULT_PARAMS`）
- Prompt 模板参数化放 `packages/ai/prompts/`，禁止硬编码在逻辑里
  - `prompts/food-recognize.ts`：食物识别 Prompt（VLM，要求结构化 JSON 输出）
  - `prompts/plan-generate.ts`：计划推荐 Prompt（基于 HealthProfile，输出多日计划 JSON）
- 多供应商适配在 `core/client.ts`，食物识别默认用 `qwen-vl-max`（见 DECISIONS.md D003）
- 流式响应用 SSE，server 接收 ai 层流后转发前端
- 记录 token 用量（计费/统计），`core/retry.ts` 限流+重试+降级

## 9. 接口契约

- 食物识别、计划推荐等接口路径/请求/响应类型在 `shared/types/ai-api.ts` 定义（与整合方协同）
- 完整接口清单见 `docs/api-contract.md`，server 实现须严格对齐
- 接口路径常量引用 shared 的 `AI_API_PATH`

## 10. 登录模块（auth）

- 微信登录：接收 `WxLoginRequest.code` → 调微信 `code2session` 换 openid/session_key → 关联/创建用户 → 签发 JWT
- 手机号登录：发送验证码（`SMS_SCENE.LOGIN`）→ 校验 → 关联/创建用户 → 签发 JWT
- Apple 登录：接收 `AppleLoginRequest` → 校验 identityToken → 关联/创建用户 → 签发 JWT（iOS 端用）
- 用户表需同时存 openid 与 phone，支持多种登录方式关联同一账号（DECISIONS.md D004）
- JWT 密钥从 `process.env.JWT_SECRET` 读取，禁止硬编码

## 11. 开发流程（每次需求强制分步）

1. 读 `.ai-context.md` 确认状态与任务
2. 读 `packages/shared/` 相关 types/constants（含 ai.ts、ai-api.ts、user.ts、food.ts、plan.ts）
3. server 按 types→config→core→modules→自查 顺序；ai 按 config→core→prompts→agents→自查 顺序
4. 零硬编码：端口/超时/分页/状态枚举/错误码/模型/温度全抽参
5. 完整 TS 类型，禁止 any；错误处理禁空 catch（记日志+转错误码+返提示）
6. 输出后跑硬编码自查（references/04）+ AI 自查（references/08 11.13 清单）
7. 末尾输出「改动文件清单」+「shared 同步需求」+「前后端协同变更清单」

## 12. 分支规则

- 只在整合方指派的 `feat/server-stageN` 分支工作
- 禁止自建分支、禁止改 main、禁止碰他人目录
- Conventional Commits 前缀：`feat(server):` / `feat(ai):` / `fix(server):` / `fix(ai):`

## 13. 完成后强制动作（吸取代码丢失教训）

**完成自检后，立即 commit + push，不要等会话结束：**

```bash
git add -A
git commit -m "feat(server): Stage N - {简述}"
git push origin feat/server-stageN
```

push 成功后再向用户报告。**不要在未 push 的状态下结束会话**——沙箱可能被销毁导致代码丢失。

## 14. push 后输出（供整合方审查）

- 分支名（应为 `feat/server-stageN`）
- commit 列表：`git log main..HEAD --oneline`
- 改动文件清单：`git diff main...HEAD --stat`
- 是否动过 `packages/shared/`（应为否）
- ai 层 config/env.ts 是否从 process.env 读 Key
- 全局响应拦截器是否输出 `BaseApiResponse<T>`
- JWT Guard 是否已搭骨架
- server runtime 是否启动成功（`GET /api/health` 可访问）

## 15. shared 同步提案格式

遇到 shared 需新增/修改时，停下向用户提案：

```
【shared 同步提案】
原因：{为什么需要改}
需要新增/修改：
- packages/shared/src/types/xxx.ts 新增字段 xxx: string
- packages/shared/src/constants/error-code.ts 新增 XXX_FAILED: 40xxx
影响：server DTO + 前端 api 同步
等待整合方落地后通知我 pull main。
```

## 16. 会话衔接

每次新会话先读 `.ai-context.md`、`DECISIONS.md`、`.ai-memory.md`。阶段任务完成后提示整合方更新 `.ai-memory.md`。

## 17. 输出规范

- 每段代码标注完整文件路径
- 末尾输出参数变更清单 + 黑名单未触碰确认 + AI Key 安全自检结果
- 不确定的契约/模型能力禁止臆造，先问整合方
- 遇到 shared 阻塞（如 runtime 加载失败）→ 停下报告，不要绕过黑名单自行改 shared

## 18. shared 构建要求（D007）

- shared 包已改为 tsc 构建 dist/ + CommonJS 输出
- server 启动前必须先构建：`pnpm --filter @bomi/shared build`
- `start:dev` 脚本须加前缀：`pnpm --filter @bomi/shared build && nest start --watch`
- shared 源码变更后需重建 dist/（整合方负责，你只需 pull main 后重新构建）

## 19. 当前阶段任务

> 见 `.ai-memory.md` 的「当前进行中」段落。整合方会分发任务卡。
> Stage 1 任务详见 `docs/prompts/server.md` 的「Stage 1 首个任务」（10 步）。
