/**
 * @CurrentUser() 装饰器
 * 从 request.user 取出 JwtAuthGuard 注入的 JwtPayload。
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '../../types/api';

/** 从 request.user 提取当前登录用户 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = request.user;
    if (!user) return undefined;
    return data ? user[data] : user;
  },
);
