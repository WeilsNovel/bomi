/**
 * AppService - 应用级服务
 * Stage 1 提供健康检查，业务服务在各业务模块。
 */
import { Injectable } from '@nestjs/common';
import { getAppEnv } from './config/env';

/** 健康检查响应数据 */
export interface HealthCheckResult {
  /** 服务状态 */
  status: string;
  /** 运行环境 */
  env: string;
  /** 进程运行时长 ms */
  uptime: number;
}

@Injectable()
export class AppService {
  /** 健康检查 */
  health(): HealthCheckResult {
    return {
      status: 'ok',
      env: getAppEnv(),
      uptime: process.uptime() * 1000,
    };
  }
}
