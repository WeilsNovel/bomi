/**
 * 全局类型声明 - 管理后台
 *
 * - 扩展 ImportMetaEnv，声明本端自定义 VITE_ 环境变量类型
 * - vite/client 已在 tsconfig.app.json 的 types 中引入，提供 import.meta.env 基础类型
 */

interface ImportMetaEnv {
  /** 接口基础域名（覆盖 config/env.ts 中按环境兜底的默认值） */
  readonly VITE_API_BASE_URL?: string;
  /** 应用标题（覆盖默认标题） */
  readonly VITE_APP_TITLE?: string;
  /** 是否开启调试日志（'true' / 'false'） */
  readonly VITE_DEBUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
