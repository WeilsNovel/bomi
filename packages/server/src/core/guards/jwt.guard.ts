/**
 * JWT 鉴权守卫
 * 从 Authorization: Bearer <token> 提取并校验 token，通过后注入 request.user = JwtPayload。
 * 配合 @Public() 装饰器放行公开接口。
 * token 过期 → ERROR_CODE.TOKEN_EXPIRED；缺失/无效 → ERROR_CODE.UNAUTHORIZED。
 */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { ERROR_CODE } from '@bomi/shared';
import { JWT_CONFIG } from '../../config/constants';
import { getJwtSecret } from '../../config/env';
import type { JwtPayload } from '../../types/api';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { BusinessException } from '../../common/business.exception';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // @Public() 标记的接口直接放行
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: JwtPayload;
    }>();

    const token = this.extractToken(request.headers);
    if (!token) {
      throw new BusinessException(ERROR_CODE.UNAUTHORIZED);
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: getJwtSecret(),
      });
      request.user = payload;
      return true;
    } catch (err) {
      // 区分 token 过期 vs 无效
      if (err instanceof UnauthorizedException) throw err;
      const isExpired =
        err instanceof Error && err.name === 'TokenExpiredError';
      throw new BusinessException(
        isExpired ? ERROR_CODE.TOKEN_EXPIRED : ERROR_CODE.UNAUTHORIZED,
      );
    }
  }

  /** 从 Authorization header 提取 Bearer token */
  private extractToken(
    headers: Record<string, string | string[] | undefined>,
  ): string | undefined {
    const raw = headers[JWT_CONFIG.HEADER_NAME];
    const headerValue = Array.isArray(raw) ? raw[0] : raw;
    if (!headerValue) return undefined;
    const prefix = `${JWT_CONFIG.HEADER_PREFIX} `;
    if (!headerValue.startsWith(prefix)) return undefined;
    const token = headerValue.slice(prefix.length).trim();
    return token.length > 0 ? token : undefined;
  }
}
