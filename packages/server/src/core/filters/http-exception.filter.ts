/**
 * 全局异常过滤器
 * 将所有异常（HttpException / BusinessException / 未知异常）统一转换为 BaseApiResponse。
 * 错误码使用 shared ERROR_CODE，禁止硬编码数字文案。
 */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  BaseApiResponse,
  ERROR_CODE,
  ERROR_MESSAGE_MAP,
} from '@bomi/shared';
import { TRACE_ID_HEADER } from '../../config/constants';

/** 未识别异常的兜底 HTTP 状态码 */
const FALLBACK_HTTP_STATUS = HttpStatus.INTERNAL_SERVER_ERROR;

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const headerTraceId = request.headers[TRACE_ID_HEADER];
    const traceId = Array.isArray(headerTraceId)
      ? headerTraceId[0]
      : headerTraceId;

    let httpStatus = FALLBACK_HTTP_STATUS;
    let code: number = ERROR_CODE.SERVER_ERROR;
    let message: string = ERROR_MESSAGE_MAP[ERROR_CODE.SERVER_ERROR];

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const resp = exception.getResponse();

      if (typeof resp === 'object' && resp !== null) {
        const r = resp as Record<string, unknown>;
        // BusinessException 形态：{ code, message }
        if (typeof r['code'] === 'number') code = r['code'];
        if (typeof r['message'] === 'string') message = r['message'];
        // class-validator 形态：{ message: string[] }
        if (Array.isArray(r['message'])) {
          code = ERROR_CODE.PARAM_INVALID;
          message =
            typeof r['message'][0] === 'string'
              ? (r['message'][0] as string)
              : ERROR_MESSAGE_MAP[ERROR_CODE.PARAM_INVALID];
        }
      } else if (typeof resp === 'string') {
        message = resp;
      }

      // HttpException 未携带业务码时，按 HTTP 状态码回填默认业务码
      if (code === ERROR_CODE.SERVER_ERROR) {
        code = httpStatusToBusinessCode(httpStatus);
        message = ERROR_MESSAGE_MAP[code] ?? message;
      }
    } else {
      // 未知异常：记完整堆栈，对外只暴露通用文案（避免泄露内部细节）
      this.logger.error(
        `[unhandled] ${getErrorMessage(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: BaseApiResponse<null> = {
      code,
      message,
      data: null,
      traceId,
      timestamp: Date.now(),
    };

    response.status(httpStatus).json(body);
  }
}

/** HTTP 状态码 → 业务错误码（仅用于 HttpException 未显式带业务码时兜底） */
function httpStatusToBusinessCode(status: number): number {
  if (status === HttpStatus.UNAUTHORIZED) return ERROR_CODE.UNAUTHORIZED;
  if (status === HttpStatus.FORBIDDEN) return ERROR_CODE.FORBIDDEN;
  if (status === HttpStatus.NOT_FOUND) return ERROR_CODE.NOT_FOUND;
  if (status === HttpStatus.BAD_REQUEST) return ERROR_CODE.PARAM_INVALID;
  if (status === HttpStatus.TOO_MANY_REQUESTS) return ERROR_CODE.RATE_LIMIT;
  return ERROR_CODE.SERVER_ERROR;
}

/** 安全提取错误信息（不抛二次异常） */
function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err);
  } catch {
    return 'unknown error';
  }
}
