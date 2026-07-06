/**
 * AppController - 应用级控制器
 * Stage 1 提供健康检查接口 GET /api/health（@Public 放行）。
 */
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import type { HealthCheckResult } from './app.service';
import { Public } from './core/decorators';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** 健康检查（公开接口，无需鉴权） */
  @Public()
  @Get('health')
  health(): HealthCheckResult {
    return this.appService.health();
  }
}
