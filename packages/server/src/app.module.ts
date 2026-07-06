/**
 * AppModule - 应用根模块
 * Stage 1：配置加载 + JWT 模块 + 全局 JWT Guard + 健康检查。
 * 业务模块（auth / diet / plan / admin）在后续阶段按需 import。
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtAuthGuard } from './core/guards/jwt.guard';
import { getJwtExpiresInSeconds, getJwtSecret } from './config/env';

@Module({
  imports: [
    // 全局加载 .env 到 process.env（密钥经 env getter 读取，禁止硬编码）
    ConfigModule.forRoot({ isGlobal: true }),
    // JWT 模块：密钥 / 有效期从 env 读取（expiresIn 用秒数，规避 ms StringValue 类型约束）
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: getJwtSecret(),
        signOptions: { expiresIn: getJwtExpiresInSeconds() },
      }),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 全局启用 JWT 鉴权（接口默认需鉴权，@Public() 标记的除外）
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
