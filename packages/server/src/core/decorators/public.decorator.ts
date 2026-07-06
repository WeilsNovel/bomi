/**
 * @Public() 装饰器
 * 标记接口为公开（无需 JWT 鉴权），由 JwtAuthGuard 读取元数据放行。
 */
import { SetMetadata } from '@nestjs/common';

/** @Public() 元数据 key */
export const IS_PUBLIC_KEY = 'isPublic';

/** 标记接口为公开（放行 JWT 鉴权） */
export const Public = (): MethodDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true) as MethodDecorator;
