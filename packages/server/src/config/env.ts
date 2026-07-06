/**
 * 服务端环境动态参数（第二层：环境动态参数）
 * 所有环境差异值 / 密钥从 process.env 读取，禁止硬编码。
 * 由 @nestjs/config 的 ConfigModule 加载 .env，业务层经 ConfigService 或本文件 getter 访问。
 */
import { ERROR_CODE } from '@bomi/shared';
import { SERVER_CONFIG, JWT_CONFIG } from './constants';

/** 运行环境类型 */
export type AppEnv = 'development' | 'test' | 'production';

/** 读取运行环境（缺省视为 development） */
export function getAppEnv(): AppEnv {
  const env = process.env.NODE_ENV;
  if (env === 'production' || env === 'test') return env;
  return 'development';
}

export const isProduction = (): boolean => getAppEnv() === 'production';
export const isDev = (): boolean => getAppEnv() === 'development';
export const isTest = (): boolean => getAppEnv() === 'test';

/** 监听端口（env.PORT 优先，兜底 SERVER_CONFIG.DEFAULT_PORT） */
export const getPort = (): number => {
  const port = Number(process.env.PORT);
  return Number.isFinite(port) && port > 0 ? port : SERVER_CONFIG.DEFAULT_PORT;
};

/** CORS 允许来源 */
export const getCorsOrigin = (): string =>
  process.env.CORS_ORIGIN ?? SERVER_CONFIG.CORS_ORIGIN;

/** JWT 密钥（必须从 env 读取，禁止硬编码） */
export const getJwtSecret = (): string => process.env.JWT_SECRET ?? '';

/** JWT 有效期原始字符串（env.JWT_EXPIRES_IN 优先，兜底默认值） */
export const getJwtExpiresIn = (): string =>
  process.env.JWT_EXPIRES_IN ?? JWT_CONFIG.DEFAULT_EXPIRES_IN;

/** 时长单位 → 秒数乘数 */
const DURATION_UNIT_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
  w: 604800,
};

/** 解析失败时的兜底秒数（7 天） */
const FALLBACK_EXPIRES_SECONDS = DURATION_UNIT_SECONDS.d * 7;

/**
 * 将时长字符串（如 '7d' / '1h' / '30m' / '2w' / '3600s'）解析为秒数。
 * 纯数字视为秒。用于 JWT signOptions.expiresIn（接受 number，避免 ms StringValue 类型约束）。
 */
export function parseDurationToSeconds(value: string | undefined): number {
  if (!value) return FALLBACK_EXPIRES_SECONDS;
  const match = value.trim().match(/^(\d+)\s*(s|m|h|d|w)?$/i);
  if (!match) return FALLBACK_EXPIRES_SECONDS;
  const n = Number(match[1]);
  const unit = (match[2] ?? 's').toLowerCase();
  return n * (DURATION_UNIT_SECONDS[unit] ?? 1);
}

/** JWT 有效期（秒，供 @nestjs/jwt signOptions.expiresIn 使用） */
export const getJwtExpiresInSeconds = (): number =>
  parseDurationToSeconds(getJwtExpiresIn());

/** 数据库连接配置（PostgreSQL，Stage 2 接库时使用） */
export const getDbConfig = () => ({
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME ?? '',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_DATABASE ?? 'bomi',
});

/** Redis 连接配置（缓存 / 限流 / 验证码，Stage 2 使用） */
export const getRedisConfig = () => ({
  host: process.env.REDIS_HOST ?? '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD ?? '',
});

/** 微信小程序配置（auth 模块使用） */
export const getWxConfig = () => ({
  appid: process.env.WX_APPID ?? '',
  secret: process.env.WX_SECRET ?? '',
});

/** 短信服务配置（手机号登录使用） */
export const getSmsConfig = () => ({
  accessKeyId: process.env.SMS_ACCESS_KEY_ID ?? '',
  accessKeySecret: process.env.SMS_ACCESS_KEY_SECRET ?? '',
  signName: process.env.SMS_SIGN_NAME ?? '',
  templateCode: process.env.SMS_TEMPLATE_CODE ?? '',
});

/** 校验码 = ERROR_CODE（供 validateEnv 引用，避免硬编码） */
const ENV_REQUIRED_CODE = ERROR_CODE.SERVER_ERROR;

/** 启动期环境变量校验：缺失必填项即抛错，禁止裸启动 */
export function validateEnv(): void {
  const required: Array<{ key: string }> = [{ key: 'JWT_SECRET' }];

  const missing = required
    .filter((r) => !process.env[r.key] || process.env[r.key]!.trim() === '')
    .map((r) => r.key);

  if (missing.length === 0) return;

  if (isProduction()) {
    // 生产环境缺失必填密钥，拒绝启动
    throw new Error(
      `[env] 缺失必填环境变量: ${missing.join(', ')}（错误码 ${ENV_REQUIRED_CODE}），请检查 .env / 部署配置`,
    );
  }
  // 开发环境仅告警，便于 Stage 1 脚手架先跑起来
  // eslint-disable-next-line no-console
  console.warn(
    `[env][warn] 缺失环境变量: ${missing.join(', ')}，请在根目录 .env 补齐（参考 .env.example）`,
  );
}
