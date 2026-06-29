/**
 * 环境动态参数 - 第二层（config/env.ts）
 *
 * 区分 development / test / production 环境，存放接口域名、调试开关、应用标题、功能开关。
 * 红线：后台 env 绝不出现 AI API Key（仅 useAiProxy: true 标记走 server 代理）。
 */

/** 环境类型 */
type EnvType = 'development' | 'test' | 'production';

/** 当前环境（由 Vite 构建变量 import.meta.env.MODE 注入） */
const CURRENT_ENV: EnvType = import.meta.env.MODE as EnvType;

/** 环境配置项类型 */
interface EnvConfigItem {
  /** 接口基础域名 */
  apiBaseUrl: string;
  /** 是否开启调试日志 */
  debug: boolean;
  /** 应用标题 */
  appTitle: string;
}

/** 环境配置映射（按环境差异化配置） */
const ENV_CONFIG_MAP: Record<EnvType, EnvConfigItem> = {
  development: {
    apiBaseUrl: 'http://localhost:3000',
    debug: true,
    appTitle: 'bomi 管理后台（开发）',
  },
  test: {
    apiBaseUrl: 'https://test-api.bomi.com',
    debug: true,
    appTitle: 'bomi 管理后台（测试）',
  },
  production: {
    apiBaseUrl: 'https://api.bomi.com',
    debug: false,
    appTitle: 'bomi 管理后台',
  },
};

/** 当前环境配置（合并 VITE_ 环境变量覆盖） */
export const ENV_CONFIG: EnvConfigItem = {
  ...ENV_CONFIG_MAP[CURRENT_ENV],
  // VITE_ 环境变量优先级最高，允许部署时覆盖
  ...(import.meta.env.VITE_API_BASE_URL
    ? { apiBaseUrl: import.meta.env.VITE_API_BASE_URL }
    : {}),
  ...(import.meta.env.VITE_APP_TITLE ? { appTitle: import.meta.env.VITE_APP_TITLE } : {}),
  ...(import.meta.env.VITE_DEBUG
    ? { debug: import.meta.env.VITE_DEBUG === 'true' }
    : {}),
};

/**
 * AI 调用代理标记
 *
 * 红线约束（详见 docs/prompts/admin.md「AI 调用红线」）：
 * - 后台禁止直连 AI 供应商 API
 * - 后台涉及 AI 一律走 server 接口（/api/ai/* 与 /api/admin/ai-config）
 * - 后台 env 仅存此标记，绝不出现 API Key
 *
 * 后台恒为 true：运营动态配置 AI Key 时调用 server 加密存储接口，前端不明文持有。
 */
export const AI_PROXY_CONFIG = {
  /** 是否走 server 代理调用 AI（后台恒为 true） */
  useAiProxy: true,
} as const;

/** 当前环境标识 */
export const IS_DEV = CURRENT_ENV === 'development';
export const IS_PROD = CURRENT_ENV === 'production';
