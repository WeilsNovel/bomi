/**
 * 全局类型声明
 * 扩展 Express.Request 以携带 JWT payload 与 traceId。
 */
import type { JwtPayload } from './api';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** 鉴权后注入的当前用户（JwtAuthGuard 填充） */
      user?: JwtPayload;
      /** 请求追踪 ID（ResponseInterceptor / HttpExceptionFilter 读取） */
      id?: string;
    }
  }
}
