/**
 * 应用入口
 * 启动流程：环境校验 → 创建应用 → 全局前缀/CORS/管道/过滤器/拦截器 → 监听端口。
 * 端口、前缀、CORS 来源全部从 config 读取，禁止硬编码。
 */
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SERVER_CONFIG } from './config/constants';
import { getCorsOrigin, getPort, validateEnv } from './config/env';
import { HttpExceptionFilter } from './core/filters/http-exception.filter';
import { ResponseInterceptor } from './core/interceptors/response.interceptor';

async function bootstrap(): Promise<void> {
  // 启动期校验必填环境变量（生产环境缺失即拒绝启动）
  validateEnv();

  const app = await NestFactory.create(AppModule);

  // 全局路由前缀：所有接口走 /api/*
  app.setGlobalPrefix(SERVER_CONFIG.API_PREFIX);

  // CORS
  app.enableCors({ origin: getCorsOrigin() });

  // 全局校验管道：DTO 自动转换 + 剔除未声明字段 + 拒绝非白名单字段
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 全局异常过滤器：统一输出 BaseApiResponse
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全局响应拦截器：统一包装 BaseApiResponse
  app.useGlobalInterceptors(new ResponseInterceptor());

  const port = getPort();
  await app.listen(port);

  new Logger('Bootstrap').log(
    `bomi server running at http://localhost:${port}/${SERVER_CONFIG.API_PREFIX}`,
  );
}

bootstrap();
