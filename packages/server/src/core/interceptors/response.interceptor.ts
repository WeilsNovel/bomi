/**
 * 全局响应拦截器
 * 将 controller 返回的裸 data 统一包装为 BaseApiResponse<T>。
 * controller 禁止返回裸数据 —— 由本拦截器兜底包装。
 */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import {
  BaseApiResponse,
  ERROR_CODE,
  ERROR_MESSAGE_MAP,
} from '@bomi/shared';
import { DEFAULT_SUCCESS_MESSAGE, TRACE_ID_HEADER } from '../../config/constants';

@Injectable()
export class ResponseInterceptor<T = unknown>
  implements NestInterceptor<T, BaseApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<BaseApiResponse<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<{
      headers: Record<string, string | string[] | undefined>;
      id?: string;
    }>();

    // traceId：前端传入优先，否则用 Nest 请求 id 兜底
    const headerTraceId = request.headers?.[TRACE_ID_HEADER];
    const traceId =
      (Array.isArray(headerTraceId) ? headerTraceId[0] : headerTraceId) ??
      request.id;

    return next.handle().pipe(
      map((data) => ({
        code: ERROR_CODE.SUCCESS,
        message: ERROR_MESSAGE_MAP[ERROR_CODE.SUCCESS] ?? DEFAULT_SUCCESS_MESSAGE,
        data,
        traceId,
        timestamp: Date.now(),
      })),
    );
  }
}
