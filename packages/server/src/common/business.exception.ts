/**
 * 业务异常
 * 携带 shared ERROR_CODE，由全局 HttpExceptionFilter 统一转换为 BaseApiResponse。
 * 抛错用 BusinessException(ERROR_CODE.XXX)，禁止硬编码数字状态码。
 */
import { HttpException, HttpStatus } from '@nestjs/common';
import { ERROR_CODE } from '@bomi/shared';

/** ERROR_CODE → HTTP 状态码映射 */
export function codeToHttpStatus(code: number): HttpStatus {
  // 40xxx → 4xx，50xxx → 5xx
  if (code === ERROR_CODE.SUCCESS) return HttpStatus.OK;
  if (code >= 50000) return HttpStatus.INTERNAL_SERVER_ERROR;
  if (code >= 42900) return HttpStatus.TOO_MANY_REQUESTS;
  if (code >= 40400) return HttpStatus.NOT_FOUND;
  if (code >= 40300) return HttpStatus.FORBIDDEN;
  if (code >= 40100) return HttpStatus.UNAUTHORIZED;
  if (code >= 40000) return HttpStatus.BAD_REQUEST;
  return HttpStatus.INTERNAL_SERVER_ERROR;
}

/** 业务异常（带 shared 错误码） */
export class BusinessException extends HttpException {
  /** 业务错误码（对齐 shared ERROR_CODE） */
  readonly code: number;

  constructor(code: number, message?: string) {
    const status = codeToHttpStatus(code);
    const body = { code, message: message ?? statusMessage(code) };
    super(body, status);
    this.code = code;
  }
}

/** 错误码兜底文案（shared ERROR_MESSAGE_MAP 缺失时使用，避免硬编码） */
function statusMessage(code: number): string {
  switch (code) {
    case ERROR_CODE.UNAUTHORIZED:
      return '请先登录';
    case ERROR_CODE.TOKEN_EXPIRED:
      return '登录已过期，请重新登录';
    case ERROR_CODE.PARAM_INVALID:
      return '参数错误';
    case ERROR_CODE.SERVER_ERROR:
      return '服务器异常，请稍后重试';
    default:
      return '请求失败';
  }
}
